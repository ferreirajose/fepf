import { Component, signal, inject, OnInit, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DespesaService, Despesa as DespesaAPI } from '../../shared/services/despesa.service';
import { CategoriaService, Categoria, Subcategoria } from '../../shared/services/categoria.service';
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
  subcategoriaId?: string;
  subcategoriaNome?: string;
  cartaoId?: string;
  cartaoNome?: string;
  recorrente: boolean;
  pago: boolean;
  formaPagamento?: 'dinheiro' | 'debito' | 'credito' | 'pix';
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
  filtroSubcategoria = signal('todas');
  filtroStatus = signal('todas');
  filtroFormaPagamento = signal('todas');
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

  subcategorias = signal<Array<{ id: string; nome: string }>>([
    { id: 'todas', nome: 'Todas Subcategorias' }
  ]);

  // Computed para verificar se select de subcategoria deve estar habilitado
  subcategoriaHabilitada = computed(() => {
    return this.filtroCategoria() !== 'todas' && this.subcategorias().length > 1;
  });

  // Armazena todas as categorias com suas subcategorias
  private categoriasCompletas: Categoria[] = [];

  ngOnInit() {
    this.carregarCategorias();
    this.carregarDespesas();
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          const categoriasApi = response.data as Categoria[];

          // Armazenar categorias completas para acessar subcategorias
          this.categoriasCompletas = categoriasApi.filter(c => c.ativo);

          // Filtrar apenas categorias ativas
          // Note: campo 'tipo' será adicionado futuramente para separar despesa/receita
          const categoriasAtivas = this.categoriasCompletas
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

  carregarSubcategorias(categoriaId: string) {
    if (categoriaId === 'todas') {
      this.subcategorias.set([{ id: 'todas', nome: 'Todas Subcategorias' }]);
      this.filtroSubcategoria.set('todas');
      return;
    }

    const categoria = this.categoriasCompletas.find(c => c._id === categoriaId);

    if (categoria && categoria.subcategorias && categoria.subcategorias.length > 0) {
      const subcategoriasAtivas = categoria.subcategorias
        .filter(s => s.ativo)
        .map(s => ({
          id: s.id,
          nome: s.nome
        }));

      this.subcategorias.set([
        { id: 'todas', nome: 'Todas Subcategorias' },
        ...subcategoriasAtivas
      ]);
    } else {
      this.subcategorias.set([{ id: 'todas', nome: 'Todas Subcategorias' }]);
    }
    this.filtroSubcategoria.set('todas');
  }

  onCategoriaChange(categoriaId: string) {
    this.carregarSubcategorias(categoriaId);
    this.carregarDespesas();
  }

  onSubcategoriaChange() {
    this.carregarDespesas();
  }

  onFormaPagamentoChange() {
    this.carregarDespesas();
  }

  onStatusChange() {
    this.carregarDespesas();
  }

  carregarDespesas() {
    this.carregando.set(true);
    this.erro.set(null);

    const primeiroDia = new Date(this.anoAtual(), this.mesAtual() - 1, 1);
    const ultimoDia = new Date(this.anoAtual(), this.mesAtual(), 0);

    const filtros: any = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0]
    };

    // Adicionar filtros condicionais
    if (this.filtroCategoria() !== 'todas') {
      filtros.categoriaId = this.filtroCategoria();
    }

    if (this.filtroSubcategoria() !== 'todas') {
      filtros.subcategoriaId = this.filtroSubcategoria();
    }

    if (this.filtroFormaPagamento() !== 'todas') {
      filtros.formaPagamento = this.filtroFormaPagamento();
    }

    if (this.filtroStatus() === 'pagas') {
      filtros.pago = true;
    } else if (this.filtroStatus() === 'pendentes') {
      filtros.pago = false;
    }

    this.despesaService.listar(filtros).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.despesas.set((response.data as DespesaAPI[]).map(d => {
            // Converter data UTC para data local sem timezone
            const dataUTC = new Date(d.data);
            const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());

            // Buscar subcategoria dentro do array de subcategorias da categoria
            const categoria = (d as any).categoriaId;
            const subcategoria = categoria?.subcategorias?.find(
              (s: any) => s.id === d.subcategoriaId
            );

            return {
              id: (d as any)._id || d.id || '',
              descricao: d.descricao,
              valor: d.valor,
              data: dataLocal,
              categoriaId: categoria?._id || categoria?.id || d.categoriaId,
              categoriaNome: categoria?.nome || 'Sem categoria',
              categoriaIcone: categoria?.icone || 'circle',
              categoriaCor: categoria?.cor || '#6e9fff',
              subcategoriaId: d.subcategoriaId,
              subcategoriaNome: subcategoria?.nome,
              cartaoId: (d as any).cartaoId?._id || (d as any).cartaoId?.id || d.cartaoId,
              cartaoNome: (d as any).cartaoId?.nome,
              recorrente: d.recorrente,
              pago: d.pago || false,
              formaPagamento: d.formaPagamento,
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
    let despesas = this.despesas();

    // MANTER apenas o filtro por texto (busca local rápida)
    if (this.filtroTexto()) {
      const texto = this.filtroTexto().toLowerCase();
      despesas = despesas.filter(d =>
        d.descricao.toLowerCase().includes(texto) ||
        d.categoriaNome.toLowerCase().includes(texto) ||
        (d.subcategoriaNome && d.subcategoriaNome.toLowerCase().includes(texto))
      );
    }

    // Filtros de categoria, subcategoria, status e formaPagamento agora são aplicados no backend

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

  getFormaPagamentoTexto(formaPagamento?: string): string {
    if (!formaPagamento) return '';

    const formas: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'debito': 'Débito',
      'credito': 'Crédito',
      'pix': 'PIX'
    };

    return formas[formaPagamento] || formaPagamento;
  }

  getFormaPagamentoIcone(formaPagamento?: string): string {
    if (!formaPagamento) return '';

    const icones: { [key: string]: string } = {
      'dinheiro': 'ri-money-dollar-circle-line',
      'debito': 'ri-bank-card-line',
      'credito': 'ri-bank-card-2-line',
      'pix': 'ri-qr-code-line'
    };

    return icones[formaPagamento] || 'ri-wallet-line';
  }

  limparFiltros() {
    this.filtroTexto.set('');
    this.filtroCategoria.set('todas');
    this.filtroSubcategoria.set('todas');
    this.filtroStatus.set('todas');
    this.filtroFormaPagamento.set('todas');
    this.subcategorias.set([{ id: 'todas', nome: 'Todas Subcategorias' }]);
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
