import { Injectable, inject } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class UbicacionService {
  private http = inject(HttpClient);

  async obtenerUbicacionActual()
{
    if (Capacitor.getPlatform() === 'web')
    {
      return new Promise<{ latitude: number, longitude: number }>(
        (resolve, reject) =>
        {
          navigator.geolocation.getCurrentPosition(
            (position) =>
            {
              resolve(
              {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) =>
            {
              reject(error);
            },
            {
              enableHighAccuracy: true
            }
          );
        }
      );
    }
    const permisos = await Geolocation.requestPermissions();

    if (permisos.location !== 'granted')
    {
      throw new Error('Permisos de ubicación denegados');
    }

    const position = await Geolocation.getCurrentPosition(
    {
      enableHighAccuracy: true
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  }

  calcularDistanciaMetros(origen: [number, number], destino: [number, number]){
    const R = 6371e3;

    const φ1 = origen[0] * Math.PI / 180;
    const φ2 = destino[0] * Math.PI / 180;

    const Δφ = (destino[0] - origen[0]) * Math.PI / 180;
    const Δλ = (destino[1] - origen[1]) * Math.PI / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async obtenerRuta(origen: [number, number], destino: [number, number]){
    const url =
    `https://api.geoapify.com/v1/routing?waypoints=${origen[0]},${origen[1]}|${destino[0]},${destino[1]}&mode=drive&apiKey=${environment.geoapifyAPIKey}`;

    const response: any = await firstValueFrom(
      this.http.get(url)
    );

    return response;
  }
}
