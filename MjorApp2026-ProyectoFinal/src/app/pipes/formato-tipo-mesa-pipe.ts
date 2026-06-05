import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoTipoMesa'
})
export class FormatoTipoMesaPipe implements PipeTransform {

  transform(tipo: string | undefined): string | undefined {
    switch(tipo){
      case "standar":
        return "Estándar";
      case "vip":
        return "VIP";
      case "handicap":
        return "Apt. Discapacidad"
    }
    return "Tipo de mesa no identificado"
  }

}
