import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { MapaComponent } from "src/app/components/gama/mapa/mapa.component";
import { GeocodeService } from 'src/app/services/geocode-service';

@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, CommonModule, FormsModule,  MapaComponent]
})
export class TestsPage implements OnInit {
  protected pedidoSvc = inject(PedidoSb);
  protected geocode = inject(GeocodeService);

  protected pedido1 = this.pedidoSvc.listaPedidos()[0]

  async ngOnInit() {
    await this.pedidoSvc.iniciarCanalPedidos()
  }

  async ngOnDestroy() {
    this.pedidoSvc.destruirCanalPedidos();
  }

  protected async testCoordAdir()
  {
    let direcciones = await this.geocode.convertirCoordenadasADireccion(-34.66225499015634, -58.36449533700943);
    console.log(JSON.stringify(direcciones));
    alert(JSON.stringify(direcciones));
  }

  protected async testDirACoord()
  {
    let direcciones = await this.geocode.convertirDireccionACoordenadas("Juan Facundo Quiroga 440")
    console.log(JSON.stringify(direcciones));
    alert(JSON.stringify(direcciones));
  }

}
