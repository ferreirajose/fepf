import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DespesaService } from '../../shared/services/despesa.service';
import { ReceitaService } from '../../shared/services/receita.service';
import { SafePipe } from '../../shared/pipes/safe.pipe';

@Component({
  selector: 'app-transacao-detalhes',
  standalone: true,
  imports: [CommonModule, RouterLink, SafePipe],
  templateUrl: './transacao-detalhes.component.html',
  styleUrl: './transacao-detalhes.component.css'
})
export class TransacaoDetalhesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private despesaService = inject(DespesaService);
  private receitaService = inject(ReceitaService);

  transacaoId = signal<string | null>(null);
  tipo = signal<'despesa' | 'receita'>('despesa');
  transacao = signal<any>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const tipo = this.route.snapshot.paramMap.get('tipo') as 'despesa' | 'receita';

    if (!id || !tipo || (tipo !== 'despesa' && tipo !== 'receita')) {
      this.erro.set('Transação não encontrada');
      this.carregando.set(false);
      return;
    }

    this.transacaoId.set(id);
    this.tipo.set(tipo);
    this.carregarTransacao(id, tipo);
  }

  carregarTransacao(id: string, tipo: 'despesa' | 'receita') {
    this.carregando.set(true);
    this.erro.set(null);

    if (tipo === 'despesa') {
      this.despesaService.buscarPorId(id).subscribe({
        next: (response: any) => {
          if (response.success && response.data && !Array.isArray(response.data)) {
            this.transacao.set(response.data);
          } else {
            this.erro.set('Transação não encontrada');
          }
          this.carregando.set(false);
        },
        error: (err: any) => {
          console.error('Erro ao carregar transação:', err);
          this.erro.set('Não foi possível carregar a transação');
          this.carregando.set(false);
        }
      });
    } else {
      this.receitaService.buscarPorId(id).subscribe({
        next: (response: any) => {
          if (response.success && response.data && !Array.isArray(response.data)) {
            this.transacao.set(response.data);
          } else {
            this.erro.set('Transação não encontrada');
          }
          this.carregando.set(false);
        },
        error: (err: any) => {
          console.error('Erro ao carregar transação:', err);
          this.erro.set('Não foi possível carregar a transação');
          this.carregando.set(false);
        }
      });
    }
  }

  voltar() {
    this.router.navigate(['/']);
  }

  editar() {
    const rota = this.tipo() === 'despesa' ? '/despesas' : '/receitas';
    this.router.navigate([rota, this.transacaoId(), 'editar']);
  }

  getIconeCategoria(): string {
    const icone = this.transacao()?.categoriaId?.icone || 'circle';
    return `ri-${icone}-line`;
  }

  getCorCategoria(): string {
    return this.transacao()?.categoriaId?.cor || '#6e9fff';
  }

  getNomeCategoria(): string {
    return this.transacao()?.categoriaId?.nome || 'Sem categoria';
  }

  getNomeSubcategoria(): string {
    if (!this.transacao()?.subcategoriaId) return '';

    const subcategorias = this.transacao()?.categoriaId?.subcategorias || [];
    const subcategoria = subcategorias.find((s: any) => s.id === this.transacao()?.subcategoriaId);

    return subcategoria?.nome || '';
  }

  getNomeCartao(): string {
    return this.transacao()?.cartaoId?.nome || '';
  }

  formatarData(data: string | Date): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusPagamento(): { texto: string; cor: string } {
    if (this.tipo() === 'receita') {
      const recebido = this.transacao()?.recebido;
      return {
        texto: recebido ? 'Recebido' : 'Pendente',
        cor: recebido ? '#006947' : '#ffa500'
      };
    } else {
      const pago = this.transacao()?.pago;
      return {
        texto: pago ? 'Pago' : 'Pendente',
        cor: pago ? '#006947' : '#ffa500'
      };
    }
  }

  temLocalizacao(): boolean {
    return !!(this.transacao()?.localizacao?.latitude && this.transacao()?.localizacao?.longitude);
  }

  getMapUrl(): string {
    const loc = this.transacao()?.localizacao;
    if (!loc?.latitude || !loc?.longitude) return '';
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }

  getMapEmbedUrl(): string {
    const loc = this.transacao()?.localizacao;
    if (!loc?.latitude || !loc?.longitude) return '';
    return `https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`;
  }
}
