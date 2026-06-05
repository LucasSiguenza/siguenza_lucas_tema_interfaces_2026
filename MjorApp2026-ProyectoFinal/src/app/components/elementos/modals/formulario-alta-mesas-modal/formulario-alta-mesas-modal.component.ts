import { QRCodeComponent } from 'angularx-qrcode';
import domToImage from 'dom-to-image';
import { Component, ElementRef, inject, OnInit, signal, ViewChild,} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule,Validators, } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ModalController, IonAccordionGroup, IonButton, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonAccordion,IonItem,
  IonLabel,} from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';
import { Util } from 'src/app/services/util';
import { MesasSb } from 'src/app/services/mesas-sb';
import { CamaraService } from 'src/app/services/camara-service';
import { Photo } from '@capacitor/camera';
import { Mesa } from 'src/app/models/Mesa';
import { CommonModule } from '@angular/common';
import { InputMjorComponent } from "../../input-mjor/input-mjor.component";


@Component({
  selector: 'app-formulario-alta-mesas-modal',
  templateUrl: './formulario-alta-mesas-modal.component.html',
  styleUrls: ['./formulario-alta-mesas-modal.component.scss'],
  imports: [
    QRCodeComponent, IonLabel, IonItem, IonAccordionGroup, IonAccordion, IonCardTitle,
    FormsModule, ReactiveFormsModule, MatCardModule, MatInputModule, IonCard, IonCardHeader,
    FormsModule, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    MatProgressSpinnerModule, MatMenuModule, CommonModule,
    InputMjorComponent
],
})
export class FormularioAltaMesasModalComponent  implements OnInit {


  //! ===================== Variables y servicios =====================
  protected modalCtrl = inject(ModalController);
  protected photo: string | undefined | null = 
    `${environment.supabaseStorageUrl}mesas/camara.png`;
    protected utilSvc = inject(Util);

  @ViewChild('dataToExport', { static: false })
  public dataToExport!: ElementRef;
  @ViewChild('accordion2') accordionCtrl!: IonAccordionGroup;
  
  protected tipoSelect = signal<string>('Estándar');
  
  protected showQR: boolean = false;
  protected mesaSvc = inject(MesasSb);
  private camaraSvc = inject(CamaraService);
  protected qrData: string = '';
  protected loading: boolean = false;
  protected flagExito: boolean = false;
  protected numerosMesaExistentes?: string[];
  protected mesaEditada = this.mesaSvc.mesaSeleccionada();

  private isNuevo = this.mesaEditada == null;
  
  protected altaForm = new FormGroup({
    numero: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(1),
      Validators.max(50),
    ]),
    cantidadComensales: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(1),
      Validators.max(20),
    ]),
    tipo: new FormControl('standar', [Validators.required]),
    foto: new FormControl('', Validators.required),
  });
  
  
  

  async ngOnInit() {
    this.numerosMesaExistentes = this.mesaSvc.listaMesas().map((m) => (m.numero));

    if(!this.isNuevo){
      this.altaForm.patchValue({
        cantidadComensales: String(this.mesaEditada?.cantidad_comensales),
        numero: String(this.mesaEditada?.numero),
        tipo: String(this.mesaEditada?.tipo),
        foto: String(this.mesaEditada?.foto),
      });

      this.photo = this.mesaEditada?.foto;
      
      switch (this.mesaEditada?.tipo){
        case 'vip':
          this.tipoSelect.set("VIP");
          break;
          case 'standar':
          this.tipoSelect.set('Estándar');
          break;
          case 'handicap':
            this.tipoSelect.set('Movilidad Reducida');
          break;
        }
    }
  }

  //! ===================== Métodos de elementos =====================
    /**
   * Abre la cámara y luego guarda los datos de esa foto en la matriz 'fotos' del servicio.
   * @param posicion Selecciona la posición en la matriz donde guardar los datos.
   */
  protected async sacarFoto() {
    if(this.utilSvc.isWeb()){
       this.photo =
        `${environment.supabaseStorageUrl}foto-usuario/user-placeholder.png`;
      this.altaForm.patchValue({
        foto: this.photo,
      });
      return
    }

    let fotoNueva!: string | null | Photo;
    fotoNueva = await this.camaraSvc.tomarFotoCelular();
    if (fotoNueva) {
      this.photo = fotoNueva.webPath;
      this.altaForm.patchValue({
        foto: fotoNueva.path,
      });
    }
  }

  /**
   * Sube un PNG del código QR generado al bucket 'qrmesas' de Supabase.
   * @param titulo Nombre del archivo a subir.
   */
  async subirQR(titulo: string): Promise<void>
  {
    const blob  = await domToImage.toBlob(this.dataToExport.nativeElement)
    await this.mesaSvc.subirQr(titulo,blob);
  }

  protected goBack() {
    this.mesaSvc.mesaSeleccionada.set(null);
    return this.modalCtrl.dismiss(null, 'cancel');
  }

   seleccionarTipo(valor: string) {

    this.altaForm.controls.tipo.setValue(valor);
    switch (this.altaForm.controls.tipo.value) {
      case 'vip':
        this.tipoSelect.set("VIP");
        break;
      case 'standar':
        this.tipoSelect.set('Estándar');
        break;
      case 'handicap':
        this.tipoSelect.set('Movilidad Reducida');
        break;
    }
    this.accordionCtrl.value = null;
  }
  //! ===================== Método de alta y edición =====================
  
  protected async submit() {
    const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    if (this.altaForm.invalid) {
      this.utilSvc.mostrarToast("¡Debe completar todos los campos para registrar!", 'warning', 'middle', 500);
      return;
    }

    const numero = this.altaForm.controls.numero.value!;
    const cantidadComensales = this.altaForm.controls.cantidadComensales.value!;
    const tipo = this.altaForm.controls.tipo.value!;
    const foto = this.altaForm.controls.foto.value!;

    if (this.isNuevo && this.numerosMesaExistentes?.includes(numero)) {
      this.utilSvc.mostrarToast("¡Elija otro número para la mesa, esa ya existe!", 'warning', 'middle', 500);
      return;
    }

    const mesaBase = this.mesaSvc.mesaSeleccionada();

    const mesaEditada: Mesa = {
      id: Number(mesaBase?.id),
      created_at: String(mesaBase?.created_at),
      numero: String(numero),
      cantidad_comensales: Number(cantidadComensales),
      tipo: String(tipo),
      usuario_asignado: String(mesaBase?.usuario_asignado),
      foto: String(foto)
    };

    try {

      this.loading = true;

      if (this.isNuevo) {
        const mesa = await this.mesaSvc.agregarMesa(mesaEditada);

        const mesaId = mesa.id;
        this.qrData = `/cliente/mesa/${mesa.id}`;
        
        await pause(1000);

        await this.subirQR(`mesa-${mesaId}`);
      
        await this.modalCtrl.dismiss(null, 'confirm');
      
      } else {

        await this.mesaSvc.editarMesa(mesaEditada);

        await pause(1000);
        this.mesaSvc.mesaSeleccionada.set(null);
        await this.modalCtrl.dismiss(null, 'confirm');

      }

    } catch (error: any) {
      console.log(error);
      await this.utilSvc.mostrarToast("Hubo un error", "warning", "middle", 700);

    } finally {

      this.loading = false;

    }
  }
  

}
