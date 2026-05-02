import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgxMaskDirective } from 'ngx-mask';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { DespesaService } from '../../shared/services/despesa.service';
import { CategoriaService, Categoria as CategoriaAPI } from '../../shared/services/categoria.service';
import { CartaoService, Cartao as CartaoAPI } from '../../shared/services/cartao.service';
import { environment } from '../../../environments/environment';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
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

  form: FormGroup;
  despesaId = signal<string | null>(null);
  isEdicao = signal(false);
  carregando = signal(false);
  erro = signal<string | null>(null);

  categorias: Categoria[] = [];
  cartoes: Cartao[] = [];

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
      cartaoId: [''],
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
              cor: c.cor || '#6e9fff'
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

  getDataHoje(): string {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  carregarDespesa(id: string) {
    this.carregando.set(true);
    this.despesaService.buscarPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data && !Array.isArray(response.data)) {
          const despesa = response.data;
          // Extrair apenas a parte da data sem conversão de timezone
          const dataFormatada = typeof despesa.data === 'string'
            ? despesa.data.split('T')[0]
            : new Date(despesa.data).toISOString().split('T')[0];

          this.form.patchValue({
            descricao: despesa.descricao,
            valor: despesa.valor,
            data: dataFormatada,
            categoriaId: despesa.categoriaId,
            cartaoId: despesa.cartaoId || '',
            formaPagamento: despesa.formaPagamento || 'dinheiro',
            recorrente: despesa.recorrente,
            pago: despesa.pago || false,
            observacoes: despesa.observacoes || '',
            localizacao: despesa.localizacao || {
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

  salvar() {
    if (this.form.valid) {
      this.carregando.set(true);
      this.erro.set(null);

      const formValue = this.form.value;

      // Se localização não foi capturada, usar coordenadas padrão
      let localizacao = formValue.localizacao;
      if (!localizacao.latitude && !localizacao.longitude) {
        localizacao = {
          latitude: -7.165104,
          longitude: -34.855471,
          endereco: '-7.165104, -34.855471'
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
        cartaoId: formValue.cartaoId || undefined,
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
      this.erroLocalizacao.set('Geolocalização não suportada pelo navegador');
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
            this.erroLocalizacao.set('Permissão negada. Habilite a localização no navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.erroLocalizacao.set('Localização indisponível.');
            break;
          case error.TIMEOUT:
            this.erroLocalizacao.set('Tempo limite excedido.');
            break;
          default:
            this.erroLocalizacao.set('Erro ao capturar localização.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  obterEndereco(latitude: number, longitude: number) {
    const apiKey = environment.googleMapsApiKey;

    if (!apiKey) {
      console.warn('Google Maps API key não configurada');
      return;
    }

    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.status === 'OK' && data.results && data.results.length > 0) {
          const resultado = data.results[0];
          const enderecoFormatado = resultado.formatted_address;

          setTimeout(() => {
            this.form.patchValue({
              localizacao: {
                latitude,
                longitude,
                endereco: enderecoFormatado
              }
            });
          }, 0);
        }
      })
      .catch((error) => {
        console.warn('Não foi possível obter o endereço:', error);
      });
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

  buscarCoordenadasPorEndereco() {
    const endereco = this.enderecoManual();

    if (!endereco || endereco.trim().length < 5) {
      this.erroLocalizacao.set('Digite um endereço válido com pelo menos 5 caracteres');
      return;
    }

    const apiKey = environment.googleMapsApiKey;

    if (!apiKey) {
      this.erroLocalizacao.set('Google Maps API key não configurada');
      return;
    }

    this.buscandoCoordenadas.set(true);
    this.erroLocalizacao.set(null);

    const enderecoEncoded = encodeURIComponent(endereco.trim());
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoEncoded}&key=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        this.buscandoCoordenadas.set(false);

        if (data && data.status === 'OK' && data.results && data.results.length > 0) {
          const resultado = data.results[0];
          const latitude = resultado.geometry.location.lat;
          const longitude = resultado.geometry.location.lng;
          const enderecoFormatado = resultado.formatted_address;

          setTimeout(() => {
            this.form.patchValue({
              localizacao: {
                latitude,
                longitude,
                endereco: enderecoFormatado
              }
            });
            this.enderecoManual.set('');
          }, 0);
        } else if (data && data.status === 'ZERO_RESULTS') {
          this.erroLocalizacao.set('Endereço não encontrado. Tente ser mais específico (ex: "Rua X, Cidade, Estado")');
        } else {
          this.erroLocalizacao.set(`Erro: ${data?.error_message || data?.status || 'Erro ao buscar o endereço'}`);
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar coordenadas:', error);
        this.buscandoCoordenadas.set(false);
        this.erroLocalizacao.set('Erro ao buscar o endereço. Tente novamente.');
      });
  }

  getLocalizacao() {
    return this.form.get('localizacao')?.value;
  }
}
