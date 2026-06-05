import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonListHeader, IonLabel, IonRadioGroup, IonItem, IonRadio, IonSelect,
  IonSelectOption, IonRange, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonInput, IonButton, IonImg, IonCheckbox, IonToggle, IonIcon, IonCardSubtitle, IonTextarea,
  IonText, IonButtons, IonFab, IonFabButton, IonChip, IonBadge, IonSearchbar, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, chevronDownOutline, chevronUpOutline, heartOutline, homeOutline, menuOutline, notificationsOutline, personOutline, restaurantOutline, saveOutline, settingsOutline, starOutline, timeOutline } from 'ionicons/icons';
import { Util } from '../servicios/util';
import { TemaService } from '../servicios/tema-service';
import { ArchivoService } from '../servicios/archivo-service';
import { Tema } from '../models/tema';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonSegmentButton, IonSegment, IonSearchbar, IonBadge, IonChip, IonFabButton, IonFab, IonButtons, IonText, IonTextarea, IonCardSubtitle, IonIcon, IonToggle, IonCheckbox, IonImg, IonButton, 
    IonInput, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonItem, IonLabel,
    IonList, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption],
})
export class HomePage {
  private utilSvc = inject(Util)
  private archivoSvc = inject(ArchivoService);
  private temaSvc = inject(TemaService);
  temaActual = computed(()=>{
    return this.temaSvc.nombreTemaActual() as string;
  })
  sonidoActual = computed(()=>{
    return this.temaSvc.sonidoTemaActual() as string;
  })

  protected readonly scroll = viewChild.required(IonContent);
  private readonly secciones = [
    'tipografia',
    'botones',
    'inputs',
    'iconografia',
  ];
  protected readonly indiceActual = signal(-1);

  protected pathImagen = computed(() => {
    return `assets/img-cabeceras/${this.temaActual()}.png`;
  });

  constructor() {
    addIcons({restaurantOutline, homeOutline, heartOutline, starOutline, menuOutline, 
      notificationsOutline, settingsOutline, saveOutline, personOutline, chevronUpOutline,
      chevronDownOutline, checkmarkCircleOutline, timeOutline
     })
  }


  async reproducirSonido(){
   this.utilSvc.reproducirSonidoPorDuracion(`assets/sonidos/${this.sonidoActual()}-click.m4a`,1000)
  }

  protected async irSeccionSiguiente(): Promise<void> {
    if (this.indiceActual() >= this.secciones.length - 1) {
      await this.scroll().scrollToBottom(400);
      return;
    }

    this.indiceActual.update(v => v + 1);
    await this.scrollASeccionActual();
  }

  protected async irSeccionAnterior(): Promise<void> {

    if (this.indiceActual() <= 0) {

      this.indiceActual.set(-1);

      await this.scroll().scrollToTop(400);

      return;
    }

    this.indiceActual.update(v => v - 1);

    await this.scrollASeccionActual();
  }

  private async scrollASeccionActual(): Promise<void> {

    const id = this.secciones[this.indiceActual()];
    console.log(id);
    const elemento = document.getElementById(id);

    if (!elemento) return;
    elemento.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

}
