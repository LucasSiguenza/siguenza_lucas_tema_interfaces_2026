import { Component, inject, OnInit } from '@angular/core';
import { IonFab, IonFabButton, IonIcon, IonFabList, IonLabel } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { atCircleOutline, balloonOutline, briefcaseOutline, colorPaletteOutline, flagOutline, moonOutline, settingsOutline, sunnyOutline } from 'ionicons/icons';
import { Util } from 'src/app/services/util';
import { ConfiguracionModalComponent } from '../configuracion-modal/configuracion-modal.component';
import { TemaService } from 'src/app/services/tema-service';

@Component({
  selector: 'app-fab-temas',
  templateUrl: './fab-temas.component.html',
  styleUrls: ['./fab-temas.component.scss'],
  imports: [IonLabel, IonFabList, IonIcon, IonFabButton, IonFab],
})
export class FabTemasComponent  implements OnInit {

  private utilSvc = inject(Util)
  private temaSvc = inject(TemaService);

  constructor() { 
    addIcons({colorPaletteOutline, briefcaseOutline,flagOutline,
      balloonOutline, settingsOutline, sunnyOutline, moonOutline,
      atCircleOutline
    })
  }

  ngOnInit() {}

  protected seleccionarTema(tema: string): void {

    switch (tema) {

      case 'inter': {
        this.temaSvc.sonidoTemaActual.set('inter');
        this.temaSvc.nombreTemaActual.set('inter');
        this.temaSvc.aplicarTema({
            principal: '#7A0F0F',
            secundario: '#D4A32F',
            fondo: '#7A0F0F',
            fondo_secundario: '#D4A32F',
            texto: '#F7E7B6'
        }, 'inter');
        break;
      }

      case 'profesional':
        this.temaSvc.sonidoTemaActual.set('profesional');
        this.temaSvc.nombreTemaActual.set('profesional');
        this.temaSvc.aplicarTema({
          principal: '#1F4D3A',
          secundario: '#78a692',
          fondo: '#f5f6f4',
          fondo_secundario: '#e9ede8',
          texto: '#014401',
          fuente: 'Roboto',
          font_size: 16
        }, 'profesional');

        break;

      case 'argentina':
        this.temaSvc.sonidoTemaActual.set('argentina');
        this.temaSvc.nombreTemaActual.set('argentina');
        this.temaSvc.aplicarTema({
          principal: '#005A9C',
          secundario: '#ffb700',
          fondo: '#fffef8',
          fondo_secundario: '#f4fbff',
          texto: '#052c64',
          fuente: 'Montserrat',
          font_size: 16
        }, 'argentina');

        break;

      case 'naif':
        this.temaSvc.sonidoTemaActual.set('naif');
        this.temaSvc.nombreTemaActual.set('naif');
        this.temaSvc.aplicarTema({
          principal: '#B8325A',
          secundario: '#3B82C4',
          fondo: '#fff8e7',
          fondo_secundario: '#fff0f4',
          texto: '#4a4a4a',
          fuente: 'Poppins',
          font_size: 16
        }, 'naif');

        break;

      case 'oscuro':
        this.temaSvc.sonidoTemaActual.set('oscuro');
        this.temaSvc.nombreTemaActual.set('oscuro');
        this.temaSvc.aplicarTema({
          principal: '#D4A32F',
          secundario: '#F0B429',
          fondo: '#0f172a6e',
          fondo_secundario: '#1e293b',
          texto: '#ffffc8',
          fuente: 'JetBrains Mono',
          font_size: 16
        }, 'oscuro');

        break;

      case 'claro':
        this.temaSvc.sonidoTemaActual.set('claro');
        this.temaSvc.nombreTemaActual.set('claro');
        this.temaSvc.aplicarTema({
          principal: '#7A0F0F',
          secundario: '#9D1C3F',
          fondo: '#ffffff',
          fondo_secundario: '#faf1f4',
          texto: '#3b1414',
          fuente: 'Nunito',
          font_size: 16
        }, 'claro');

        break;
    }
  }

  protected async abrirCustom() {
    await this.utilSvc.crearModal(ConfiguracionModalComponent, 'full', {},true);
    console.log('Abrir modal custom');
  }

} 
