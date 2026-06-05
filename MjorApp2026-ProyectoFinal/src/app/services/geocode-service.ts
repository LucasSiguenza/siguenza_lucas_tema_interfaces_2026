import { Injectable } from '@angular/core';
import { Address, ForwardOptions, NativeGeocoder, ReverseOptions } from '@capgo/nativegeocoder';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class GeocodeService
{
  private http = inject(HttpClient);


  public async convertirCoordenadasADireccion( latitud: number, longitud: number): Promise<Address[]>
  {
    if (Capacitor.getPlatform() !== 'web')
    {
      const ubicacion: ReverseOptions =
      {
        latitude: latitud,
        longitude: longitud,
        useLocale: true,
        defaultLocale: 'es_AR',
      };

      return (
        await NativeGeocoder.reverseGeocode(ubicacion)
      ).addresses;
    }

    const response: any =
    await firstValueFrom(
      this.http.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitud}&lon=${longitud}&apiKey=${environment.geoapifyAPIKey}`
      )
    );

    const resultado = response.features[0]?.properties;

    return [
      {
        latitude: latitud,
        longitude: longitud,
        countryCode: resultado.country_code ?? '',
        countryName: resultado.country ?? '',
        postalCode: resultado.postcode ?? '',
        administrativeArea: resultado.state ?? '',
        subAdministrativeArea: '',
        locality: resultado.city ?? '',
        subLocality: resultado.suburb ?? '',
        thoroughfare: resultado.street ?? '',
        subThoroughfare: resultado.housenumber ?? '',
        areasOfInterest: []
      }
    ];
  }

  public async convertirDireccionACoordenadas(direccion: string)
  : Promise<Address[]>
  {
    let ubicacion: ForwardOptions = 
    {
      addressString: direccion,
      useLocale: true,
      defaultLocale: "es_AR"
    }

    return (await NativeGeocoder.forwardGeocode(ubicacion)).addresses;
  }
}
