import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import {
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
} from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardTitle,
  IonItem,
  IonTextarea,
  IonButton,
  IonLabel,
  IonRange,
  IonToggle,
  IonRadioGroup,
  IonRadio,
  IonIcon,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Util } from 'src/app/services/util';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { EncuestaService } from 'src/app/services/encuesta.service';
import { HeaderComponent } from 'src/app/components/alfa/header/header.component';
import { EncuestaData } from 'src/app/models/encuesta-data';
import { PedidoSb } from 'src/app/services/pedido-sb';

register();
addIcons({ star, starOutline });

@Component({
  selector: 'app-encuesta-form',
  templateUrl: './encuesta-form.component.html',
  styleUrls: ['./encuesta-form.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonToggle,
    IonRange,
    IonLabel,
    CommonModule,
    IonButton,
    IonTextarea,
    IonItem,
    IonCardTitle,
    IonCard,
    IonContent,
    ReactiveFormsModule,
    IonRadioGroup,
    IonRadio,
    IonIcon,
    HeaderComponent
  ],
})
export class EncuestaFormComponent implements OnInit
{
  private encuestaService = inject(EncuestaService);
  private utilSvc = inject(Util);
  private pedido = inject(PedidoSb);

  encuestaForm = new FormGroup({
    comida: new FormControl(3, [Validators.required]),
    bebida: new FormControl(3, [Validators.required]),
    postre: new FormControl(false, [Validators.required]),
    precioCalidad: new FormControl(3, [Validators.required]),
    atencion: new FormControl(3, [Validators.required]),
    probabilidadRecomendar: new FormControl('tal_vez', [Validators.required]),
    comentario: new FormControl(''),
  });

  ngOnInit() {
    setTimeout(() => {
      this.encuestaForm.updateValueAndValidity();
    });
  }

  async enviarEncuesta() {
    if (this.encuestaForm.invalid) {
      await this.utilSvc.mostrarToast(
        'Completá todos los campos obligatorios',
        'error'
      );
      return;
    }
    const spinner = await this.utilSvc.loading();
    spinner.present();

    const datos = this.encuestaForm.value as EncuestaData;
    datos.pedido_uid = await this.pedido.setUIDPedido();

    await this.encuestaService.subirEncuesta(datos);
    await this.utilSvc.mostrarToast('¡Gracias por tu opinión!', 'success');
    this.encuestaForm.reset();
    this.utilSvc.redirigir('/cliente');
    spinner.dismiss();
  }

  cambiarValor() {
    this.encuestaForm.controls.postre.patchValue(
      !this.encuestaForm.controls.postre.value
    );
  }

  setRating(campo: 'comida' | 'precioCalidad', valor: number) {
    this.encuestaForm.get(campo)?.patchValue(valor);
  }

  getEstrellas(campo: 'comida' | 'precioCalidad'): number[] {
    return [1, 2, 3, 4, 5];
  }

  isEstrellaMarcada(campo: 'comida' | 'precioCalidad', valor: number): boolean {
    const valorActual = this.encuestaForm.get(campo)?.value || 0;
    return valor <= valorActual;
  }
}
