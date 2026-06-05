import { Component, inject, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Router } from '@angular/router';
import { Util } from 'src/app/services/util';
import { Juegos } from 'src/app/services/juegos';
import { GameGyroscopeService } from 'src/app/services/game-gyroscope';

@Component({
  selector: 'app-ayudar-mozo',
  templateUrl: './ayudar-mozo.page.html',
  styleUrls: ['./ayudar-mozo.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class AyudarMozoPage implements OnInit, OnDestroy {

  // Inyecciones
  private gameService = inject(GameGyroscopeService);
  private router = inject(Router);
  private utils = inject(Util);
  private juegosService = inject(Juegos);
  private ngZone = inject(NgZone);

  // Configuración del juego
  mozoSize = 0;
  obstaculoSize = 0;
  mesaSize = 0;
  
  // Posiciones (X, Y)
  mozoPos = { x: 20, y: 20 };
  velocidad = { x: 0, y: 0 };
  mesaPos = { x: 0, y: 0 };
  
  // Obstáculos
  obstaculos: { x: number, y: number, tipo: string }[] = [];
  // Asegúrate de tener estas imágenes en assets/juego-mozo/
  tiposObstaculos = ['patin.png', 'banana.png', 'aceite.png']; 

  // Estado
  idPedido = signal<number>(-1);
  esperandoInicio = true;
  juegoActivo = false;
  subscription: Subscription | null = null;
  mensajeFin = '';

  // Audio (Rutas relativas a src/assets/)
  audioInicio = new Audio('assets/sounds/inicio.mp3'); 
  audioFin = new Audio('assets/sounds/fin.mp3');
  audioError = new Audio('assets/sounds/error.mp3');

  // Calibración
  biasX = 0;
  biasY = 0;

  constructor() {}

  async ngOnInit()
  {
    var spinner = await this.utils.loading();
    await ScreenOrientation.lock({ orientation: 'landscape' });
    spinner.present();
    await this.juegosService.revisarSiJuegoIntentado(await this.juegosService.obtenerUIDPedido());
    spinner.dismiss();
  }

  ionViewWillLeave() {
    this.detenerJuego();
    ScreenOrientation.unlock(); // Liberar rotación al salir
  }

  ngOnDestroy() {
    this.detenerJuego();
  }

  comenzarJuego() {
    // 1. Calcular dimensiones actuales (Landscape)
    const w = window.innerWidth;
    const h = window.innerHeight;
    const minDim = Math.min(w, h);

    // Ajustar tamaños proporcionales
    this.mozoSize = minDim * 0.15;      
    this.mesaSize = minDim * 0.20;      
    this.obstaculoSize = minDim * 0.12; 

    // 2. Posicionar elementos (Esquinas opuestas)
    this.mozoPos = { x: 20, y: h / 2 - this.mozoSize / 2 }; // Izquierda centrado
    this.mesaPos = { x: w - this.mesaSize - 20, y: h / 2 - this.mesaSize / 2 }; // Derecha centrado

    this.generarObstaculos(w, h);

    // 3. Resetear físicas
    this.velocidad = { x: 0, y: 0 };
    this.esperandoInicio = false;
    this.juegoActivo = true;
    this.mensajeFin = '';

    // 4. Sonido
    this.audioInicio.play().catch(() => {});

    // 5. Iniciar Sensor con CALIBRACIÓN
    let primeraLectura = true;

    this.subscription = this.gameService.getAccelerationObservable().subscribe(acc => {
      this.ngZone.run(() => {
        if (primeraLectura) {
          this.biasX = acc.x; 
          this.biasY = acc.y;
          primeraLectura = false;
          return;
        }
        // Invertimos ejes si es necesario según orientación del dispositivo
        // Generalmente en Landscape: Y del sensor mueve X en pantalla
        this.actualizarFisica(acc.y - this.biasY, acc.x - this.biasX);
      });
    });
  }

  generarObstaculos(maxX: number, maxY: number) {
    this.obstaculos = [];
    const zonaSeguraX_Inicio = maxX * 0.25;
    const zonaSeguraX_Fin = maxX * 0.75;
    
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * (zonaSeguraX_Fin - zonaSeguraX_Inicio) + zonaSeguraX_Inicio; 
      const y = Math.random() * (maxY - this.obstaculoSize - 20) + 10;
      // Rotar tipo de obstáculo
      const tipo = `assets/juego-mozo/${this.tiposObstaculos[i % 3]}`;
      this.obstaculos.push({ x, y, tipo });
    }
  }

  actualizarFisica(diffX: number, diffY: number) {
    if (!this.juegoActivo) return;

    const sensibilidad = 0.5;
    
    // Mover Mozo
    // Nota: diffY afecta X y diffX afecta Y en Landscape usualmente
    this.velocidad.x += diffY * sensibilidad;    
    this.velocidad.y += diffX * sensibilidad; 

    // Límite de velocidad
    const MAX = 10;
    this.velocidad.x = Math.max(-MAX, Math.min(this.velocidad.x, MAX));
    this.velocidad.y = Math.max(-MAX, Math.min(this.velocidad.y, MAX));

    // Fricción
    this.velocidad.x *= 0.85;
    this.velocidad.y *= 0.85;

    this.mozoPos.x += this.velocidad.x;
    this.mozoPos.y += this.velocidad.y;

    // Colisión con bordes = PERDER
    const ancho = window.innerWidth;
    const alto = window.innerHeight;

    if (this.mozoPos.x < 0 || this.mozoPos.y < 0 || 
        this.mozoPos.x > ancho - this.mozoSize || 
        this.mozoPos.y > alto - this.mozoSize) {
        this.perder('¡Te caíste del mapa!');
        return;
    }

    this.chequearColisiones();
  }

  chequearColisiones() {
    // Obstáculos
    for (const obs of this.obstaculos) {
      if (this.detectarColision(this.mozoPos, this.mozoSize, obs, this.obstaculoSize)) {
        this.perder('¡Chocaste!');
        return;
      }
    }
    // Mesa
    if (this.detectarColision(this.mozoPos, this.mozoSize, this.mesaPos, this.mesaSize)) {
      this.ganar();
    }
  }

  detectarColision(pos1: any, size1: number, pos2: any, size2: number): boolean {
    const margen = size1 * 0.25; // Margen de perdón
    return (
      pos1.x + size1 - margen > pos2.x + margen &&
      pos1.x + margen < pos2.x + size2 - margen &&
      pos1.y + size1 - margen > pos2.y + margen &&
      pos1.y + margen < pos2.y + size2 - margen
    );
  }

  async perder(mensaje: string) {
    this.juegoActivo = false;
    this.mensajeFin = mensaje;
    
    // Vibración y Sonido
    try {
      await Haptics.vibrate({ duration: 500 });
    } catch(e) {}
    this.audioError.play().catch(()=>{});

    setTimeout(() => this.finalizarJuego(false), 2000);
  }

  async ganar() {
    this.juegoActivo = false;
    this.mensajeFin = '¡Pedido Entregado! 🍽️';
    this.audioFin.play().catch(()=>{});

    setTimeout(() => this.finalizarJuego(true), 2000);
  }

  detenerJuego() {
    this.juegoActivo = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async finalizarJuego(gano: boolean) {
    const yaJugo = this.juegosService.isJuegoIntentado();

    if (gano) {
      if (!yaJugo) {
        // GANA DESCUENTO 20%
        await this.juegosService.cambiarEstadoDescuento(true, 0.80);
        this.showAlert('¡Ganaste!', 'Felicitaciones, ganaste un 20% de descuento en tu pedido.', true);
      } else {
        this.showAlert('¡Ganaste!', '¡Excelente equilibrio!', true);
      }
    } else {
      if (!yaJugo) {
        // PIERDE OPORTUNIDAD
        await this.juegosService.cambiarEstadoDescuento(true, 1);
        this.showAlert('Juego Terminado', 'No ganaste el descuento.', false);
      } else {
        this.showAlert('Juego Terminado', '¡Suerte la próxima!', false);
      }
    }
  }

  async showAlert(header: string, message: string, won: boolean)
  {
    await this.utils.mostrarAlert(header, message);
    ScreenOrientation.unlock();
    this.utils.redirigir('/juegos');
  }
  volver() {
    this.router.navigate(['/juegos']);
  }
}