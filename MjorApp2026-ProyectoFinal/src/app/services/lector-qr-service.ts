import { Injectable } from '@angular/core';
import {  inject } from '@angular/core';
import { Barcode, BarcodeFormat, BarcodeScanner, IsGoogleBarcodeScannerModuleAvailableResult, ScanOptions } from '@capacitor-mlkit/barcode-scanning';
import { Util } from './util';


@Injectable({
  providedIn: 'root'
})

export class LectorQrService {
 
  isSupported = true;
  private utils = inject(Util);

  async scan(): Promise<Barcode[] | null>
  {
    var isGoogleModuleAvailable = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

    if (!isGoogleModuleAvailable)
    {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }

    const { barcodes } = await BarcodeScanner.scan
    ({
      formats: [BarcodeFormat.QrCode],
      autoZoom: false
    } as ScanOptions);
    
    return barcodes;
  }
  async scanDni(): Promise<Barcode[] | null>
  {
    const { barcodes } = await BarcodeScanner.scan
    ({
      formats: [BarcodeFormat.Pdf417],
      autoZoom: false
    } as ScanOptions);
    
    return barcodes;
  }

  async requestPermissions(): Promise<boolean>
  {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }
  
}
