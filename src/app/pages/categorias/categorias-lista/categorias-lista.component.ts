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

  // Dialog de edição de subcategoria
  subcategoriaDialog = signal({
    isOpen: false,
    categoriaId: '',
    subcategoriaId: '',
    nome: '',
    icone: 'tag'
  });

  icones = [
    { nome: 'tag', label: 'Tag' },
    { nome: 'shopping-bag', label: 'Compras' },
    { nome: 'restaurant', label: 'Alimentação' },
    { nome: 'home', label: 'Casa' },
    { nome: 'car', label: 'Transporte' },
    { nome: 'heart', label: 'Saúde' },
    { nome: 'book', label: 'Educação' },
    { nome: 'shirt', label: 'Vestuário' },
    { nome: 'phone', label: 'Telefone' },
    { nome: 'lightbulb', label: 'Energia' },
    { nome: 'drop', label: 'Água' },
    { nome: 'football', label: 'Lazer' },
    { nome: 'briefcase', label: 'Trabalho' },
    { nome: 'bank', label: 'Banco' },
    { nome: 'wallet', label: 'Carteira' },
    { nome: 'gift', label: 'Presente' },
    { nome: 'flight-takeoff', label: 'Viagem' },
    { nome: 'hotel', label: 'Hotel' },
    { nome: 'gas-station', label: 'Gasolina' },
    { nome: 'hospital', label: 'Hospital' },
    { nome: 'stethoscope', label: 'Médico' },
    { nome: 'capsule', label: 'Remédio' },
    { nome: 'bill', label: 'Conta' },
    { nome: 'shopping-cart', label: 'Mercado' },
    { nome: 'taxi', label: 'Táxi' },
    { nome: 'bus', label: 'Ônibus' },
    { nome: 'subway', label: 'Metrô' },
    { nome: 'movie', label: 'Cinema' },
    { nome: 'music', label: 'Música' },
    { nome: 'gamepad', label: 'Games' },
    { nome: 'tools', label: 'Ferramentas' },
    { nome: 'paint-brush', label: 'Arte' },
    { nome: 'scissors', label: 'Salão' },
    { nome: 'barbell', label: 'Academia' },
    { nome: 'pizza', label: 'Pizza' },
    { nome: 'cup', label: 'Café' },
    { nome: 'goblet', label: 'Bebida' },
    { nome: 'cake', label: 'Doce' },
    { nome: 'restaurant-2', label: 'Restaurante' },
    { nome: 'computer', label: 'Computador' },
    { nome: 'smartphone', label: 'Celular' },
    { nome: 'tv', label: 'TV' },
    { nome: 'headphone', label: 'Fone' },
    { nome: 'camera', label: 'Câmera' },
    { nome: 'printer', label: 'Impressora' },
    { nome: 'plug', label: 'Eletrônicos' },
    { nome: 'home-wifi', label: 'Internet' },
    { nome: 'flashlight', label: 'Lanterna' }
  ];

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
              icone: s.icone || 'tag',
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
      message: 'Tem certeza que deseja excluir esta categoria? ATENÇÃO: Todas as subcategorias, receitas e despesas associadas a esta categoria também serão permanentemente removidas. Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.categoriaService.deletar(id).subscribe({
          next: (response) => {
            // Fechar o diálogo de confirmação
            this.confirmDialog.set({
              isOpen: false,
              title: '',
              message: '',
              onConfirm: () => {}
            });

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
            // Fechar o diálogo de confirmação
            this.confirmDialog.set({
              isOpen: false,
              title: '',
              message: '',
              onConfirm: () => {}
            });

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
    this.subcategoriaDialog.set({
      isOpen: true,
      categoriaId: categoriaId,
      subcategoriaId: '',
      nome: '',
      icone: 'tag'
    });
  }

  editarSubcategoria(categoriaId: string, subcategoriaId: string, nomeAtual: string, iconeAtual: string | undefined, event: Event) {
    event.stopPropagation();
    this.subcategoriaDialog.set({
      isOpen: true,
      categoriaId: categoriaId,
      subcategoriaId: subcategoriaId,
      nome: nomeAtual,
      icone: iconeAtual || 'tag'
    });
  }

  selecionarIconeSubcategoria(icone: string) {
    const dialog = this.subcategoriaDialog();
    this.subcategoriaDialog.set({ ...dialog, icone });
  }

  atualizarNomeSubcategoria(event: Event) {
    const input = event.target as HTMLInputElement;
    const dialog = this.subcategoriaDialog();
    this.subcategoriaDialog.set({ ...dialog, nome: input.value });
  }

  salvarSubcategoria() {
    const dialog = this.subcategoriaDialog();
    const nome = dialog.nome.trim();

    if (!nome) {
      this.alertDialog.set({
        isOpen: true,
        title: 'Erro',
        message: 'O nome da subcategoria é obrigatório',
        type: 'error'
      });
      return;
    }

    // Se é nova subcategoria (sem ID)
    if (!dialog.subcategoriaId) {
      this.categoriaService.adicionarSubcategoria(dialog.categoriaId, nome, dialog.icone).subscribe({
        next: (response) => {
          if (response.success && response.data && !Array.isArray(response.data)) {
            this.carregarCategorias();
            this.fecharSubcategoriaDialog();
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
    } else {
      // Editar subcategoria existente
      this.categoriaService.atualizarSubcategoria(
        dialog.categoriaId,
        dialog.subcategoriaId,
        { nome: nome, icone: dialog.icone }
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.carregarCategorias();
            this.fecharSubcategoriaDialog();
            this.alertDialog.set({
              isOpen: true,
              title: 'Sucesso',
              message: 'Subcategoria atualizada com sucesso!',
              type: 'success'
            });
          } else {
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: response.error || 'Não foi possível atualizar a subcategoria',
              type: 'error'
            });
          }
        },
        error: (err) => {
          console.error('Erro ao atualizar subcategoria:', err);
          this.alertDialog.set({
            isOpen: true,
            title: 'Erro',
            message: 'Não foi possível atualizar a subcategoria. Tente novamente.',
            type: 'error'
          });
        }
      });
    }
  }

  fecharSubcategoriaDialog() {
    this.subcategoriaDialog.set({
      isOpen: false,
      categoriaId: '',
      subcategoriaId: '',
      nome: '',
      icone: 'tag'
    });
  }

  excluirSubcategoria(categoriaId: string, subcategoriaId: string, event: Event) {
    event.stopPropagation();

    this.confirmDialog.set({
      isOpen: true,
      title: 'Excluir Subcategoria',
      message: 'Tem certeza que deseja excluir esta subcategoria? ATENÇÃO: Todas as receitas e despesas associadas a esta subcategoria também serão permanentemente removidas. Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.categoriaService.deletarSubcategoria(categoriaId, subcategoriaId).subscribe({
          next: (response) => {
            // Fechar o diálogo de confirmação
            this.confirmDialog.set({
              isOpen: false,
              title: '',
              message: '',
              onConfirm: () => {}
            });

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
            // Fechar o diálogo de confirmação
            this.confirmDialog.set({
              isOpen: false,
              title: '',
              message: '',
              onConfirm: () => {}
            });

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
