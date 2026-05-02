import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DespesaService } from '../../shared/services/despesa.service';
import { ReceitaService } from '../../shared/services/receita.service';
import { CartaoService } from '../../shared/services/cartao.service';
import { OrcamentoService } from '../../shared/services/orcamento.service';
import { CategoriaService } from '../../shared/services/categoria.service';
import { FinanceiroService } from '../../shared/services/financeiro.service';
import { MapClustererComponent } from '../../shared/components/map-clusterer/map-clusterer.component';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MapClustererComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private despesaService = inject(DespesaService);
  private receitaService = inject(ReceitaService);
  private cartaoService = inject(CartaoService);
  private orcamentoService = inject(OrcamentoService);
  private categoriaService = inject(CategoriaService);
  private financeiroService = inject(FinanceiroService);

  @ViewChild('evolucaoChart') evolucaoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriasChart') categoriasChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cartoesChart') cartoesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orcamentosChart') orcamentosChartRef!: ElementRef<HTMLCanvasElement>;

  // Instâncias dos gráficos
  private evolucaoChart?: Chart;
  private categoriasChart?: Chart;
  private cartoesChart?: Chart;
  private orcamentosChart?: Chart;

  saldoAnterior = signal(0);
  saldoAtual = signal(0);
  receitasMes = signal(0);
  despesasMes = signal(0);
  carregando = signal(false);
  erro = signal<string | null>(null);
  tipoVisualizacao = signal<'mensal' | 'anual'>('mensal');

  dadosEstatisticos = signal<any>(null);
  cartoes = signal<any[]>([]);
  orcamentos = signal<any[]>([]);
  categorias = signal<any[]>([]);
  transacoesRecentes: any[] = [];
  despesasComLocalizacao = signal<any[]>([]);
  gruposDespesas = signal<any[]>([]);
  googleMapsApiKey = environment.googleMapsApiKey;

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    // Para o gráfico de evolução, buscar dados dos últimos 5 anos (para ter dados suficientes para visualização anual)
    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + 1);
    dataFim.setDate(0);
    dataFim.setHours(23, 59, 59, 999); // Final do mês atual

    const dataInicio = new Date();
    dataInicio.setFullYear(dataInicio.getFullYear() - 4); // 5 anos atrás (ano atual + 4 anteriores)
    dataInicio.setMonth(0); // Janeiro
    dataInicio.setDate(1);
    dataInicio.setHours(0, 0, 0, 0); // Início do ano

    const filtros = {
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0]
    };

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    forkJoin({
      receitas: this.receitaService.obterEstatisticas(filtros),
      despesas: this.despesaService.obterEstatisticas(filtros),
      receitasLista: this.receitaService.listar(),
      despesasLista: this.despesaService.listar(),
      cartoes: this.cartaoService.listar(),
      orcamentos: this.orcamentoService.listar({ mes: mesAtual, ano: anoAtual }),
      categorias: this.categoriaService.listar(),
      saldoAcumulado: this.financeiroService.obterSaldoAcumulado(mesAtual, anoAtual)
    }).subscribe({
      next: (response) => {
        if (response.saldoAcumulado.success && response.saldoAcumulado.data) {
          const saldo = response.saldoAcumulado.data;
          this.saldoAnterior.set(saldo.saldoAnterior);
          this.receitasMes.set(saldo.receitasMes);
          this.despesasMes.set(saldo.despesasMes);
          this.saldoAtual.set(saldo.saldoAtual);
        } else {
          if (response.receitas.success && response.receitas.data) {
            this.receitasMes.set(response.receitas.data.total || 0);
          }
          if (response.despesas.success && response.despesas.data) {
            this.despesasMes.set(response.despesas.data.total || 0);
          }
          this.saldoAtual.set(this.receitasMes() - this.despesasMes());
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

        // Armazenar estatísticas completas
        this.dadosEstatisticos.set({
          receitas: response.receitas.data,
          despesas: response.despesas.data
        });

        // Processar transações recentes
        this.processarTransacoesRecentes(response.receitasLista.data, response.despesasLista.data);

        // Processar despesas com localização
        this.processarDespesasComLocalizacao(response.despesasLista.data);

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
    return this.saldoAnterior() + this.receitasMes() - this.despesasMes();
  }

  processarTransacoesRecentes(receitas: any, despesas: any) {
    const transacoes: any[] = [];

    // Adicionar receitas
    if (Array.isArray(receitas)) {
      receitas.forEach((receita: any) => {
        const dataUTC = new Date(receita.data);
        const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());
        transacoes.push({
          tipo: 'receita',
          descricao: receita.descricao,
          valor: receita.valor,
          data: dataLocal
        });
      });
    }

    // Adicionar despesas
    if (Array.isArray(despesas)) {
      despesas.forEach((despesa: any) => {
        const dataUTC = new Date(despesa.data);
        const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());
        transacoes.push({
          tipo: 'despesa',
          descricao: despesa.descricao,
          valor: despesa.valor,
          data: dataLocal
        });
      });
    }

    // Ordenar por data (mais recente primeiro)
    transacoes.sort((a, b) => b.data.getTime() - a.data.getTime());

    // Pegar apenas as 5 mais recentes
    this.transacoesRecentes = transacoes.slice(0, 5);
  }

  processarDespesasComLocalizacao(despesas: any) {
    if (!Array.isArray(despesas)) {
      this.despesasComLocalizacao.set([]);
      this.gruposDespesas.set([]);
      return;
    }

    const despesasComLoc = despesas
      .filter((despesa: any) =>
        despesa.localizacao &&
        despesa.localizacao.latitude &&
        despesa.localizacao.longitude
      )
      .map((despesa: any) => {
        const dataUTC = new Date(despesa.data);
        const dataLocal = new Date(dataUTC.getUTCFullYear(), dataUTC.getUTCMonth(), dataUTC.getUTCDate());
        return {
          id: despesa._id,
          descricao: despesa.descricao,
          valor: despesa.valor,
          data: dataLocal,
          latitude: despesa.localizacao.latitude,
          longitude: despesa.localizacao.longitude,
          endereco: despesa.localizacao.endereco || `${despesa.localizacao.latitude}, ${despesa.localizacao.longitude}`,
          categoriaNome: despesa.categoriaId?.nome || 'Sem categoria',
          categoriaCor: despesa.categoriaId?.cor || '#6e9fff'
        };
      })
      .sort((a: any, b: any) => b.data.getTime() - a.data.getTime());

    this.despesasComLocalizacao.set(despesasComLoc);

    // Agrupar despesas por proximidade (15km)
    const grupos = this.agruparDespesasPorProximidade(despesasComLoc, 15);
    this.gruposDespesas.set(grupos);
  }

  // Calcula distância entre duas coordenadas em km (fórmula de Haversine)
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return distancia;
  }

  toRad(valor: number): number {
    return valor * Math.PI / 180;
  }

  // Agrupa despesas por proximidade (raio em km)
  agruparDespesasPorProximidade(despesas: any[], raioKm: number): any[] {
    if (despesas.length === 0) return [];

    const grupos: any[] = [];
    const processadas = new Set<string>();

    despesas.forEach(despesa => {
      if (processadas.has(despesa.id)) return;

      // Criar novo grupo com a despesa atual
      const grupo: any = {
        id: `grupo-${grupos.length}`,
        latitude: despesa.latitude,
        longitude: despesa.longitude,
        despesas: [despesa],
        totalValor: despesa.valor,
        endereco: despesa.endereco
      };

      processadas.add(despesa.id);

      // Buscar outras despesas próximas
      despesas.forEach(outraDespesa => {
        if (processadas.has(outraDespesa.id)) return;

        const distancia = this.calcularDistancia(
          despesa.latitude,
          despesa.longitude,
          outraDespesa.latitude,
          outraDespesa.longitude
        );

        if (distancia <= raioKm) {
          grupo.despesas.push(outraDespesa);
          grupo.totalValor += outraDespesa.valor;
          processadas.add(outraDespesa.id);
        }
      });

      // Calcular centro do grupo (média das coordenadas)
      if (grupo.despesas.length > 1) {
        grupo.latitude = grupo.despesas.reduce((sum: number, d: any) => sum + d.latitude, 0) / grupo.despesas.length;
        grupo.longitude = grupo.despesas.reduce((sum: number, d: any) => sum + d.longitude, 0) / grupo.despesas.length;

        // Usar o endereço da primeira despesa como referência, mas indicar que é uma área
        const enderecoBase = grupo.despesas[0].endereco;
        // Tentar extrair apenas a cidade/bairro do endereço completo
        const partes = enderecoBase.split(',');
        if (partes.length >= 2) {
          grupo.endereco = `Área de ${partes[partes.length - 2].trim()}, ${partes[partes.length - 1].trim()}`;
        } else {
          grupo.endereco = `${grupo.despesas.length} despesas nesta área`;
        }
      }

      grupos.push(grupo);
    });

    return grupos;
  }

  getMapUrl(): string {
    const grupos = this.gruposDespesas();

    if (grupos.length === 0) {
      // Mapa padrão centrado nas coordenadas padrão
      return `https://maps.google.com/maps?q=-7.165104,-34.855471&z=13&output=embed`;
    }

    // Se tiver apenas um grupo, centralizar nele
    if (grupos.length === 1) {
      const grupo = grupos[0];
      return `https://maps.google.com/maps?q=${grupo.latitude},${grupo.longitude}&z=14&output=embed`;
    }

    // Para múltiplos grupos, criar uma URL com o centro calculado e zoom ajustado
    const latitudes = grupos.map(g => g.latitude);
    const longitudes = grupos.map(g => g.longitude);

    const centerLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const centerLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

    // Calcular zoom baseado na dispersão dos pontos
    const maxLat = Math.max(...latitudes);
    const minLat = Math.min(...latitudes);
    const maxLng = Math.max(...longitudes);
    const minLng = Math.min(...longitudes);

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Ajustar zoom baseado na diferença
    let zoom = 13;
    if (maxDiff < 0.01) zoom = 15;      // Muito próximos
    else if (maxDiff < 0.05) zoom = 13;  // Próximos
    else if (maxDiff < 0.1) zoom = 12;   // Moderadamente dispersos
    else if (maxDiff < 0.2) zoom = 11;   // Dispersos
    else zoom = 10;                      // Muito dispersos

    return `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=${zoom}&output=embed`;
  }

  getMapUrlComMarcadores(): string {
    const grupos = this.gruposDespesas();

    if (grupos.length === 0) {
      return '';
    }

    // Criar URL do Google Maps com múltiplos pontos
    // Usar o formato de busca com múltiplas coordenadas
    if (grupos.length === 1) {
      const grupo = grupos[0];
      return `https://www.google.com/maps/search/?api=1&query=${grupo.latitude},${grupo.longitude}`;
    }

    // Para múltiplos grupos, criar URL com direções
    const origem = grupos[0];
    const destino = grupos[grupos.length - 1];
    const waypoints = grupos.slice(1, -1).map(g => `${g.latitude},${g.longitude}`).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origem.latitude},${origem.longitude}&destination=${destino.latitude},${destino.longitude}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    url += '&travelmode=driving';

    return url;
  }

  setTipoVisualizacao(tipo: 'mensal' | 'anual') {
    this.tipoVisualizacao.set(tipo);
    // Recriar apenas o gráfico de evolução
    setTimeout(() => {
      this.criarGraficoEvolucao();
    }, 50);
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

    // Destruir gráfico anterior se existir
    if (this.evolucaoChart) {
      this.evolucaoChart.destroy();
    }

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

    let labels: string[] = [];
    let receitasData: number[] = [];
    let despesasData: number[] = [];

    if (this.tipoVisualizacao() === 'mensal') {
      // Visualização mensal - últimos 12 meses
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const hoje = new Date();
      const anoAtualCompleto = hoje.getFullYear();

      for (let i = 11; i >= 0; i--) {
        const data = new Date();
        data.setMonth(hoje.getMonth() - i);
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();

        // Incluir ano no label se for diferente do ano atual
        const label = ano !== anoAtualCompleto ? `${meses[mes - 1]}/${ano}` : meses[mes - 1];
        labels.push(label);

        // Buscar receita do mês
        const receitaMes = receitasPorMes.find((r: any) => r._id.mes === mes && r._id.ano === ano);
        receitasData.push(receitaMes?.total || 0);

        // Buscar despesa do mês
        const despesaMes = despesasPorMes.find((d: any) => d._id.mes === mes && d._id.ano === ano);
        despesasData.push(despesaMes?.total || 0);
      }
    } else {
      // Visualização anual - últimos 5 anos
      const anoAtual = new Date().getFullYear();

      for (let i = 4; i >= 0; i--) {
        const ano = anoAtual - i;
        labels.push(ano.toString());

        // Somar todas as receitas do ano
        const receitaAno = receitasPorMes
          .filter((r: any) => r._id.ano === ano)
          .reduce((sum: number, r: any) => sum + r.total, 0);
        receitasData.push(receitaAno);

        // Somar todas as despesas do ano
        const despesaAno = despesasPorMes
          .filter((d: any) => d._id.ano === ano)
          .reduce((sum: number, d: any) => sum + d.total, 0);
        despesasData.push(despesaAno);
      }
    }

    this.evolucaoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Receitas',
            data: receitasData,
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
            data: despesasData,
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

    // Destruir gráfico anterior se existir
    if (this.categoriasChart) {
      this.categoriasChart.destroy();
    }

    const stats = this.dadosEstatisticos();
    const categorias = stats?.despesas?.porCategoria || [];

    const labels = categorias.map((c: any) => c.categoriaNome || 'Sem categoria');
    const data = categorias.map((c: any) => c.total);
    const cores = ['#6e9fff', '#69f6b8', '#ff928b', '#0057bd', '#006947', '#515981', '#820AD1', '#FFD700'];

    this.categoriasChart = new Chart(ctx, {
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

    // Destruir gráfico anterior se existir
    if (this.cartoesChart) {
      this.cartoesChart.destroy();
    }

    const cartoes = this.cartoes().filter((c: any) => c.ativo);

    const labels = cartoes.length > 0 ? cartoes.map((c: any) => c.nome) : ['Sem cartões cadastrados'];
    // Para demo, vamos mostrar o limite disponível. No futuro, pode-se buscar despesas por cartão para calcular utilizado
    const limites = cartoes.length > 0 ? cartoes.map((c: any) => c.limite || 0) : [0];
    const utilizados = cartoes.length > 0 ? cartoes.map(() => 0) : [0]; // Placeholder - pode ser calculado futuramente

    this.cartoesChart = new Chart(ctx, {
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

    // Destruir gráfico anterior se existir
    if (this.orcamentosChart) {
      this.orcamentosChart.destroy();
    }

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

    this.orcamentosChart = new Chart(ctx, {
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
