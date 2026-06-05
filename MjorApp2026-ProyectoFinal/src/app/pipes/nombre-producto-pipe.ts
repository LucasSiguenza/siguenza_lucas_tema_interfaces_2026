import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nombreProducto'
})
export class NombreProductoPipe implements PipeTransform {

  transform(nombre: string)
  {
    let nombreFormateado = nombre.replace(/-/g, ' ').toLowerCase();

    return nombreFormateado;
  }

}
