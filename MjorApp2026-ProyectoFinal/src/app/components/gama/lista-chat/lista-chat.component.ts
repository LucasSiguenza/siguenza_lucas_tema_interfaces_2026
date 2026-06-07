import { Component, computed, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonAvatar, IonText, IonIcon, IonCardContent } from "@ionic/angular/standalone";
import { MesasSb } from 'src/app/services/mesas-sb';
import { Util } from 'src/app/services/util';
import { ChatService } from 'src/app/services/chat-service';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-lista-chat',
  templateUrl: './lista-chat.component.html',
  styleUrls: ['./lista-chat.component.scss'],
  imports: [ IonIcon, IonText, IonAvatar, IonLabel, IonItem, IonList, IonCardTitle, IonCardHeader, IonCard],
})
export class ListaChatComponent  implements OnInit, OnDestroy
{
  //services
  private utils = inject(Util);
  private chatService = inject(ChatService);
  protected mesasService = inject(MesasSb);
  protected pedidoService = inject(PedidoSb);
  
  @Input() esDelivery = false

  protected lista = computed(()=>
   this.pedidoService.listaPedidos().filter(pdd => pdd.es_delivery && pdd.estado !== 'pagado')
  )
  protected mesasOrdenadas = computed(() =>
    [...this.mesasService.listaMesas()]
      .sort((a, b) => +a.numero - +b.numero)
  );  

  constructor(){
    addIcons({checkmarkOutline})
  }

  async ngOnInit()
  {
    await this.mesasService.iniciarTRMesas();
    if(this.esDelivery) this.pedidoService.iniciarCanalPedidos()
  }

  async ngOnDestroy()
  {
    this.mesasService.destruirCanalMesas();
  }

  protected async abrirSalaDeChat(idSala: string)
  {
    this.chatService.chatID.set(idSala);
    await this.utils.redirigir('chat')
  }

  protected test(test:string)
  {
    console.log(test);
  }
}
