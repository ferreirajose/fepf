import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContaService } from '../../shared/services/conta.service';
import { ReceitaService } from '../../shared/services/receita.service';
import { DespesaService } from '../../shared/services/despesa.service';
import { TransferenciaService } from '../../shared/services/transferencia.service';
import { Conta } from '../../shared/models/conta.model';

interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa' | 'transferencia_recebida' | 'transferencia_enviada';
  descricao: string;
  valor: number;
  data: Date;
  categoria?: string;
  contaOrigem?: string;
  contaDestino?: string;
}

interface FluxoCaixa {
  totalReceitas: number;
  totalDespesas: number;
  totalTransferenciasRecebidas: number;
  totalTransferenciasEnviadas: number;
  saldoLiquido: number;
}

@Component({
  selector: 'app-conta-detalhes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conta-detalhes.component.html',
  styleUrl: './conta-detalhes.component.css'
})
export class ContaDetalhesComponent implements OnInit {
  private contaService = inject(ContaService);
  private receitaService = inject(ReceitaService);
  private despesaService = inject(DespesaService);
  private transferenciaService = inject(TransferenciaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  contaId = signal<string>('');
  conta = signal<Conta | null>(null);
  transacoes = signal<Transacao[]>([]);
  carregando = signal(false);
  erro = signal<string | null>(null);

  filtroTipo = signal<'todas' | 'receitas' | 'despesas' | 'transferencias'>('todas');
  periodoSelecionado = signal<'7dias' | '30dias' | '90dias' | 'todos'>('30dias');

  fluxoCaixa = computed<FluxoCaixa>(() => {
    const transacoes = this.getTransacoesFiltradas();

    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    const transRecebidas = transacoes.filter(t => t.tipo === 'transferencia_recebida');
    const transEnviadas = transacoes.filter(t => t.tipo === 'transferencia_enviada');

    const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
    const totalTransferenciasRecebidas = transRecebidas.reduce((sum, t) => sum + t.valor, 0);
    const totalTransferenciasEnviadas = transEnviadas.reduce((sum, t) => sum + t.valor, 0);

    const saldoLiquido = totalReceitas - totalDespesas + totalTransferenciasRecebidas - totalTransferenciasEnviadas;

    return {
      totalReceitas,
      totalDespesas,
      totalTransferenciasRecebidas,
      totalTransferenciasEnviadas,
      saldoLiquido
    };
  });

  evolucaoSaldo = computed(() => {
    const conta = this.conta();
    if (!conta) return [];

    const transacoes = [...this.transacoes()].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const evolucao: Array<{ data: Date; saldo: number }> = [
      { data: new Date(), saldo: conta.saldoInicial }
    ];

    let saldoAcumulado = conta.saldoInicial;

    transacoes.forEach(t => {
      if (t.tipo === 'receita' || t.tipo === 'transferencia_recebida') {
        saldoAcumulado += t.valor;
      } else if (t.tipo === 'despesa' || t.tipo === 'transferencia_enviada') {
        saldoAcumulado -= t.valor;
      }
      evolucao.push({ data: t.data, saldo: saldoAcumulado });
    });

    return evolucao;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contaId.set(id);
      this.carregarDados();
    } else {
      this.router.navigate(['/contas']);
    }
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    this.contaService.buscarPorId(this.contaId()).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          this.conta.set(response.data);
          this.carregarTransacoes();
        } else {
          this.erro.set('Conta não encontrada');
          this.carregando.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar conta:', err);
        this.erro.set('Não foi possível carregar os dados da conta');
        this.carregando.set(false);
      }
    });
  }

  carregarTransacoes() {
    const contaId = this.contaId();
    const transacoes: Transacao[] = [];

    Promise.all([
      this.carregarReceitas(contaId),
      this.carregarDespesas(contaId),
      this.carregarTransferencias(contaId)
    ]).then(([receitas, despesas, transferencias]) => {
      this.transacoes.set([...receitas, ...despesas, ...transferencias]);
      this.carregando.set(false);
    }).catch(err => {
      console.error('Erro ao carregar transações:', err);
      this.erro.set('Erro ao carregar histórico de transações');
      this.carregando.set(false);
    });
  }

  carregarReceitas(contaId: string): Promise<Transacao[]> {
    return new Promise((resolve) => {
      this.receitaService.listar().subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const receitas = response.data
              .filter((r: any) => r.contaId === contaId || r.contaId?._id === contaId)
              .map((r: any) => ({
                id: r._id || r.id,
                tipo: 'receita' as const,
                descricao: r.descricao,
                valor: r.valor,
                data: new Date(r.data),
                categoria: r.categoriaId?.nome || 'Sem categoria'
              }));
            resolve(receitas);
          } else {
            resolve([]);
          }
        },
        error: () => resolve([])
      });
    });
  }

  carregarDespesas(contaId: string): Promise<Transacao[]> {
    return new Promise((resolve) => {
      this.despesaService.listar().subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const despesas = response.data
              .filter((d: any) => d.contaId === contaId || d.contaId?._id === contaId)
              .map((d: any) => ({
                id: d._id || d.id,
                tipo: 'despesa' as const,
                descricao: d.descricao,
                valor: d.valor,
                data: new Date(d.data),
                categoria: d.categoriaId?.nome || 'Sem categoria'
              }));
            resolve(despesas);
          } else {
            resolve([]);
          }
        },
        error: () => resolve([])
      });
    });
  }

  carregarTransferencias(contaId: string): Promise<Transacao[]> {
    return new Promise((resolve) => {
      this.transferenciaService.listar().subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const transferencias: Transacao[] = [];

            response.data.forEach((t: any) => {
              const contaOrigemId = t.contaOrigemId?._id || t.contaOrigemId;
              const contaDestinoId = t.contaDestinoId?._id || t.contaDestinoId;

              if (contaOrigemId === contaId) {
                transferencias.push({
                  id: t._id || t.id,
                  tipo: 'transferencia_enviada',
                  descricao: t.descricao || 'Transferência enviada',
                  valor: t.valor,
                  data: new Date(t.data),
                  contaDestino: t.contaDestinoId?.nome || 'Desconhecida'
                });
              }

              if (contaDestinoId === contaId) {
                transferencias.push({
                  id: t._id || t.id,
                  tipo: 'transferencia_recebida',
                  descricao: t.descricao || 'Transferência recebida',
                  valor: t.valor,
                  data: new Date(t.data),
                  contaOrigem: t.contaOrigemId?.nome || 'Desconhecida'
                });
              }
            });

            resolve(transferencias);
          } else {
            resolve([]);
          }
        },
        error: () => resolve([])
      });
    });
  }

  getTransacoesFiltradas(): Transacao[] {
    let transacoes = this.transacoes();

    // Filtro por tipo
    if (this.filtroTipo() === 'receitas') {
      transacoes = transacoes.filter(t => t.tipo === 'receita');
    } else if (this.filtroTipo() === 'despesas') {
      transacoes = transacoes.filter(t => t.tipo === 'despesa');
    } else if (this.filtroTipo() === 'transferencias') {
      transacoes = transacoes.filter(t =>
        t.tipo === 'transferencia_recebida' || t.tipo === 'transferencia_enviada'
      );
    }

    // Filtro por período
    const hoje = new Date();
    const dataLimite = new Date();

    if (this.periodoSelecionado() === '7dias') {
      dataLimite.setDate(hoje.getDate() - 7);
    } else if (this.periodoSelecionado() === '30dias') {
      dataLimite.setDate(hoje.getDate() - 30);
    } else if (this.periodoSelecionado() === '90dias') {
      dataLimite.setDate(hoje.getDate() - 90);
    }

    if (this.periodoSelecionado() !== 'todos') {
      transacoes = transacoes.filter(t => new Date(t.data) >= dataLimite);
    }

    return transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  getTipoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'receita': 'ri-arrow-up-circle-fill',
      'despesa': 'ri-arrow-down-circle-fill',
      'transferencia_recebida': 'ri-download-line',
      'transferencia_enviada': 'ri-upload-line'
    };
    return icons[tipo] || 'ri-exchange-line';
  }

  getTipoCor(tipo: string): string {
    const cores: Record<string, string> = {
      'receita': '#006947',
      'despesa': '#b51621',
      'transferencia_recebida': '#2196F3',
      'transferencia_enviada': '#FF9800'
    };
    return cores[tipo] || '#515981';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'receita': 'Receita',
      'despesa': 'Despesa',
      'transferencia_recebida': 'Transferência Recebida',
      'transferencia_enviada': 'Transferência Enviada'
    };
    return labels[tipo] || tipo;
  }

  atualizarSaldo() {
    this.contaService.calcularSaldo(this.contaId()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const contaAtual = this.conta();
          if (contaAtual) {
            this.conta.set({
              ...contaAtual,
              saldoAtual: response.data.saldoAtual
            });
          }
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar saldo:', err);
      }
    });
  }

  voltar() {
    this.router.navigate(['/contas']);
  }
}
