import { inject, Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { environment } from 'src/environments/environment.prod';
import { Usuario } from '../models/usuario';
import { Util } from './util';
import { Pedido } from '../models/Pedido';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private servId = environment.EmailService;
  private servKey = environment.EmailPublicKey;
  private template = environment.EmailTemplate;
  private templateFactura = "template_o5rxz3d"


  enviarEmail(usr: Usuario| null, mensaje: string, encabezado: string){

    const templateParams = {
      encabezado: encabezado,
      nombre: usr?.nombre+" "+usr?.apellido,
      mensaje: mensaje,
      email: usr?.email ? `${usr.email}` : 'mjorteam@gmail.com',
    };

    emailjs.send(this.servId, this.template, templateParams, {
    publicKey: this.servKey,
    })
    .then((response: EmailJSResponseStatus) => {
      console.log('Correo enviado correctamente:', response.status, response.text);
    })
    .catch((error: EmailJSResponseStatus) => {
      console.error('Error al enviar el correo:', error.text);
    });

  }

  envClienteEnEspera(usr: Usuario){
    const nombre = usr.nombre+" "+usr.apellido;
    const encabezado = `¡${nombre} te has registrado exitosamente!`
    const mensaje=  
    `Hola, ${nombre}.
¡Su solicitud de registro ya se encuentra en espera de aprobación para nuestro supervisor!`

  this.enviarEmail(usr, mensaje, encabezado);
  setTimeout(()=>{
    const mensaje=`
    Estimado supervisor 
El usuario ${nombre} se ha registrado recientemente en la plataforma MjorApp y está a la espera de su aprobación para acceder.
Le agradecemos revisar y confirmar su solicitud en el panel de administración.
     `
    const encabezadoSup = `MjorApp - El usuario ${nombre} espera su aprobación.`
    this.enviarEmail(null, mensaje, encabezadoSup);
  }, 1000);
  }

  envClienteAprobado(usr: Usuario){
    const nombre = usr.nombre+" "+usr.apellido;
    const encabezado = `MjorApp - ¡Felicidades, ${nombre}! Ahora puedes ingresar a la app.`
    const mensaje= `¡Hola ${nombre}!
¡Su solicitud de registro ha sido aprobada por nuestro supervisor!`

  this.enviarEmail(usr, mensaje, encabezado);
  }

    envClienteRechazado(usr: Usuario){
      const nombre = usr.nombre+" "+usr.apellido;
      const encabezado = `MjorApp - Lamentamos informarle, ${nombre}. No se le permitirá el ingreso.`
      const mensaje= `¡Hola ${nombre}!
Su solicitud de registro ha sido rechazada por nuestro supervisor`

    this.enviarEmail(usr, mensaje, encabezado);
  }

  envClienteReservaAprobada(usr: Usuario, fechaReservada:string)
  {
    const nombre = usr.nombre+" "+usr.apellido;
    const encabezado = `MjorApp - Estado de su reserva`
    const mensaje= `¡Hola ${nombre}!
    Su reserva del ${fechaReservada} ha sido aprobada.
    ¡Lo esperamos en Mjor!`

    this.enviarEmail(usr, mensaje, encabezado);
  }

  envClienteReservaRechazada(usr: Usuario, fechaReservada:string)
  {
    const nombre = usr.nombre+" "+usr.apellido;
    const encabezado = `MjorApp - Estado de su reserva`
    const mensaje= `Hola ${nombre}
    Lamentamos informarle que su reserva del ${fechaReservada} ha sido rechazada`

    this.enviarEmail(usr, mensaje, encabezado);
  }

  async enviarFactura(usr: Usuario | null, pedido: Pedido, propina: number){

    if(!usr) return;

    const totales =
      this.calcularTotalesFactura(pedido, propina);

    const templateParams = {
      usr: {
        email: usr.email
      },

      numero_pedido: pedido.id,

      fecha: new Date(
        pedido.created_at!
      ).toLocaleDateString('es-AR'),

      cliente: `${usr.nombre} ${usr.apellido}`,

      subtotal:
        this.formatearMoneda(totales.totalBruto),

      propina:
        this.formatearMoneda(totales.propina),

      descuento:
        this.formatearMoneda(totales.descuento),

      total:
        this.formatearMoneda(totales.totalFinal),

      productos_html:
        this.generarHtmlProductos(pedido)
    };

    try{

      const response = await emailjs.send(
        this.servId,
        this.templateFactura,
        templateParams,
        { publicKey: this.servKey }
      );

      console.log(
        'Correo enviado correctamente:',
        response.status,
        response.text
      );

    } catch(error){

      console.error(
        'Error al enviar correo:',
        error
      );

    }

  }
  
  private generarHtmlProductos(
    pedido: Pedido
  ): string{

    const filas =
      pedido.detalles?.map(detalle => `

        <tr>

          <td style="
            border:1px solid #333;
            padding:10px;
          ">
            ${detalle.nombreProducto}
          </td>

          <td style="
            border:1px solid #333;
            padding:10px;
            text-align:center;
          ">
            ${detalle.cantidad}
          </td>

          <td style="
            border:1px solid #333;
            padding:10px;
            text-align:right;
          ">
            ${this.formatearMoneda(detalle.precio ?? 0)}
          </td>

          <td style="
            border:1px solid #333;
            padding:10px;
            text-align:right;
          ">
            ${this.formatearMoneda(
              (detalle.precio ?? 0) * detalle.cantidad
            )}
          </td>

        </tr>

      `).join('') ?? '';

    return `
      <table
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="border-collapse:collapse;"
      >

        <tbody>
          ${filas}
        </tbody>

      </table>
    `;

  }

  private calcularTotalesFactura(
    pedido: Pedido,
    propina: number
  ){

    const totalBruto =
      pedido.detalles?.reduce((acc, detalle) =>
        acc + (
          (detalle.precio ?? 0) *
          detalle.cantidad
        ), 0
      ) ?? 0;

    const totalPropina = totalBruto * propina;

    const descuento =
      totalBruto * (1 - pedido.descuento);

    const totalFinal =
      totalBruto +
      totalPropina -
      descuento;

    return {
      totalBruto,
      propina: totalPropina,
      descuento,
      totalFinal
    };

  }

  private formatearMoneda(valor: number): string{

    return new Intl.NumberFormat('es-AR', {
      style:'currency',
      currency:'ARS'
    }).format(valor);

  }

}
