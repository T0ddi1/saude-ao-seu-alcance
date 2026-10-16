import { Directive, Input, OnChanges, Self } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * O routerLink do Angular não entende "?" dentro do texto do link (ex: "/blog?categoria=nutricao" vira um caminho quebrado).
 * Como os links do menu, rodapé e cards são cadastrados pelo admin nesse formato, esta diretiva separa o caminho
 * dos parâmetros e entrega cada parte ao RouterLink. Basta importá-la junto com o RouterLink.
 */
@Directive({ selector: 'a[routerLink]', standalone: true })
export class LinkComQueryDirective implements OnChanges {
  @Input() routerLink: unknown;

  constructor(@Self() private link: RouterLink) {}

  ngOnChanges(): void {
    if (typeof this.routerLink !== 'string' || !this.routerLink.includes('?')) return;

    const [caminho, consulta] = this.routerLink.split('?');
    const params: Record<string, string> = {};
    consulta.split('&').forEach((par) => {
      const [chave, valor] = par.split('=');
      if (chave) params[decodeURIComponent(chave)] = decodeURIComponent(valor ?? '');
    });

    this.link.queryParams = params;
    this.link.routerLink = caminho || '/';
    this.link.ngOnChanges();
  }
}
