import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';

interface Bandeira {
  id: string;
  nome: string;
  cor: string;
}

@Component({
  selector: 'app-cartoes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule],
  templateUrl: './cartoes-form.component.html',
  styleUrl: './cartoes-form.component.css'
})
export class CartoesFormComponent {
  form: FormGroup;
  cartaoId = signal<string | null>(null);
  isEdicao = signal(false);

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
      numero: ['', [Validators.required, Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)]],
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
    const cartaoMock = {
      nome: 'Nubank Ultravioleta',
      bandeira: 'mastercard',
      numero: '5555 5555 5555 1234',
      limite: 15000.00,
      diaVencimento: 15,
      diaFechamento: 10,
      cor: '#820AD1',
      ativo: true
    };
    this.form.patchValue(cartaoMock);
  }

  salvar() {
    if (this.form.valid) {
      console.log('Salvando cartão:', this.form.value);
      this.router.navigate(['/cartoes']);
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

  formatarNumeroCartao(event: any) {
    let valor = event.target.value.replace(/\s/g, '');
    if (valor.length > 16) valor = valor.substring(0, 16);
    const formatado = valor.match(/.{1,4}/g)?.join(' ') || valor;
    this.form.patchValue({ numero: formatado }, { emitEvent: false });
  }

  getBandeiraSelecionada(): Bandeira | undefined {
    const bandeiraId = this.form.get('bandeira')?.value;
    return this.bandeiras.find(b => b.id === bandeiraId);
  }
}
