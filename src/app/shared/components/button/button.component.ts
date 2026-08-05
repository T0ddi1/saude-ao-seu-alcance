import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' = 'primary';
  @Input() href: string | null = null;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() showArrow = false;
}
