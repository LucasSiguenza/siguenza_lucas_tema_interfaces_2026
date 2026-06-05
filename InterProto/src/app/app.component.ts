import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { FabTemasComponent } from "./componentes/fab-temas/fab-temas.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FabTemasComponent],
})
export class AppComponent {
  constructor() {}
}
