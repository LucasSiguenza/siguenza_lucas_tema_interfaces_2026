import { inject, Injectable, signal } from '@angular/core';
import { ChatEntry } from '../models/chatEntry';
import { SupabaseService } from './supabase-service';
import { UsuarioSb } from './usuario-sb';
import { NotificationService } from './notification.service';
import { INotification } from './notification';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService
{
  // services
  public supabaseService = inject(SupabaseService);
  private usuario = inject(UsuarioSb);
  private notificacion = inject(NotificationService);

  // Properties
  public chatID = signal<string>('');
  public allMessages: ChatEntry[] | null = [];
  

  public async getAllMessages()
  {
    try
    {
      var allMessages: ChatEntry[] = await this.supabaseService.adquirirDatosPorColumnaOrdenada
      (
        "messages",
        `
        *,
        users ( nombre, apellido, uid, perfil )
        `,
        "chat_id",
        this.chatID(),
        'created_at',
        false
      )

      this.allMessages = allMessages;
      return allMessages;
    } catch (error)
    {
      alert(`chat-service/getAllMessages/errorCatch: ${error}`);
      this.allMessages = [];
      return null;
    }
  }

  public async sendMessage(author: string, content: string)
  {
    try
    {
      const mensaje = await this.supabaseService.insertar
      (
        'messages',
        {
          chat_id: this.chatID(),
          author: author,
          content: content,
        }
      )

      this.enviarPushNotification(content);
      return true
    } catch (error)
    {
      alert(`chat-service/sendMessage/errorCatch: ${JSON.stringify(error)}`);
      return false;
    }
  }

  private async enviarPushNotification(mensaje: string)
  {
    var channelID = '';

    if (this.usuario.usrActual()?.perfil == 'mozo' || this.usuario.usrActual()?.perfil == 'delivery')
    {
      let mensajeDelCliente: ChatEntry | undefined = this.allMessages?.find
      (
        (ultimoMensajeCliente) =>
        {
          return ultimoMensajeCliente.users.perfil == 'cliente';
        }
      );

      if (mensajeDelCliente != undefined)
      {
        let notificacion: INotification =
        {
          title: 'Nuevo Mensaje del MjorTeam',
          body: mensaje,
          data: {url: '/chat'},
          userIds: [mensajeDelCliente?.users.uid!.replace(/-/g, "")]
        }
        // canal "Aviso"
        channelID = environment.oneSignalAvisoChannel;
        this.notificacion.enviarNotificacion(notificacion, channelID);
      }
    }
    else
    {
      var notificacion: INotification = {title: '', body: ''};

      if (this.chatID().length >= 36)
      {
        let mensajeDelRepartidor: ChatEntry | undefined = this.allMessages?.find
        (
          (ultimoMensajeRepartidor) =>
          {
            return ultimoMensajeRepartidor.users.perfil == 'delivery';
          }
        );

      if (mensajeDelRepartidor != undefined)
      {
        let notificacion: INotification =
        {
          title: `Nuevo Mensaje de ${this.usuario.usrActual()?.nombre}`,
          body: mensaje,
          data: {url: '/chat', chatID: this.chatID()},
          userIds: [mensajeDelRepartidor?.users.uid!.replace(/-/g, "")]
        }
        // canal "Aviso"
        channelID = environment.oneSignalAvisoChannel;;
        this.notificacion.enviarNotificacion(notificacion, channelID);
      }
      } else
      {
        notificacion =
        {
          title: `Nuevo Mensaje de la mesa ${this.chatID()}`,
          body: mensaje,
          data: {url: '/chat', chatID: this.chatID()},
          segments: ['mozo'],
        }
      }
      channelID = environment.oneSignalAvisoChannel;;
      this.notificacion.enviarNotificacion(notificacion, channelID);
    }
  }
}
