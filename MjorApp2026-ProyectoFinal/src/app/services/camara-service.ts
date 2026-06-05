import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource, ImageOptions, Photo} from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';
import { Filesystem } from '@capacitor/filesystem';


@Injectable({
  providedIn: 'root',
})
export class CamaraService {

  async convertirFotosABlobs(fotos: string[]): Promise<Blob[]> {
    const blobs: Blob[] = [];

    for (const fotoPath of fotos) {
      const blob = await this.procesarFoto(fotoPath);
      blobs.push(blob);
    }

    return blobs;
  }
  /**
   * Convierte un string con el path de una foto en el sistema en un blob
   * @param img path de la imagen
   * @returns Promise<Blob> o null si el formato es inválido
   */
  async procesarFoto(img: string): Promise<Blob>{
    const file = await Filesystem.readFile({
        path: img,
      });
    const ab = decode(file.data as string) as ArrayBuffer;
    const archivo = new Blob([ab], { type: 'image/png' });

    return archivo
  }

   /** //? Crea una instancia de la interfaz de Photo con el producto de
   *   ?la interacción del usuario.
   * * Devuelve la instancia de Photo o null en caso de error.
   * @returns Photo
   */
  async tomarFotoCelular(): Promise<Photo | null>{
    try{
      await Camera.requestPermissions();
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 500,
        height: 500,
      } as ImageOptions);

      if(image){
        return image;
      }

      return null;
    }catch(e){
      alert(String(e));
      return null;
    }
  }
  /** //?Habilita a seleccionar una imágen desde la galería
   *  *  Devuelve un objeto del tipo Promise<Photo> 
   * @returns String
   */
  async seleccionarFotoCelular(): Promise<Photo | null> {
    try {
      await Camera.requestPermissions();
      const imagen = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: 500,
      } as ImageOptions);

      if (imagen.path) {
        return imagen;
      }

      return null;

    } catch (error) {
      alert(String(error));
      return null;
    }
  }

}
