import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' = 'primary';
  @Input() href: string | null = null;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() showArrow = false;
  @Input() disabled = false;
  @Input() large = false;
  @Input() compact = false;

  
  get isInternal(): boolean {
    return !!this.href && this.href.startsWith('/');
  }
}
