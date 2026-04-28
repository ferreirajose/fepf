import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-orcamentos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherModule],
  templateUrl: './orcamentos-form.component.html',
  styleUrl: './orcamentos-form.component.css'
})
export class OrcamentosFormComponent {
  form: FormGroup;
  orcamentoId = signal<string | null>(null);
  isEdicao = signal(false);

  categorias: Categoria[] = [
    { id: '1', nome: 'Alimentação', icone: 'shopping-cart', cor: '#6e9fff' },
    { id: '2', nome: 'Transporte', icone: 'truck', cor: '#69f6b8' },
    { id: '3', nome: 'Moradia', icone: 'home', cor: '#ff928b' },
    { id: '4', nome: 'Lazer', icone: 'calendar', cor: '#0057bd' },
    { id: '5', nome: 'Saúde', icone: 'heart', cor: '#006947' },
    { id: '6', nome: 'Educação', icone: 'book', cor: '#820AD1' },
    { id: '7', nome: 'Vestuário', icone: 'shopping-bag', cor: '#b51621' }
  ];

  meses = [
    { numero: 1, nome: 'Janeiro' },
    { numero: 2, nome: 'Fevereiro' },
    { numero: 3, nome: 'Março' },
    { numero: 4, nome: 'Abril' },
    { numero: 5, nome: 'Maio' },
    { numero: 6, nome: 'Junho' },
    { numero: 7, nome: 'Julho' },
    { numero: 8, nome: 'Agosto' },
    { numero: 9, nome: 'Setembro' },
    { numero: 10, nome: 'Outubro' },
    { numero: 11, nome: 'Novembro' },
    { numero: 12, nome: 'Dezembro' }
  ];

  anos = [2024, 2025, 2026, 2027, 2028];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const hoje = new Date();

    this.form = this.fb.group({
      categoriaId: ['', Validators.required],
      valorPlanejado: [null, [Validators.required, Validators.min(0.01)]],
      mes: [hoje.getMonth() + 1, Validators.required],
      ano: [hoje.getFullYear(), Validators.required],
      ativo: [true],
      descricao: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orcamentoId.set(id);
      this.isEdicao.set(true);
      this.carregarOrcamento(id);
    }
  }

  carregarOrcamento(id: string) {
    const orcamentoMock = {
      categoriaId: '1',
      valorPlanejado: 1500.00,
      mes: 4,
      ano: 2026,
      ativo: true,
      descricao: 'Orçamento mensal para alimentação'
    };
    this.form.patchValue(orcamentoMock);
  }

  salvar() {
    if (this.form.valid) {
      console.log('Salvando orçamento:', this.form.value);
      this.router.navigate(['/orcamentos']);
    } else {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/orcamentos']);
  }

  getCategoriaSelecionada(): Categoria | undefined {
    const categoriaId = this.form.get('categoriaId')?.value;
    return this.categorias.find(c => c.id === categoriaId);
  }

  selecionarCategoria(categoriaId: string) {
    this.form.patchValue({ categoriaId });
  }

  getMesNome(numero: number): string {
    const mes = this.meses.find(m => m.numero === numero);
    return mes ? mes.nome : '';
  }

  copiarParaProximoMes() {
    const mesAtual = this.form.get('mes')?.value;
    const anoAtual = this.form.get('ano')?.value;

    if (mesAtual === 12) {
      this.form.patchValue({ mes: 1, ano: anoAtual + 1 });
    } else {
      this.form.patchValue({ mes: mesAtual + 1 });
    }
  }

  copiarParaMeses() {
    if (confirm('Deseja copiar este orçamento para todos os meses do ano?')) {
      console.log('Copiar para todos os meses:', this.form.value);
      // Implementar lógica de cópia para múltiplos meses
    }
  }
}
