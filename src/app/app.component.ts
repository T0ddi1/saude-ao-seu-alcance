import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/layout/header/header.component';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TotemService } from './core/services/totem.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  isFullscreen = signal(!!document.fullscreenElement);
  isHome = signal(false);

  /** totem is public so the template can read isTotem() directly. */
  constructor(public totem: TotemService, private location: Location, private router: Router) {
    this.isHome.set(this.isHomeUrl(this.router.url));
  }

  ngOnInit(): void {
    this.router
      .events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.isHome.set(this.isHomeUrl(event.urlAfterRedirects)));

    if (this.totem.isTotem()) {
      // Browsers only allow requestFullscreen() from a real user gesture, so
      // we can't do it automatically on load — instead, the very first tap
      // anywhere on the kiosk (whatever the visitor meant to tap) doubles as
      // that gesture and quietly goes fullscreen alongside it.
      document.addEventListener('click', () => this.goFullscreen(), { once: true, capture: true });
    }
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * `router.url` includes the query string (e.g. "/?totem=1" on the kiosk's
   * first load), so a plain "/" comparison missed the home route whenever
   * that param was present — leaving the back button visible with nowhere
   * useful to go back to.
   */
  private isHomeUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path === '/' || path === '';
  }

  goFullscreen(): void {
    if (document.fullscreenElement) return;
    document.documentElement.requestFullscreen?.().catch(() => {
      // Some kiosk browsers block requestFullscreen entirely — nothing more we can do from here.
    });
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }
}
