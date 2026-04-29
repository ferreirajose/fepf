import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgxMaskDirective } from 'ngx-mask';
import { OrcamentoService } from '../../shared/services/orcamento.service';
import { CategoriaService, Categoria as CategoriaAPI } from '../../shared/services/categoria.service';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-orcamentos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule, NgxMaskDirective],
  templateUrl: './orcamentos-form.component.html',
  styleUrl: './orcamentos-form.component.css'
})
export class OrcamentosFormComponent implements OnInit {
  private orcamentoService = inject(OrcamentoService);
  private categoriaService = inject(CategoriaService);

  form: FormGroup;
  orcamentoId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);
  categorias: Categoria[] = [];

  meses = [
    { numero: 1, nome: 'Janeiro' },
    { numero: 2, nome: 'Fevereiro' },
    { numero: 3, nome: 'Março' },
    { numero: 4, nome: 'Abril' },
    { numero: 5, nome: 'Maio' },
    { numero: 6, nome: 'Junho' },
    { numero: 7, nome: 'Julho' },
    { numero: 8, nome: 'Agosto' },
    { numero: 9, nome: 'Setembro' },
    { numero: 10, nome: 'Outubro' },
    { numero: 11, nome: 'Novembro' },
    { numero: 12, nome: 'Dezembro' }
  ];

  anos = [2024, 2025, 2026, 2027, 2028];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const hoje = new Date();

    this.form = this.fb.group({
      categoriaId: ['', Validators.required],
      valorPlanejado: [null, [Validators.required, Validators.min(0.01)]],
      mes: [hoje.getMonth() + 1, Validators.required],
      ano: [hoje.getFullYear(), Validators.required],
      ativo: [true],
      descricao: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orcamentoId.set(id);
      this.isEdicao.set(true);
      this.carregarOrcamento(id);
    }
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
              icone: c.icone || 'circle',
              cor: c.cor || '#6e9fff'
            }));
        }
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
    });
  }

  carregarOrcamento(id: string) {
    this.carregando.set(true);
    this.orcamentoService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const orcamento = response.data;
          this.form.patchValue({
            categoriaId: orcamento.categoriaId,
            valorPlanejado: orcamento.valor,
            mes: orcamento.mes,
            ano: orcamento.ano,
            descricao: orcamento.observacoes || ''
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar orçamento:', err);
        this.erro.set('Não foi possível carregar o orçamento');
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
      let valorNumerico = 0;
      if (formValue.valorPlanejado) {
        const valorString = String(formValue.valorPlanejado);
        valorNumerico = parseFloat(valorString.replace(/\./g, '').replace(',', '.'));
      }

      const orcamentoData = {
        categoriaId: formValue.categoriaId,
        valor: valorNumerico,
        mes: formValue.mes,
        ano: formValue.ano,
        observacoes: formValue.descricao || undefined
      };

      const operacao = this.isEdicao()
        ? this.orcamentoService.atualizar(this.orcamentoId()!, orcamentoData)
        : this.orcamentoService.criar(orcamentoData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/orcamentos']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar orçamento');
            this.carregando.set(false);
          }
        },
        error: (err) => {
          console.error('Erro ao salvar orçamento:', err);
          this.erro.set(err.error?.error || 'Não foi possível salvar o orçamento');
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
    this.router.navigate(['/orcamentos']);
  }

  getCategoriaSelecionada(): Categoria | undefined {
    const categoriaId = this.form.get('categoriaId')?.value;
    return this.categorias.find(c => c.id === categoriaId);
  }

  selecionarCategoria(categoriaId: string) {
    this.form.patchValue({ categoriaId });
  }

  getMesNome(numero: number): string {
    const mes = this.meses.find(m => m.numero === numero);
    return mes ? mes.nome : '';
  }

  copiarParaProximoMes() {
    const mesAtual = this.form.get('mes')?.value;
    const anoAtual = this.form.get('ano')?.value;

    if (mesAtual === 12) {
      this.form.patchValue({ mes: 1, ano: anoAtual + 1 });
    } else {
      this.form.patchValue({ mes: mesAtual + 1 });
    }
  }

  copiarParaMeses() {
    if (confirm('Deseja copiar este orçamento para todos os meses do ano?')) {
      console.log('Copiar para todos os meses:', this.form.value);
      // Implementar lógica de cópia para múltiplos meses
    }
  }
}
