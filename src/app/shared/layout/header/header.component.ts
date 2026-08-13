import { Component, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../../core/services/navigation.service';
import { NavItem } from '../../../core/models/navigation.model';
import { IconComponent } from '../../components/icon/icon.component';
import { SearchBoxComponent } from '../../components/search-box/search-box.component';

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

  constructor(private navigationService: NavigationService, private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.navigationService.getNavigation().subscribe((items) => this.navItems.set(items));
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
  }
}
