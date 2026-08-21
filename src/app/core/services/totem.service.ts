import { Injectable, signal } from '@angular/core';

/**
 * Detects whether this browser is the physical kiosk ("totem"), as opposed to
 * a regular visitor's browser. The totem's home URL should be configured
 * once with `?totem=1` (e.g. https://saudeaoseualcance.com/#/?totem=1) — we
 * persist that flag to localStorage on first load so it survives every
 * later in-app navigation and browser/device restart without needing the
 * query param again.
 */
const STORAGE_KEY = 'saude-is-totem';

@Injectable({ providedIn: 'root' })
export class TotemService {
  private readonly _isTotem = signal(this.detect());
  readonly isTotem = this._isTotem.asReadonly();

  /** Set by the header while its fullscreen totem menu is open, so the floating back button can hide behind it. */
  readonly menuOpen = signal(false);

  constructor() {
    if (this._isTotem()) {
      this.lockZoom();
    }
  }

  private detect(): boolean {
    const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    if (params.get('totem') === '1') {
      localStorage.setItem(STORAGE_KEY, '1');
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  /**
   * Someone pinch-zoomed the page by accident on the kiosk touchscreen — this
   * pins the viewport so pinch/double-tap zoom can't change it. Only applied
   * on the totem; regular visitors keep normal pinch-zoom for accessibility.
   */
  private lockZoom(): void {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    document.documentElement.style.touchAction = 'pan-x pan-y';
  }
}
