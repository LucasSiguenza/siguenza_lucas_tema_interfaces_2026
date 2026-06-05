import { Component, inject, OnInit } from '@angular/core';
import { ModalController ,IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from "@ionic/angular/standalone";
import { MapaComponent } from 'src/app/components/gama/mapa/mapa.component';
import { Pedido } from 'src/app/models/Pedido';
import { GeocodeService } from 'src/app/services/geocode-service';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UbicacionService } from 'src/app/services/ubicacion-service';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';

@Component({
  selector: 'app-formulario-delivery-modal',
  templateUrl: './formulario-delivery-modal.component.html',
  styleUrls: ['./formulario-delivery-modal.component.scss'],
  imports: [IonButton, IonCardContent, IonCardTitle, IonCardHeader, IonCard],
})
export class FormularioDeliveryModalComponent  implements OnInit {

  private utilSvc = inject(Util);
  private pedidoSvc = inject(PedidoSb)
  private usuarioSvc = inject(UsuarioSb);
  private ubicacionSvc = inject(UbicacionService);
  private geocodeSvc = inject(GeocodeService);
  private modalCtrl = inject(ModalController);

  constructor() { }

  ngOnInit() {}

  async elegirUbicacion(){
    const modal = await this.utilSvc.crearModal(MapaComponent, 'lg',{},true,'map-modal')
    const carga = await this.utilSvc.loading();
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
    const {data, role} = await modal.onDidDismiss();
    
    await carga.present();
    if(role !== 'confirm'){
      this.utilSvc.mostrarToast('Acción cancelada', 'error', 'middle', 200)
      await carga.dismiss();
      return;
    }
    else{
      const pd: Pedido = {
        direccion_cliente: data.direccion,
        es_delivery: true,
        descuento: 1,
        estado: 'espera de aprobación',
        estado_descuento: this.usuarioSvc.usrActual()?.is_anonimo === 'no',
        latitud:String(data.latitud),
        longitud: String(data.longitud),
        mesa_id: this.usuarioSvc.usrActual()?.uid!,
        uid_cliente: this.usuarioSvc.usrActual()?.uid!,
        numeroMesa: 'A domicilio'
      }

      this.pedidoSvc.pedidoDelivery.set(pd);
    
      this.pedidoSvc.esPedidoDelivery.set(true)
      
      await this.utilSvc.redirigir('carta')
      await this.modalCtrl.dismiss(null, 'confirm');
      await carga.dismiss();
    }

  }

  async usarUbicacionActual(){
    const carga = await this.utilSvc.loading();
    await carga.present();
    const coordenadas: {latitude: number, longitude: number } = await this.ubicacionSvc.obtenerUbicacionActual();
    const direccion = await this.geocodeSvc.convertirCoordenadasADireccion(coordenadas.latitude, coordenadas.longitude)
    const nombreCalle = `${direccion[0].thoroughfare} ${direccion[0].subThoroughfare}`.trim()


    const pd: Pedido = {
      direccion_cliente: nombreCalle,
      es_delivery: true,
      descuento: 1,
      estado: 'espera de aprobación',
      estado_descuento: this.usuarioSvc.usrActual()?.is_anonimo === 'no',
      latitud:String(coordenadas.latitude),
      longitud: String(coordenadas.longitude),
      mesa_id: this.usuarioSvc.usrActual()?.uid!,
      uid_cliente: this.usuarioSvc.usrActual()?.uid!,
      numeroMesa: 'A domicilio'
    }
    
    await carga.dismiss();
    const confirmacion = await this.utilSvc.mostrarConfirmAlert('Confirme ubicación.',
      `¿Es ${nombreCalle} la dirección exacta en la que desea su pedido?`
    )

    if(!confirmacion) {
      await this.elegirUbicacion();
      return;
    }
    
    this.pedidoSvc.pedidoDelivery.set(pd);
    
    this.pedidoSvc.esPedidoDelivery.set(true)
    
    await this.utilSvc.redirigir('carta')
    await this.modalCtrl.dismiss(null, 'confirm');
    await carga.dismiss();

  }

  cancelar(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

}
