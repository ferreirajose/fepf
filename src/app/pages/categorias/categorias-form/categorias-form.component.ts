import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CategoriaService } from '../../../shared/services/categoria.service';

@Component({
  selector: 'app-categorias-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule],
  templateUrl: './categorias-form.component.html',
  styleUrl: './categorias-form.component.css'
})
export class CategoriasFormComponent {
  private categoriaService = inject(CategoriaService);

  form: FormGroup;
  categoriaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);

  cores = [
    '#0057bd', '#006947', '#b51621', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['receita', Validators.required],
      cor: ['#0057bd', Validators.required],
      icone: [''],
      ativo: [true]
    });

    // Verificar se é edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoriaId.set(id);
      this.isEdicao.set(true);
      this.carregarCategoria(id);
    }
  }

  carregarCategoria(id: string) {
    this.carregando.set(true);
    this.erro.set(null);

    this.categoriaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const categoria = response.data;
          this.form.patchValue({
            nome: categoria.nome,
            tipo: categoria.tipo,
            cor: categoria.cor || '#0057bd',
            icone: categoria.icone || '',
            ativo: categoria.ativo
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
        this.erro.set('Não foi possível carregar a categoria');
        this.carregando.set(false);
      }
    });
  }

  salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const categoriaData = {
        nome: this.form.value.nome,
        tipo: this.form.value.tipo,
        cor: this.form.value.cor,
        icone: this.form.value.icone || undefined,
        ativo: this.form.value.ativo
      };

      const operacao = this.isEdicao()
        ? this.categoriaService.atualizar(this.categoriaId()!, categoriaData)
        : this.categoriaService.criar(categoriaData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/categorias']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar categoria');
          }
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao salvar categoria:', err);
          this.erro.set('Não foi possível salvar a categoria');
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
    this.router.navigate(['/categorias']);
  }

  selecionarCor(cor: string) {
    this.form.patchValue({ cor });
  }
}
