import { Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';


@Injectable({
  providedIn: 'root'
})
export class ArchivoService{
//! ================== Almacenamiento ==================
  async guardarArchivoLocal<T>(direccion: string, datos: T, isArchivo = false) {
    const archivo = await Filesystem.writeFile({
      path: direccion,
      data: isArchivo ? datos as string : JSON.stringify(datos),
      directory: Directory.Documents,
      encoding:isArchivo ? undefined : Encoding.UTF8,
    });

    
    console.log('Archivo guardado.');
    return archivo;
  }
  async recuperarArchivoGuardado<T>(direccion: string): Promise<T | null> {
    try {

      const archivo = await Filesystem.readFile({
        path: direccion,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      console.log('Archivo recuperado');

      return JSON.parse(archivo.data as string) as T;

    } catch(e){
      return null;
    }
  }

  async eliminarArchivoLocal(direccion: string) {

    await Filesystem.deleteFile({
      path: direccion,
      directory: Directory.Documents
    });

    console.log('Archivo eliminado.');
  }
}