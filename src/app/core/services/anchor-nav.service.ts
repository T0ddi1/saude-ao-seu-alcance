import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs';

/**
 * Handles links like "/#dados-da-saude" — a route plus an in-page anchor.
 * [routerLink] can't be used for these: with hash-location routing already
 * spending the URL's one "#" on the route, Angular treats a second "#" in
 * the string as literal text (URL-encoding it to "%23") instead of splitting
 * out a fragment, so the link silently 404s to the wildcard redirect and the
 * anchor is lost. This does the split itself and scrolls manually — waiting
 * for the route to finish navigating first when it isn't already there.
 */
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

  /**
   * NavigationEnd fires once the route is activated, but the target page's
   * own async bits (lazy-loaded chunk, an HTTP call feeding *ngFor content
   * above the anchor) can still be growing the layout after that — scrolling
   * immediately targets a position that's correct for the half-rendered page
   * and wrong once everything settles. Polling until the element's offset
   * stops moving (or a ~2s cap runs out) waits that out instead of guessing
   * a fixed delay.
   */
  private scrollTo(anchorId: string): void {
    let lastTop: number | null = null;
    let stableFrames = 0;
    let attempts = 0;
    const maxAttempts = 120; // ~2s at 60fps

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
