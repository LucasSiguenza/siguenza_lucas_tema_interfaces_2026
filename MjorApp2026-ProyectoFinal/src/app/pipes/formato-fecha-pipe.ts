import { Pipe, PipeTransform, } from '@angular/core';
import { DateTime } from 'luxon';
@Pipe({
  name: 'formatoFecha'
})
export class FormatoFechaPipe implements PipeTransform {

  transform(fecha: string | undefined): string | undefined {
  const fechaFormato = DateTime.fromISO(String(fecha)).toFormat("dd/MM/yyyy ─ HH:mm"); 
    return String(fechaFormato);
  }

}
