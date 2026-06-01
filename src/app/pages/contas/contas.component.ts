import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContaService } from '../../shared/services/conta.service';
import { Conta, TipoConta, Banco } from '../../shared/models/conta.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../shared/components/alert-dialog/alert-dialog.component';

interface ContaListagem {
  id: string;
  nome: string;
  tipoConta: TipoConta;
  banco?: Banco;
  subTipoConta?: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
}

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent, AlertDialogComponent],
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.css'
})
export class ContasComponent implements OnInit {
  private contaService = inject(ContaService);

  confirmDialog = signal({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  alertDialog = signal({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info' | 'warning'
  });

  filtroTexto = signal('');
  filtroTipoConta = signal('todas');
  filtroAtivo = signal<'todas' | 'ativas' | 'inativas'>('todas');
  carregando = signal(false);
  erro = signal<string | null>(null);

  contas = signal<ContaListagem[]>([]);
  categorias = signal<Array<{ id: string; nome: string }>>([
    { id: 'todas', nome: 'Todos os Tipos' },
    { id: 'conta_corrente', nome: 'Conta Corrente' },
    { id: 'poupanca', nome: 'Poupança' },
    { id: 'investimentos', nome: 'Investimentos' },
    { id: 'conta_beneficios', nome: 'Benefícios' }
  ]);

  ngOnInit() {
    this.carregarContas();
  }

  carregarContas() {
    this.carregando.set(true);
    this.erro.set(null);

    // Não passa filtro de ativo para carregar todas as contas
    this.contaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.contas.set((response.data as Conta[]).map(c => ({
            id: (c as any)._id || c.id || '',
            nome: c.nome,
            tipoConta: c.tipoConta,
            banco: c.banco,
            subTipoConta: c.subTipoConta,
            saldoInicial: c.saldoInicial,
            saldoAtual: c.saldoAtual,
            ativo: c.ativo
          })));
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar contas:', err);
        this.erro.set('Não foi possível carregar as contas');
        this.carregando.set(false);
      }
    });
  }

  getTipoLabel(tipo: TipoConta): string {
    const mapa: Record<TipoConta, string> = {
      'conta_corrente': 'Conta Corrente',
      'poupanca': 'Poupança',
      'investimentos': 'Investimentos',
      'conta_beneficios': 'Benefícios'
    };
    return mapa[tipo] || tipo;
  }

  getBancoLabel(banco?: Banco): string {
    if (!banco) return '-';
    const mapa: Record<Banco, string> = {
      'inter': 'Banco Inter',
      'bradesco': 'Bradesco',
      'itau': 'Itaú',
      'caixa': 'Caixa Econômica Federal',
      'nubank': 'Nubank',
      'santander': 'Santander',
      'pan': 'Banco Pan'
    };
    return mapa[banco] || banco;
  }

  getTipoCor(tipo: TipoConta): string {
    const mapa: Record<TipoConta, string> = {
      'conta_corrente': '#4CAF50',
      'poupanca': '#2196F3',
      'investimentos': '#FF9800',
      'conta_beneficios': '#9C27B0'
    };
    return mapa[tipo] || '#006947';
  }

  getTipoIcone(tipo: TipoConta): string {
    const mapa: Record<TipoConta, string> = {
      'conta_corrente': 'bank',
      'poupanca': 'safe',
      'investimentos': 'line-chart',
      'conta_beneficios': 'gift'
    };
    return mapa[tipo] || 'bank';
  }

  getContasFiltradas(): ContaListagem[] {
    let contas = this.contas();

    // Filtro de status (ativo/inativo)
    if (this.filtroAtivo() === 'ativas') {
      contas = contas.filter(c => c.ativo);
    } else if (this.filtroAtivo() === 'inativas') {
      contas = contas.filter(c => !c.ativo);
    }

    if (this.filtroTexto()) {
      const texto = this.filtroTexto().toLowerCase();
      contas = contas.filter(c =>
        c.nome.toLowerCase().includes(texto) ||
        this.getTipoLabel(c.tipoConta).toLowerCase().includes(texto) ||
        this.getBancoLabel(c.banco).toLowerCase().includes(texto)
      );
    }

    if (this.filtroTipoConta() !== 'todas') {
      contas = contas.filter(c => c.tipoConta === this.filtroTipoConta());
    }

    return contas.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  getTotalSaldoAtual(): number {
    return this.getContasFiltradas().reduce((sum, c) => sum + c.saldoAtual, 0);
  }

  getTotalSaldoInicial(): number {
    return this.getContasFiltradas().reduce((sum, c) => sum + c.saldoInicial, 0);
  }

  getQuantidadeContas(): number {
    return this.getContasFiltradas().length;
  }

  excluirConta(id: string, event: Event) {
    event.stopPropagation();

    this.confirmDialog.set({
      isOpen: true,
      title: 'Desativar Conta',
      message: 'Tem certeza que deseja desativar esta conta? Ela ficará oculta mas poderá ser reativada posteriormente.',
      onConfirm: () => {
        this.contaService.deletar(id).subscribe({
          next: (response) => {
            if (response.success) {
              // Atualiza o status da conta localmente
              const contas = this.contas().map(c => {
                if (c.id === id) {
                  return { ...c, ativo: false };
                }
                return c;
              });
              this.contas.set(contas);

              this.alertDialog.set({
                isOpen: true,
                title: 'Sucesso',
                message: 'Conta desativada com sucesso!',
                type: 'success'
              });
            } else {
              this.alertDialog.set({
                isOpen: true,
                title: 'Erro',
                message: response.error || 'Não foi possível desativar a conta',
                type: 'error'
              });
            }
          },
          error: (err) => {
            console.error('Erro ao desativar conta:', err);
            this.alertDialog.set({
              isOpen: true,
              title: 'Erro',
              message: 'Não foi possível desativar a conta. Tente novamente.',
              type: 'error'
            });
          }
        });
      }
    });
  }

  atualizarSaldo(id: string, event: Event) {
    event.stopPropagation();

    this.contaService.calcularSaldo(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const contas = this.contas().map(c => {
            if (c.id === id) {
              return { ...c, saldoAtual: response.data!.saldoAtual };
            }
            return c;
          });
          this.contas.set(contas);

          this.alertDialog.set({
            isOpen: true,
            title: 'Sucesso',
            message: 'Saldo atualizado com sucesso!',
            type: 'success'
          });
        } else {
          this.alertDialog.set({
            isOpen: true,
            title: 'Erro',
            message: response.error || 'Não foi possível atualizar o saldo',
            type: 'error'
          });
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar saldo:', err);
        this.alertDialog.set({
          isOpen: true,
          title: 'Erro',
          message: 'Não foi possível atualizar o saldo. Tente novamente.',
          type: 'error'
        });
      }
    });
  }

  limparFiltros() {
    this.filtroTexto.set('');
    this.filtroTipoConta.set('todas');
    this.filtroAtivo.set('ativas');
  }
}
