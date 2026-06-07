import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { EncuestaService } from 'src/app/services/encuesta.service';
import { Util } from 'src/app/services/util';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  statsChartOutline,
  chatbubblesOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { register } from 'swiper/element/bundle';
import { HeaderComponent } from 'src/app/components/alfa/header/header.component';
import { EstadisticasEncuesta } from 'src/app/models/encuesta-data';

Chart.register(...registerables);
register();

@Component({
  selector: 'app-resultados-encuesta',
  templateUrl: './resultados-encuesta.page.html',
  styleUrls: ['./resultados-encuesta.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    HeaderComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ResultadosEncuestaPage implements OnInit {
  private encuestaSvc = inject(EncuestaService);
  private utilSvc = inject(Util);

  estadisticas: EstadisticasEncuesta | null = null;
  ultimosComentarios: Array<{ comentario: string; fecha: string }> = [];
  cargando = true;

  private chartPromedios: Chart | null = null;
  private chartRecomendacion: Chart | null = null;
  private chartRadar: Chart | null = null;

  constructor() {
    addIcons({
      refreshOutline,
      statsChartOutline,
      chatbubblesOutline,
      personCircleOutline,
    });
  }
  estilos = getComputedStyle(document.documentElement);

  principal = this.estilos.getPropertyValue('--app-principal').trim();
  secundario = this.estilos.getPropertyValue('--app-secundario').trim();
  texto = this.estilos.getPropertyValue('--app-texto').trim();
  textoContraste = this.estilos.getPropertyValue('--app-texto-contraste').trim();
  fondo = this.estilos.getPropertyValue('--app-fondo').trim();
  fondoSecundario = this.estilos.getPropertyValue('--app-fondo-secundario').trim();

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    const loading = await this.utilSvc.loading();
    await loading.present();

    try {
      this.estadisticas = await this.encuestaSvc.calcularEstadisticas();
      await this.cargarComentarios();

      if (this.estadisticas) {
        // Esperar a que el DOM esté listo
        setTimeout(() => {
          this.crearGraficos();
        }, 100);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      await loading.dismiss();
      this.cargando = false;
    }
  }

  async cargarComentarios() {
    try {
      const encuestas = await this.encuestaSvc.obtenerUltimasEncuestas(3);
      this.ultimosComentarios = encuestas
        .filter((e) => e.comentario && e.comentario.trim() !== '')
        .map((e) => ({
          comentario: e.comentario || '',
          fecha: e.created_at
            ? new Date(e.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Sin fecha',
        }));
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  }

  async recargar() {
    // Destruir gráficos existentes
    this.destruirGraficos();
    await this.cargarEstadisticas();
  }

  private destruirGraficos() {
    if (this.chartPromedios) {
      this.chartPromedios.destroy();
      this.chartPromedios = null;
    }
    if (this.chartRecomendacion) {
      this.chartRecomendacion.destroy();
      this.chartRecomendacion = null;
    }
    if (this.chartRadar) {
      this.chartRadar.destroy();
      this.chartRadar = null;
    }
  }

  private crearGraficos() {
    if (!this.estadisticas) return;

    this.crearGraficoPromedios();
    this.crearGraficoRecomendacion();
    this.crearGraficoRadar();
  }

  
  /**
   * Gráfico de barras con promedios de calificaciones
   */
  private crearGraficoPromedios() {
    const canvas = document.getElementById('chartPromedios') as HTMLCanvasElement;
    if (!canvas || !this.estadisticas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartPromedios = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Comida', 'Bebida', 'Precio-Calidad', 'Atención'],
        datasets: [
          {
            label: 'Promedio de Calificación',
            data: [
              this.estadisticas.promedioComida,
              this.estadisticas.promedioBebida,
              this.estadisticas.promedioPrecioCalidad,
              this.estadisticas.promedioAtencion,
            ],
            backgroundColor: [
              this.principal,
              this.secundario,
              this.textoContraste,
              this.texto,
            ],
            borderColor: [
              this.principal,
              this.secundario,
              this.principal,
              this.texto,
            ],
            borderWidth: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              color: this.texto,
              stepSize: 1,
              font: {
                size: 14,
              },
            },
            grid: {
              color: this.texto + '33',
            },
          },
          x: {
            ticks: {
              color: this.texto,
              font: {
                size: 12,
              },
            },
            grid: {
              color: this.texto + '33',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Calificaciones Promedio (1-5)',
            color: this.texto,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
      },
    });
  }

  /**
   * Gráfico de dona para probabilidad de recomendación
   */
  private crearGraficoRecomendacion() {
    const canvas = document.getElementById('chartRecomendacion') as HTMLCanvasElement;
    if (!canvas || !this.estadisticas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { si, no, tal_vez } = this.estadisticas.distribucionRecomendacion;

    this.chartRecomendacion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sí', 'No', 'Tal vez'],
        datasets: [
          {
            data: [si, no, tal_vez],
            backgroundColor: [
              this.secundario,
              this.principal,
              this.fondoSecundario,
            ],
            borderColor: [
              this.texto,
              this.texto,
              this.texto,
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.texto,
              font: {
                size: 14,
              },
              padding: 15,
            },
          },
          title: {
            display: true,
            text: '¿Nos recomendarías?',
            color: this.texto,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
      },
    });
  }

  /**
   * Gráfico de radar para visualización general
   */
  private crearGraficoRadar() {
    const canvas = document.getElementById('chartRadar') as HTMLCanvasElement;
    if (!canvas || !this.estadisticas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartRadar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Comida', 'Bebida', 'Precio-Calidad', 'Atención'],
        datasets: [
          {
            label: 'Calificaciones',
            data: [
              this.estadisticas.promedioComida,
              this.estadisticas.promedioBebida,
              this.estadisticas.promedioPrecioCalidad,
              this.estadisticas.promedioAtencion,
            ],
            backgroundColor: this.secundario + '55',
            borderColor: this.principal,
            borderWidth: 2,
            pointBackgroundColor: this.principal,
            pointBorderColor: this.texto,
            pointHoverBackgroundColor: this.texto,
            pointHoverBorderColor: this.principal,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: {
              color: this.texto,
              backdropColor: 'transparent',
              stepSize: 1,
              font: {
                size: 12,
              },
            },
            grid: {
              color: this.texto + '33',
            },
            pointLabels: {
              color: this.texto,
              font: {
                size: 13,
                weight: 'bold',
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Vista General',
            color: this.texto,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
      },
    });
  }

  ngOnDestroy() {
    this.destruirGraficos();
  }
}
