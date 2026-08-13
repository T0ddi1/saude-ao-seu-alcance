import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Maps semantic icon names used across templates to Font Awesome classes. */
const ICON_MAP: Record<string, string> = {
  ring: 'fa-solid fa-heart-pulse',
  ribbon: 'fa-solid fa-ribbon',
  dot: 'fa-solid fa-circle-dot',
  cross: 'fa-solid fa-plus',
  square: 'fa-solid fa-hospital',
  doc: 'fa-solid fa-file-lines',
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
};

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

  get faClass(): string {
    return ICON_MAP[this.name] ?? 'fa-solid fa-circle';
  }
}
