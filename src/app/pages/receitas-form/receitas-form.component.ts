import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CategoriaService, Categoria as CategoriaAPI } from '../../shared/services/categoria.service';

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
export class ReceitasFormComponent implements OnInit {
  form: FormGroup;
  receitaId = signal<string | null>(null);
  isEdicao = signal(false);
  categorias: Categoria[] = [];

  formasRecebimento = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: 'dollar-sign' },
    { id: 'pix', nome: 'PIX', icone: 'smartphone' },
    { id: 'transferencia', nome: 'Transferência', icone: 'send' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private categoriaService: CategoriaService
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

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categorias = (response.data as CategoriaAPI[])
            .filter(c => c.tipo === 'receita' && c.ativo)
            .map(c => ({
              id: c._id || '',
              nome: c.nome,
              icone: c.icone || 'dollar-sign',
              cor: c.cor || '#006947'
            }));
        }
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
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
    return this.categorias.find(c => c._id === categoriaId);
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
