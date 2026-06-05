import { Interval } from "luxon";
import { Usuario } from "./usuario";
import { Mesa } from "./Mesa";

export interface Reserva{
    id?: number,
    created_at?: string,
    uid?: string,
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'registrada',
    usuario: string,
    id_mesa?: number,
    fecha_reservada: string,
    users?: Usuario,
    mesas?: Mesa,
    intervaloReserva?: Interval
}