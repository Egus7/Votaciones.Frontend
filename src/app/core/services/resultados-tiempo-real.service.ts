import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subject } from 'rxjs';
import { AuthCoreServiceCore } from '../auth/auth-core.service';
import { supabase } from '../supabase/supabase.service';
import { TipoCandidato } from '../../api/models/tipo-candidato';

export interface ResultadosActualizadosEvent {
  eleccionId: string;
  tipoCandidato: TipoCandidato;
  mesaId: string;
  zonaId: string;
  parroquiaId: string;
  cantonId: string;
  provinciaId: string;
}
interface GrupoResultados {
  eleccionId: string;
  tipoCandidato: TipoCandidato;
}

// Reemplaza a SignalR: escucha el canal privado de Supabase Realtime que notifican las RPC de actas.
// El canal solo admite usuarios con el permiso resultados.view (política RLS en realtime.messages).
@Injectable({
  providedIn: 'root',
})
export class ResultadosTiempoRealService {
  private canal?: RealtimeChannel;
  private grupoActual?: GrupoResultados;

  private readonly resultadosActualizadosSubject = new Subject<ResultadosActualizadosEvent>();
  readonly resultadosActualizados$ = this.resultadosActualizadosSubject.asObservable();
  //error
  private readonly errorConexionSubject = new Subject<unknown>();
  readonly errorConexion$ = this.errorConexionSubject.asObservable();

  constructor(private authService: AuthCoreServiceCore) {}

  async unirseAResultados(eleccionId: string, tipoCandidato: TipoCandidato): Promise<void> {
    const eleccion = eleccionId.trim();
    if (!eleccion) {
      throw new Error('La elección es obligatoria.');
    }
    if (tipoCandidato === undefined) {
      throw new Error('El tipo de candidato no es válido.');
    }
    if (!this.authService.isAuthenticated()) {
      throw new Error('No existe una sesión autenticada para recibir resultados en tiempo real.');
    }

    const mismoGrupo =
      this.grupoActual?.eleccionId.toLowerCase() === eleccion.toLowerCase() &&
      this.grupoActual?.tipoCandidato === tipoCandidato;

    if (mismoGrupo) {
      return;
    }
    await this.salirDeResultados();

    this.grupoActual = {
      eleccionId: eleccion,
      tipoCandidato: tipoCandidato,
    };

    try {
      await this.suscribirse(this.grupoActual);
    } catch (error) {
      this.grupoActual = undefined;
      throw error;
    }
  }

  async salirDeResultados(): Promise<void> {
    this.grupoActual = undefined;
    const canal = this.canal;
    this.canal = undefined;
    if (canal) {
      await supabase.removeChannel(canal);
    }
  }

  async desconectar(): Promise<void> {
    await this.salirDeResultados();
  }

  private async suscribirse({ eleccionId, tipoCandidato }: GrupoResultados): Promise<void> {
    // El canal privado valida el JWT de la sesión actual
    const { data } = await supabase.auth.getSession();
    await supabase.realtime.setAuth(data.session?.access_token ?? null);

    // Mismo nombre que en privado.notificar_resultados: resultados:{eleccionId sin guiones}:{TipoCandidato}
    const topico = `resultados:${eleccionId.replace(/-/g, '').toLowerCase()}:${tipoCandidato}`;
    const canal = supabase.channel(topico, { config: { private: true } });

    canal.on('broadcast', { event: 'ResultadosActualizados' }, ({ payload }) => {
      this.resultadosActualizadosSubject.next(payload as ResultadosActualizadosEvent);
    });

    await new Promise<void>((resolve, reject) => {
      let suscrito = false;
      canal.subscribe((estado, error) => {
        if (estado === 'SUBSCRIBED') {
          suscrito = true;
          resolve();
          return;
        }
        if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
          const motivo = error ?? new Error('No se pudo conectar a los resultados en tiempo real.');
          if (suscrito) {
            this.errorConexionSubject.next(motivo);
          } else {
            reject(motivo);
          }
        }
      });
    });

    this.canal = canal;
  }
}
