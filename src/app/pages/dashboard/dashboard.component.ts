import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FinanceiroService } from '../../shared/services/financeiro.service';
import { MapClustererComponent } from '../../shared/components/map-clusterer/map-clusterer.component';
import { DashboardFinanceiro } from '../../shared/models/dashboard.model';
import {
  CORES_GRAFICO,
  formatarMoeda,
  legendaPadrao,
  tooltipPadrao,
  escalaValores,
  escalaRotulos
} from '../../shared/utils/chart-theme';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CORES_RESERVA = ['#6e9fff', '#69f6b8', '#ff928b', '#0057bd', '#006947', '#515981', '#820AD1', '#FFD700'];

// As datas da API são meia-noite UTC; converte para a mesma data no fuso local
const dataLocal = (iso: string): Date => {
  const data = new Date(iso);
  return new Date(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MapClustererComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private financeiroService = inject(FinanceiroService);
  private injector = inject(Injector);

  @ViewChild('evolucaoChart') evolucaoChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cartoesChart') cartoesChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('orcamentosChart') orcamentosChartRef?: ElementRef<HTMLCanvasElement>;

  private evolucaoChart?: Chart;
  private categoriasChart?: Chart;
  private cartoesChart?: Chart;
  private orcamentosChart?: Chart;

  private hoje = new Date();
  mesSelecionado = signal(this.hoje.getMonth() + 1);
  anoSelecionado = signal(this.hoje.getFullYear());

  carregando = signal(false);
  erro = signal<string | null>(null);
  tipoVisualizacao = signal<'mensal' | 'anual'>('mensal');
  dados = signal<DashboardFinanceiro | null>(null);

  googleMapsApiKey = environment.googleMapsApiKey;

  saldo = computed(() => this.dados()?.saldo ?? null);
  saldoAnterior = computed(() => this.saldo()?.saldoAnterior ?? 0);
  saldoAtual = computed(() => this.saldo()?.saldoAtual ?? 0);
  receitasMes = computed(() => this.saldo()?.receitasMes ?? 0);
  despesasMes = computed(() => this.saldo()?.despesasMes ?? 0);

  periodoInput = computed(() =>
    `${this.anoSelecionado()}-${String(this.mesSelecionado()).padStart(2, '0')}`
  );

  ehMesAtual = computed(() =>
    this.mesSelecionado() === this.hoje.getMonth() + 1 && this.anoSelecionado() === this.hoje.getFullYear()
  );

  // Percentual das receitas do mês consumido pelas despesas
  comprometimentoReceitas = computed(() => {
    const saldo = this.saldo();
    if (!saldo || saldo.receitasMes <= 0) return saldo && saldo.despesasMes > 0 ? 100 : 0;
    return (saldo.despesasMes / saldo.receitasMes) * 100;
  });

  transacoesRecentes = computed(() =>
    (this.dados()?.transacoesRecentes ?? []).map(t => ({ ...t, data: dataLocal(t.data) }))
  );

  despesasComLocalizacao = computed(() =>
    (this.dados()?.locais ?? []).map(local => ({ ...local, id: local._id, data: dataLocal(local.data) }))
  );

  totalLocais = computed(() =>
    new Set(this.despesasComLocalizacao().map(d => `${d.latitude},${d.longitude}`)).size
  );

  ngOnInit() {
    this.carregarDados();
  }

  ngOnDestroy() {
    this.destruirGraficos();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    this.financeiroService.obterDashboard(this.mesSelecionado(), this.anoSelecionado()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dados.set(response.data);
          // Os canvas são atualizados depois que o template refletir os novos dados
          afterNextRender(() => this.criarGraficos(), { injector: this.injector });
        } else {
          this.erro.set(response.error || 'Não foi possível carregar os dados');
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
        this.erro.set('Não foi possível carregar os dados');
        this.carregando.set(false);
      }
    });
  }

  alterarPeriodo(valor: string) {
    const [ano, mes] = valor.split('-').map(Number);
    if (!ano || !mes) return;
    this.anoSelecionado.set(ano);
    this.mesSelecionado.set(mes);
    this.carregarDados();
  }

  navegarMes(delta: number) {
    const data = new Date(this.anoSelecionado(), this.mesSelecionado() - 1 + delta, 1);
    this.alterarPeriodo(`${data.getFullYear()}-${data.getMonth() + 1}`);
  }

  irParaMesAtual() {
    this.alterarPeriodo(`${this.hoje.getFullYear()}-${this.hoje.getMonth() + 1}`);
  }

  nomeMesSelecionado(): string {
    return new Date(this.anoSelecionado(), this.mesSelecionado() - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  getMapUrlComMarcadores(): string {
    const locais = this.despesasComLocalizacao();
    if (locais.length === 0) return '';

    if (locais.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${locais[0].latitude},${locais[0].longitude}`;
    }

    // Google Maps aceita no máximo 9 waypoints intermediários
    const origem = locais[0];
    const destino = locais[locais.length - 1];
    const waypoints = locais.slice(1, -1).slice(0, 9).map(l => `${l.latitude},${l.longitude}`).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origem.latitude},${origem.longitude}&destination=${destino.latitude},${destino.longitude}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    return url + '&travelmode=driving';
  }

  setTipoVisualizacao(tipo: 'mensal' | 'anual') {
    this.tipoVisualizacao.set(tipo);
    this.criarGraficoEvolucao();
  }

  private criarGraficos() {
    this.criarGraficoEvolucao();
    this.criarGraficoCategorias();
    this.criarGraficoCartoes();
    this.criarGraficoOrcamentos();
  }

  private destruirGraficos() {
    this.evolucaoChart?.destroy();
    this.categoriasChart?.destroy();
    this.cartoesChart?.destroy();
    this.orcamentosChart?.destroy();
  }

  private criarGraficoEvolucao() {
    const ctx = this.evolucaoChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.evolucaoChart?.destroy();

    const receitasGradient = ctx.createLinearGradient(0, 0, 0, 300);
    receitasGradient.addColorStop(0, 'rgba(0, 105, 71, 0.3)');
    receitasGradient.addColorStop(1, 'rgba(0, 105, 71, 0.01)');

    const despesasGradient = ctx.createLinearGradient(0, 0, 0, 300);
    despesasGradient.addColorStop(0, 'rgba(181, 22, 33, 0.3)');
    despesasGradient.addColorStop(1, 'rgba(181, 22, 33, 0.01)');

    const evolucao = this.dados()?.evolucao ?? [];
    let labels: string[];
    let receitasData: number[];
    let despesasData: number[];

    if (this.tipoVisualizacao() === 'mensal') {
      // Últimos 12 meses até o mês selecionado
      const ultimos = evolucao.slice(-12);
      labels = ultimos.map(e =>
        e.ano !== this.anoSelecionado() ? `${MESES_ABREV[e.mes - 1]}/${e.ano}` : MESES_ABREV[e.mes - 1]
      );
      receitasData = ultimos.map(e => e.receitas);
      despesasData = ultimos.map(e => e.despesas);
    } else {
      // Totais por ano (o ano selecionado vai até o mês selecionado)
      const anos = [...new Set(evolucao.map(e => e.ano))];
      labels = anos.map(String);
      receitasData = anos.map(ano => evolucao.filter(e => e.ano === ano).reduce((s, e) => s + e.receitas, 0));
      despesasData = anos.map(ano => evolucao.filter(e => e.ano === ano).reduce((s, e) => s + e.despesas, 0));
    }

    const estiloLinha = (cor: string) => ({
      borderColor: cor,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: cor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    });

    this.evolucaoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Receitas', data: receitasData, backgroundColor: receitasGradient, ...estiloLinha(CORES_GRAFICO.receita) },
          { label: 'Despesas', data: despesasData, backgroundColor: despesasGradient, ...estiloLinha(CORES_GRAFICO.despesa) }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legendaPadrao<'line'>(),
          tooltip: {
            ...tooltipPadrao<'line'>(),
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatarMoeda(context.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          y: escalaValores(),
          x: escalaRotulos()
        }
      }
    });
  }

  private criarGraficoCategorias() {
    const ctx = this.categoriasChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.categoriasChart?.destroy();

    const categorias = this.dados()?.despesasPorCategoria ?? [];
    const temDados = categorias.length > 0;

    // Usa a cor cadastrada na categoria; repete cores apenas na falta delas
    const cores = categorias.map((c, i) => c.cor || CORES_RESERVA[i % CORES_RESERVA.length]);

    this.categoriasChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: temDados ? categorias.map(c => c.nome) : ['Sem despesas no mês'],
        datasets: [{
          data: temDados ? categorias.map(c => c.total) : [1],
          backgroundColor: temDados ? cores : ['#efefff'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: legendaPadrao<'doughnut'>('bottom'),
          tooltip: {
            ...tooltipPadrao<'doughnut'>(),
            enabled: temDados,
            callbacks: {
              label: (context) => {
                const valor = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0';
                return `${context.label}: ${formatarMoeda(valor)} (${percentual}%)`;
              }
            }
          }
        }
      }
    });
  }

  private criarGraficoCartoes() {
    const ctx = this.cartoesChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.cartoesChart?.destroy();

    const cartoes = this.dados()?.cartoes ?? [];
    const temDados = cartoes.length > 0;
    const formatarDia = (iso: string) => dataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    this.cartoesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: temDados ? cartoes.map(c => c.nome) : ['Sem cartões cadastrados'],
        datasets: [
          {
            label: 'Utilizado',
            data: temDados ? cartoes.map(c => c.utilizado) : [0],
            backgroundColor: CORES_GRAFICO.despesa,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Disponível',
            data: temDados ? cartoes.map(c => c.disponivel) : [0],
            backgroundColor: CORES_GRAFICO.receita,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legendaPadrao<'bar'>(),
          tooltip: {
            ...tooltipPadrao<'bar'>(),
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatarMoeda(context.parsed.x ?? 0)}`,
              afterBody: (context) => {
                const cartao = cartoes[context[0]?.dataIndex];
                if (!cartao) return [];
                return [
                  '',
                  `Fatura: ${formatarDia(cartao.cicloInicio)} a ${formatarDia(cartao.cicloFim)}`,
                  `Limite: ${formatarMoeda(cartao.limite)}`,
                  `Utilização: ${cartao.percentualUtilizado.toFixed(1)}%`
                ];
              }
            }
          }
        },
        scales: {
          x: escalaValores(true),
          y: escalaRotulos(true)
        }
      }
    });
  }

  private criarGraficoOrcamentos() {
    const ctx = this.orcamentosChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.orcamentosChart?.destroy();

    const orcamentos = this.dados()?.orcamentos ?? [];
    const temDados = orcamentos.length > 0;

    // Verde: normal · Laranja: acima de 90% · Vermelho: excedido
    const coresGastos = orcamentos.map(o => {
      if (o.percentualGasto > 100) return CORES_GRAFICO.despesa;
      if (o.percentualGasto >= 90) return CORES_GRAFICO.alerta;
      return CORES_GRAFICO.receita;
    });

    this.orcamentosChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: temDados ? orcamentos.map(o => o.categoriaNome) : ['Sem orçamentos no mês'],
        datasets: [
          {
            label: 'Planejado',
            data: temDados ? orcamentos.map(o => o.valorPlanejado) : [0],
            backgroundColor: CORES_GRAFICO.planejado,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Gasto',
            data: temDados ? orcamentos.map(o => o.valorGasto) : [0],
            backgroundColor: temDados ? coresGastos : [CORES_GRAFICO.neutro],
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legendaPadrao<'bar'>(),
          tooltip: {
            ...tooltipPadrao<'bar'>(),
            callbacks: {
              label: (context) => {
                const orcamento = orcamentos[context.dataIndex];
                let label = `${context.dataset.label}: ${formatarMoeda(context.parsed.y ?? 0)}`;
                if (context.dataset.label === 'Gasto' && orcamento) {
                  label += ` (${orcamento.percentualGasto.toFixed(1)}%)`;
                }
                return label;
              },
              afterLabel: (context) => {
                const orcamento = orcamentos[context.dataIndex];
                if (context.dataset.label !== 'Gasto' || !orcamento) return '';
                return orcamento.valorRestante >= 0
                  ? `Restante: ${formatarMoeda(orcamento.valorRestante)}`
                  : `Excedido em: ${formatarMoeda(Math.abs(orcamento.valorRestante))}`;
              }
            }
          }
        },
        scales: {
          y: escalaValores(),
          x: escalaRotulos()
        }
      }
    });
  }
}
