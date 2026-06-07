import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { Util } from 'src/app/services/util';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { TemaService } from 'src/app/services/tema-service';

@Component({
  selector: 'app-prelogin',
  templateUrl: './prelogin.page.html',
  styleUrls: ['./prelogin.page.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonContent, CommonModule, FormsModule]
})
export class PreloginPage implements OnInit {

  private noise: HTMLAudioElement | null = null;
  private utilSvc = inject(Util);
  private temaSvc = inject(TemaService);
  private usuarioSvc = inject(UsuarioSb);

    
   async ionViewWillEnter() {
    let sesion = null;
    await this.temaSvc.cargarTema();
    try {
      sesion = await this.usuarioSvc.recuperarSesion();
    } catch (e) {
      if((e as Error).message.includes(''))
      sesion = null;
    }

    setTimeout(() => {

      this.noise?.remove();

      if (!sesion) {
        this.utilSvc.redirigir('/inicio');
        return;
      }

      if (this.usuarioSvc.usrActual()?.perfil === 'cliente') {
        this.utilSvc.redirigir('/cliente');
      } else {
        this.utilSvc.redirigir('/control');
      }

    }, 3000);
  }

  async ngOnInit(): Promise<void>
  {
    this.utilSvc.reproducirSonidoPorDuracion('assets/sounds/drum.ogg',1000)
  }

  ngOnDestroy(): void {
    this.noise?.remove()
  }

}
