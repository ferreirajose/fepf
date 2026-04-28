import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FormsModule } from '@angular/forms';
import { DespesaService, Despesa as DespesaAPI } from '../../shared/services/despesa.service';

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
  imports: [CommonModule, RouterLink, FeatherModule, FormsModule],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.css'
})
export class DespesasComponent implements OnInit {
  private despesaService = inject(DespesaService);

  filtroTexto = signal('');
  filtroCategoria = signal('todas');
  filtroStatus = signal('todas');
  mesAtual = signal(new Date().getMonth() + 1);
  anoAtual = signal(new Date().getFullYear());
  carregando = signal(false);
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

  despesas = signal<Despesa[]>([]);

  categorias = [
    { id: 'todas', nome: 'Todas Categorias' },
    { id: '1', nome: 'Alimentação' },
    { id: '2', nome: 'Lazer' },
    { id: '3', nome: 'Transporte' },
    { id: '4', nome: 'Moradia' },
    { id: '5', nome: 'Saúde' }
  ];

  ngOnInit() {
    this.carregarDespesas();
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
          this.despesas.set((response.data as DespesaAPI[]).map(d => ({
            id: d.id || '',
            descricao: d.descricao,
            valor: d.valor,
            data: new Date(d.data),
            categoriaId: d.categoriaId,
            categoriaNome: (d as any).categoriaId?.nome || 'Sem categoria',
            categoriaIcone: (d as any).categoriaId?.icone || 'circle',
            categoriaCor: (d as any).categoriaId?.cor || '#6e9fff',
            cartaoId: d.cartaoId,
            cartaoNome: (d as any).cartaoId?.nome,
            recorrente: d.recorrente,
            pago: d.pago || false,
            observacoes: d.observacoes
          })));
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
    if (confirm('Deseja realmente excluir esta despesa?')) {
      this.despesaService.deletar(id).subscribe({
        next: (response) => {
          if (response.success) {
            const despesas = this.despesas().filter(d => d.id !== id);
            this.despesas.set(despesas);
          } else {
            alert('Erro ao excluir despesa: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao excluir despesa:', err);
          alert('Não foi possível excluir a despesa');
        }
      });
    }
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
}
