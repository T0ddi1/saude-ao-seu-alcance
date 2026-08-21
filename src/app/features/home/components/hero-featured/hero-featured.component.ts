import { Component, Input, OnChanges, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FeaturedArticle } from '../../../../core/models/home.model';

const AUTOPLAY_MS = 6000;

@Component({
  selector: 'app-hero-featured',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, IconComponent],
  templateUrl: './hero-featured.component.html',
  styleUrl: './hero-featured.component.scss',
})
export class HeroFeaturedComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) articles!: FeaturedArticle[];

  activeIndex = signal(0);
  article = computed(() => this.articles[this.activeIndex()]);

  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;

  ngOnChanges(): void {
    this.activeIndex.set(0);
    this.restartAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  goTo(index: number): void {
    this.activeIndex.set(index);
    this.restartAutoplay();
  }

  next(): void {
    this.activeIndex.set((this.activeIndex() + 1) % this.articles.length);
    this.restartAutoplay();
  }

  prev(): void {
    this.activeIndex.set((this.activeIndex() - 1 + this.articles.length) % this.articles.length);
    this.restartAutoplay();
  }

  pauseAutoplay(): void {
    this.stopAutoplay();
  }

  resumeAutoplay(): void {
    this.restartAutoplay();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) this.next();
    else this.prev();
  }

  private restartAutoplay(): void {
    this.stopAutoplay();
    if (!this.articles || this.articles.length < 2) return;
    this.timer = setInterval(() => {
      this.activeIndex.set((this.activeIndex() + 1) % this.articles.length);
    }, AUTOPLAY_MS);
  }

  private stopAutoplay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
