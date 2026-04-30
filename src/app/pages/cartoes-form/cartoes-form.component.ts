import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { CartaoService } from '../../shared/services/cartao.service';

interface Bandeira {
  id: string;
  nome: string;
  cor: string;
}

@Component({
  selector: 'app-cartoes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  templateUrl: './cartoes-form.component.html',
  styleUrl: './cartoes-form.component.css'
})
export class CartoesFormComponent {
  private cartaoService = inject(CartaoService);

  form: FormGroup;
  cartaoId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);

  bandeiras: Bandeira[] = [
    { id: 'visa', nome: 'Visa', cor: '#1A1F71' },
    { id: 'mastercard', nome: 'Mastercard', cor: '#EB001B' },
    { id: 'elo', nome: 'Elo', cor: '#FFCB05' },
    { id: 'amex', nome: 'American Express', cor: '#006FCF' },
    { id: 'hipercard', nome: 'Hipercard', cor: '#E30613' }
  ];

  cores = [
    '#820AD1', '#0057bd', '#006947', '#b51621', '#1A1A1A',
    '#D4AF37', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      bandeira: ['', Validators.required],
      dono: [''],
      limite: [null, [Validators.required, Validators.min(0)]],
      diaVencimento: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      diaFechamento: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      cor: ['#820AD1', Validators.required],
      ativo: [true]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cartaoId.set(id);
      this.isEdicao.set(true);
      this.carregarCartao(id);
    }
  }

  carregarCartao(id: string) {
    this.carregando.set(true);
    this.cartaoService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const cartao = response.data;
          this.form.patchValue({
            nome: cartao.nome,
            bandeira: cartao.bandeira,
            dono: cartao.dono || '',
            limite: cartao.limite,
            diaVencimento: cartao.diaVencimento,
            diaFechamento: cartao.diaFechamento,
            ativo: cartao.ativo
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar cartão:', err);
        this.erro.set('Não foi possível carregar o cartão');
        this.carregando.set(false);
      }
    });
  }

  salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const formValue = this.form.value;

      // Converter valor formatado para número
      let limiteNumerico = 0;
      if (formValue.limite) {
        const valorString = String(formValue.limite);
        limiteNumerico = parseFloat(valorString.replace(/\./g, '').replace(',', '.'));
      }

      const cartaoData = {
        nome: formValue.nome,
        bandeira: formValue.bandeira,
        dono: formValue.dono || undefined,
        limite: limiteNumerico,
        diaVencimento: parseInt(formValue.diaVencimento),
        diaFechamento: parseInt(formValue.diaFechamento),
        ativo: formValue.ativo
      };

      const operacao = this.isEdicao()
        ? this.cartaoService.atualizar(this.cartaoId()!, cartaoData)
        : this.cartaoService.criar(cartaoData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/cartoes']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar cartão');
            this.carregando.set(false);
          }
        },
        error: (err) => {
          console.error('Erro ao salvar cartão:', err);
          this.erro.set(err.error?.error || 'Não foi possível salvar o cartão');
          this.carregando.set(false);
        }
      });
    } else {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/cartoes']);
  }

  selecionarBandeira(bandeiraId: string) {
    this.form.patchValue({ bandeira: bandeiraId });
    const bandeira = this.bandeiras.find(b => b.id === bandeiraId);
    if (bandeira && !this.form.get('cor')?.dirty) {
      this.form.patchValue({ cor: bandeira.cor });
    }
  }

  selecionarCor(cor: string) {
    this.form.patchValue({ cor });
  }

  getBandeiraSelecionada(): Bandeira | undefined {
    const bandeiraId = this.form.get('bandeira')?.value;
    return this.bandeiras.find(b => b.id === bandeiraId);
  }
}
