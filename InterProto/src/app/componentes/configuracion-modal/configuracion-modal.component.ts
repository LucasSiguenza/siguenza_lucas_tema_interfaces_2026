import { Component, inject, OnInit, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
  IonListHeader, IonLabel, IonRadioGroup, IonItem, IonRadio, IonSelect, 
  IonSelectOption, IonRange, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonInput, IonButton, ModalController, IonIcon, IonFabButton, IonFab, IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { Tema } from 'src/app/models/tema';
import { TemaService } from 'src/app/servicios/tema-service';
import { Util } from 'src/app/servicios/util';


@Component({
  selector: 'app-configuracion-modal',
  templateUrl: './configuracion-modal.component.html',
  styleUrls: ['./configuracion-modal.component.scss'],
  imports: [IonRow, IonGrid, IonCol, IonFab, IonFabButton, IonIcon, IonButton, IonInput, IonCardContent, IonCardTitle, IonCardHeader,
     IonCard, IonRange, IonItem, IonLabel, IonListHeader, 
     IonList, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption],

})
export class ConfiguracionModalComponent implements OnInit {

  // ------------------------------------------------
  // INYECCIONES
  // ------------------------------------------------

  private modalCtrl = inject(ModalController);
  private utilSvc = inject(Util);
  private temaSvc = inject(TemaService);

  // ------------------------------------------------
  // ESTADO
  // ------------------------------------------------

  protected readonly colorPrimario = signal('#3880ff');
  protected readonly colorSecundario = signal('#5260ff');

  protected readonly fuente = signal('Arial');
  protected readonly fontSize = signal(16);

  private temaEntrada!: Tema;

  // ------------------------------------------------
  // CICLO DE VIDA
  // ------------------------------------------------

  constructor(){
    addIcons({
      closeOutline, checkmarkOutline
    })
  }

  ngOnInit(): void {

    this.temaEntrada = structuredClone(
      this.temaSvc.temaActual()
    );

    this.colorPrimario.set(
      this.temaEntrada.principal
    );

    this.colorSecundario.set(
      this.temaEntrada.secundario
    );

    this.fuente.set(
      this.temaEntrada.fuente ?? 'Arial'
    );

    this.fontSize.set(
      this.temaEntrada.font_size ?? 16
    );
  }

  // ------------------------------------------------
  // MODAL y sonidos
  // ------------------------------------------------

  async cerrarModal(): Promise<void> {

    this.restaurarConfiguracion();

    await this.modalCtrl.dismiss(null);
  }

  async confirmarCambios(): Promise<void> {

    const tema = this.generarTema();
    this.temaSvc.nombreTemaActual.set('custom')
    this.temaSvc.aplicarTema(tema, 'custom');

    await this.modalCtrl.dismiss(null);
  }

  elegirSonido(sonido: 'profesional' | 'claro' | 'inter' | 'naif' | 'oscuro' | 'argentina'){
    this.temaSvc.sonidoTemaActual.set(sonido);
    this.utilSvc.reproducirSonidoPorDuracion(`assets/sonidos/${sonido}-click.m4a`,1000)
  }

  // ------------------------------------------------
  // EVENTOS
  // ------------------------------------------------

  protected actualizarColorPrimario(event: Event): void {

    const value = (event.target as HTMLInputElement).value;

    this.colorPrimario.set(value);

    this.aplicarPreview();
  }

  protected actualizarColorSecundario(event: Event): void {

    const value = (event.target as HTMLInputElement).value;

    this.colorSecundario.set(value);

    this.aplicarPreview();
  }

  protected actualizarFuente(event: CustomEvent): void {
    if(event.detail.value === 'inter') this.fuente.set('Arial') 
    else this.fuente.set(event.detail.value);

    this.aplicarPreview();
  }

  protected actualizarTamanio(event: CustomEvent): void {

    this.fontSize.set(event.detail.value);

    this.aplicarPreview();
  }

  // ------------------------------------------------
  // RESTAURAR
  // ------------------------------------------------

  protected restaurarConfiguracion(): void {

    this.temaSvc.aplicarTema(
      this.temaEntrada, 
    );
  }

  // ------------------------------------------------
  // GENERACIÓN DE TEMA
  // ------------------------------------------------

  private generarTema(): Tema {

    const fondo = this.generarFondo();

    const fondoSecundario = this.generarFondoSecundario();

    return {
      principal: this.colorPrimario(),
      secundario: this.colorSecundario(),

      fondo,
      fondo_secundario: fondoSecundario,

      texto: this.generarColorTexto(
        fondo
      ),

      fuente: this.fuente(),
      font_size: this.fontSize()
    };
  }

  // ------------------------------------------------
  // PREVIEW
  // ------------------------------------------------

  private aplicarPreview(): void {

    const tema = this.generarTema();

    this.temaSvc.aplicarTema(
      tema
    );
  }

  // ------------------------------------------------
  // COLORES DERIVADOS
  // ------------------------------------------------

  private generarFondo(): string {

    const hex = this.colorPrimario().replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminosidad =
      (r * 299 + g * 587 + b * 114) / 1000;

    const porcentajeBlanco =
      luminosidad < 80
        ? 0.25
        : 0.75;

    const nuevoR = Math.round(
      r + (255 - r) * porcentajeBlanco
    );

    const nuevoG = Math.round(
      g + (255 - g) * porcentajeBlanco
    );

    const nuevoB = Math.round(
      b + (255 - b) * porcentajeBlanco
    );

    return `#${nuevoR.toString(16).padStart(2, '0')}${nuevoG.toString(16).padStart(2, '0')}${nuevoB.toString(16).padStart(2, '0')}`;
  }

  private generarColorTexto(fondo: string): string {

    const valor = fondo.replace('#', '');

    const r = parseInt(valor.substring(0, 2), 16);
    const g = parseInt(valor.substring(2, 4), 16);
    const b = parseInt(valor.substring(4, 6), 16);

    const luminosidad =
      (r * 299 + g * 587 + b * 114) / 1000;

    return luminosidad > 128
      ? '#000000'
      : '#ffffff';
  }

  private generarFondoSecundario(): string {

    const hex = this.colorSecundario().replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const porcentajeBlanco = 0.35;

    const nuevoR = Math.round(
      r + (255 - r) * porcentajeBlanco
    );

    const nuevoG = Math.round(
      g + (255 - g) * porcentajeBlanco
    );

    const nuevoB = Math.round(
      b + (255 - b) * porcentajeBlanco
    );

    return `#${nuevoR.toString(16).padStart(2, '0')}${nuevoG.toString(16).padStart(2, '0')}${nuevoB.toString(16).padStart(2, '0')}`;
  }

}