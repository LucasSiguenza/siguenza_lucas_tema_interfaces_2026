import { Component, inject, Input, OnInit, signal } from '@angular/core';
import * as Leaflet from 'leaflet';
import { environment } from 'src/environments/environment';
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';
import { GeocodeService } from 'src/app/services/geocode-service';
import { Util } from 'src/app/services/util';
import { IonButton, ModalController } from "@ionic/angular/standalone";
import { UbicacionService } from 'src/app/services/ubicacion-service';
import { UsuarioSb } from 'src/app/services/usuario-sb';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  imports: [IonButton],
})
export class MapaComponent{
  // services
  private utils = inject(Util);
  private geocode = inject(GeocodeService);
  private ubicacionSvc = inject(UbicacionService);
  private usuarioSvc = inject(UsuarioSb);
  private modalCrtl = inject(ModalController);

  protected rolActual = this.usuarioSvc.usrActual()?.perfil ?? 'cliente'

  // properties
  private leafletMap!: Leaflet.Map;
  private zoom: number = 18;
  private lastLocation: {latitude: number, longitude: number} =
  { latitude: -34.66225499015634, 
    longitude: -58.36449533700943
  }
  private markerOrigen: any = null;
  private marker: any = null;
  protected isMarked: boolean = false;
  protected autocomplete!: GeocoderAutocomplete;
  private rutaLayer: any = null;
  protected nombreUbicacion = signal<string>('')
  // Inputs
  @Input() isDelivery = false;
  @Input() coordenadas?: {latitud: string, longitud: string}

  async ngAfterViewInit()
{
  const carga = await this.utils.loading();

  await carga.present();

  this.initMap();

  if (!this.isDelivery)
  {
    this.initAddressbar();

    const ubicacion =
    await this.ubicacionSvc.obtenerUbicacionActual();

    this.lastLocation = ubicacion;

    this.leafletMap.setView(
      [ubicacion.latitude, ubicacion.longitude],
      18
    );

    this.crearMarkerOrigen(
      -34.66247223047393,
      -58.36482203003471
    );

    this.crearMarker(
      ubicacion.latitude,
      ubicacion.longitude
    );
  }
  else if (this.coordenadas)
  {
    this.crearMarkerOrigen(
      -34.66247223047393,
      -58.36482203003471
    );

    this.crearMarker(
      parseFloat(this.coordenadas.latitud),
      parseFloat(this.coordenadas.longitud)
    );

    await this.dibujarRuta(
      parseFloat(this.coordenadas.latitud),
      parseFloat(this.coordenadas.longitud)
    );
  }

  await carga.dismiss();
}
  
  private initAddressbar(){
    const container = document.getElementById('autocomplete');
    
    this.autocomplete = new GeocoderAutocomplete(container!, environment.geoapifyAPIKey, {
      placeholder: 'Ingrese una dirección...',
      lang: 'es',
      limit: 5
    });
    
    this.autocomplete.on('select', (res) =>
      {
        if (!res || !res.properties) return;
        const p = res.properties;
        
      this.lastLocation = { latitude: p.lat, longitude: p.lon };

      if (!this.marker)
      {
        this.crearMarker(p.lat, p.lon)
      } else {
        this.marker.setLatLng([p.lat, p.lon]);
      }

      // Zoom to street level
      this.leafletMap.setView([p.lat, p.lon], Math.max(this.leafletMap.getZoom(), 16));
    });
  }

  private initMap(): void
  {
    Leaflet.TileLayer.prototype.options.referrerPolicy = 'strict-origin-when-cross-origin';
    this.leafletMap = new Leaflet.Map('map', {zoomControl: false});

    
    const self = this;
    this.leafletMap.on('load', function ()
    {
     setTimeout
      (
        () => 
        {
          self.leafletMap.invalidateSize();
        }, 10
      );
    });
    this.leafletMap.setView([this.lastLocation.latitude, this.lastLocation.longitude], this.zoom);

    Leaflet.control.zoom
    (
      {
        position: 'bottomright'
      }
    ).addTo(this.leafletMap)

    Leaflet.tileLayer(`https://api.thunderforest.com/atlas/{z}/{x}/{y}{r}.png?apikey=${environment.thunderforestOpenCycleMapApiKey}`,
    {
      attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 22
    }).addTo(this.leafletMap);

    if(!this.isDelivery){
    this.leafletMap.on('click',
      async (e) =>
        {
          console.log(JSON.stringify(e.latlng));

          this.limpiarRuta();

          if (!this.marker)
          {
            this.crearMarker(e.latlng.lat, e.latlng.lng);
          }
          else
          {
            this.marker.setLatLng([e.latlng.lat, e.latlng.lng]);
          }

          this.lastLocation =
          {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          };

          try
          {
            const address =
            await this.geocode.convertirCoordenadasADireccion(
              e.latlng.lat,
              e.latlng.lng
            );

            const direccion = address[0];

            this.nombreUbicacion.set(
              `${direccion.thoroughfare} ${direccion.subThoroughfare}`.trim()
            );

            this.marker.setTooltipContent(
              this.nombreUbicacion()
            );

            if (!this.utils.isWeb())
            {
              this.autocomplete.setValue(
                this.nombreUbicacion()
              );
            }
          }
          catch(error)
          {
            console.error(error);
          }
        }
      );
    }
  }

  private crearMarker(latitude: number, longitude: number)
  {
    let Customicon = Leaflet.icon(
      {
        iconUrl:'assets/position-marker.png',
        iconSize: [40, 40]
      }
    )
    this.marker = Leaflet.marker( [latitude, longitude], { icon: Customicon }).addTo(this.leafletMap);
    
    if(!this.isDelivery){
    this.marker.bindTooltip( this.nombreUbicacion() === ''
     ? 
     'Ubicación actual'
     : 
     this.nombreUbicacion()
     , 
      {
        permanent: true,
        direction: 'top',
        offset: [0, -30]
      } ).openTooltip();
    } else{
      this.marker.bindTooltip( "Destino", 
      {
        permanent: true,
        direction: 'top',
        offset: [0, -30]
      } ).openTooltip();
    }
    this.isMarked = true;
  }


  private async dibujarRuta(destinoLat: number, destinoLng: number)
  {
    const origen: [number, number] =
    [
      -34.66249003516861,
      -58.36483597755433
    ];

    const destino: [number, number] =
    [
      destinoLat,
      destinoLng
    ];

    const ruta =
    await this.ubicacionSvc.obtenerRuta(
      origen,
      destino
    );

    const coordenadas =
    ruta.features[0].geometry.coordinates[0];

    const puntosLeaflet =
    coordenadas.map(
      (c: number[]) => [c[1], c[0]]
    );

    if (this.rutaLayer)
    {
      this.leafletMap.removeLayer(this.rutaLayer);
    }

    this.rutaLayer = Leaflet.polyline(
      puntosLeaflet,
      {
        weight: 5
      }
    ).addTo(this.leafletMap);

    this.leafletMap.fitBounds(
      this.rutaLayer.getBounds(),
      {
        padding: [50, 50]
      }
    );

    const distanciaMetros =
    ruta.features[0].properties.distance;

    console.log(distanciaMetros);
  }


  private crearMarkerOrigen(latitude: number, longitude: number){
    const iconoOrigen = Leaflet.icon(
    {
      iconUrl: 'assets/position-marker.png',
      iconSize: [40, 40]
    });

    this.markerOrigen = Leaflet.marker(
      [latitude, longitude],
      {
        icon: iconoOrigen
      }
    ).addTo(this.leafletMap);
  }
  private limpiarRuta(){
    if (this.rutaLayer)
    {
      this.leafletMap.removeLayer(this.rutaLayer);
      this.rutaLayer = null;
    }
  }
  protected async confirmar()
  {
    // y acá hacé lo que tengas que hacer con los datos.
    //! A la orden, general Dzisko.

    const coordenadas = this.lastLocation

    if(this.rolActual === 'cliente'){
      const confirmacion = await this.utils.mostrarConfirmAlert('Confirmar dirección.',
        `¿Es ${this.nombreUbicacion()} la dirección exacta donde espera la entrega?`);
      
      if(!confirmacion) return
      
      const data = {
        direccion: this.nombreUbicacion(),
        latitud: coordenadas.latitude,
        longitud: coordenadas.longitude
      }

      this.modalCrtl.dismiss(data, 'confirm');

    }
    if(this.rolActual !== 'cliente') await this.dibujarRuta(coordenadas.latitude, coordenadas.longitude)

  }

}
