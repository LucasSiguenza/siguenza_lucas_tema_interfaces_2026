import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import OneSignal from 'onesignal-cordova-plugin';
import { environment } from 'src/environments/environment';
import { ChatService } from './services/chat-service';
import { App } from '@capacitor/app';
import { FabTemasComponent } from "./components/elementos/fab-temas/fab-temas.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FabTemasComponent],
})
export class AppComponent
{
  private router = inject(Router);
  private chat = inject(ChatService);

  constructor(){
    this.inicializarDeepLinks();
    if(Capacitor.getPlatform() !== 'web')
    {
      OneSignal.initialize(environment.oneSignalID);
      OneSignal.Notifications.requestPermission(false)
      .then((accepted: boolean) => 
      {
        console.log("User accepted notifications: " + accepted);
      });
      const myClickListener = (event: any) => 
        {
          if (event.notification.additionalData.chatID)
          {
            this.chat.chatID.set(event.notification.additionalData.chatID);
          }

          if (event.notification.additionalData.url)
          {
            this.router.navigateByUrl(event.notification.additionalData.url);
          }
        };
      OneSignal.Notifications.addEventListener("click", myClickListener);
    }
  }


  private inicializarDeepLinks() {

    App.addListener('appUrlOpen', async(event) => {

      console.log('URL recibida:', event.url);

      if(event.url.includes('login-callback')) {

        this.router.navigateByUrl('/prelogin');
      }

    });

  }
}
