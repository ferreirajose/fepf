import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DespesaService } from '../../shared/services/despesa.service';
import { ReceitaService } from '../../shared/services/receita.service';
import { CartaoService } from '../../shared/services/cartao.service';
import { OrcamentoService } from '../../shared/services/orcamento.service';
import { CategoriaService } from '../../shared/services/categoria.service';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FeatherModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private despesaService = inject(DespesaService);
  private receitaService = inject(ReceitaService);
  private cartaoService = inject(CartaoService);
  private orcamentoService = inject(OrcamentoService);
  private categoriaService = inject(CategoriaService);

  @ViewChild('evolucaoChart') evolucaoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cartoesChart') cartoesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orcamentosChart') orcamentosChartRef!: ElementRef<HTMLCanvasElement>;

  saldoAtual = signal(0);
  receitasMes = signal(0);
  despesasMes = signal(0);
  carregando = signal(false);
  erro = signal<string | null>(null);

  dadosEstatisticos = signal<any>(null);
  cartoes = signal<any[]>([]);
  orcamentos = signal<any[]>([]);
  categorias = signal<any[]>([]);
  transacoesRecentes: any[] = [];

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    const primeiroDia = new Date();
    primeiroDia.setDate(1);
    const ultimoDia = new Date();
    ultimoDia.setMonth(ultimoDia.getMonth() + 1);
    ultimoDia.setDate(0);

    const filtros = {
      dataInicio: primeiroDia.toISOString().split('T')[0],
      dataFim: ultimoDia.toISOString().split('T')[0]
    };

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    forkJoin({
      receitas: this.receitaService.obterEstatisticas(filtros),
      despesas: this.despesaService.obterEstatisticas(filtros),
      cartoes: this.cartaoService.listar(),
      orcamentos: this.orcamentoService.listar({ mes: mesAtual, ano: anoAtual }),
      categorias: this.categoriaService.listar()
    }).subscribe({
      next: (response) => {
        if (response.receitas.success && response.receitas.data) {
          this.receitasMes.set(response.receitas.data.total || 0);
        }
        if (response.despesas.success && response.despesas.data) {
          this.despesasMes.set(response.despesas.data.total || 0);
        }
        if (response.cartoes.success && Array.isArray(response.cartoes.data)) {
          this.cartoes.set(response.cartoes.data);
        }
        if (response.orcamentos.success && Array.isArray(response.orcamentos.data)) {
          this.orcamentos.set(response.orcamentos.data);
        }
        if (response.categorias.success && Array.isArray(response.categorias.data)) {
          this.categorias.set(response.categorias.data);
        }

        this.saldoAtual.set(this.receitasMes() - this.despesasMes());

        // Armazenar estatísticas completas
        this.dadosEstatisticos.set({
          receitas: response.receitas.data,
          despesas: response.despesas.data
        });

        this.carregando.set(false);

        // Aguardar o próximo ciclo de renderização para criar gráficos
        setTimeout(() => {
          this.criarGraficos();
        }, 100);
      },
      error: (err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
        this.erro.set('Não foi possível carregar os dados');
        this.carregando.set(false);
      }
    });
  }

  calcularSaldo(): number {
    return this.receitasMes() - this.despesasMes();
  }

  criarGraficos() {
    this.criarGraficoEvolucao();
    this.criarGraficoCategorias();
    this.criarGraficoCartoes();
    this.criarGraficoOrcamentos();
  }

  criarGraficoEvolucao() {
    if (!this.evolucaoChartRef) return;

    const ctx = this.evolucaoChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Criar gradientes para receitas e despesas
    const receitasGradient = ctx.createLinearGradient(0, 0, 0, 300);
    receitasGradient.addColorStop(0, 'rgba(0, 105, 71, 0.3)');
    receitasGradient.addColorStop(1, 'rgba(0, 105, 71, 0.01)');

    const despesasGradient = ctx.createLinearGradient(0, 0, 0, 300);
    despesasGradient.addColorStop(0, 'rgba(181, 22, 33, 0.3)');
    despesasGradient.addColorStop(1, 'rgba(181, 22, 33, 0.01)');

    const stats = this.dadosEstatisticos();
    const receitasPorMes = stats?.receitas?.porMes || [];
    const despesasPorMes = stats?.despesas?.porMes || [];

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = receitasPorMes.map((item: any) => meses[item._id.mes - 1] || '').slice(0, 6);
    const receitasData = receitasPorMes.map((item: any) => item.total).slice(0, 6);
    const despesasData = despesasPorMes.map((item: any) => item.total).slice(0, 6);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Mês Atual'],
        datasets: [
          {
            label: 'Receitas',
            data: receitasData.length > 0 ? receitasData : [this.receitasMes()],
            borderColor: '#006947',
            backgroundColor: receitasGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#006947',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Despesas',
            data: despesasData.length > 0 ? despesasData : [this.despesasMes()],
            borderColor: '#b51621',
            backgroundColor: despesasGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#b51621',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: 600
              },
              color: '#515981',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#242c51',
            bodyColor: '#515981',
            borderColor: '#a3abd7',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: 'Manrope',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter',
              size: 12
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed && typeof context.parsed.y === 'number') {
                  label += 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(163, 171, 215, 0.1)'
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11
              },
              color: '#515981',
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11,
                weight: 600
              },
              color: '#515981'
            }
          }
        }
      }
    });
  }

  criarGraficoCategorias() {
    if (!this.categoriasChartRef) return;

    const ctx = this.categoriasChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const stats = this.dadosEstatisticos();
    const categorias = stats?.despesas?.porCategoria || [];

    const labels = categorias.map((c: any) => c.categoriaNome || 'Sem categoria');
    const data = categorias.map((c: any) => c.total);
    const cores = ['#6e9fff', '#69f6b8', '#ff928b', '#0057bd', '#006947', '#515981', '#820AD1', '#FFD700'];

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sem dados'],
        datasets: [{
          data: data.length > 0 ? data : [0],
          backgroundColor: cores.slice(0, labels.length > 0 ? labels.length : 1),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: 600
              },
              color: '#515981',
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#242c51',
            bodyColor: '#515981',
            borderColor: '#a3abd7',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: 'Manrope',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter',
              size: 12
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                if (typeof value !== 'number') return '';
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return context.label + ': R$ ' + value.toFixed(2).replace('.', ',') + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  criarGraficoCartoes() {
    if (!this.cartoesChartRef) return;

    const ctx = this.cartoesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const cartoes = this.cartoes().filter((c: any) => c.ativo);

    const labels = cartoes.length > 0 ? cartoes.map((c: any) => c.nome) : ['Sem cartões cadastrados'];
    // Para demo, vamos mostrar o limite disponível. No futuro, pode-se buscar despesas por cartão para calcular utilizado
    const limites = cartoes.length > 0 ? cartoes.map((c: any) => c.limite || 0) : [0];
    const utilizados = cartoes.length > 0 ? cartoes.map(() => 0) : [0]; // Placeholder - pode ser calculado futuramente

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Utilizado',
            data: utilizados,
            backgroundColor: '#b51621',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Disponível',
            data: limites,
            backgroundColor: '#006947',
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
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: 600
              },
              color: '#515981',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#242c51',
            bodyColor: '#515981',
            borderColor: '#a3abd7',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: 'Manrope',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter',
              size: 12
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed && typeof context.parsed.x === 'number') {
                  label += 'R$ ' + context.parsed.x.toFixed(2).replace('.', ',');
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: 'rgba(163, 171, 215, 0.1)'
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11
              },
              color: '#515981',
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          },
          y: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11,
                weight: 600
              },
              color: '#515981'
            }
          }
        }
      }
    });
  }

  criarGraficoOrcamentos() {
    if (!this.orcamentosChartRef) return;

    const ctx = this.orcamentosChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const orcamentos = this.orcamentos();
    const stats = this.dadosEstatisticos();
    const categorias = this.categorias();
    const despesasPorCategoria = stats?.despesas?.porCategoria || [];

    // Mapear categorias por ID
    const categoriasMap = new Map();
    categorias.forEach((c: any) => {
      categoriasMap.set(c._id, c.nome);
    });

    // Mapear gastos reais por categoria
    const gastosMap = new Map();
    despesasPorCategoria.forEach((d: any) => {
      gastosMap.set(d.categoriaId, d.total);
    });

    const labels = orcamentos.length > 0
      ? orcamentos.map((o: any) => categoriasMap.get(o.categoriaId) || 'Categoria')
      : ['Sem orçamentos cadastrados'];
    const planejados = orcamentos.length > 0 ? orcamentos.map((o: any) => o.valor || 0) : [0];
    const gastos = orcamentos.length > 0 ? orcamentos.map((o: any) => gastosMap.get(o.categoriaId) || 0) : [0];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Planejado',
            data: planejados,
            backgroundColor: '#0057bd',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Gasto',
            data: gastos,
            backgroundColor: '#6e9fff',
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: 'Inter',
                size: 12,
                weight: 600
              },
              color: '#515981',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#242c51',
            bodyColor: '#515981',
            borderColor: '#a3abd7',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              family: 'Manrope',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter',
              size: 12
            },
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed && typeof context.parsed.y === 'number') {
                  label += 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(163, 171, 215, 0.1)'
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11
              },
              color: '#515981',
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Inter',
                size: 11,
                weight: 600
              },
              color: '#515981'
            }
          }
        }
      }
    });
  }
}
