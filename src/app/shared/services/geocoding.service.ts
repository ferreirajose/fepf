import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  /** Endereço formatado pelo provedor (quando disponível) */
  endereco?: string;
}

/**
 * Geocodificação de endereços.
 * Usa o Google Geocoding quando há chave configurada (NG_APP_GOOGLE_MAPS_API_KEY);
 * caso contrário — ou se o Google falhar — usa o Nominatim (OpenStreetMap), que não exige chave.
 * Política do Nominatim: no máximo 1 requisição por segundo, por isso as tentativas são sequenciais
 * e espaçadas.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly TIMEOUT_MS = 8000;
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  /** Converte um endereço em coordenadas. Retorna null se não encontrar ou em caso de falha. */
  async geocodificar(endereco: string): Promise<Coordenadas | null> {
    const texto = endereco.trim();
    if (texto.length < 5) {
      return null;
    }

    const google = await this.geocodificarGoogle(texto);
    if (google) {
      return google;
    }

    // Tentativas progressivamente menos específicas: endereço completo → sem número → só bairro/cidade
    const candidatos = this.gerarVariacoes(texto);
    for (let i = 0; i < candidatos.length; i++) {
      if (i > 0) {
        await this.esperar(1100);
      }
      const resultado = await this.buscarNominatim(candidatos[i]);
      if (resultado) {
        return resultado;
      }
    }
    return null;
  }

  /** Converte coordenadas em endereço legível. Retorna null em caso de falha. */
  async geocodificarReverso(latitude: number, longitude: number): Promise<string | null> {
    const apiKey = environment.googleMapsApiKey;
    if (apiKey) {
      const data = await this.getJson(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      if (data?.status === 'OK' && data.results?.length > 0) {
        return data.results[0].formatted_address;
      }
    }

    const data = await this.getJson(
      `${this.NOMINATIM_URL}/reverse?format=json&accept-language=pt-BR&lat=${latitude}&lon=${longitude}`
    );
    return data?.display_name ?? null;
  }

  private async geocodificarGoogle(endereco: string): Promise<Coordenadas | null> {
    const apiKey = environment.googleMapsApiKey;
    if (!apiKey) {
      return null;
    }
    const data = await this.getJson(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(endereco)}&region=br&key=${apiKey}`
    );
    if (data?.status === 'OK' && data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng, endereco: data.results[0].formatted_address };
    }
    console.warn('Google Geocoding sem resultado:', data?.status, data?.error_message);
    return null;
  }

  private async buscarNominatim(consulta: string): Promise<Coordenadas | null> {
    const params = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: 'br',
      'accept-language': 'pt-BR',
      q: consulta
    });
    const data = await this.getJson(`${this.NOMINATIM_URL}/search?${params}`);
    if (Array.isArray(data) && data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude, endereco: data[0].display_name };
      }
    }
    return null;
  }

  /**
   * Ex.: "Rua X, 944 - Bairro, Cidade - PB, 58060-100" gera:
   *  1. "Rua X, 944, Bairro, Cidade, PB"
   *  2. "Rua X, Bairro, Cidade, PB"
   *  3. "Bairro, Cidade, PB"
   */
  private gerarVariacoes(endereco: string): string[] {
    const partes = endereco
      .replace(/\b\d{5}-?\d{3}\b/g, '')      // remove CEP
      .split(/\s+-\s+|,/)                     // separa por vírgula ou " - "
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const semNumero = partes.filter(p => !/^(n[º°o.]?\s*)?\d+[a-zA-Z]?$/i.test(p));
    const semRua = semNumero.slice(1);

    const variacoes = [partes, semNumero, semRua.length >= 2 ? semRua : []]
      .map(p => p.join(', '))
      .filter(v => v.length >= 5);
    return [...new Set(variacoes)];
  }

  private async getJson(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        console.warn('Geocoding HTTP', response.status, url.split('?')[0]);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn('Geocoding falhou:', error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
