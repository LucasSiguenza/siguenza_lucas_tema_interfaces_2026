import { Component, inject, OnInit } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';
import { ChatEntry } from 'src/app/models/chatEntry';
import { ChatService } from 'src/app/services/chat-service';
import { SupabaseService } from 'src/app/services/supabase-service';
import { Util } from 'src/app/services/util';
import { IonButton, IonContent } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { MesasSb } from 'src/app/services/mesas-sb';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [
    IonButton,
    FormsModule,
    DatePipe,
    IonContent,
    HeaderComponent
],
})
export class ChatComponent  implements OnInit
{
  //services
  private utils = inject(Util);
  private mesaSvc = inject(MesasSb);
  private supabaseService = inject(SupabaseService);
  protected chatService = inject(ChatService);
  protected User = inject(UsuarioSb);

  //properties  
  newMessage: string = "";
  chatSubscription?: Subscription;
  channel?: RealtimeChannel;

  async ngOnInit()
  {
    var spinner = await this.utils.loading();
    spinner.present();
    if(this.User.usrActual()?.perfil === 'cliente')
    {
      this.chatService.chatID.set(
        this.mesaSvc.mesaDelUsuario() === null 
        ? this.User.usrActual()?.uid! 
        : this.mesaSvc.mesaDelUsuario()?.numero!);
    }
    await this.chatService.getAllMessages();

    if (this.chatService.allMessages?.length == 0)
    {
      this.chatService.allMessages = [];  
    }
    
    await this.iniciarCanalRealtime();

    spinner.dismiss();
  }

  async ngOnDestroy()
  {
    this.chatSubscription?.unsubscribe();
    await this.channel?.unsubscribe()
  }

  private async iniciarCanalRealtime()
  {
    this.channel = this.supabaseService.sb
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      async () => 
      {
        this.chatService.allMessages = await this.chatService.getAllMessages();
      }
    )
    .subscribe()
  }

  protected async sendMessage()
  {
    if (this.newMessage != "")
    {
      this.chatService.allMessages?.unshift
      (
        {
          chat_id: this.chatService.chatID(),
          author: this.User.usrActual()!.uid!,
          content: this.newMessage,
          created_at: Date.now().toString(),
          users : 
          {
            nombre: this.User.usrActual()!.nombre,
            uid: this.User.usrActual()!.uid!
          }
        }
      )

      await this.chatService.sendMessage(this.User.usrActual()!.uid!, this.newMessage);  
      this.newMessage = "";
    }
  }

}
