import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../../core/services/blog.service';
import { BlogPageData } from '../../core/models/blog.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ArticleCardComponent } from './components/article-card/article-card.component';
import { ContentSidebarComponent } from '../../shared/components/content-sidebar/content-sidebar.component';
import { PaginationComponent } from './components/pagination/pagination.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, ArticleCardComponent, ContentSidebarComponent, PaginationComponent],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  data = signal<BlogPageData | null>(null);
  private categoriaAtual: string | null = null;
  private paginaAtual = 1;

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.categoriaAtual = params.get('categoria');
      this.paginaAtual = 1;
      this.carregar();
    });
  }

  onPageChange(page: number): void {
    this.paginaAtual = page;
    this.carregar();
  }

  private carregar(): void {
    this.blogService.getBlogPage(this.paginaAtual, this.categoriaAtual).subscribe((data) => this.data.set(data));
  }
}
