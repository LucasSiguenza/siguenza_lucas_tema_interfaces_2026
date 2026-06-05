import { Injectable } from '@angular/core';
import { FileViewer } from '@capacitor/file-viewer';

@Injectable({
  providedIn: 'root',
})
export class LectorArchivoService {
  
  async abrirArchivoPorRuta(uri: string){
    return await FileViewer.openDocumentFromUrl({
      url: uri,
    })
  }

}
