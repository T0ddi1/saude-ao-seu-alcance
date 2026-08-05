import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [BreadcrumbComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contato', href: '/contato' },
  ];

  formUrl: SafeResourceUrl;

  constructor(sanitizer: DomSanitizer) {
    this.formUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://docs.google.com/forms/d/e/1FAIpQLSeGgrxjcNjDG2fjeBerZmED2v2_ClEo76l_kZB9jIJ65qI6RA/viewform?embedded=true'
    );
  }
}
