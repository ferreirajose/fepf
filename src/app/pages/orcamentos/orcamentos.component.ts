import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { OrcamentoService, Orcamento as OrcamentoAPI } from '../../shared/services/orcamento.service';

interface Orcamento {
  id: string;
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  valorPlanejado: number;
  valorGasto: number;
  mes: number;
  ano: number;
  ativo: boolean;
}

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherModule],
  templateUrl: './orcamentos.component.html',
  styleUrl: './orcamentos.component.css'
})
export class OrcamentosComponent implements OnInit {
  private orcamentoService = inject(OrcamentoService);

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

  orcamentos = signal<Orcamento[]>([]);

  ngOnInit() {
    this.carregarOrcamentos();
  }

  carregarOrcamentos() {
    this.carregando.set(true);
    this.erro.set(null);

    const filtros = {
      mes: this.mesAtual(),
      ano: this.anoAtual()
    };

    this.orcamentoService.listar(filtros).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.orcamentos.set((response.data as OrcamentoAPI[]).map(o => ({
            id: o._id || '',
            categoriaId: o.categoriaId,
            categoriaNome: (o as any).categoriaId?.nome || 'Sem categoria',
            categoriaIcone: (o as any).categoriaId?.icone || 'circle',
            categoriaCor: (o as any).categoriaId?.cor || '#6e9fff',
            valorPlanejado: o.valor,
            valorGasto: 0,
            mes: o.mes,
            ano: o.ano,
            ativo: true
          })));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar orçamentos:', err);
        this.erro.set('Não foi possível carregar os orçamentos');
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
    this.carregarOrcamentos();
  }

  mesAnterior() {
    if (this.mesAtual() === 1) {
      this.mesAtual.set(12);
      this.anoAtual.set(this.anoAtual() - 1);
    } else {
      this.mesAtual.set(this.mesAtual() - 1);
    }
    this.carregarOrcamentos();
  }

  getOrcamentosDoMes(): Orcamento[] {
    return this.orcamentos().filter(o =>
      o.mes === this.mesAtual() && o.ano === this.anoAtual()
    );
  }

  getPercentualGasto(orcamento: Orcamento): number {
    if (orcamento.valorPlanejado === 0) return 0;
    return (orcamento.valorGasto / orcamento.valorPlanejado) * 100;
  }

  getValorRestante(orcamento: Orcamento): number {
    return orcamento.valorPlanejado - orcamento.valorGasto;
  }

  isExcedido(orcamento: Orcamento): boolean {
    return orcamento.valorGasto > orcamento.valorPlanejado;
  }

  getTotalPlanejado(): number {
    return this.getOrcamentosDoMes().reduce((sum, o) => sum + o.valorPlanejado, 0);
  }

  getTotalGasto(): number {
    return this.getOrcamentosDoMes().reduce((sum, o) => sum + o.valorGasto, 0);
  }

  getTotalRestante(): number {
    return this.getTotalPlanejado() - this.getTotalGasto();
  }

  getPercentualTotalGasto(): number {
    const total = this.getTotalPlanejado();
    if (total === 0) return 0;
    return (this.getTotalGasto() / total) * 100;
  }

  getQuantidadeExcedidos(): number {
    return this.getOrcamentosDoMes().filter(o => this.isExcedido(o)).length;
  }

  getQuantidadeDentroDoLimite(): number {
    return this.getOrcamentosDoMes().filter(o => !this.isExcedido(o)).length;
  }

  excluirOrcamento(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Deseja realmente excluir este orçamento?')) {
      this.orcamentoService.deletar(id).subscribe({
        next: (response) => {
          if (response.success) {
            const orcamentos = this.orcamentos().filter(o => o.id !== id);
            this.orcamentos.set(orcamentos);
          } else {
            alert('Erro ao excluir orçamento: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao excluir orçamento:', err);
          alert('Não foi possível excluir o orçamento');
        }
      });
    }
  }

  getProgressWidth(orcamento: Orcamento): number {
    return Math.min(this.getPercentualGasto(orcamento), 100);
  }
}
