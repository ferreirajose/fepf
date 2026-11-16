/** @type {import('tailwindcss').Config} */
// Design System: BudgetZen (https://designmd.ai/chef/budgetzen)
// "Calm, encouraging, goal-oriented — your money, your peace of mind."
const shadowColor = '28, 25, 23'; // #1C1917

module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens BudgetZen
        mint: { DEFAULT: '#10B981', dark: '#059669', light: '#34D399' },
        sky: { DEFAULT: '#38BDF8' },
        'warm-gray': '#A8A29E',
        stone: { DEFAULT: '#78716C' },
        background: '#FAFFFE',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#38BDF8',

        // Aliases semânticos usados pelo app (mantidos para compatibilidade)
        primary: '#10B981',            // Mint — CTAs, progresso
        'primary-container': '#34D399',
        secondary: '#059669',          // receitas / sucesso
        'secondary-container': '#6EE7B7',
        tertiary: '#DC2626',           // despesas / erro
        'tertiary-container': '#F87171',
        surface: '#FAFFFE',            // fundo do app
        'on-surface': '#1C1917',       // texto principal
        'on-surface-variant': '#57534E', // labels / texto secundário
        outline: '#E7E5E4',            // bordas e divisores
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],   // headlines
        body: ['Nunito', 'sans-serif'],       // corpo
        mono: ['"Source Code Pro"', 'monospace'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '800' }],
        headline: ['28px', { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '700' }],
        subhead: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.6' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '600' }],
        overline: ['11px', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '700' }],
      },
      borderRadius: {
        'bz-sm': '6px',    // chips, badges
        'bz-md': '12px',   // botões, inputs, cards
        'bz-lg': '16px',   // modais, painéis
        'bz-xl': '24px',   // hero, cards de meta
      },
      boxShadow: {
        'bz-subtle': `0 1px 3px rgba(${shadowColor}, 0.06)`,
        'bz-medium': `0 4px 12px rgba(${shadowColor}, 0.08)`,
        'bz-large': `0 8px 24px rgba(${shadowColor}, 0.10)`,
        'bz-overlay': `0 16px 48px rgba(${shadowColor}, 0.14)`,
      },
    },
  },
  plugins: [],
}
