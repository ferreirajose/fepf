import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CategoriaService, Categoria as CategoriaAPI } from '../../shared/services/categoria.service';
import { ReceitaService } from '../../shared/services/receita.service';
import { CurrencyMaskDirective } from '../../shared/directives/currency-mask.directive';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-receitas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule, RouterLink, CurrencyMaskDirective],
  templateUrl: './receitas-form.component.html',
  styleUrl: './receitas-form.component.css'
})
export class ReceitasFormComponent implements OnInit {
  private receitaService = inject(ReceitaService);
  private categoriaService = inject(CategoriaService);

  form: FormGroup;
  receitaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);
  categorias: Categoria[] = [];

  formasRecebimento = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: 'dollar-sign' },
    { id: 'pix', nome: 'PIX', icone: 'smartphone' },
    { id: 'transferencia', nome: 'Transferência', icone: 'send' }
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

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categorias = (response.data as CategoriaAPI[])
            .filter(c => c.ativo)
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
    this.carregando.set(true);
    this.receitaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const receita = response.data;
          const dataFormatada = new Date(receita.data).toISOString().split('T')[0];

          this.form.patchValue({
            descricao: receita.descricao,
            valor: receita.valor,
            data: dataFormatada,
            categoriaId: receita.categoriaId,
            recorrente: receita.recorrente,
            observacoes: receita.observacoes || ''
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar receita:', err);
        this.erro.set('Não foi possível carregar a receita');
        this.carregando.set(false);
      }
    });
  }

  salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const formValue = this.form.value;
      const receitaData = {
        descricao: formValue.descricao,
        valor: parseFloat(formValue.valor),
        data: formValue.data,
        categoriaId: formValue.categoriaId,
        recorrente: formValue.recorrente,
        observacoes: formValue.observacoes || undefined
      };

      const operacao = this.isEdicao()
        ? this.receitaService.atualizar(this.receitaId()!, receitaData)
        : this.receitaService.criar(receitaData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/receitas']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar receita');
            this.carregando.set(false);
          }
        },
        error: (err) => {
          console.error('Erro ao salvar receita:', err);
          this.erro.set(err.error?.error || 'Não foi possível salvar a receita');
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
