import { inject, Injectable, signal } from '@angular/core';
import { Tema } from '../models/tema';
import { ArchivoService } from './archivo-service';

@Injectable({
  providedIn: 'root'
})
export class TemaService {

  private archivoSvc = inject(ArchivoService);

  public temaActual = signal<Tema>({
    principal: '#3880ff',
    secundario: '#5260ff',
    fondo: '#ffffff',
    fondo_secundario: '#7880ff',
    texto: '#000000'
  });

  public nombreTemaActual = signal< 'profesional' | 'claro' | 'inter' |
   'naif' | 'oscuro' | 'argentina' | 'custom'>('inter');

  public sonidoTemaActual = signal<'profesional' | 'claro' | 'inter' |
   'naif' | 'oscuro' | 'argentina'>('inter')

  constructor() {
    this.cargarTema();
  }

   private async cargarTema(): Promise<void> {

    const temaObj : {tema: Tema,nombre: string, sonido: string} | null = await this.archivoSvc.recuperarArchivoGuardado('tema.usuario') ;
    console.log(JSON.stringify(temaObj));

    const tema = temaObj ? temaObj.tema : null
    const nombre = temaObj ? temaObj.nombre : null
    const sonido = temaObj?.sonido
    if (tema) {
      this.nombreTemaActual.set(nombre as 'profesional' | 'claro' | 'inter' |
        'naif' | 'oscuro' | 'argentina' | 'custom');
        this.sonidoTemaActual.set(sonido as 'profesional' | 'claro' | 'inter' |
          'naif' | 'oscuro' | 'argentina');
      console.log(JSON.stringify(this.nombreTemaActual()));
      console.log(JSON.stringify(this.sonidoTemaActual()));
      this.aplicarTema(tema as Tema);
    } else {
      this.aplicarTema(this.temaActual());
    }

  }


  public aplicarTema(tema: Tema, nombreTema?: 'profesional' | 'claro' | 'inter' |
        'naif' | 'oscuro' | 'argentina' | 'custom'): void {

    this.temaActual.set(tema);
    const temaObj = {tema: tema, nombre: this.nombreTemaActual(), 
      sonido: this.sonidoTemaActual()}
     this.archivoSvc.guardarArchivoLocal('tema.usuario',temaObj);
    const root = document.documentElement;

    const textoContraste =
      this.generarTextoContraste(
        tema.texto
      );
    /* ------------------------------------------------ */
    /* VARIABLES PROPIAS                                */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--app-principal',
      tema.principal
    );

    root.style.setProperty(
      '--app-secundario',
      tema.secundario
    );

    root.style.setProperty(
      '--app-fondo',
      tema.fondo
    );

    root.style.setProperty(
      '--app-texto',
      tema.texto
    );

    root.style.setProperty(
      '--app-texto-contraste',
      textoContraste
    );

    root.style.setProperty(
      '--app-font-family',
      tema.fuente ?? 'Arial'
    );

    root.style.setProperty(
      '--app-font-size',
      `${tema.font_size ?? 16}px`
    );

    /* ------------------------------------------------ */
    /* PALETA IONIC                                     */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-color-primary',
      tema.principal
    );

    root.style.setProperty(
      '--ion-color-primary-rgb',
      this.hexToRgb(
        tema.principal
      )
    );

    root.style.setProperty(
      '--ion-color-primary-contrast',
      textoContraste
    );

    root.style.setProperty(
      '--ion-color-primary-contrast-rgb',
      this.hexToRgb(
        textoContraste
      )
    );

    root.style.setProperty(
      '--ion-color-secondary',
      tema.secundario
    );

    root.style.setProperty(
      '--ion-color-secondary-rgb',
      this.hexToRgb(
        tema.secundario
      )
    );

    root.style.setProperty(
      '--ion-color-secondary-contrast',
      textoContraste
    );

    root.style.setProperty(
      '--ion-color-secondary-contrast-rgb',
      this.hexToRgb(
        textoContraste
      )
    );

    /* ------------------------------------------------ */
    /* APP GLOBAL                                       */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-background-color',
      tema.fondo
    );

    root.style.setProperty(
      '--ion-text-color',
      tema.texto
    );

    root.style.setProperty(
      '--ion-text-color-rgb',
      this.hexToRgb(
        tema.texto
      )
    );

    root.style.setProperty(
      '--ion-border-color',
      tema.fondo_secundario
    );

    /* ------------------------------------------------ */
    /* CARDS                                            */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-card-background',
      tema.fondo_secundario
    );

    root.style.setProperty(
      '--ion-card-color',
      tema.texto
    );

    /* ------------------------------------------------ */
    /* ITEMS                                            */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-item-background',
      tema.fondo_secundario
    );

    root.style.setProperty(
      '--ion-item-color',
      tema.texto
    );

    /* ------------------------------------------------ */
    /* TOOLBAR                                          */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-toolbar-background',
      tema.fondo
    );

    root.style.setProperty(
      '--ion-toolbar-color',
      textoContraste
    );

    /* ------------------------------------------------ */
    /* INPUTS                                           */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-color-step-50',
      tema.fondo_secundario
    );

    root.style.setProperty(
      '--ion-color-step-100',
      tema.fondo_secundario
    );

    root.style.setProperty(
      '--ion-placeholder-color',
      tema.texto
    );

    /* ------------------------------------------------ */
    /* FAB / ICONOS / CONTRASTE GLOBAL                  */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--app-texto-contraste',
      textoContraste
    );

    /* ------------------------------------------------ */
    /* OVERLAYS                                         */
    /* ------------------------------------------------ */

    root.style.setProperty(
      '--ion-overlay-background-color',
      tema.fondo
    );
  }

  private generarTextoContraste(hex: string): string {

  const valor = hex.replace('#', '');

  const r = parseInt(
    valor.substring(0, 2),
    16
  );

  const g = parseInt(
    valor.substring(2, 4),
    16
  );

  const b = parseInt(
    valor.substring(4, 6),
    16
  );

  const luminosidad =
    (r * 299 + g * 587 + b * 114) / 1000;

  return luminosidad > 128
    ? '#000000'
    : '#ffffff';
}

  private hexToRgb(hex: string): string {

    const valor = hex.replace('#', '');

    const r = parseInt(
      valor.substring(0, 2),
      16
    );

    const g = parseInt(
      valor.substring(2, 4),
      16
    );

    const b = parseInt(
      valor.substring(4, 6),
      16
    );

    return `${r}, ${g}, ${b}`;
  }
}