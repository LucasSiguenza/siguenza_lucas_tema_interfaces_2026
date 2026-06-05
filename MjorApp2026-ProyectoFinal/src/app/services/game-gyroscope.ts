import { Injectable, NgZone } from '@angular/core';
import { Motion } from '@capacitor/motion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameGyroscopeService {
  constructor(private ngZone: NgZone) {}

  getAccelerationObservable(): Observable<{ x: number, y: number }> {
    return new Observable(observer => {
      let listener: any;

      const startListening = async () => {
        // En iOS se requiere pedir permiso explícito
        try {
            // @ts-ignore
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                // @ts-ignore
                await DeviceMotionEvent.requestPermission();
            }
        } catch (e) {
            console.error(e);
        }

        listener = await Motion.addListener('accel', event => {
          this.ngZone.run(() => {
            // Ajustamos ejes para modo Landscape
            // X del dispositivo -> Y del juego
            // Y del dispositivo -> X del juego
            observer.next({
              x: event.accelerationIncludingGravity.y || 0, 
              y: event.accelerationIncludingGravity.x || 0
            });
          });
        });
      };

      startListening();

      return () => {
        if (listener) {
          listener.remove();
        }
      };
    });
  }
}