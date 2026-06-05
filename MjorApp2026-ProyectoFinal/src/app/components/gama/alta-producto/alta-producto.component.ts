import { Component, inject, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Producto } from 'src/app/models/Producto';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/angular/standalone';
import { CamaraService } from 'src/app/services/camara-service';
import { Util } from 'src/app/services/util';
import { InputMjorComponent } from "../../elementos/input-mjor/input-mjor.component";
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { SupabaseService } from 'src/app/services/supabase-service';
import { Photo } from '@capacitor/camera';

@Component({
  selector: 'app-alta-producto',
  templateUrl: './alta-producto.component.html',
  styleUrls: ['./alta-producto.component.scss'],
  imports: [
    IonCardTitle,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    IonCard,
    IonCardHeader,
    IonButton,
    IonCardContent,
    MatProgressSpinnerModule,
    IonIcon,
    InputMjorComponent
]
})
export class AltaProductoComponent  implements OnInit
{
  protected photo = inject(CamaraService);
  private utils = inject(Util);
  private supabaseService = inject(SupabaseService);
  
  @Input() categoria: 'plato' | 'postre' | 'bebida' = 'bebida';
  
  protected fotosTomadas : Photo[] | null[] = [null, null, null];
  protected fotosValidas: number = 0;
  protected page: number = 1;
  protected showPhotoPrompt: boolean = false;
  protected posicionFoto: number = 0;
  protected flagExito: boolean = false;
  protected altaForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required]),
    tiempo: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    precio: new FormControl('', [Validators.required]),
  });

  constructor()
  {
    addIcons({ chevronBackOutline,chevronForwardOutline });
  }

  ngOnInit() {}

  public reiniciarFotos()
  {
    this.fotosTomadas = [null, null, null];
    this.fotosValidas = 0;
  }

  public recontarFotosValidas()
  {
    var contadorFotos = 0;

    for (let index = 0; index < this.fotosTomadas.length; index++)
    {
      if (this.fotosTomadas[index] != null)
      {
        contadorFotos +=1;
      }
    }

    this.fotosValidas = contadorFotos;
  }

  protected elegirFotoASacar(posicion: number = 0)
  {
    this.posicionFoto = posicion;
    this.showPhotoPrompt = true;
  }

  protected async sacarFoto(metodo: "camara" | "galeria", posicion: number)
  {
    var result = null;

    let spinner = await this.utils.loading();
    spinner.present();

    switch (metodo)
    {
      case "camara":
        result = await this.photo.tomarFotoCelular();
        break;
    
      case "galeria":
        result = await this.photo.seleccionarFotoCelular();
        break;
    }

    if (result != null)
    {
      let fotos = this.fotosTomadas;
      fotos[posicion] = result;
      this.fotosTomadas = fotos;
      this.recontarFotosValidas();
    }

    this.showPhotoPrompt = false;
    spinner.dismiss();
  }

  private async subirImagenes()
  {
    var pathFotos: string[] = [];
    var fotosASubir: Blob[] = [];
    let nombre = this.utils.sanitizarString(this.altaForm.controls.nombre.value!);
    let bucket = 'productos';

    for (let index = 0; index < this.fotosTomadas.length; index++)
    {      
      pathFotos.push(this.fotosTomadas[index]!.path!);
    }

    fotosASubir = await this.photo.convertirFotosABlobs(pathFotos);

    this.supabaseService.subirFoto(nombre, fotosASubir, bucket);
  }

  protected goBack()
  {
    this.reiniciarFotos();
    this.altaForm.reset();
    this.flagExito = false;
  }

  protected nextPage()
  {
    if (this.page == 3)
    {
      this.page = 1;
    } else
    {
      this.page += 1;
    }
  }

  protected previouspage()
  {
    if (this.page == 1)
    {
      this.page = 3;
    } else
    {
      this.page -= 1;
    }
  }

  protected async submit()
  {
    let spinner = await this.utils.loading();
    spinner.present();

    this.subirImagenes();

    var nuevoProducto =
    {
      nombre: this.utils.sanitizarString(this.altaForm.controls.nombre.value!),
      tiempo: parseInt(this.altaForm.controls.tiempo.value!),
      precio: parseFloat(this.altaForm.controls.precio.value!),
      descripcion: this.altaForm.controls.descripcion.value!,
      categoria: this.categoria,
    } as Producto;

    await this.supabaseService.insertar('productos', nuevoProducto);
    this.reiniciarFotos();
    this.flagExito = true;
    spinner.dismiss();
  }
}
