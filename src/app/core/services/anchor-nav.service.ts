import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AnchorNavService {
  constructor(private router: Router) {}

  isAnchorLink(href: string): boolean {
    return href.includes('#');
  }

  navigate(href: string, event: Event): void {
    event.preventDefault();
    const [path, anchorId] = href.split('#');
    const targetPath = path || '/';
    const currentPath = this.router.url.split('?')[0].split('#')[0];

    if (currentPath === targetPath) {
      this.scrollTo(anchorId);
      return;
    }

    this.router
      .events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => this.scrollTo(anchorId));
    this.router.navigateByUrl(targetPath);
  }

  
  private scrollTo(anchorId: string): void {
    let lastTop: number | null = null;
    let stableFrames = 0;
    let attempts = 0;
    const maxAttempts = 120; 

    const poll = () => {
      const el = document.getElementById(anchorId);
      attempts++;
      if (!el) {
        if (attempts < maxAttempts) requestAnimationFrame(poll);
        return;
      }

      const top = el.getBoundingClientRect().top;
      if (top === lastTop) {
        stableFrames++;
      } else {
        stableFrames = 0;
        lastTop = top;
      }

      if (stableFrames >= 5 || attempts >= maxAttempts) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      requestAnimationFrame(poll);
    };

    requestAnimationFrame(poll);
  }
}
