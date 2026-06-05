import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import OneSignal from 'onesignal-cordova-plugin';
import { INotification } from './notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService
{
  /**
   * Envía una notificación  a los distintos roles o usuarios específicos.
   */
  public async emitirNotificacion(titulo: string, mensaje: string, url: string, 
    rol?: 'dueño' | 'mozo' | 'cliente' | 'cocinero' | 'bartender' | string[],
    uid?: string){

    const notificacion: INotification = {
      title: titulo,
      body: mensaje,
      data: {url: url}
    }
    if(uid) notificacion.userIds = [uid.replace(/-/g, "")]
    if(rol) {
      if(typeof rol === 'string') notificacion.segments = [rol]
      else notificacion.segments = rol
    }
    console.log(JSON.stringify(notificacion))
    this.enviarNotificacion(notificacion, environment.oneSignalAvisoChannel);
 
  }

  /**
   * Envia una push notification a través de la REST API de OneSignal.
   */
  public async enviarNotificacion
  (notification: INotification, channelID: string): Promise<HttpResponse>
  {
    const payload: any = {
      app_id: `${environment.oneSignalID}`,
      headings: { en: notification.title },
      contents: { en: notification.body },
      data: notification.data,
      "android_channel_id": channelID,
      priority: 10,
      small_icon: "ic_stat_onesignal_default"
    };

    if (notification.userIds && notification.userIds.length > 0)
    {
      payload.include_aliases = {external_id: notification.userIds};
      payload.target_channel = "push";
    } else if (notification.segments && notification.segments.length > 0)
    {
      payload.included_segments = notification.segments;
    }    

    return CapacitorHttp.post
    ({
      url: 'https://onesignal.com/api/v1/notifications',
      params: {},
      data: payload,
      headers:
      {
        'Content-type': 'application/json',
        Authorization: `Basic ${environment.onseSignalRestAPI}`,
      },
    });
  }

  /**
   * Agrega un tag "perfil: 'x'" al usuario actual.
   *
   * (Al supervisor agregarle el tag 'dueño')
   */
  public agregarTagPerfil(
    perfil: 'dueño' | 'maitre' | 'mozo' | 'bartender' | 'cocinero' | 'cliente'
  ): void {
    try
    {
      OneSignal.User.addTag('perfil', perfil);
    } catch (error)
    {
      console.error('Error al agregar tag de perfil:', error);
    }
  }

  /**
   * Remueve el tag "perfil" del usuario actual
   */
  public removerTagPerfil(): void {
    try
    {
      OneSignal.User.removeTag('perfil');
    } catch (error)
    {
      console.error('Error al remover tag de perfil:', error);
    }
  }
}
