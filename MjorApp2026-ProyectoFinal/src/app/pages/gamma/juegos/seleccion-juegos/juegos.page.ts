import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent, IonButton, IonText } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { Util } from 'src/app/services/util';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";

@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  standalone: true,
  imports: [IonText, IonButton, 
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonCol,
    IonRow,
    IonGrid,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent
],
})
export class JuegosPage implements OnInit
{
  private utils = inject(Util);

  juegos = [
    {
      titulo: 'Tateti',
      descripcion: 'Juega al Tateti con un oponente virtual.',
      ruta: '/tateti',
    },
    {
      titulo: 'Sudoku',
      descripcion: 'Resuelve el Sudoku lo más rápido posible.',
      ruta: '/sudoku',
    },
    {
      titulo: 'Ayudar al Mozo',
      descripcion: 'Ayuda al mozo a esquivar obstáculos y llegar a la mesa.',
      ruta: '/ayudar-mozo',
    },
  ];

  irA(ruta: string)
  {
    this.utils.redirigir(ruta);
  }

  ngOnInit() {}
}
