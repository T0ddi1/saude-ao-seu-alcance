import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/layout/header/header.component';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TotemService } from './core/services/totem.service';
import { SiteConfigService } from './core/services/site-config.service';
import { ContatoService } from './core/services/contato.service';
import { GeolocationService } from './core/services/geolocation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  isHome = signal(false);
  isAdmin = signal(false);
  private ultimoCaminho: string | null = null;

  
  constructor(
    public totem: TotemService,
    private location: Location,
    private router: Router,
    private siteConfig: SiteConfigService,
    contato: ContatoService,
    geolocation: GeolocationService,
  ) {
    contato.captureUtm();
    geolocation.captureLocation();
    this.isHome.set(this.isHomeUrl(this.router.url));
    this.isAdmin.set(this.isAdminUrl(this.router.url));
  }

  ngOnInit(): void {
    this.siteConfig.getConfig().subscribe((config) => {
      this.siteConfig.aplicarFavicon(config.faviconUrl);
      this.siteConfig.aplicarCores(config.coresJson);
    });

    this.router
      .events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isHome.set(this.isHomeUrl(event.urlAfterRedirects));
        this.isAdmin.set(this.isAdminUrl(event.urlAfterRedirects));

        const caminho = event.urlAfterRedirects.split('?')[0].split('#')[0];
        const primeira = this.ultimoCaminho === null;
        if (caminho !== this.ultimoCaminho) {
          this.ultimoCaminho = caminho;
          if (!primeira) setTimeout(() => document.getElementById('conteudo')?.focus({ preventScroll: true }));
        }
      });

    if (this.totem.isTotem()) {
      
      
      
      
      document.addEventListener('click', () => this.totem.goFullscreen(), { once: true, capture: true });
    }
  }

  irParaConteudo(evento: Event): void {
    evento.preventDefault();
    const main = document.getElementById('conteudo');
    main?.focus();
    main?.scrollIntoView();
  }

  goBack(): void {
    this.location.back();
  }

  
  private isHomeUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path === '/' || path === '';
  }

  
  private isAdminUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return path.startsWith('/admin');
  }
}
