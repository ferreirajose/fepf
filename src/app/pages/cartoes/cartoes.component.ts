import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FormsModule } from '@angular/forms';
import { CartaoService, Cartao as CartaoAPI } from '../../shared/services/cartao.service';

interface Cartao {
  id: string;
  nome: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'amex' | 'outra';
  limite: number;
  limiteDisponivel: number;
  diaVencimento: number;
  diaFechamento: number;
  cor: string;
  ativo: boolean;
}

@Component({
  selector: 'app-cartoes',
  standalone: true,
  imports: [CommonModule, RouterLink, FeatherModule, FormsModule],
  templateUrl: './cartoes.component.html',
  styleUrl: './cartoes.component.css'
})
export class CartoesComponent implements OnInit {
  private cartaoService = inject(CartaoService);

  filtroTexto = signal('');
  filtroBandeira = signal('todas');
  filtroStatus = signal('todos');
  carregando = signal(false);
  erro = signal<string | null>(null);

  cartoes = signal<Cartao[]>([]);

  bandeiras = [
    { id: 'todas', nome: 'Todas Bandeiras' },
    { id: 'visa', nome: 'Visa' },
    { id: 'mastercard', nome: 'Mastercard' },
    { id: 'elo', nome: 'Elo' },
    { id: 'amex', nome: 'American Express' },
    { id: 'outra', nome: 'Outra' }
  ];

  coresPorBandeira: { [key: string]: string } = {
    visa: '#1434CB',
    mastercard: '#EB001B',
    elo: '#FFCB05',
    amex: '#006FCF',
    outra: '#6e9fff'
  };

  ngOnInit() {
    this.carregarCartoes();
  }

  carregarCartoes() {
    this.carregando.set(true);
    this.erro.set(null);

    this.cartaoService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.cartoes.set((response.data as CartaoAPI[]).map(c => ({
            id: c._id || '',
            nome: c.nome,
            bandeira: c.bandeira,
            limite: c.limite,
            limiteDisponivel: c.limite,
            diaVencimento: c.diaVencimento,
            diaFechamento: c.diaFechamento,
            cor: this.coresPorBandeira[c.bandeira] || '#6e9fff',
            ativo: c.ativo
          })));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar cartões:', err);
        this.erro.set('Não foi possível carregar os cartões');
        this.carregando.set(false);
      }
    });
  }

  getCartoesFiltrados(): Cartao[] {
    let cartoes = this.cartoes();

    if (this.filtroTexto()) {
      const texto = this.filtroTexto().toLowerCase();
      cartoes = cartoes.filter(c =>
        c.nome.toLowerCase().includes(texto) ||
        c.bandeira.toLowerCase().includes(texto)
      );
    }

    if (this.filtroBandeira() !== 'todas') {
      cartoes = cartoes.filter(c => c.bandeira === this.filtroBandeira());
    }

    if (this.filtroStatus() === 'ativos') {
      cartoes = cartoes.filter(c => c.ativo);
    } else if (this.filtroStatus() === 'inativos') {
      cartoes = cartoes.filter(c => !c.ativo);
    }

    return cartoes;
  }

  getLimiteTotal(): number {
    return this.getCartoesFiltrados().reduce((sum, c) => sum + c.limite, 0);
  }

  getLimiteDisponivel(): number {
    return this.getCartoesFiltrados().reduce((sum, c) => sum + c.limiteDisponivel, 0);
  }

  getLimiteUtilizado(): number {
    return this.getLimiteTotal() - this.getLimiteDisponivel();
  }

  getPercentualUtilizado(): number {
    const total = this.getLimiteTotal();
    if (total === 0) return 0;
    return (this.getLimiteUtilizado() / total) * 100;
  }

  getQuantidadeCartoes(): number {
    return this.getCartoesFiltrados().length;
  }

  getCartaoComMaiorLimite(): Cartao | undefined {
    const cartoes = this.getCartoesFiltrados();
    if (cartoes.length === 0) return undefined;
    return cartoes.reduce((max, c) => c.limite > max.limite ? c : max);
  }

  getPercentualUtilizadoCartao(cartao: Cartao): number {
    if (cartao.limite === 0) return 0;
    return ((cartao.limite - cartao.limiteDisponivel) / cartao.limite) * 100;
  }

  toggleAtivo(cartao: Cartao, event: Event) {
    event.stopPropagation();

    this.cartaoService.atualizar(cartao.id, { ativo: !cartao.ativo }).subscribe({
      next: (response) => {
        if (response.success) {
          const cartoes = this.cartoes().map(c => {
            if (c.id === cartao.id) {
              return { ...c, ativo: !c.ativo };
            }
            return c;
          });
          this.cartoes.set(cartoes);
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar cartão:', err);
        alert('Não foi possível atualizar o status do cartão');
      }
    });
  }

  excluirCartao(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Deseja realmente excluir este cartão?')) {
      this.cartaoService.deletar(id).subscribe({
        next: (response) => {
          if (response.success) {
            const cartoes = this.cartoes().filter(c => c.id !== id);
            this.cartoes.set(cartoes);
          } else {
            alert('Erro ao excluir cartão: ' + (response.error || 'Erro desconhecido'));
          }
        },
        error: (err) => {
          console.error('Erro ao excluir cartão:', err);
          alert('Não foi possível excluir o cartão');
        }
      });
    }
  }

  limparFiltros() {
    this.filtroTexto.set('');
    this.filtroBandeira.set('todas');
    this.filtroStatus.set('todos');
  }

  getBandeiraIcone(bandeira: string): string {
    const icones: { [key: string]: string } = {
      visa: 'credit-card',
      mastercard: 'credit-card',
      elo: 'credit-card',
      amex: 'credit-card',
      hipercard: 'credit-card'
    };
    return icones[bandeira] || 'credit-card';
  }

  getBandeiraNome(bandeira: string): string {
    const nomes: { [key: string]: string } = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      elo: 'Elo',
      amex: 'American Express',
      hipercard: 'Hipercard'
    };
    return nomes[bandeira] || bandeira;
  }
}
