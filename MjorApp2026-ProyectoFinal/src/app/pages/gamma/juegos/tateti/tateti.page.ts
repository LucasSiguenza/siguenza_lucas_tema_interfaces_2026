import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Util } from 'src/app/services/util';
import { Juegos } from 'src/app/services/juegos';
import { addIcons } from 'ionicons';
import { refreshOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tateti',
  templateUrl: './tateti.page.html',
  styleUrls: ['./tateti.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ],
})
export class TatetiPage implements OnInit {
  private router = inject(Router);
  private utils = inject(Util);
  private juegosService = inject(Juegos);

  // Estado del juego con Signals
  idPedido = signal<number>(-1);
  board = signal<string[]>(Array(9).fill(''));
  currentPlayer = signal<'X' | 'O'>('X'); // X es Usuario, O es IA
  winner = signal<string | null>(null);
  isDraw = signal<boolean>(false);
  gameActive = signal<boolean>(true);

  constructor() {
    addIcons({ refreshOutline, arrowBackOutline });
  }

  async ngOnInit()
  {
    var spinner = await this.utils.loading();
    spinner.present();
    await this.juegosService.revisarSiJuegoIntentado(await this.juegosService.obtenerUIDPedido());
    spinner.dismiss();
  }

  makeMove(index: number) {
    if (!this.gameActive() || this.board()[index] !== '') {
      return;
    }

    // Movimiento del Jugador
    this.updateBoard(index, 'X');
    
    if (this.checkResult()) return;

    // Turno de la IA
    this.currentPlayer.set('O');
    setTimeout(() => this.aiMove(), 600); // Pequeño delay para realismo
  }

  aiMove() {
    if (!this.gameActive()) return;

    const emptyIndices = this.board()
      .map((val, idx) => (val === '' ? idx : -1))
      .filter((idx) => idx !== -1);

    if (emptyIndices.length > 0) {
      // IA Simple: Elige al azar (se puede mejorar a Minimax si quieres que sea difícil)
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      
      this.updateBoard(randomIndex, 'O');
      if (this.checkResult()) return;
      
      this.currentPlayer.set('X');
    }
  }

  private updateBoard(index: number, player: 'X' | 'O') {
    this.board.update(b => {
      const newBoard = [...b];
      newBoard[index] = player;
      return newBoard;
    });
  }

  checkResult(): boolean {
    const b = this.board();
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
      [0, 4, 8], [2, 4, 6]             // Diagonales
    ];

    for (let combo of winningCombinations) {
      const [x, y, z] = combo;
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        this.finishGame(b[x]); // Ganador encontrado
        return true;
      }
    }

    if (!b.includes('')) {
      this.finishGame('draw'); // Empate
      return true;
    }

    return false; // El juego sigue
  }

  async finishGame(result: string) {
    this.gameActive.set(false);

    if (result === 'draw') {
      this.isDraw.set(true);
      await this.handleGameEnd(false); // Empate cuenta como no ganar descuento
    } else {
      this.winner.set(result);
      await this.handleGameEnd(result === 'X'); // Gana si es 'X'
    }
  }

  async handleGameEnd(userWon: boolean) {
    const yaJugo = this.juegosService.isJuegoIntentado();

    if (userWon) {
      if (!yaJugo) {
        // GANA DESCUENTO 10%
        await this.juegosService.cambiarEstadoDescuento(true, 0.9);
        this.showAlert('¡Ganaste!', 'Felicitaciones, ganaste un 10% de descuento en tu pedido.', true);
      } else {
        this.showAlert('¡Ganaste!', '¡Excelente partida!', true);
      }
    } else {
      if (!yaJugo) {
        // PIERDE OPORTUNIDAD
        await this.juegosService.cambiarEstadoDescuento(true, 1);
        this.showAlert('Juego Terminado', 'No ganaste el descuento.', false);
      } else {
        this.showAlert('Juego Terminado', '¡Suerte la próxima!', false);
      }
    }
  }

  async showAlert(header: string, message: string, won: boolean)
  {
    await this.utils.mostrarAlert(header, message);
    this.utils.redirigir('/juegos');
  }

  resetGame() {
    this.board.set(Array(9).fill(''));
    this.currentPlayer.set('X');
    this.winner.set(null);
    this.isDraw.set(false);
    this.gameActive.set(true);
  }

  volver() {
    this.router.navigate(['/juegos']);
  }
}