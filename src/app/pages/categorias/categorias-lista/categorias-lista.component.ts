import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../shared/models/categoria.model';
import { CategoriaService, Categoria as CategoriaAPI } from '../../../shared/services/categoria.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../../shared/components/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-categorias-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent, AlertDialogComponent],
  templateUrl: './categorias-lista.component.html',
  styleUrl: './categorias-lista.component.css'
})
export class CategoriasListaComponent implements OnInit {
  private categoriaService = inject(CategoriaService);

  expandedCategories = signal<Set<string>>(new Set());
  categorias = signal<Categoria[]>([]);
  carregando = signal(false);
  erro = signal<string | null>(null);

  // Dialogs
  confirmDialog = signal({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  alertDialog = signal({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info' | 'warning'
  });

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

    this.confirmDialog.set({
      isOpen: true,
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.categoriaService.deletar(id).subscribe({
          next: (response) => {
            if (response.success) {
              const categorias = this.categorias().filter(c => c.id !== id);
              this.categorias.set(categorias);

              this.alertDialog.set({
                isOpen: true,
                title: 'Sucesso',
                message: 'Categoria excluída com sucesso!',
                type: 'success'
              });
            } else {
              this.alertDialog.set({
                isOpen: true,
                title: 'Erro',
                message: response.error || 'Não foi possível excluir a categoria',
                type: 'error'
              });
            }
          },
          error: (err) => {
            console.error('Erro ao excluir categoria:', err);
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: 'Não foi possível excluir a categoria. Tente novamente.',
              type: 'error'
            });
          }
        });
      }
    });
  }

  adicionarSubcategoria(categoriaId: string, event: Event) {
    event.stopPropagation();
    const nome = prompt('Digite o nome da subcategoria:');
    if (nome && nome.trim()) {
      this.categoriaService.adicionarSubcategoria(categoriaId, nome.trim()).subscribe({
        next: (response) => {
          if (response.success && response.data && !Array.isArray(response.data)) {
            this.carregarCategorias();
            this.alertDialog.set({
              isOpen: true,
              title: 'Sucesso',
              message: 'Subcategoria adicionada com sucesso!',
              type: 'success'
            });
          } else {
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: response.error || 'Não foi possível adicionar a subcategoria',
              type: 'error'
            });
          }
        },
        error: (err) => {
          console.error('Erro ao adicionar subcategoria:', err);
          this.alertDialog.set({
            isOpen: true,
            title: 'Erro',
            message: 'Não foi possível adicionar a subcategoria. Tente novamente.',
            type: 'error'
          });
        }
      });
    }
  }

  excluirSubcategoria(categoriaId: string, subcategoriaId: string, event: Event) {
    event.stopPropagation();

    this.confirmDialog.set({
      isOpen: true,
      title: 'Excluir Subcategoria',
      message: 'Tem certeza que deseja excluir esta subcategoria?',
      onConfirm: () => {
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

              this.alertDialog.set({
                isOpen: true,
                title: 'Sucesso',
                message: 'Subcategoria excluída com sucesso!',
                type: 'success'
              });
            } else {
              this.alertDialog.set({
                isOpen: true,
                title: 'Erro',
                message: response.error || 'Não foi possível excluir a subcategoria',
                type: 'error'
              });
            }
          },
          error: (err) => {
            console.error('Erro ao excluir subcategoria:', err);
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: 'Não foi possível excluir a subcategoria. Tente novamente.',
              type: 'error'
            });
          }
        });
      }
    });
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
