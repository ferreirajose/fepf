import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-receitas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule],
  templateUrl: './receitas-form.component.html',
  styleUrl: './receitas-form.component.css'
})
export class ReceitasFormComponent {
  form: FormGroup;
  receitaId = signal<string | null>(null);
  isEdicao = signal(false);

  categorias: Categoria[] = [
    { id: '1', nome: 'Salário', icone: 'briefcase', cor: '#006947' },
    { id: '2', nome: 'Freelance', icone: 'code', cor: '#0057bd' },
    { id: '3', nome: 'Aluguel', icone: 'home', cor: '#69f6b8' },
    { id: '4', nome: 'Investimentos', icone: 'trending-up', cor: '#6e9fff' },
    { id: '5', nome: 'Vendas', icone: 'shopping-bag', cor: '#ff928b' },
    { id: '6', nome: 'Bônus', icone: 'award', cor: '#006947' },
    { id: '7', nome: 'Outros', icone: 'dollar-sign', cor: '#69f6b8' }
  ];

  formasRecebimento = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: 'dollar-sign' },
    { id: 'pix', nome: 'PIX', icone: 'smartphone' },
    { id: 'transferencia', nome: 'Transferência', icone: 'send' },
    { id: 'cheque', nome: 'Cheque', icone: 'file-text' },
    { id: 'credito-conta', nome: 'Crédito em Conta', icone: 'credit-card' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [this.getDataHoje(), Validators.required],
      categoriaId: ['', Validators.required],
      formaRecebimento: ['pix', Validators.required],
      recorrente: [false],
      frequenciaRecorrencia: ['mensal'],
      dataRecorrenciaFim: [''],
      recebida: [false],
      observacoes: [''],
      anexos: [[]]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.receitaId.set(id);
      this.isEdicao.set(true);
      this.carregarReceita(id);
    }

    this.form.get('recorrente')?.valueChanges.subscribe(recorrente => {
      if (recorrente) {
        this.form.get('frequenciaRecorrencia')?.setValidators(Validators.required);
      } else {
        this.form.get('frequenciaRecorrencia')?.clearValidators();
        this.form.get('dataRecorrenciaFim')?.clearValidators();
      }
      this.form.get('frequenciaRecorrencia')?.updateValueAndValidity();
      this.form.get('dataRecorrenciaFim')?.updateValueAndValidity();
    });
  }

  getDataHoje(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  carregarReceita(id: string) {
    const receitaMock = {
      descricao: 'Salário CLT',
      valor: 5500.00,
      data: '2026-04-05',
      categoriaId: '1',
      formaRecebimento: 'pix',
      recorrente: true,
      frequenciaRecorrencia: 'mensal',
      dataRecorrenciaFim: '',
      recebida: true,
      observacoes: 'Pagamento mensal',
      anexos: []
    };
    this.form.patchValue(receitaMock);
  }

  salvar() {
    if (this.form.valid) {
      console.log('Salvando receita:', this.form.value);
      this.router.navigate(['/receitas']);
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
    this.router.navigate(['/receitas']);
  }

  getCategoriaSelecionada(): Categoria | undefined {
    const categoriaId = this.form.get('categoriaId')?.value;
    return this.categorias.find(c => c.id === categoriaId);
  }

  selecionarCategoria(categoriaId: string) {
    this.form.patchValue({ categoriaId });
  }

  getFormaRecebimentoSelecionada() {
    const formaRecebimento = this.form.get('formaRecebimento')?.value;
    return this.formasRecebimento.find(f => f.id === formaRecebimento);
  }

  formatarValorMoeda(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/\D/g, '');
    valor = (parseFloat(valor) / 100).toFixed(2);
    this.form.patchValue({ valor: parseFloat(valor) }, { emitEvent: false });
  }
}
