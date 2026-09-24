import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../../core/services/navigation.service';
import { NavItem } from '../../../core/models/navigation.model';
import { IconComponent } from '../../components/icon/icon.component';
import { SearchBoxComponent } from '../../components/search-box/search-box.component';
import { TotemService } from '../../../core/services/totem.service';
import { AnchorNavService } from '../../../core/services/anchor-nav.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { SiteConfigService } from '../../../core/services/site-config.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, SearchBoxComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  navItems = signal<NavItem[]>([]);
  openIndex = signal<number | null>(null);
  mobileMenuOpen = signal(false);
  logoPersonalizado = signal<string | null>(null);

  constructor(
    private navigationService: NavigationService,
    private elementRef: ElementRef<HTMLElement>,
    public totem: TotemService,
    public anchorNav: AnchorNavService,
    private toast: ToastService,
    public authService: AuthService,
    private siteConfig: SiteConfigService
  ) {}

  ngOnInit(): void {
    this.navigationService.getNavigation().subscribe((items) => this.navItems.set(items));
    this.siteConfig.getConfig().subscribe((config) => this.logoPersonalizado.set(config.logoUrl));
  }

  get linkContaLogada(): string {
    return this.authService.ehAdmin || this.authService.ehStaff ? '/admin' : '/perfil';
  }

  get rotuloContaLogada(): string {
    return this.authService.ehAdmin || this.authService.ehStaff ? 'Painel Admin' : 'Meu Perfil';
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    this.openIndex.update((current) => (current === index ? null : index));
  }

  closeMenu(): void {
    this.openIndex.set(null);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
    this.openIndex.set(null);
    this.totem.menuOpen.set(this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.openIndex.set(null);
    this.totem.menuOpen.set(false);
  }

  private logoTapCount = 0;
  private logoTapResetTimer: ReturnType<typeof setTimeout> | null = null;

  
  onLogoTap(): void {
    this.logoTapCount++;
    if (this.logoTapResetTimer) clearTimeout(this.logoTapResetTimer);
    this.logoTapResetTimer = setTimeout(() => (this.logoTapCount = 0), 3000);

    if (this.logoTapCount < 7) return;

    this.logoTapCount = 0;
    if (this.logoTapResetTimer) clearTimeout(this.logoTapResetTimer);

    const nowTotem = this.totem.toggle();
    this.toast.show(nowTotem ? 'Modo totem ativado — reiniciando…' : 'Modo totem desativado — reiniciando…');
    setTimeout(() => window.location.reload(), 1200);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
    this.mobileMenuOpen.set(false);
    this.totem.menuOpen.set(false);
  }
}
