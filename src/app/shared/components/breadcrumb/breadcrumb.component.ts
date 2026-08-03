import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { Breadcrumb } from '../../../core/models/blog.model';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  @Input({ required: true }) items!: Breadcrumb[];
}
