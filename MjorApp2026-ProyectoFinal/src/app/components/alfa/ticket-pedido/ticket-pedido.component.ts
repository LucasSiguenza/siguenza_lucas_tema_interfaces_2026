import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { AfterViewInit, ApplicationRef, Component, computed, inject, input, Input, OnInit, signal, Signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Pedido } from 'src/app/models/Pedido';
import html2pdf from 'html2pdf.js';
import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';
import { Util } from 'src/app/services/util';
import { ActivatedRoute } from '@angular/router';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { Directory } from '@capacitor/filesystem';
import { LectorArchivoService } from 'src/app/services/lector-archivo-service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-ticket-pedido',
  templateUrl: './ticket-pedido.component.html',
  styleUrls: ['./ticket-pedido.component.scss'],
  imports: [FormatoFechaPipe, CurrencyPipe, TitleCasePipe],
})
export class TicketPedidoComponent implements OnInit, AfterViewInit{

  private pedidoSvc = inject(PedidoSb);
  private modalCtrl = inject(ModalController);
  private utilSvc = inject(Util);
  private lectorArchivoSvc = inject(LectorArchivoService);
  private route = inject(ActivatedRoute)


  protected pedido = computed(()=>{
    if(this.pedidoRuta !== null) return this.pedidoRuta()
    else return this.pedidoModal()
  })
  
  pedidoModal = input.required<Pedido>()

  private pedidoRuta = signal<Pedido | null>(null)
  @Input() propina!: number;
  @Input() isNotificacion?: boolean = false

  totalBrutoValor = 0;
  propinaCalculada = 0;
  descuentoCalculado = 0;
  totalFinal = 0;

  protected fechaVto: string =
    new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString('es-AR');

  constructor(){}

  async ngOnInit(){
    await this.pedidoSvc.iniciarCanalPedidos();
    const propina = this.route.snapshot.paramMap.get('propina');
    const idPedido = this.route.snapshot.paramMap.get('idPedido');

    console.log(propina, ' ─ ', idPedido);

    if(propina && idPedido){
      this.propina = parseFloat(propina)
      this.pedidoRuta.set(this.pedidoSvc.listaPedidos().find((pedido) => pedido.id === parseInt(idPedido))!)
      this.isNotificacion = true;
    }

    this.calcularTotales();
  }

  async ngAfterViewInit(){

    const carga = await this.utilSvc.loading();
    await carga.present();


    try{

      await new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve())
      );
      if(this.isNotificacion){
        await this.descargarFactura();
      }
      await new Promise(resolve =>
        setTimeout(resolve, 1200)
      );

    } finally{
      if(!this.isNotificacion)await this.modalCtrl.dismiss(null, 'confirm')
      await carga.dismiss();
    }

  }

async descargarFactura(){

  const carga = await this.utilSvc.loading();
  await carga.present();

  const element =
    document.getElementById('facturaPdf');

  if(!element){

    console.error('NO EXISTE facturaPdf');
    await carga.dismiss();

    return;
  }

  try{

    const pdf = await html2pdf()
      .set({

        margin:10,

        filename:`factura-mjor-pedido-${this.pedido()!.id}.pdf`,

        image:{
          type:'jpeg',
          quality:1
        },

        html2canvas:{
          scale:3,
          useCORS:true,
          backgroundColor:'#ffffff'
        },

        jsPDF:{
          unit:'mm',
          format:'a4',
          orientation:'portrait'
        }

      })
      .from(element)
      .outputPdf('datauristring')
    const base64 = pdf.split(',')[1];
    const archivo = await this.utilSvc.guardarArchivoLocal(`factura-mjor-pedido-${this.pedido()!.id}.pdf`, base64, true)
    await this.utilSvc.mostrarAlert('¡Archivo descargado!', `Su factura se encuentra en la carpeta Documens de android.`)
  } catch(error){

    console.error(
      'ERROR GENERANDO PDF',
      error
    );

  } finally{
    await this.utilSvc.redirigir('/control');
    await carga.dismiss();
  }

}
  calcularTotales(){

    const pedido = this.pedido()!;

    this.totalBrutoValor =
      pedido.detalles?.reduce((acc, d) =>
        acc + (
          (d.precio ?? 0) * d.cantidad
        ), 0) ?? 0;

    console.log(this.totalBrutoValor)
      this.propinaCalculada =
        this.totalBrutoValor * this.propina;
        
    console.log(this.propinaCalculada)
    this.descuentoCalculado =
      this.totalBrutoValor *
      (1 - pedido.descuento);
    console.log(this.propinaCalculada)
    
    this.totalFinal =
      this.totalBrutoValor +
      this.propinaCalculada -
      this.descuentoCalculado;
    console.log(this.totalFinal)

  }

}