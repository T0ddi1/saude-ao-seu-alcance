import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoMetaData {
  title: string;
  description: string;
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const SITE_NAME = 'Saúde ao Seu Alcance';
const JSON_LD_ID = 'seo-structured-data';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);

  setMeta(data: SeoMetaData): void {
    const pageTitle = data.title.includes(SITE_NAME) ? data.title : `${data.title} — ${SITE_NAME}`;
    this.titleService.setTitle(pageTitle);

    const imageUrl = data.image ? new URL(data.image, this.document.location.origin).href : '';

    const tags: { property?: string; name?: string; content: string }[] = [
      { name: 'description', content: data.description },
      { property: 'og:type', content: data.type ?? 'website' },
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:url', content: this.document.location.href },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
    ];
    if (imageUrl) {
      tags.push({ property: 'og:image', content: imageUrl }, { name: 'twitter:image', content: imageUrl });
    }

    for (const tag of tags) {
      this.meta.updateTag(tag, tag.property ? `property="${tag.property}"` : `name="${tag.name}"`);
    }

    if (data.noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }

  /** Injeta (ou substitui) o script JSON-LD de dados estruturados (Schema.org) da página atual. */
  setStructuredData(data: object | null): void {
    this.removeStructuredData();
    if (!data) return;

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeStructuredData(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }
}
