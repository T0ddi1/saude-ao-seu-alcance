import { Component, Input } from '@angular/core';
import { LinkComQueryDirective } from '../../../../shared/directives/link-com-query.directive';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BlogCategory, RecentPost, SponsorCard } from '../../../../core/models/blog.model';

@Component({
  selector: 'app-blog-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, LinkComQueryDirective, IconComponent, ButtonComponent],
  templateUrl: './blog-sidebar.component.html',
  styleUrl: './blog-sidebar.component.scss',
})
export class BlogSidebarComponent {
  @Input({ required: true }) categories!: BlogCategory[];
  @Input({ required: true }) recentPosts!: RecentPost[];
  @Input({ required: true }) adBanner!: { title: string; ctaLabel: string; href: string };
  @Input({ required: true }) sponsor!: SponsorCard;
}
