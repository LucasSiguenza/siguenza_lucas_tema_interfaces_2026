import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Util } from 'src/app/services/util';
import { AlertController } from '@ionic/angular';
import { SudokuService } from 'src/app/services/sudoku-service';
import { Juegos } from 'src/app/services/juegos';

@Component({
  selector: 'app-sudoku',
  templateUrl: './sudoku.page.html',
  styleUrls: ['./sudoku.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, CommonModule, FormsModule]
})
export class SudokuPage implements OnInit
{
  //services
  sudokuService = inject(SudokuService);
  router = inject(Router);

  //properties
  private utils = inject(Util);
  private juegosService = inject(Juegos);
  
  private idPedido = signal<number>(-1);
  celdaSeleccionada = signal<[number, number] | null>(null);
  numeroSeleccionado = signal<number | null>(null);
  
  readonly numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  async ngOnInit()
  {
    var spinner = await this.utils.loading();
    spinner.present();
    await this.juegosService.revisarSiJuegoIntentado(await this.juegosService.obtenerUIDPedido());
    this.sudokuService.iniciarJuego();
    spinner.dismiss();
  }

  get contadores() {
    return this.sudokuService.contadoresRestantes();
  }

  seleccionarCelda(i: number, j: number) {
    if (this.sudokuService.juegoTerminado()) return;

    const valor = this.sudokuService.tablero()[i][j];
    this.celdaSeleccionada.set([i, j]);
    this.numeroSeleccionado.set(valor || null);
  }

  async usarTecla(valor: number) {
    const celda = this.celdaSeleccionada();
    if (!celda) return;

    this.sudokuService.establecerValor(celda[0], celda[1], valor.toString());
    
    // Verificar si perdió todas las vidas
    if (this.sudokuService.vidas() === 0) {
      if (!this.juegosService.isJuegoIntentado())
      {
        await this.showAlert(
          'Juego Terminado',
          'No ganaste el descuento.',
          false
        );
        await this.juegosService.cambiarEstadoDescuento(true, 1);        
      } else
      {
        await this.showAlert(
          'Juego Terminado',
          '¡Suerte la próxima!',
          false
        );
      }
      return;
    }

    this.sudokuService.verificarSolucion();

    // Verificar si el juego terminó (tablero completo y verificado)
    if (this.sudokuService.juegoTerminado()) {
      if (!this.juegosService.isJuegoIntentado())
      {
        await this.showAlert(
          '¡Ganaste!',
          'Felicitaciones, ganaste un 20% de descuento en tu pedido.',
          true
        );
        await this.juegosService.cambiarEstadoDescuento(true, 0.8);        
      } else {
        await this.showAlert(
          '¡Ganaste!',
          'Felicitaciones.',
          true
        );
      }
    }
  }

  esConflicto(i: number, j: number): boolean {
    return false;
  }

  reiniciarJuego() {
    this.sudokuService.iniciarJuego();
  }

  borrarCelda() {
    const celda = this.celdaSeleccionada();
    if (celda) {
      this.sudokuService.borrarCelda(celda[0], celda[1]);
    }
  }

  celdaEditable(): boolean {
    const celda = this.celdaSeleccionada();
    return celda ? !this.sudokuService.celdaFija(celda[0], celda[1]) : false;
  }

  volver() {
    this.router.navigate(['/cliente']);
  }

  async showAlert(header: string, message: string, won: boolean)
  {
    await this.utils.mostrarAlert(header,message);
    this.utils.redirigir('/juegos');
  }

}
