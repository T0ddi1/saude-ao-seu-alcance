import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'ghost' = 'primary';
  @Input() href: string | null = null;
  @Input() type: 'button' | 'submit' = 'button';
}
