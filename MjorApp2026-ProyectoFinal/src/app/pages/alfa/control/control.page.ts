import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSegment, IonSegmentButton, IonSegmentView, IonSegmentContent,
} from '@ionic/angular/standalone';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { PanelUsuariosComponent } from "src/app/components/alfa/panel-usuarios/panel-usuarios.component";
import { AltaProductoComponent } from "src/app/components/gama/alta-producto/alta-producto.component";
import { PanelMesasComponent } from "src/app/components/alfa/panel-mesas/panel-mesas.component";
import { ListaEsperaComponent } from "src/app/components/alfa/lista-espera/lista-espera.component";
import { ListaChatComponent } from "src/app/components/gama/lista-chat/lista-chat.component";
import { PanelPedidosAprobacionComponent } from "src/app/components/alfa/panel-pedidos-aprobacion/panel-pedidos-aprobacion.component";
import { PanelPedidosPreparacionComponent } from "src/app/components/alfa/panel-pedidos-preparacion/panel-pedidos-preparacion.component";
import { ListaReservasPendientesComponent } from "src/app/components/gama/lista-reservas-pendientes/lista-reservas-pendientes.component";

@Component({
  selector: 'app-control',
  templateUrl: './control.page.html',
  styleUrls: ['./control.page.scss'],
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonContent,
    CommonModule, FormsModule, IonSegmentView, IonSegmentContent, HeaderComponent, PanelUsuariosComponent, AltaProductoComponent, PanelMesasComponent, ListaEsperaComponent, ListaChatComponent, PanelPedidosAprobacionComponent, PanelPedidosPreparacionComponent, ListaReservasPendientesComponent]
})
export class ControlPage implements OnInit {

  protected userSvc = inject(UsuarioSb);
  private utilSvc = inject(Util);

  async ngOnInit() {
    const carga = await this.utilSvc.loading();

    await carga.present()
    await this.userSvc.recuperarSesion();
    await carga.dismiss();
  }

}
