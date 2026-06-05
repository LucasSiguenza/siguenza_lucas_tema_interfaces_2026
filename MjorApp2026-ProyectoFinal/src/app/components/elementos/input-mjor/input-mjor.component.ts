import { Component, Input } from '@angular/core';
import { IonInput, IonLabel, IonIcon, IonInputPasswordToggle } from '@ionic/angular/standalone';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';


@Component({
  selector: 'app-input-mjor',
  templateUrl: './input-mjor.component.html',
  styleUrls: ['./input-mjor.component.scss'],
  imports: [
  IonInput,
  IonLabel,
  ReactiveFormsModule,
],
})
export class InputMjorComponent {

 protected verPassword = false;

  @Input({ required: true }) placeholder!: string;
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) control!: string | null;
  @Input() tipo: 'text' | 'number' | 'email' | 'password' = 'text';
  @Input() mensajeValidacion: string = '';
  @Input() nombreControl:string = '';

  // límites de caracteres (opcionales)
  @Input() minLength?: number;
  @Input() maxLength?: number;


  get formControl(): FormControl {
    return this.form.get(this.control!) as FormControl;
  }

  get contador(): string {
    if (this.tipo !== 'number' || this.maxLength == null) return '';

    const length = this.formControl?.value?.toString().length ?? 0;

    return `${length} / ${this.maxLength}`;
  }

 limitarLongitud(ev: any) {
    if (this.tipo !== 'number' || this.maxLength == null) return;

    const valor: string = ev.detail.value ?? '';

    if (valor.length > this.maxLength) {
      const recortado = valor.slice(0, this.maxLength);
      this.formControl.setValue(recortado);
    }
  }
}
