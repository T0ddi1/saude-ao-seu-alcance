import { Injectable, signal } from '@angular/core';


const STORAGE_KEY = 'saude-is-totem';


const TOTEM_WIDTH_RANGE: [number, number] = [1000, 1300];
const TOTEM_HEIGHT_RANGE: [number, number] = [1800, 2100];

@Injectable({ providedIn: 'root' })
export class TotemService {
  private readonly _isTotem = signal(this.detect());
  readonly isTotem = this._isTotem.asReadonly();

  
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
    });
  }


  exitFullscreen(): void {
    if (!document.fullscreenElement) return;
    document.exitFullscreen?.().catch(() => {});
  }

  
  toggle(): boolean {
    const next = !this._isTotem();
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    this._isTotem.set(next);
    return next;
  }
}
