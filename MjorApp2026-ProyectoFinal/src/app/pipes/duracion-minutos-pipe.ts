import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duracionMinutos'
})
export class DuracionMinutosPipe implements PipeTransform {

  transform(minutosFloat: string|number | null | undefined): string {

    if(minutosFloat == null) return '00:00';
    if(typeof minutosFloat === 'string') parseFloat(minutosFloat)

    const minutos = Math.floor(minutosFloat as number);

    const segundos = Math.round(((minutosFloat as number) - minutos) * 60);

    const minutosFormateados = minutos.toString().padStart(2, '0');

    const segundosFormateados = segundos.toString().padStart(2, '0');

    return `${minutosFormateados}:${segundosFormateados}`;
  }
}
