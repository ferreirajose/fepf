import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

declare global {
  interface Window {
    google: any;
  }
}

interface DespesaLocation {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  latitude: number;
  longitude: number;
  endereco: string;
  categoriaNome: string;
  categoriaCor: string;
}

@Component({
  selector: 'app-map-clusterer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer class="w-full h-full min-h-[500px] rounded-xl"></div>
  `,
  styles: []
})
export class MapClustererComponent implements AfterViewInit, OnChanges {
  @Input() despesas: DespesaLocation[] = [];
  @Input() googleMapsApiKey: string = '';

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: any;
  private markerClusterer: MarkerClusterer | null = null;
  private markers: any[] = [];
  private infoWindow: any;
  private isGoogleMapsLoaded = signal(false);

  ngAfterViewInit() {
    this.loadGoogleMaps();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['despesas'] && !changes['despesas'].firstChange && this.isGoogleMapsLoaded()) {
      this.updateMarkers();
    }
  }

  private loadGoogleMaps() {
    // Verificar se já está carregado
    if (window.google && window.google.maps) {
      this.isGoogleMapsLoaded.set(true);
      this.initMap();
      return;
    }

    // Carregar script do Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.isGoogleMapsLoaded.set(true);
      this.initMap();
    };
    script.onerror = () => {
      console.error('Erro ao carregar Google Maps API');
    };
    document.head.appendChild(script);
  }

  private async initMap() {
    // Coordenadas padrão (João Pessoa, PB)
    const defaultCenter = { lat: -7.165104, lng: -34.855471 };

    // Calcular centro baseado nas despesas
    let center = defaultCenter;
    let zoom = 13;

    if (this.despesas.length > 0) {
      const latitudes = this.despesas.map(d => d.latitude);
      const longitudes = this.despesas.map(d => d.longitude);

      center = {
        lat: latitudes.reduce((a, b) => a + b, 0) / latitudes.length,
        lng: longitudes.reduce((a, b) => a + b, 0) / longitudes.length
      };

      // Calcular zoom baseado na dispersão
      const maxLat = Math.max(...latitudes);
      const minLat = Math.min(...latitudes);
      const maxLng = Math.max(...longitudes);
      const minLng = Math.min(...longitudes);
      const maxDiff = Math.max(maxLat - minLat, maxLng - minLng);

      if (maxDiff < 0.01) zoom = 15;
      else if (maxDiff < 0.05) zoom = 13;
      else if (maxDiff < 0.1) zoom = 12;
      else if (maxDiff < 0.2) zoom = 11;
      else zoom = 10;
    }

    // Criar mapa
    const { Map } = await window.google.maps.importLibrary('maps');
    this.map = new Map(this.mapContainer.nativeElement, {
      zoom: zoom,
      center: center,
      mapId: 'DESPESAS_MAP',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Criar InfoWindow
    this.infoWindow = new window.google.maps.InfoWindow({
      content: '',
      disableAutoPan: false,
    });

    // Adicionar marcadores
    this.updateMarkers();
  }

  private async updateMarkers() {
    if (!this.map) return;

    // Limpar marcadores anteriores
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }
    this.markers = [];

    if (this.despesas.length === 0) return;

    const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary('marker');

    // Criar marcadores para cada despesa
    this.markers = this.despesas.map((despesa, index) => {
      // Criar pin customizado com cor da categoria
      const pinElement = new PinElement({
        background: despesa.categoriaCor,
        borderColor: this.darkenColor(despesa.categoriaCor, 20),
        glyphColor: '#ffffff',
        scale: 1.2,
      });

      // Criar marcador
      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: { lat: despesa.latitude, lng: despesa.longitude },
        content: pinElement.element,
        title: despesa.descricao,
      });

      // Adicionar listener de click
      marker.addListener('click', () => {
        const content = `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #242c51; font-size: 14px;">
              ${despesa.descricao}
            </h3>
            <div style="margin-bottom: 6px;">
              <span style="display: inline-block; padding: 2px 8px; background: ${despesa.categoriaCor}30; color: ${despesa.categoriaCor}; border-radius: 4px; font-size: 11px; font-weight: bold;">
                ${despesa.categoriaNome}
              </span>
            </div>
            <p style="margin: 6px 0; font-size: 16px; font-weight: bold; color: #b51621;">
              R$ ${despesa.valor.toFixed(2).replace('.', ',')}
            </p>
            <p style="margin: 6px 0; font-size: 12px; color: #515981;">
              <strong>Data:</strong> ${new Date(despesa.data).toLocaleDateString('pt-BR')}
            </p>
            <p style="margin: 6px 0; font-size: 11px; color: #515981;">
              <strong>📍</strong> ${despesa.endereco}
            </p>
          </div>
        `;
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      });

      return marker;
    });

    // Adicionar MarkerClusterer
    this.markerClusterer = new MarkerClusterer({
      markers: this.markers,
      map: this.map,
    });
  }

  private darkenColor(color: string, percent: number): string {
    // Remove # se houver
    const hex = color.replace('#', '');

    // Converte para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Escurece
    const newR = Math.floor(r * (100 - percent) / 100);
    const newG = Math.floor(g * (100 - percent) / 100);
    const newB = Math.floor(b * (100 - percent) / 100);

    // Converte de volta para hex
    return '#' +
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0');
  }
}
