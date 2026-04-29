import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit {
  private el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef,
    private control: NgControl
  ) {
    this.el = this.elementRef.nativeElement;
  }

  ngOnInit() {
    // Formatar valor inicial se existir
    if (this.control.value) {
      this.el.value = this.formatarParaExibicao(this.control.value);
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(event: any) {
    // Ao focar, mostrar apenas números sem formatação
    const valor = this.control.value;
    if (valor) {
      this.el.value = this.formatarParaEdicao(valor);
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any) {
    // Ao desfocar, formatar para exibição
    const valor = this.extrairNumero(this.el.value);
    this.control.control?.setValue(valor);
    this.el.value = this.formatarParaExibicao(valor);
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    // Durante digitação, permitir apenas números e vírgula
    let valor = this.el.value;

    // Remover tudo exceto números e vírgula
    valor = valor.replace(/[^\d,]/g, '');

    // Permitir apenas uma vírgula
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }

    // Limitar a 2 casas decimais após a vírgula
    if (partes.length === 2 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2);
    }

    this.el.value = valor;

    // Atualizar o valor do controle
    const valorNumerico = this.extrairNumero(valor);
    this.control.control?.setValue(valorNumerico, { emitEvent: false });
  }

  private extrairNumero(valor: string): number {
    if (!valor) return 0;

    // Remover tudo exceto números e vírgula
    valor = valor.replace(/[^\d,]/g, '');

    // Substituir vírgula por ponto
    valor = valor.replace(',', '.');

    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  }

  private formatarParaExibicao(valor: number): string {
    if (!valor) return '';

    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatarParaEdicao(valor: number): string {
    if (!valor) return '';

    return valor.toFixed(2).replace('.', ',');
  }
}
