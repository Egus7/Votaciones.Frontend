import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { AuthCoreServiceCore } from '../auth/auth-core.service';
import { ApiConfiguration } from '../../api/api-configuration';
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
const TIPO_CANDIDATO_NUMERO: Record<TipoCandidato, number> = {
  Presidente: 1,
  Prefecto: 2,
  Alcalde: 3,
  ConcejalUrbano: 4,
  ConcejalRural: 5,
};
//para notificacion
const TIPO_CANDIDATO_TEXTO: Record<number, TipoCandidato> = {
  1: 'Presidente',
  2: 'Prefecto',
  3: 'Alcalde',
  4: 'ConcejalUrbano',
  5: 'ConcejalRural',
};
@Injectable({
  providedIn: 'root',
})
export class ResultadosSignalrService {
  private connection?: HubConnection;
  private grupoActual?: GrupoResultados;

  private readonly resultadosActualizadosSubject = new Subject<ResultadosActualizadosEvent>();
  readonly resultadosActualizados$ = this.resultadosActualizadosSubject.asObservable();
  //error
  private readonly errorConexionSubject = new Subject<unknown>();
  readonly errorConexion$ = this.errorConexionSubject.asObservable();

  constructor(
    private authService: AuthCoreServiceCore,
    private readonly apiConfig: ApiConfiguration,
  ) {}

  async conectar(): Promise<void> {
    if (
      this.connection?.state === HubConnectionState.Connected ||
      this.connection?.state === HubConnectionState.Connecting
    ) {
      return;
    }
    // recibir token
    const token = this.authService.getToken();
    // Validar token
    if (!token || !this.authService.isAuthenticated()) {
      throw new Error('No existe una sesión autenticada para conectar con SignalR.');
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${this.apiConfig.rootUrl}/hubs/resultados`, {
        accessTokenFactory: () => {
          const tokenActual = this.authService.getToken();
          if (!tokenActual) {
            throw new Error('No existe un token de autenticación.');
          }
          return tokenActual;
        },
      })
      .withAutomaticReconnect()
      .build();

    this.connection = connection;
    connection.on(
      'ResultadosActualizados',
      (
        eleccionId: string,
        tipoCandidatoNumero: number,
        mesaId: string,
        zonaId: string,
        parroquiaId: string,
        cantonId: string,
        provinciaId: string,
      ) => {
        const evento: ResultadosActualizadosEvent = {
          eleccionId,
          tipoCandidato: TIPO_CANDIDATO_TEXTO[tipoCandidatoNumero],
          mesaId,
          zonaId,
          parroquiaId,
          cantonId,
          provinciaId,
        };

        this.resultadosActualizadosSubject.next(evento);
      },
    );

    connection.onreconnected(async () => {
      try {
        await this.unirseAlGrupoActual();
      } catch (error) {
        this.errorConexionSubject.next(error);
      }
    });

    connection.onclose((error) => {
      if (error) {
        this.errorConexionSubject.next(error);
      }
    });

    try {
      await connection.start();
    } catch (error) {
      if (this.connection === connection) {
        this.connection = undefined;
      }
      throw error;
    }
  }

  async unirseAResultados(eleccionId: string, tipoCandidato: TipoCandidato): Promise<void> {
    const eleccion = eleccionId.trim();
    if (!eleccion) {
      throw new Error('La elección es obligatoria.');
    }
    if (tipoCandidato === undefined) {
      throw new Error('El tipo de candidato no es válido.');
    }

    await this.conectar();

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
      await this.unirseAlGrupoActual();
    } catch (error) {
      this.grupoActual = undefined;
      throw error;
    }
  }

  private async unirseAlGrupoActual(): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected ||
      !this.grupoActual
    ) {
      return;
    }

    const { eleccionId, tipoCandidato } = this.grupoActual;
    await this.connection.invoke(
      'UnirseAResultados',
      eleccionId, TIPO_CANDIDATO_NUMERO[tipoCandidato],);
  }

  async salirDeResultados(): Promise<void> {
    if (!this.grupoActual) {
      return;
    }
    const grupo = this.grupoActual;

    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.invoke(
        'SalirDeResultados',
        grupo.eleccionId,
        TIPO_CANDIDATO_NUMERO[grupo.tipoCandidato],
      );
    }

    this.grupoActual = undefined;
  }

  async desconectar(): Promise<void> {
    this.grupoActual = undefined;

    const connection = this.connection;
    this.connection = undefined;
    if (connection) {
      await connection.stop();
    }
  }

}
