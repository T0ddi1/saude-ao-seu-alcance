import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 3500): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.message.set(message);
    this.hideTimer = setTimeout(() => this.message.set(null), durationMs);
  }
}
