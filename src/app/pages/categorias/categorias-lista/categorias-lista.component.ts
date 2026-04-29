import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../shared/models/categoria.model';
import { FeatherModule } from 'angular-feather';
import { CategoriaService, Categoria as CategoriaAPI } from '../../../shared/services/categoria.service';

@Component({
  selector: 'app-categorias-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherModule],
  templateUrl: './categorias-lista.component.html',
  styleUrl: './categorias-lista.component.css'
})
export class CategoriasListaComponent implements OnInit {
  private categoriaService = inject(CategoriaService);

  expandedCategories = signal<Set<string>>(new Set());
  categorias = signal<Categoria[]>([]);
  carregando = signal(false);
  erro = signal<string | null>(null);

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.carregando.set(true);
    this.erro.set(null);

    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categorias.set((response.data as CategoriaAPI[]).map(c => ({
            id: c._id || '',
            nome: c.nome,
            tipo: c.tipo,
            cor: c.cor,
            icone: c.icone,
            ativo: c.ativo,
            dataCriacao: c.dataCriacao ? new Date(c.dataCriacao) : new Date(),
            subcategorias: c.subcategorias?.map(s => ({
              id: s.id || '',
              nome: s.nome,
              categoriaId: c._id || '',
              ativo: s.ativo
            }))
          })));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.erro.set('Não foi possível carregar as categorias');
        this.carregando.set(false);
      }
    });
  }

  toggleCategory(id: string) {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.expandedCategories.set(expanded);
  }

  isExpanded(id: string): boolean {
    return this.expandedCategories().has(id);
  }

  excluirCategoria(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Deseja realmente excluir esta categoria?')) {
      this.categoriaService.deletar(id).subscribe({
        next: (response) => {
          if (response.success) {
            const categorias = this.categorias().filter(c => c.id !== id);
            this.categorias.set(categorias);
          } else {
            alert('Erro ao excluir categoria: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao excluir categoria:', err);
          alert('Não foi possível excluir a categoria');
        }
      });
    }
  }

  adicionarSubcategoria(categoriaId: string, event: Event) {
    event.stopPropagation();
    const nome = prompt('Digite o nome da subcategoria:');
    if (nome && nome.trim()) {
      this.categoriaService.adicionarSubcategoria(categoriaId, nome.trim()).subscribe({
        next: (response) => {
          if (response.success && response.data && !Array.isArray(response.data)) {
            // Atualizar a lista de categorias
            this.carregarCategorias();
          } else {
            alert('Erro ao adicionar subcategoria: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao adicionar subcategoria:', err);
          alert('Não foi possível adicionar a subcategoria');
        }
      });
    }
  }

  excluirSubcategoria(categoriaId: string, subcategoriaId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Deseja realmente excluir esta subcategoria?')) {
      this.categoriaService.deletarSubcategoria(categoriaId, subcategoriaId).subscribe({
        next: (response) => {
          if (response.success) {
            const categorias = this.categorias().map(cat => {
              if (cat.id === categoriaId && cat.subcategorias) {
                return {
                  ...cat,
                  subcategorias: cat.subcategorias.filter(sub => sub.id !== subcategoriaId)
                };
              }
              return cat;
            });
            this.categorias.set(categorias);
          } else {
            alert('Erro ao excluir subcategoria: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao excluir subcategoria:', err);
          alert('Não foi possível excluir a subcategoria');
        }
      });
    }
  }

  getTotalReceitas(): number {
    return this.categorias().filter(c => c.tipo === 'receita').length;
  }

  getTotalDespesas(): number {
    return this.categorias().filter(c => c.tipo === 'despesa').length;
  }

  getTotalCategorias(): number {
    return this.categorias().length;
  }
}
