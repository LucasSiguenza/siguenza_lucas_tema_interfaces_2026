import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SudokuService
{
  vidas = signal(3);
  puntaje = signal(0);
  dificultad = signal<'facil' | 'media' | 'dificil'>('media');
  juegoTerminado = signal(false);
  mensajeResultado = signal('');
  conflictos = signal<[number, number][]>([]);

  tableroInicial: number[][] = [];
  tablero = signal<number[][]>([]);


  /**
   * Genera un tablero de Sudoku válido completo usando Backtracking
   */
  private generarSolucionSudoku(): number[][] {
    const tablero: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

    const esSeguro = (fila: number, col: number, num: number): boolean => {
      for (let i = 0; i < 9; i++) {
        if (tablero[fila][i] === num || tablero[i][col] === num) return false;
      }

      const startRow = Math.floor(fila / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;

      for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
          if (tablero[i][j] === num) return false;
        }
      }

      return true;
    };

    const resolver = (): boolean => {
      for (let fila = 0; fila < 9; fila++) {
        for (let col = 0; col < 9; col++) {
          if (tablero[fila][col] === 0) {
            const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const num of nums) {
              if (esSeguro(fila, col, num)) {
                tablero[fila][col] = num;
                if (resolver()) return true;
                tablero[fila][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    resolver();
    return tablero;
  }

  /**
   * Elimina números del tablero completo para crear el puzzle según dificultad
   */
  private aplicarDificultad(tablero: number[][], cantidad: number): number[][] {
    const resultado = tablero.map((fila) => [...fila]);
    let ocultadas = 0;

    while (ocultadas < cantidad) {
      const i = Math.floor(Math.random() * 9);
      const j = Math.floor(Math.random() * 9);

      if (resultado[i][j] !== 0) {
        resultado[i][j] = 0;
        ocultadas++;
      }
    }

    return resultado;
  }

  /**
   * Inicializa una nueva partida
   */
  iniciarJuego() {
    this.vidas.set(3);
    const completo = this.generarSolucionSudoku();
    const huecos = this.dificultad() === 'facil' ? 30 : this.dificultad() === 'media' ? 40 : 50;
    const conHuecos = this.aplicarDificultad(completo, huecos);

    this.tableroInicial = conHuecos;
    this.tablero.set(conHuecos.map((row) => [...row]));
    this.puntaje.set(0);
    this.juegoTerminado.set(false);
    this.mensajeResultado.set('');
    this.conflictos.set([]);
  }

  /**
   * Intenta colocar un número en una celda
   */
  establecerValor(i: number, j: number, valorStr: string) {
    if (this.juegoTerminado() || this.vidas() === 0) return;

    const num = Number(valorStr || 0);
    if (isNaN(num) || num < 0 || num > 9) return;

    if (this.celdaFija(i, j)) return;

    this.tablero.update((currentBoard) => {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[i][j] = num;
      return newBoard;
    });

    const esValido = this.validarMovimiento(i, j, num);
    
    if (!esValido) {
      this.vidas.update((v) => Math.max(v - 1, 0));
      //vibración acá

      const conflictosDetectados: [number, number][] = [];

      for (let col = 0; col < 9; col++) {
        if (col !== j && this.tablero()[i][col] === num) {
          conflictosDetectados.push([i, col]);
        }
      }

      for (let fila = 0; fila < 9; fila++) {
        if (fila !== i && this.tablero()[fila][j] === num) {
          conflictosDetectados.push([fila, j]);
        }
      }

      conflictosDetectados.push([i, j]);
      this.conflictos.set(conflictosDetectados);
    } else {
      this.conflictos.set([]);
    }

    const restantes = this.contadoresRestantes();
    if (restantes[num] === 0 && this.esNumeroBienUbicado(num)) {
      const puntos =
        this.dificultad() === 'facil' ? 100 : this.dificultad() === 'media' ? 150 : 250;
      this.puntaje.update((p) => p + puntos);
    }
  }

  celdaFija(i: number, j: number): boolean {
    return this.tableroInicial[i][j] !== 0;
  }

  shuffle(array: number[]): number[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  esNumeroBienUbicado(num: number): boolean {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.tablero()[i][j] === num) {
          if (!this.validarMovimiento(i, j, num)) return false;
          count++;
        }
      }
    }
    return count === 9;
  }

  borrarCelda(i: number, j: number) {
    if (this.celdaFija(i, j)) return;
    if (this.tablero()[i][j] !== 0) {
      this.tablero.update((board) => {
        const newBoard = board.map(row => [...row]);
        newBoard[i][j] = 0;
        return newBoard;
      });
      this.conflictos.set([]);
    }
  }

  tableroCompleto(): boolean {
    return !this.tablero().flat().includes(0);
  }

  async verificarSolucion(): Promise<void> {
    if (!this.tableroCompleto()) {
      this.mensajeResultado.set('¡El tablero no está completo!');
      return;
    }

    const board = this.tablero();
    let esValido = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!this.validarMovimiento(i, j, board[i][j])) {
          esValido = false;
          break;
        }
      }
      if (!esValido) break;
    }

    if (esValido) {
      this.juegoTerminado.set(true);
      this.mensajeResultado.set('Felicidades, Sudoku resuelto');
      //sonido exito acá
    } else {
      this.juegoTerminado.set(true);
      this.mensajeResultado.set('Hay errores en tu solución. Vuelve a intentarlo.');
      //sonido fracaso acá
    }
  }

  validarMovimiento(row: number, col: number, num: number): boolean {
    const board = this.tablero();
    if (num === 0) return true;

    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) return false;
      if (i !== col && board[row][i] === num) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        if (i !== row && j !== col && board[i][j] === num) return false;
      }
    }
    return true;
  }

  contadoresRestantes(): Record<number, number> {
    const usados = new Map<number, number>();
    for (const fila of this.tablero()) {
      for (const celda of fila) {
        if (celda !== 0) {
          usados.set(celda, (usados.get(celda) || 0) + 1);
        }
      }
    }

    const restantes: Record<number, number> = {};
    for (let n = 1; n <= 9; n++) {
      restantes[n] = Math.max(0, 9 - (usados.get(n) || 0));
    }

    return restantes;
  }
}
