import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DespesaService } from '../../shared/services/despesa.service';
import { ReceitaService } from '../../shared/services/receita.service';
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

  @ViewChild('evolucaoChart') evolucaoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cartoesChart') cartoesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orcamentosChart') orcamentosChartRef!: ElementRef<HTMLCanvasElement>;

  saldoAtual = signal(0);
  receitasMes = signal(0);
  despesasMes = signal(0);
  carregando = signal(false);
  erro = signal<string | null>(null);

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

    forkJoin({
      receitas: this.receitaService.obterEstatisticas(filtros),
      despesas: this.despesaService.obterEstatisticas(filtros)
    }).subscribe({
      next: (response) => {
        if (response.receitas.success && response.receitas.data) {
          this.receitasMes.set(response.receitas.data.total || 0);
        }
        if (response.despesas.success && response.despesas.data) {
          this.despesasMes.set(response.despesas.data.total || 0);
        }
        this.saldoAtual.set(this.receitasMes() - this.despesasMes());
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

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Receitas',
            data: [7500, 8200, 7800, 8500, 8100, 8300],
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
            data: [3200, 3450, 3100, 3279.50, 3350, 3180],
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

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'],
        datasets: [{
          data: [1245.50, 920, 2500, 385, 150, 500],
          backgroundColor: [
            '#6e9fff',
            '#69f6b8',
            '#ff928b',
            '#0057bd',
            '#006947',
            '#515981'
          ],
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

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Nubank', 'Itaú', 'Bradesco', 'C6 Bank', 'Amex'],
        datasets: [
          {
            label: 'Utilizado',
            data: [3200, 1850, 980, 750, 1420],
            backgroundColor: '#b51621',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Disponível',
            data: [1800, 3150, 4020, 2250, 3580],
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

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde'],
        datasets: [
          {
            label: 'Planejado',
            data: [1500, 800, 2500, 600, 400],
            backgroundColor: '#0057bd',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Gasto',
            data: [1245.50, 920, 2500, 385, 150],
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
