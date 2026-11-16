import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { DespesaService } from '../../shared/services/despesa.service';
import { CategoriaService, Categoria as CategoriaAPI } from '../../shared/services/categoria.service';
import { CartaoService, Cartao as CartaoAPI } from '../../shared/services/cartao.service';
import { ContaService } from '../../shared/services/conta.service';
import { Conta } from '../../shared/models/conta.model';
import { GeocodingService } from '../../shared/services/geocoding.service';

interface Subcategoria {
  id: string;
  nome: string;
  icone?: string;
  categoriaId: string;
  ativo: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  subcategorias?: Subcategoria[];
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
}

@Component({
  selector: 'app-despesas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SafeUrlPipe, RouterLink, NgxMaskDirective],
  templateUrl: './despesas-form.component.html',
  styleUrl: './despesas-form.component.css'
})
export class DespesasFormComponent implements OnInit {
  private despesaService = inject(DespesaService);
  private categoriaService = inject(CategoriaService);
  private cartaoService = inject(CartaoService);
  private contaService = inject(ContaService);
  private geocodingService = inject(GeocodingService);

  form: FormGroup;
  despesaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);

  categorias: Categoria[] = [];
  cartoes: Cartao[] = [];
  contas: Conta[] = [];
  subcategorias: Subcategoria[] = [];

  formasPagamento = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: 'money-dollar-box' },
    { id: 'debito', nome: 'Débito', icone: 'bank-card' },
    { id: 'credito', nome: 'Crédito', icone: 'bank-card' },
    { id: 'pix', nome: 'PIX', icone: 'smartphone' }
  ];

  capturandoLocalizacao = signal(false);
  erroLocalizacao = signal<string | null>(null);
  buscandoCoordenadas = signal(false);
  enderecoManual = signal('');

  private readonly LOCALIZACAO_PADRAO = { latitude: -7.165104, longitude: -34.855471 };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [this.getDataHoje(), Validators.required],
      categoriaId: ['', Validators.required],
      subcategoriaId: [''],
      cartaoId: [''],
      contaId: [''],
      formaPagamento: ['dinheiro', Validators.required],
      recorrente: [false],
      frequenciaRecorrencia: ['mensal'],
      dataRecorrenciaFim: [''],
      pago: [false],
      observacoes: [''],
      anexos: [[]],
      localizacao: this.fb.group({
        latitude: [null],
        longitude: [null],
        endereco: ['']
      })
    });

    this.form.get('categoriaId')?.valueChanges.subscribe(categoriaId => {
      this.atualizarSubcategorias(categoriaId);
      this.form.patchValue({ subcategoriaId: '' });
    });

    this.form.get('formaPagamento')?.valueChanges.subscribe(forma => {
      if (forma === 'credito') {
        this.form.get('cartaoId')?.setValidators(Validators.required);
      } else {
        this.form.get('cartaoId')?.clearValidators();
      }
      this.form.get('cartaoId')?.updateValueAndValidity();
    });

    this.form.get('recorrente')?.valueChanges.subscribe(recorrente => {
      if (recorrente) {
        this.form.get('frequenciaRecorrencia')?.setValidators(Validators.required);
      } else {
        this.form.get('frequenciaRecorrencia')?.clearValidators();
        this.form.get('dataRecorrenciaFim')?.clearValidators();
      }
      this.form.get('frequenciaRecorrencia')?.updateValueAndValidity();
      this.form.get('dataRecorrenciaFim')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.carregarCategorias();
    this.carregarCartoes();
    this.carregarContas();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.despesaId.set(id);
      this.isEdicao.set(true);
      this.carregarDespesa(id);
    }
  }

  carregarCategorias() {
    this.categoriaService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.categorias = (response.data as CategoriaAPI[])
            .filter(c => c.ativo)
            .map(c => ({
              id: c._id || '',
              nome: c.nome,
              icone: c.icone || 'circle',
              cor: c.cor || '#34D399',
              subcategorias: c.subcategorias?.filter(s => s.ativo).map(s => ({
                id: s.id,
                nome: s.nome,
                icone: s.icone,
                categoriaId: s.categoriaId,
                ativo: s.ativo
              })) || []
            }));
        }
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.erro.set('Não foi possível carregar as categorias');
      }
    });
  }

  carregarCartoes() {
    this.cartaoService.listar().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.cartoes = (response.data as CartaoAPI[])
            .filter(c => c.ativo)
            .map(c => ({
              id: c._id || '',
              nome: c.nome,
              bandeira: c.bandeira
            }));
        }
      },
      error: (err) => {
        console.error('Erro ao carregar cartões:', err);
      }
    });
  }

  carregarContas() {
    this.contaService.listar(true).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.contas = response.data;
        }
      },
      error: (err) => console.error('Erro ao carregar contas:', err)
    });
  }

  getDataHoje(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  carregarDespesa(id: string) {
    this.carregando.set(true);
    this.despesaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const despesa = response.data as any;
          // Extrair apenas a parte da data sem conversão de timezone
          const dataFormatada = typeof despesa.data === 'string'
            ? despesa.data.split('T')[0]
            : new Date(despesa.data).toISOString().split('T')[0];

          // Extrair IDs de objetos populados ou usar valores diretos
          const categoriaId = typeof despesa.categoriaId === 'object' && despesa.categoriaId?._id
            ? despesa.categoriaId._id
            : despesa.categoriaId;

          const cartaoId = typeof despesa.cartaoId === 'object' && despesa.cartaoId?._id
            ? despesa.cartaoId._id
            : despesa.cartaoId || '';

          // Coordenadas padrão significam que não houve localização real:
          // nesse caso exibimos o endereço salvo no campo de texto, sem mapa.
          const loc = despesa.localizacao;
          const usaCoordenadaPadrao = loc
            && loc.latitude === this.LOCALIZACAO_PADRAO.latitude
            && loc.longitude === this.LOCALIZACAO_PADRAO.longitude;
          const enderecoPadrao = `${this.LOCALIZACAO_PADRAO.latitude}, ${this.LOCALIZACAO_PADRAO.longitude}`;
          if (usaCoordenadaPadrao) {
            this.enderecoManual.set(loc.endereco && loc.endereco !== enderecoPadrao ? loc.endereco : '');
          }

          this.form.patchValue({
            descricao: despesa.descricao,
            valor: despesa.valor,
            data: dataFormatada,
            categoriaId: categoriaId,
            subcategoriaId: despesa.subcategoriaId || '',
            cartaoId: cartaoId,
            contaId: despesa.contaId || '',
            formaPagamento: despesa.formaPagamento || 'dinheiro',
            recorrente: despesa.recorrente,
            pago: despesa.pago || false,
            observacoes: despesa.observacoes || '',
            localizacao: (!usaCoordenadaPadrao && loc) || {
              latitude: null,
              longitude: null,
              endereco: ''
            }
          });
        }
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar despesa:', err);
        this.erro.set('Não foi possível carregar a despesa');
        this.carregando.set(false);
      }
    });
  }

  async salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const formValue = this.form.value;

      // Sem coordenadas: se o usuário digitou um endereço, tentar localizá-lo no mapa
      // automaticamente; se não for possível, usar coordenadas padrão preservando o texto
      let localizacao = formValue.localizacao;
      if (!localizacao.latitude && !localizacao.longitude) {
        const enderecoDigitado = this.enderecoManual().trim();
        const coordenadas = enderecoDigitado.length >= 5
          ? await this.geocodificarEndereco(enderecoDigitado)
          : null;
        const { latitude, longitude } = coordenadas ?? this.LOCALIZACAO_PADRAO;
        localizacao = {
          latitude,
          longitude,
          endereco: enderecoDigitado || `${latitude}, ${longitude}`
        };
      }

      // Converter valor formatado para número
      let valorNumerico = 0;
      if (formValue.valor) {
        const valorString = String(formValue.valor);
        valorNumerico = parseFloat(valorString.replace(/\./g, '').replace(',', '.'));
      }

      const despesaData = {
        descricao: formValue.descricao,
        valor: valorNumerico,
        data: formValue.data,
        categoriaId: formValue.categoriaId,
        subcategoriaId: formValue.subcategoriaId || undefined,
        cartaoId: formValue.cartaoId || undefined,
        contaId: formValue.contaId || undefined,
        formaPagamento: formValue.formaPagamento,
        recorrente: formValue.recorrente,
        pago: formValue.pago,
        observacoes: formValue.observacoes || undefined,
        localizacao: localizacao
      };

      const operacao = this.isEdicao()
        ? this.despesaService.atualizar(this.despesaId()!, despesaData)
        : this.despesaService.criar(despesaData);

      operacao.subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/despesas']);
          } else {
            this.erro.set(response.error || 'Erro ao salvar despesa');
            this.carregando.set(false);
          }
        },
        error: (err) => {
          console.error('Erro ao salvar despesa:', err);
          this.erro.set(err.error?.error || 'Não foi possível salvar a despesa');
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
    this.router.navigate(['/despesas']);
  }

  getCategoriaSelecionada(): Categoria | undefined {
    const categoriaId = this.form.get('categoriaId')?.value;
    return this.categorias.find(c => c.id === categoriaId);
  }

  selecionarCategoria(categoriaId: string) {
    this.form.patchValue({ categoriaId });
  }

  getFormaPagamentoSelecionada() {
    const formaPagamento = this.form.get('formaPagamento')?.value;
    return this.formasPagamento.find(f => f.id === formaPagamento);
  }

  capturarLocalizacao() {
    if (!navigator.geolocation) {
      this.erroLocalizacao.set('Geolocalização não suportada pelo navegador. Digite o endereço do local abaixo.');
      return;
    }

    this.capturandoLocalizacao.set(true);
    this.erroLocalizacao.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        this.form.patchValue({
          localizacao: {
            latitude,
            longitude,
            endereco: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }
        });

        // Tentar obter endereço usando reverse geocoding (API do Nominatim)
        this.obterEndereco(latitude, longitude);
        this.capturandoLocalizacao.set(false);
      },
      (error) => {
        this.capturandoLocalizacao.set(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.erroLocalizacao.set('Permissão negada. Habilite a localização no navegador ou digite o endereço do local abaixo.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.erroLocalizacao.set('Localização indisponível. Digite o endereço do local abaixo.');
            break;
          case error.TIMEOUT:
            this.erroLocalizacao.set('Tempo limite excedido. Tente novamente ou digite o endereço do local abaixo.');
            break;
          default:
            this.erroLocalizacao.set('Erro ao capturar localização. Digite o endereço do local abaixo.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  async obterEndereco(latitude: number, longitude: number) {
    const endereco = await this.geocodingService.geocodificarReverso(latitude, longitude);
    const atual = this.getLocalizacao();
    // Só aplica se a localização não mudou enquanto a busca acontecia
    if (endereco && atual?.latitude === latitude && atual?.longitude === longitude) {
      this.form.patchValue({ localizacao: { latitude, longitude, endereco } });
    }
  }

  limparLocalizacao() {
    this.form.patchValue({
      localizacao: {
        latitude: null,
        longitude: null,
        endereco: ''
      }
    });
    this.erroLocalizacao.set(null);
    this.enderecoManual.set('');
  }

  async buscarCoordenadasPorEndereco() {
    const endereco = this.enderecoManual().trim();

    if (endereco.length < 5) {
      this.erroLocalizacao.set('Digite um endereço válido com pelo menos 5 caracteres');
      return;
    }

    this.buscandoCoordenadas.set(true);
    this.erroLocalizacao.set(null);

    const coordenadas = await this.geocodingService.geocodificar(endereco);
    this.buscandoCoordenadas.set(false);

    if (coordenadas) {
      // Mantém o texto digitado pelo usuário como endereço registrado
      this.form.patchValue({
        localizacao: { latitude: coordenadas.latitude, longitude: coordenadas.longitude, endereco }
      });
      this.enderecoManual.set('');
    } else {
      this.erroLocalizacao.set('Endereço não encontrado no mapa. Tente ser mais específico (ex: "Rua X, Bairro, Cidade - UF") ou salve assim mesmo: o endereço digitado será registrado.');
    }
  }

  /** Geocodifica no salvamento, limitado a 15s para não travar o formulário. */
  private geocodificarEndereco(endereco: string): Promise<{ latitude: number; longitude: number } | null> {
    const limite = new Promise<null>(resolve => setTimeout(() => resolve(null), 15000));
    return Promise.race([this.geocodingService.geocodificar(endereco), limite]);
  }

  getLocalizacao() {
    return this.form.get('localizacao')?.value;
  }

  atualizarSubcategorias(categoriaId: string) {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    this.subcategorias = categoria?.subcategorias || [];
  }

  selecionarSubcategoria(subcategoriaId: string) {
    this.form.patchValue({ subcategoriaId });
  }

  getSubcategoriaSelecionada(): Subcategoria | undefined {
    const subcategoriaId = this.form.get('subcategoriaId')?.value;
    return this.subcategorias.find(s => s.id === subcategoriaId);
  }
}
