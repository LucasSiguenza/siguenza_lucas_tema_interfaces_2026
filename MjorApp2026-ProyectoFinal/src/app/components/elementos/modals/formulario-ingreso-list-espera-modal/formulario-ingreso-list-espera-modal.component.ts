import { Component, EventEmitter, inject, Output } from '@angular/core';
import {  ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonList, IonContent, IonItem, IonLabel, IonInput, IonRadioGroup, IonRadio, IonCard, IonCardContent, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputMjorComponent } from "../../input-mjor/input-mjor.component";

@Component({
  selector: 'app-formulario-ingreso-list-espera-modal',
  templateUrl: './formulario-ingreso-list-espera-modal.component.html',
  styleUrls: ['./formulario-ingreso-list-espera-modal.component.scss'],
   imports: [IonCardContent, IonCard, IonRadio, IonRadioGroup, IonLabel, IonItem, IonContent,
    IonList, IonButton, IonButtons, IonTitle, IonToolbar, IonHeader, ReactiveFormsModule, InputMjorComponent],
})
export class FormularioIngresoListEsperaModalComponent  {

  private modalCtrl =  inject(ModalController);

  protected form = new FormGroup({
    cantidad: new FormControl('', [Validators.required, Validators.min(1), Validators.max(20)]),
    tipo: new FormControl('standar',  Validators.required),
  })

  async cancel(): Promise<void> {
    await this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirm(): Promise<void> {
    if (this.form.invalid) return;
    const { cantidad, tipo } = this.form.value;
    await this.modalCtrl.dismiss({ cantidad: Number(cantidad), tipo }, 'confirm');
  }

}
