import { Component, signal, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceitaService, Receita as ReceitaAPI } from '../../shared/services/receita.service';
import { CategoriaService, Categoria } from '../../shared/services/categoria.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';

interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  recorrente: boolean;
  recebida: boolean;
  observacoes?: string;
}

@Component({
  selector: 'app-receitas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent, AlertDialogComponent],
  templateUrl: './receitas.component.html',
  styleUrl: './receitas.component.css'
})
export class ReceitasComponent implements OnInit {
  private receitaService = inject(ReceitaService);
  private categoriaService = inject(CategoriaService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  filtroTexto = signal('');
  filtroCategoria = signal('todas');
  filtroStatus = signal('todas');
  mesAtual = signal(new Date().getMonth() + 1);
  anoAtual = signal(new Date().getFullYear());
  carregando = signal(false);
  carregandoImportExport = signal(false);
  erro = signal<string | null>(null);

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

  receitas = signal<Receita[]>([]);

  categorias = signal<Array<{ id: string; nome: string }>>([
    { id: 'todas', nome: 'Todas Categorias' }
  ]);

  ngOnInit() {
    this.carregarCategorias();
    this.carregarReceitas();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          const categoriasApi = response.data as Categoria[];

          // Filtrar apenas categorias ativas
          // Note: campo 'tipo' será adicionado futuramente para separar despesa/receita
          const categoriasAtivas = categoriasApi
            .filter(c => c.ativo)
            .map(c => ({
              id: c._id || '',
              nome: c.nome
            }));

          this.categorias.set([
            { id: 'todas', nome: 'Todas Categorias' },
            ...categoriasAtivas
          ]);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
      }
    });
  }

  carregarReceitas() {
    this.carregando.set(true);
    this.erro.set(null);

    const primeiroDia = new Date(this.anoAtual(), this.mesAtual() - 1, 1);
    const ultimoDia = new Date(this.anoAtual(), this.mesAtual(), 0);

    const filtros = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0]
    };

    this.receitaService.listar(filtros).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.receitas.set((response.data as ReceitaAPI[]).map(r => {
            // Converter data UTC para data local sem timezone
            const dataUTC = new Date(r.data);
            const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());

            return {
              id: (r as any)._id || r.id || '',
              descricao: r.descricao,
              valor: r.valor,
              data: dataLocal,
              categoriaId: (r as any).categoriaId?._id || (r as any).categoriaId?.id || r.categoriaId,
              categoriaNome: (r as any).categoriaId?.nome || 'Sem categoria',
              categoriaIcone: (r as any).categoriaId?.icone || 'circle',
              categoriaCor: (r as any).categoriaId?.cor || '#69f6b8',
              recorrente: r.recorrente,
              recebida: true,
              observacoes: r.observacoes
            };
          }));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar receitas:', err);
        this.erro.set('Não foi possível carregar as receitas');
        this.carregando.set(false);
      }
    });
  }

  getMesNome(): string {
    const mes = this.meses.find(m => m.numero === this.mesAtual());
    return mes ? mes.nome : '';
  }

  proximoMes() {
    if (this.mesAtual() === 12) {
      this.mesAtual.set(1);
      this.anoAtual.set(this.anoAtual() + 1);
    } else {
      this.mesAtual.set(this.mesAtual() + 1);
    }
    this.carregarReceitas();
  }

  mesAnterior() {
    if (this.mesAtual() === 1) {
      this.mesAtual.set(12);
      this.anoAtual.set(this.anoAtual() - 1);
    } else {
      this.mesAtual.set(this.mesAtual() - 1);
    }
    this.carregarReceitas();
  }

  getReceitasFiltradas(): Receita[] {
    let receitas = this.receitas().filter(r => {
      const dataR = new Date(r.data);
      return dataR.getMonth() + 1 === this.mesAtual() && dataR.getFullYear() === this.anoAtual();
    });

    if (this.filtroTexto()) {
      const texto = this.filtroTexto().toLowerCase();
      receitas = receitas.filter(r =>
        r.descricao.toLowerCase().includes(texto) ||
        r.categoriaNome.toLowerCase().includes(texto)
      );
    }

    if (this.filtroCategoria() !== 'todas') {
      receitas = receitas.filter(r => r.categoriaId === this.filtroCategoria());
    }

    if (this.filtroStatus() === 'recebidas') {
      receitas = receitas.filter(r => r.recebida);
    } else if (this.filtroStatus() === 'pendentes') {
      receitas = receitas.filter(r => !r.recebida);
    }

    return receitas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  getTotalReceitas(): number {
    return this.getReceitasFiltradas().reduce((sum, r) => sum + r.valor, 0);
  }

  getMaiorReceita(): number {
    const receitas = this.getReceitasFiltradas();
    if (receitas.length === 0) return 0;
    return Math.max(...receitas.map(r => r.valor));
  }

  getQuantidadeReceitas(): number {
    return this.getReceitasFiltradas().length;
  }

  getTotalRecebido(): number {
    return this.getReceitasFiltradas()
      .filter(r => r.recebida)
      .reduce((sum, r) => sum + r.valor, 0);
  }

  getTotalPendente(): number {
    return this.getReceitasFiltradas()
      .filter(r => !r.recebida)
      .reduce((sum, r) => sum + r.valor, 0);
  }

  getQuantidadeRecebidas(): number {
    return this.getReceitasFiltradas().filter(r => r.recebida).length;
  }

  getQuantidadePendentes(): number {
    return this.getReceitasFiltradas().filter(r => !r.recebida).length;
  }

  toggleRecebida(receita: Receita, event: Event) {
    event.stopPropagation();
    const receitas = this.receitas().map(r => {
      if (r.id === receita.id) {
        return { ...r, recebida: !r.recebida };
      }
      return r;
    });
    this.receitas.set(receitas);
  }

  excluirReceita(id: string, event: Event) {
    event.stopPropagation();

    this.confirmDialog.set({
      isOpen: true,
      title: 'Excluir Receita',
      message: 'Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.receitaService.deletar(id).subscribe({
          next: (response) => {
            if (response.success) {
              const receitas = this.receitas().filter(r => r.id !== id);
              this.receitas.set(receitas);

              this.alertDialog.set({
                isOpen: true,
                title: 'Sucesso',
                message: 'Receita excluída com sucesso!',
                type: 'success'
              });
            } else {
              this.alertDialog.set({
                isOpen: true,
                title: 'Erro',
                message: response.error || 'Não foi possível excluir a receita',
                type: 'error'
              });
            }
          },
          error: (err) => {
            console.error('Erro ao excluir receita:', err);
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: 'Não foi possível excluir a receita. Tente novamente.',
              type: 'error'
            });
          }
        });
      }
    });
  }

  formatarData(data: Date): string {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  limparFiltros() {
    this.filtroTexto.set('');
    this.filtroCategoria.set('todas');
    this.filtroStatus.set('todas');
  }

  exportarReceitas() {
    this.carregandoImportExport.set(true);

    const primeiroDia = new Date(this.anoAtual(), this.mesAtual() - 1, 1);
    const ultimoDia = new Date(this.anoAtual(), this.mesAtual(), 0);

    const filtros = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0],
      categoriaId: this.filtroCategoria() !== 'todas' ? this.filtroCategoria() : undefined
    };

    this.receitaService.exportar(filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receitas-${this.getMesNome()}-${this.anoAtual()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.carregandoImportExport.set(false);

        this.alertDialog.set({
          isOpen: true,
          title: 'Sucesso',
          message: 'Receitas exportadas com sucesso!',
          type: 'success'
        });
      },
      error: (err) => {
        console.error('Erro ao exportar:', err);
        this.carregandoImportExport.set(false);
        this.alertDialog.set({
          isOpen: true,
          title: 'Erro',
          message: 'Não foi possível exportar as receitas.',
          type: 'error'
        });
      }
    });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const arquivo = input.files[0];

    if (!arquivo.name.match(/\.(xlsx|xls)$/)) {
      this.alertDialog.set({
        isOpen: true,
        title: 'Erro',
        message: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)',
        type: 'error'
      });
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      this.alertDialog.set({
        isOpen: true,
        title: 'Erro',
        message: 'O arquivo deve ter no máximo 5MB',
        type: 'error'
      });
      return;
    }

    this.carregandoImportExport.set(true);
    this.receitaService.importar(arquivo).subscribe({
      next: (response) => {
        if (response.success) {
          const result = response.data as any;
          const mensagem = `Importação concluída!\nTotal: ${result.total}\nSucesso: ${result.success}\nFalhas: ${result.failed}`;

          this.alertDialog.set({
            isOpen: true,
            title: 'Importação Concluída',
            message: mensagem,
            type: result.failed > 0 ? 'warning' : 'success'
          });

          this.carregarReceitas();
        }
        this.carregandoImportExport.set(false);
        input.value = '';
      },
      error: (err) => {
        console.error('Erro ao importar:', err);
        this.carregandoImportExport.set(false);
        input.value = '';

        this.alertDialog.set({
          isOpen: true,
          title: 'Erro',
          message: 'Não foi possível importar o arquivo.',
          type: 'error'
        });
      }
    });
  }
}
