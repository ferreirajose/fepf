import { Component, signal, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DespesaService, Despesa as DespesaAPI } from '../../shared/services/despesa.service';
import { CategoriaService, Categoria } from '../../shared/services/categoria.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  cartaoId?: string;
  cartaoNome?: string;
  recorrente: boolean;
  pago: boolean;
  observacoes?: string;
}

@Component({
  selector: 'app-despesas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent, AlertDialogComponent],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.css'
})
export class DespesasComponent implements OnInit {
  private despesaService = inject(DespesaService);
  private categoriaService = inject(CategoriaService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  filtroTexto = signal('');
  filtroCategoria = signal('todas');
  filtroStatus = signal('todas');
  mesAtual = signal(new Date().getMonth() + 1);
  anoAtual = signal(new Date().getFullYear());
  carregando = signal(false);
  carregandoImportExport = signal(false);
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

  despesas = signal<Despesa[]>([]);

  categorias = signal<Array<{ id: string; nome: string }>>([
    { id: 'todas', nome: 'Todas Categorias' }
  ]);

  ngOnInit() {
    this.carregarCategorias();
    this.carregarDespesas();
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

  carregarDespesas() {
    this.carregando.set(true);
    this.erro.set(null);

    const primeiroDia = new Date(this.anoAtual(), this.mesAtual() - 1, 1);
    const ultimoDia = new Date(this.anoAtual(), this.mesAtual(), 0);

    const filtros = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0]
    };

    this.despesaService.listar(filtros).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.despesas.set((response.data as DespesaAPI[]).map(d => {
            // Converter data UTC para data local sem timezone
            const dataUTC = new Date(d.data);
            const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());

            return {
              id: (d as any)._id || d.id || '',
              descricao: d.descricao,
              valor: d.valor,
              data: dataLocal,
              categoriaId: (d as any).categoriaId?._id || (d as any).categoriaId?.id || d.categoriaId,
              categoriaNome: (d as any).categoriaId?.nome || 'Sem categoria',
              categoriaIcone: (d as any).categoriaId?.icone || 'circle',
              categoriaCor: (d as any).categoriaId?.cor || '#6e9fff',
              cartaoId: (d as any).cartaoId?._id || (d as any).cartaoId?.id || d.cartaoId,
              cartaoNome: (d as any).cartaoId?.nome,
              recorrente: d.recorrente,
              pago: d.pago || false,
              observacoes: d.observacoes
            };
          }));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar despesas:', err);
        this.erro.set('Não foi possível carregar as despesas');
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
    this.carregarDespesas();
  }

  mesAnterior() {
    if (this.mesAtual() === 1) {
      this.mesAtual.set(12);
      this.anoAtual.set(this.anoAtual() - 1);
    } else {
      this.mesAtual.set(this.mesAtual() - 1);
    }
    this.carregarDespesas();
  }

  getDespesasFiltradas(): Despesa[] {
    let despesas = this.despesas().filter(d => {
      const dataD = new Date(d.data);
      return dataD.getMonth() + 1 === this.mesAtual() && dataD.getFullYear() === this.anoAtual();
    });

    // Filtro por texto
    if (this.filtroTexto()) {
      const texto = this.filtroTexto().toLowerCase();
      despesas = despesas.filter(d =>
        d.descricao.toLowerCase().includes(texto) ||
        d.categoriaNome.toLowerCase().includes(texto)
      );
    }

    // Filtro por categoria
    if (this.filtroCategoria() !== 'todas') {
      despesas = despesas.filter(d => d.categoriaId === this.filtroCategoria());
    }

    // Filtro por status
    if (this.filtroStatus() === 'pagas') {
      despesas = despesas.filter(d => d.pago);
    } else if (this.filtroStatus() === 'pendentes') {
      despesas = despesas.filter(d => !d.pago);
    }

    return despesas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  getTotalDespesas(): number {
    return this.getDespesasFiltradas().reduce((sum, d) => sum + d.valor, 0);
  }

  getMaiorDespesa(): number {
    const despesas = this.getDespesasFiltradas();
    if (despesas.length === 0) return 0;
    return Math.max(...despesas.map(d => d.valor));
  }

  getQuantidadeDespesas(): number {
    return this.getDespesasFiltradas().length;
  }

  getTotalPago(): number {
    return this.getDespesasFiltradas()
      .filter(d => d.pago)
      .reduce((sum, d) => sum + d.valor, 0);
  }

  getTotalPendente(): number {
    return this.getDespesasFiltradas()
      .filter(d => !d.pago)
      .reduce((sum, d) => sum + d.valor, 0);
  }

  getQuantidadePagas(): number {
    return this.getDespesasFiltradas().filter(d => d.pago).length;
  }

  getQuantidadePendentes(): number {
    return this.getDespesasFiltradas().filter(d => !d.pago).length;
  }

  togglePago(despesa: Despesa, event: Event) {
    event.stopPropagation();
    const despesas = this.despesas().map(d => {
      if (d.id === despesa.id) {
        return { ...d, pago: !d.pago };
      }
      return d;
    });
    this.despesas.set(despesas);
  }

  excluirDespesa(id: string, event: Event) {
    event.stopPropagation();

    this.confirmDialog.set({
      isOpen: true,
      title: 'Excluir Despesa',
      message: 'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.despesaService.deletar(id).subscribe({
          next: (response) => {
            if (response.success) {
              const despesas = this.despesas().filter(d => d.id !== id);
              this.despesas.set(despesas);

              this.alertDialog.set({
                isOpen: true,
                title: 'Sucesso',
                message: 'Despesa excluída com sucesso!',
                type: 'success'
              });
            } else {
              this.alertDialog.set({
                isOpen: true,
                title: 'Erro',
                message: response.error || 'Não foi possível excluir a despesa',
                type: 'error'
              });
            }
          },
          error: (err) => {
            console.error('Erro ao excluir despesa:', err);
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: 'Não foi possível excluir a despesa. Tente novamente.',
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

  exportarDespesas() {
    this.carregandoImportExport.set(true);

    const primeiroDia = new Date(this.anoAtual(), this.mesAtual() - 1, 1);
    const ultimoDia = new Date(this.anoAtual(), this.mesAtual(), 0);

    const filtros = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0],
      categoriaId: this.filtroCategoria() !== 'todas' ? this.filtroCategoria() : undefined
    };

    this.despesaService.exportar(filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `despesas-${this.getMesNome()}-${this.anoAtual()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.carregandoImportExport.set(false);

        this.alertDialog.set({
          isOpen: true,
          title: 'Sucesso',
          message: 'Despesas exportadas com sucesso!',
          type: 'success'
        });
      },
      error: (err) => {
        console.error('Erro ao exportar:', err);
        this.carregandoImportExport.set(false);
        this.alertDialog.set({
          isOpen: true,
          title: 'Erro',
          message: 'Não foi possível exportar as despesas.',
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
    this.despesaService.importar(arquivo).subscribe({
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

          this.carregarDespesas();
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
