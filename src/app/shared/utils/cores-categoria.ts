// Paleta de cores de categoria — tons distintos entre si, legíveis sobre fundo branco
// e compatíveis com o design system BudgetZen. Vermelho fica de fora para não
// confundir categoria com "orçamento estourado".
export const PALETA_CATEGORIAS = [
  '#10B981', // mint
  '#0EA5E9', // sky
  '#8B5CF6', // violeta
  '#F59E0B', // âmbar
  '#EC4899', // rosa
  '#84CC16', // lima
  '#78716C', // stone
  '#1D4ED8', // azul
  '#BE185D', // framboesa
  '#A16207', // mostarda
];

const DISTANCIA_MINIMA = 60; // abaixo disso duas cores são visualmente "iguais"

function hexParaRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function distancia(a: string, b: string): number {
  const ra = hexParaRgb(a);
  const rb = hexParaRgb(b);
  if (!ra || !rb) return Infinity;
  return Math.hypot(ra[0] - rb[0], ra[1] - rb[1], ra[2] - rb[2]);
}

function conflita(cor: string, usadas: string[]): boolean {
  return usadas.some(u => distancia(cor, u) < DISTANCIA_MINIMA);
}

/**
 * Garante que cada categoria tenha uma cor visualmente distinta das demais da lista.
 * Mantém a cor original quando ela não conflita; caso contrário (cor repetida, parecida
 * ou ausente) atribui a próxima cor livre da paleta. Itens da mesma categoria
 * recebem sempre a mesma cor.
 */
export function atribuirCoresUnicas<T>(
  itens: T[],
  getChave: (item: T) => string,
  getCor: (item: T) => string | undefined,
  setCor: (item: T, cor: string) => T
): T[] {
  const porCategoria = new Map<string, string>();
  const usadas: string[] = [];

  // Ordem estável (pela chave) para que a cor de cada categoria não mude entre recarregamentos
  const chaves = [...new Set(itens.map(getChave))].sort();
  const corOriginal = new Map(itens.map(i => [getChave(i), getCor(i)]));

  for (const chave of chaves) {
    const original = corOriginal.get(chave);
    let cor = original && hexParaRgb(original) && !conflita(original, usadas) ? original : undefined;
    if (!cor) {
      cor = PALETA_CATEGORIAS.find(c => !conflita(c, usadas))
        ?? PALETA_CATEGORIAS[usadas.length % PALETA_CATEGORIAS.length];
    }
    porCategoria.set(chave, cor);
    usadas.push(cor);
  }

  return itens.map(i => setCor(i, porCategoria.get(getChave(i))!));
}
