import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { BlogCategory, RecentPost } from '../../../core/models/blog.model';
import { SidebarExtra } from '../../../core/models/content.model';

@Component({
  selector: 'app-content-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './content-sidebar.component.html',
  styleUrl: './content-sidebar.component.scss',
})
export class ContentSidebarComponent {
  @Input({ required: true }) categories!: BlogCategory[];
  @Input({ required: true }) recentPosts!: RecentPost[];
  @Input({ required: true }) extras!: SidebarExtra[];
}
