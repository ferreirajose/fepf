import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoriaService } from '../../../shared/services/categoria.service';
import { Subcategoria } from '../../../shared/models/categoria.model';

@Component({
  selector: 'app-categorias-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias-form.component.html',
  styleUrl: './categorias-form.component.css'
})
export class CategoriasFormComponent {
  private categoriaService = inject(CategoriaService);

  form: FormGroup;
  categoriaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);
  subcategorias = signal<Array<{ id?: string; nome: string; icone?: string; ativo: boolean }>>([]);
  novaSubcategoria = signal('');
  novoIconeSubcategoria = signal('tag');

  cores = [
    '#0057bd', '#006947', '#b51621', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'
  ];

  icones = [
    { nome: 'tag', label: 'Tag' },
    { nome: 'shopping-bag', label: 'Compras' },
    { nome: 'restaurant', label: 'Alimentação' },
    { nome: 'home', label: 'Casa' },
    { nome: 'car', label: 'Transporte' },
    { nome: 'heart', label: 'Saúde' },
    { nome: 'book', label: 'Educação' },
    { nome: 'shirt', label: 'Vestuário' },
    { nome: 'phone', label: 'Telefone' },
    { nome: 'lightbulb', label: 'Energia' },
    { nome: 'drop', label: 'Água' },
    { nome: 'football', label: 'Lazer' },
    { nome: 'briefcase', label: 'Trabalho' },
    { nome: 'bank', label: 'Banco' },
    { nome: 'wallet', label: 'Carteira' },
    { nome: 'gift', label: 'Presente' },
    { nome: 'flight-takeoff', label: 'Viagem' },
    { nome: 'hotel', label: 'Hotel' },
    { nome: 'gas-station', label: 'Gasolina' },
    { nome: 'hospital', label: 'Hospital' },
    { nome: 'stethoscope', label: 'Médico' },
    { nome: 'capsule', label: 'Remédio' },
    { nome: 'bill', label: 'Conta' },
    { nome: 'shopping-cart', label: 'Mercado' },
    { nome: 'taxi', label: 'Táxi' },
    { nome: 'bus', label: 'Ônibus' },
    { nome: 'subway', label: 'Metrô' },
    { nome: 'movie', label: 'Cinema' },
    { nome: 'music', label: 'Música' },
    { nome: 'gamepad', label: 'Games' },
    { nome: 'tools', label: 'Ferramentas' },
    { nome: 'paint-brush', label: 'Arte' },
    { nome: 'scissors', label: 'Salão' },
    { nome: 'barbell', label: 'Academia' },
    { nome: 'pizza', label: 'Pizza' },
    { nome: 'cup', label: 'Café' },
    { nome: 'goblet', label: 'Bebida' },
    { nome: 'cake', label: 'Doce' },
    { nome: 'restaurant-2', label: 'Restaurante' },
    { nome: 'computer', label: 'Computador' },
    { nome: 'smartphone', label: 'Celular' },
    { nome: 'tv', label: 'TV' },
    { nome: 'headphone', label: 'Fone' },
    { nome: 'camera', label: 'Câmera' },
    { nome: 'printer', label: 'Impressora' },
    { nome: 'plug', label: 'Eletrônicos' },
    { nome: 'home-wifi', label: 'Internet' },
    { nome: 'flashlight', label: 'Lanterna' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cor: ['#0057bd', Validators.required],
      icone: ['tag', Validators.required],
      ativo: [true]
    });

    // Verificar se é edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoriaId.set(id);
      this.isEdicao.set(true);
      this.carregarCategoria(id);
    }
  }

  carregarCategoria(id: string) {
    this.carregando.set(true);
    this.erro.set(null);

    this.categoriaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const categoria = response.data;
          this.form.patchValue({
            nome: categoria.nome,
            cor: categoria.cor || '#0057bd',
            icone: categoria.icone || '',
            ativo: categoria.ativo
          });

          // Carregar subcategorias existentes
          if (categoria.subcategorias && categoria.subcategorias.length > 0) {
            this.subcategorias.set(categoria.subcategorias.map(sub => ({
              id: sub.id,
              nome: sub.nome,
              icone: sub.icone || 'tag',
              ativo: sub.ativo
            })));
          }
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar categoria:', err);
        this.erro.set('Não foi possível carregar a categoria');
        this.carregando.set(false);
      }
    });
  }

  salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const categoriaData: any = {
        nome: this.form.value.nome,
        cor: this.form.value.cor,
        icone: this.form.value.icone || undefined,
        ativo: this.form.value.ativo
      };

      // Incluir subcategorias apenas se houver alguma
      if (this.subcategorias().length > 0) {
        categoriaData.subcategorias = this.subcategorias().map(sub => {
          const subData: any = {
            nome: sub.nome,
            icone: sub.icone || 'tag',
            ativo: sub.ativo
          };

          // Incluir id e categoriaId apenas se existirem (modo edição)
          if (sub.id) {
            subData.id = sub.id;
          }
          if (this.categoriaId()) {
            subData.categoriaId = this.categoriaId();
          }

          return subData;
        });
      }

      const operacao = this.isEdicao()
        ? this.categoriaService.atualizar(this.categoriaId()!, categoriaData)
        : this.categoriaService.criar(categoriaData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/categorias']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar categoria');
          }
          this.carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao salvar categoria:', err);
          this.erro.set('Não foi possível salvar a categoria');
          this.carregando.set(false);
        }
      });
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
    this.router.navigate(['/categorias']);
  }

  selecionarCor(cor: string) {
    this.form.patchValue({ cor });
  }

  selecionarIcone(icone: string) {
    this.form.patchValue({ icone });
  }

  selecionarIconeSubcategoria(icone: string) {
    this.novoIconeSubcategoria.set(icone);
  }

  adicionarSubcategoria() {
    const nome = this.novaSubcategoria().trim();
    if (nome) {
      const subcats = this.subcategorias();
      subcats.push({
        nome: nome,
        icone: this.novoIconeSubcategoria(),
        ativo: true
      });
      this.subcategorias.set([...subcats]);
      this.novaSubcategoria.set('');
      this.novoIconeSubcategoria.set('tag');
    }
  }

  removerSubcategoria(index: number) {
    const subcats = this.subcategorias();
    subcats.splice(index, 1);
    this.subcategorias.set([...subcats]);
  }

  atualizarNovaSubcategoria(event: Event) {
    const input = event.target as HTMLInputElement;
    this.novaSubcategoria.set(input.value);
  }
}
