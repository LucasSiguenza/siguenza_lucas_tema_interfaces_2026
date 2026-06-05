import { Routes } from '@angular/router';

export const routes: Routes = [
  //! =================== Inicio ===================
{
  path: '',
  redirectTo: 'prelogin',
  pathMatch: 'full',
},
{
  path: 'prelogin',
  loadComponent: () => import('./pages/prelogin/prelogin.page').then(m => m.PreloginPage)
},
  //! =================== Páginas principales ===================
  {
    path: 'control',
    loadComponent: () => import('./pages/alfa/control/control.page').then(m => m.ControlPage)
  },
  {
    path: 'cliente',
    loadComponent: () => import('./pages/gamma/cliente/cliente.page').then(m => m.ClientePage)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
  },
  //! =================== Autenticación ===================
  {
    path: 'login-usuario',
    loadComponent: () => import('./pages/alfa/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'login-anonimo',
    loadComponent: () => import('./pages/alfa/login-anonimo/login-anonimo.page').then(m => m.LoginAnonimoPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/alfa/register/register.page').then(m => m.RegisterPage)
  },
  //! =================== Flujo del cliente ===================
  //~ =================== Pedido
  {
    path: 'carta',
    loadComponent: () => import('./pages/gamma/carta/carta.page').then( m => m.CartaPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/gamma/chat/chat.component').then(c => c.ChatComponent)
  },
  {
    path: 'cliente/mesa/:id',
    loadComponent: () => import('./pages/alfa/panel-mesa-asignada/panel-mesa-asignada.page').then( m => m.PanelMesaAsignadaPage)
  },
  {
    path: 'cliente/cuenta',
    loadComponent: () => import('./pages/alfa/cuenta/cuenta.page').then( m => m.CuentaPage)
  },
  {
    path: 'cliente/cuenta/:propina',
    loadComponent: () => import('./pages/alfa/cuenta/cuenta.page').then( m => m.CuentaPage)
  },
  {
    path: 'descargar/:idPedido/:propina',
    loadComponent: () => import('./components/alfa/ticket-pedido/ticket-pedido.component').then( m => m.TicketPedidoComponent)
  },
  {
  path: 'reservar-mesa',
    loadComponent: () => import('./pages/gamma/reservar-mesa/reservar-mesa.page').then( m => m.ReservarMesaPage)
  },
  //~ =================== Juegos
  {
    path: 'juegos',
    loadComponent: () => import('./pages/gamma/juegos/seleccion-juegos/juegos.page').then( m => m.JuegosPage)
  },
  {
    path: 'sudoku',
    loadComponent: () => import('./pages/gamma/juegos/sudoku/sudoku.page').then( m => m.SudokuPage)
  },
  {
    path: 'tateti',
    loadComponent: () => import('./pages/gamma/juegos/tateti/tateti.page').then( m => m.TatetiPage)
  },
  {
    path: 'ayudar-mozo',
    loadComponent: () => import('./pages/gamma/juegos/ayudar-mozo/ayudar-mozo.page').then( m => m.AyudarMozoPage)
  },
  //~ =================== Encuestas
  
  {
    path: 'encuesta',
    loadComponent: () => import('./pages/gamma/encuesta/encuesta-form/encuesta-form.component').then( m => m.EncuestaFormComponent)
  },
  {
    path: 'resultados-encuesta',
    loadComponent: () => import('./pages/gamma/encuesta/resultados-encuesta/resultados-encuesta.page').then( m => m.ResultadosEncuestaPage)
  },
  {
    path: 'test',
    loadComponent: () => import('./pages/tests/tests.page').then(m => m.TestsPage) 
  },
  





];