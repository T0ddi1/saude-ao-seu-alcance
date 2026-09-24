import { Injectable } from '@angular/core';

const STORAGE_KEY = 'saude-geo';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  captureLocation(): void {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {

    }

    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const coords: Coordenadas = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch {

        }
      },
      () => {

      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  getStoredLocation(): Coordenadas | null {
    try {
      const bruto = sessionStorage.getItem(STORAGE_KEY);
      return bruto ? (JSON.parse(bruto) as Coordenadas) : null;
    } catch {
      return null;
    }
  }
}
