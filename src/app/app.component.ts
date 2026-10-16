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
    this.acompanharLarguraUtil();
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
      document.documentElement.classList.add('is-totem');
      
      
      
      
      document.addEventListener('click', () => this.totem.goFullscreen(), { once: true, capture: true });
    }
  }

  /**
   * "100vw" inclui a barra de rolagem e faz faixas de largura total passarem da tela.
   * Aqui guardamos 1% da largura REAL disponível em --vw (px) pra usar no lugar de 1vw.
   */
  private acompanharLarguraUtil(): void {
    const raiz = document.documentElement;
    const atualizar = () => raiz.style.setProperty('--vw', `${raiz.clientWidth / 100}px`);
    atualizar();
    // A barra de rolagem aparece/some conforme o tamanho do conteúdo, sem disparar "resize" da janela:
    // por isso também observamos o <body> e reavaliamos a cada troca de página.
    window.addEventListener('resize', atualizar);
    if (typeof ResizeObserver !== 'undefined') {
      const observador = new ResizeObserver(atualizar);
      observador.observe(raiz);
      observador.observe(document.body);
    }
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => setTimeout(atualizar, 350));
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

  goHome(): void {
    this.router.navigateByUrl('/');
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
