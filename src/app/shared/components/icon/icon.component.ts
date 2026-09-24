import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


const ICON_MAP: Record<string, string> = {
  ring: 'fa-solid fa-heart-pulse',
  ribbon: 'fa-solid fa-ribbon',
  dot: 'fa-solid fa-circle-dot',
  cross: 'fa-solid fa-plus',
  square: 'fa-solid fa-hospital',
  doc: 'fa-solid fa-file-lines',
  download: 'fa-solid fa-download',
  mic: 'fa-solid fa-microphone',
  play: 'fa-solid fa-circle-play',
  'arrow-right': 'fa-solid fa-arrow-right',
  search: 'fa-solid fa-magnifying-glass',
  bookmark: 'fa-regular fa-bookmark',
  'chevron-down': 'fa-solid fa-chevron-down',
  map: 'fa-solid fa-map-location-dot',
  fire: 'fa-solid fa-fire',
  user: 'fa-regular fa-user',
  facebook: 'fa-brands fa-facebook-f',
  instagram: 'fa-brands fa-instagram',
  youtube: 'fa-brands fa-youtube',
  linkedin: 'fa-brands fa-linkedin-in',
  whatsapp: 'fa-brands fa-whatsapp',
  x: 'fa-brands fa-x-twitter',
  compress: 'fa-solid fa-compress',
};


export function separarIcone(valor: string | null | undefined): { nome: string; cor: string | null } {
  const [nome, cor] = (valor ?? '').split('|');
  return { nome, cor: cor && /^#[0-9a-f]{6}$/i.test(cor) ? cor : null };
}

export function montarIcone(nome: string, cor: string | null): string {
  return cor ? `${nome}|${cor}` : nome;
}

export const ICONES_DISPONIVEIS = Object.keys(ICON_MAP);

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  @Input() name = 'dot';
  @Input() size = 20;
  @Input() color = 'currentColor';

  get corFinal(): string {
    return separarIcone(this.name).cor ?? this.color;
  }

  get faClass(): string {
    const nome = separarIcone(this.name).nome;
    if (nome.includes(' ')) return nome;
    return ICON_MAP[nome] ?? 'fa-solid fa-circle';
  }
}
