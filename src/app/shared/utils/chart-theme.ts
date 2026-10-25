import { TooltipOptions, LegendOptions, ChartType } from 'chart.js';

// Paleta e tipografia comuns aos gráficos do app

export const CORES_GRAFICO = {
  receita: '#006947',
  despesa: '#b51621',
  planejado: '#0057bd',
  alerta: '#ffa500',
  neutro: '#6e9fff',
  texto: '#515981',
  titulo: '#242c51',
  borda: '#a3abd7',
  grade: 'rgba(163, 171, 215, 0.1)'
};

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorMoedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1
});

export const formatarMoeda = (valor: number): string => formatadorMoeda.format(valor);
export const formatarMoedaCompacta = (valor: number): string => formatadorMoedaCompacta.format(valor);

export const legendaPadrao = <T extends ChartType>(
  position: 'top' | 'bottom' = 'top'
): Partial<LegendOptions<T>> => ({
  display: true,
  position,
  labels: {
    font: { family: 'Inter', size: 12, weight: 600 },
    color: CORES_GRAFICO.texto,
    padding: 15,
    usePointStyle: true,
    pointStyle: 'circle'
  } as LegendOptions<T>['labels']
});

export const tooltipPadrao = <T extends ChartType>(): Partial<TooltipOptions<T>> => ({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  titleColor: CORES_GRAFICO.titulo,
  bodyColor: CORES_GRAFICO.texto,
  borderColor: CORES_GRAFICO.borda,
  borderWidth: 1,
  padding: 12,
  titleFont: { family: 'Manrope', size: 14, weight: 'bold' },
  bodyFont: { family: 'Inter', size: 12 },
  displayColors: true
});

// Eixo com valores em reais
export const escalaValores = (stacked = false) => ({
  beginAtZero: true,
  stacked,
  grid: { color: CORES_GRAFICO.grade },
  ticks: {
    font: { family: 'Inter', size: 11 },
    color: CORES_GRAFICO.texto,
    callback: (valor: string | number) => formatarMoedaCompacta(Number(valor))
  }
});

// Eixo com rótulos (meses, nomes de cartões, categorias)
export const escalaRotulos = (stacked = false) => ({
  stacked,
  grid: { display: false },
  ticks: {
    font: { family: 'Inter', size: 11, weight: 600 as const },
    color: CORES_GRAFICO.texto
  }
});
