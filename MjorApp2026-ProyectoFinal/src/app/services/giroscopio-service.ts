import { inject, Injectable, NgZone } from '@angular/core';
import { Motion } from '@capacitor/motion';
import type { AccelListenerEvent } from '@capacitor/motion';
import { PluginListenerHandle } from '@capacitor/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GiroscopioService {

  private motionListenerHandle: PluginListenerHandle | null = null;
  private ngZone = inject(NgZone)

   
  /* ===================== */
  /* 📱 MOTION → OBSERVABLE CON NGZONE + cooldown */
  /* ===================== */
  getAccelerationObservable(): Observable<{ x: number, y: number, z: number }> {
    return new Observable(observer => {
      let listener: PluginListenerHandle | null = null;
      let move = true; // cooldown flag

      const startListening = async () => {
        listener = await Motion.addListener('accel', (event: AccelListenerEvent) => {
          this.ngZone.run(() => {
            if (!move) return;
            move = false;
            const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity;
            observer.next({ x, y, z });
            setTimeout(() => move = true, 1000); // 500ms cooldown
          });
        });
        this.motionListenerHandle = listener;
      };

      startListening();

      return () => {
        if (listener) { listener.remove(); this.motionListenerHandle = null; }
      };
    });
  }

  /* ===================== */
  /* 🚫 DETENER MOTION      */
  /* ===================== */
  async stopMotionListener(): Promise<void> {
    if (this.motionListenerHandle) { await this.motionListenerHandle.remove(); this.motionListenerHandle = null; }
    await Motion.removeAllListeners();
  }
  
}
