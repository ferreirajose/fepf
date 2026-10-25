# Roadmap — Melhorias do Dashboard Financeiro

Origem: análise de 2026-10-25. O Dashboard baixava todas as despesas e receitas da base
e exibia praticamente todas no mapa/lista, porque despesas sem localização recebiam uma
coordenada padrão fixa.

Legenda: ✅ concluído · ⏳ em andamento · ⏸️ adiado · ↩️ revertido

## Fase 1 — Dados de localização (fepf-api + fepf)
- ↩️ Revertida a pedido: a coordenada padrão (-7.165104, -34.855471) continua sendo usada
  em despesas sem localização. O mapa do Dashboard passou a mostrar só o mês selecionado.

## Fase 2 — API (fepf-api)
- ✅ Endpoint agregado `GET /api/financeiro/dashboard?mes=&ano=` (substitui 8 chamadas):
  saldo, evolução mensal (5 anos), despesas por categoria do mês, uso dos cartões pelo
  ciclo da fatura, orçamentos, 5 transações recentes e locais das despesas do mês
- ✅ Consultas do saldo acumulado em paralelo e com limites de mês em UTC
- ✅ Paginação opcional (`page`, `limit`) em `GET /despesas` e `GET /receitas`
- ✅ `obterEstatisticas` não descarta despesas de categorias removidas (`preserveNullAndEmptyArrays`)
- ✅ Limite de 50mb no body só nas rotas de import/backup (demais: 1mb)

## Fase 3 — Front-end do Dashboard (fepf)
- ✅ Usar o endpoint agregado
- ✅ Seletor de mês/ano
- ✅ Gráfico de categorias referente ao mês selecionado
- ✅ Gráfico de cartões com o ciclo da fatura calculado na API
- ✅ Barras dos cards com valores reais (sem larguras fixas)
- ✅ Lista lateral renomeada para "Despesas com Localização" (mês selecionado)
- ✅ Remover código morto (`getMapUrl`, `calcularSaldo`, agrupamento por proximidade)

## Fase 4 — Qualidade de código (fepf)
- ✅ Tema comum do Chart.js e formatador de moeda `Intl.NumberFormat('pt-BR')`
- ✅ Gráficos criados com `afterNextRender`/ciclo de vida e destruídos em `ngOnDestroy`
- ✅ Tipagem do retorno do Dashboard (sem `any` nos dados principais)

## Implantação
1. Publicar a API (`fepf-api`) — o front novo depende de `GET /api/financeiro/dashboard`
2. Publicar o front (`fepf`)

## Fora do escopo desta rodada
- Filtro pelo campo `ativo` das despesas/receitas: nenhum fluxo grava `ativo: false` hoje, então não muda resultados.
- `conta-detalhes` ainda lista todas as receitas/despesas sem filtro; pode usar a paginação nova.

## Fase 5 — Segurança
- ⏸️ Autenticação: adiada — no momento o app não terá login.
  Quando for feita: JWT, campo `usuarioId` nos models e filtro por usuário em todas as consultas.
