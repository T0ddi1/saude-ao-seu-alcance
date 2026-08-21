import { Injectable, signal } from '@angular/core';

/**
 * Detects whether this browser is the physical kiosk ("totem"), as opposed to
 * a regular visitor's browser. The kiosk's browser can't be pointed at a
 * custom start URL, so this can't just read a `?totem=1` param on a real
 * device — instead it's auto-detected from the screen resolution: the
 * hardware spec from the kiosk's provider is 1080x1920 (portrait), so
 * anything in that neighborhood (see `matchesTotemResolution`) is assumed to
 * be the kiosk. The `?totem=1` query param still works too, and the header
 * logo's 7-tap gesture (see HeaderComponent.onLogoTap) can force it on or
 * off manually — both handy for testing, or as a fallback if some totem unit
 * ever reports a resolution outside the expected range. Whichever path sets
 * it, the result is persisted to localStorage so it survives every later
 * in-app navigation and browser/device restart without redetecting.
 */
const STORAGE_KEY = 'saude-is-totem';

/** Kiosk spec is 1080x1920 — a wide margin either side covers OS chrome/scaling without accidentally matching a phone or a regular desktop monitor. */
const TOTEM_WIDTH_RANGE: [number, number] = [1000, 1300];
const TOTEM_HEIGHT_RANGE: [number, number] = [1800, 2100];

@Injectable({ providedIn: 'root' })
export class TotemService {
  private readonly _isTotem = signal(this.detect());
  readonly isTotem = this._isTotem.asReadonly();

  /** Set by the header while its fullscreen totem menu is open, so the floating back button can hide behind it. */
  readonly menuOpen = signal(false);

  private readonly _isFullscreen = signal(!!document.fullscreenElement);
  readonly isFullscreen = this._isFullscreen.asReadonly();

  constructor() {
    if (this._isTotem()) {
      this.lockZoom();
    }
    document.addEventListener('fullscreenchange', () => this._isFullscreen.set(!!document.fullscreenElement));
  }

  private detect(): boolean {
    const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    if (params.get('totem') === '1') {
      localStorage.setItem(STORAGE_KEY, '1');
      return true;
    }

    // An explicit manual choice (via the logo-tap gesture) always wins over
    // the resolution guess — otherwise turning it off on a device whose
    // screen happens to match the totem's size would just turn itself back
    // on again on the next reload.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;

    return this.matchesTotemResolution();
  }

  private matchesTotemResolution(): boolean {
    const w = window.screen.width;
    const h = window.screen.height;
    return (
      w >= TOTEM_WIDTH_RANGE[0] &&
      w <= TOTEM_WIDTH_RANGE[1] &&
      h >= TOTEM_HEIGHT_RANGE[0] &&
      h <= TOTEM_HEIGHT_RANGE[1]
    );
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

  goFullscreen(): void {
    if (document.fullscreenElement) return;
    document.documentElement.requestFullscreen?.().catch(() => {
      // Some kiosk browsers block requestFullscreen entirely — nothing more we can do from here.
    });
  }

  /** The kiosk has no keyboard, so visitors can't rely on Esc — this backs a visible "exit fullscreen" control. */
  exitFullscreen(): void {
    if (!document.fullscreenElement) return;
    document.exitFullscreen?.().catch(() => {});
  }

  /**
   * Flips totem mode on/off and persists it — used by the logo-tap gesture
   * as a manual override. Stores an explicit '0' rather than clearing the
   * key when turning off, so that choice sticks even on a device whose
   * screen resolution would otherwise auto-detect as a totem.
   */
  toggle(): boolean {
    const next = !this._isTotem();
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    this._isTotem.set(next);
    return next;
  }
}
