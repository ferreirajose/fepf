import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { ContaService } from '../../shared/services/conta.service';

@Component({
  selector: 'app-contas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  templateUrl: './contas-form.component.html',
  styleUrl: './contas-form.component.css'
})
export class ContasFormComponent implements OnInit {
  private contaService = inject(ContaService);

  form: FormGroup;
  contaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  salvando = signal(false);
  erro = signal<string | null>(null);

  tiposConta = [
    { valor: 'conta_corrente', label: 'Conta Corrente', cor: '#4CAF50', icone: 'ri-bank-line' },
    { valor: 'poupanca', label: 'Poupança', cor: '#2196F3', icone: 'ri-safe-line' },
    { valor: 'investimentos', label: 'Investimentos', cor: '#FF9800', icone: 'ri-line-chart-line' },
    { valor: 'conta_beneficios', label: 'Benefícios', cor: '#9C27B0', icone: 'ri-gift-line' }
  ];

  bancos = [
    { valor: 'inter', label: 'Banco Inter' },
    { valor: 'bradesco', label: 'Bradesco' },
    { valor: 'itau', label: 'Itaú' },
    { valor: 'caixa', label: 'Caixa Econômica Federal' },
    { valor: 'nubank', label: 'Nubank' },
    { valor: 'santander', label: 'Santander' },
    { valor: 'pan', label: 'Banco Pan' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipoConta: ['', Validators.required],
      banco: [''],
      subTipoConta: [''],
      saldoInicial: [null, [Validators.required]]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contaId.set(id);
      this.isEdicao.set(true);
      this.carregarConta(id);
    }
  }

  ngOnInit() {
    this.form.get('tipoConta')?.valueChanges.subscribe(tipo => {
      if (tipo !== 'conta_beneficios') {
        this.form.patchValue({ subTipoConta: '' }, { emitEvent: false });
      }

      if (tipo === 'conta_beneficios') {
        this.form.get('banco')?.clearValidators();
        this.form.patchValue({ banco: null }, { emitEvent: false });
      } else {
        this.form.get('banco')?.setValidators(Validators.required);
      }
      this.form.get('banco')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  carregarConta(id: string) {
    this.carregando.set(true);
    this.contaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const conta = response.data;

          this.form.patchValue({
            nome: conta.nome,
            tipoConta: conta.tipoConta,
            banco: conta.banco,
            subTipoConta: conta.subTipoConta || '',
            saldoInicial: conta.saldoInicial
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar conta:', err);
        this.erro.set('Não foi possível carregar a conta');
        this.carregando.set(false);
      }
    });
  }

  get mostrarSubTipo(): boolean {
    return this.form.get('tipoConta')?.value === 'conta_beneficios';
  }

  get mostrarCampoBanco(): boolean {
    const tipo = this.form.get('tipoConta')?.value;
    return tipo && tipo !== 'conta_beneficios';
  }

  selecionarTipoConta(tipo: string) {
    this.form.patchValue({ tipoConta: tipo });
    if (tipo !== 'conta_beneficios') {
      this.form.patchValue({ subTipoConta: '' });
    }
  }

  selecionarBanco(banco: string) {
    this.form.patchValue({ banco });
  }

  salvar() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.salvando.set(true);

    const valorString = this.form.value.saldoInicial;
    const saldoInicial = typeof valorString === 'string'
      ? parseFloat(valorString.replace(/\./g, '').replace(',', '.'))
      : valorString;

    const contaData = {
      nome: this.form.value.nome,
      tipoConta: this.form.value.tipoConta,
      banco: this.form.value.tipoConta === 'conta_beneficios' ? null : this.form.value.banco,
      subTipoConta: this.form.value.subTipoConta || undefined,
      saldoInicial
    };

    const operacao = this.isEdicao()
      ? this.contaService.atualizar(this.contaId()!, contaData)
      : this.contaService.criar(contaData);

    operacao.subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/contas']);
        } else {
          this.erro.set(response.error || 'Erro ao salvar conta');
          this.salvando.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);
        this.erro.set('Não foi possível salvar a conta. Tente novamente.');
        this.salvando.set(false);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/contas']);
  }
}
