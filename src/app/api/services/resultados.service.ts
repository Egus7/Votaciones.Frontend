import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AsignacionConcejalesDto } from '../models/asignacion-concejales-dto';
import { ResultadoEleccionDto } from '../models/resultado-eleccion-dto';
import { TipoCandidato } from '../models/tipo-candidato';
import { TipoResultado } from '../models/tipo-resultado';

interface FiltroResultado {
  eleccionId?: string;
  tipoCandidato?: TipoCandidato;
  tipoResultado?: TipoResultado;
}

@Injectable({ providedIn: 'root' })
export class ResultadosService {
  constructor(private supabase: SupabaseService) {}

  apiResultadosEleccionGet$Json(params?: FiltroResultado): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_eleccion', this.filtro(params));
  }

  apiResultadosEleccionProvinciaGet$Json(params?: FiltroResultado & { provinciaId?: string }): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_provincia', { ...this.filtro(params), p_provincia_id: params?.provinciaId });
  }

  apiResultadosEleccionCantonGet$Json(params?: FiltroResultado & { cantonId?: string }): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_canton', { ...this.filtro(params), p_canton_id: params?.cantonId });
  }

  apiResultadosEleccionParroquiaGet$Json(params?: FiltroResultado & { parroquiaId?: string }): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_parroquia', { ...this.filtro(params), p_parroquia_id: params?.parroquiaId });
  }

  apiResultadosEleccionZonaGet$Json(params?: FiltroResultado & { zonaId?: string }): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_zona', { ...this.filtro(params), p_zona_id: params?.zonaId });
  }

  apiResultadosEleccionMesaGet$Json(params?: FiltroResultado & { mesaId?: string }): Promise<ResultadoEleccionDto> {
    return this.supabase.rpc('resultados_mesa', { ...this.filtro(params), p_mesa_id: params?.mesaId });
  }

  apiResultadosAsignacionEscanosGet$Json(params?: FiltroResultado & { cantonId?: string }): Promise<AsignacionConcejalesDto> {
    return this.supabase.rpc('resultados_asignacion_escanos', { ...this.filtro(params), p_canton_id: params?.cantonId });
  }

  // Antes lo generaba el backend con ClosedXML; ahora se arma en el navegador con los mismos cocientes.
  async apiResultadosAsignacionConcejalesExcelGet(params?: FiltroResultado & { cantonId?: string }): Promise<Blob> {
    const asignacion = await this.apiResultadosAsignacionEscanosGet$Json(params);
    const { generarExcelAsignacionConcejales } = await import('./asignacion-concejales-excel');
    return generarExcelAsignacionConcejales(asignacion);
  }

  private filtro(params?: FiltroResultado): Record<string, unknown> {
    return {
      p_eleccion_id: params?.eleccionId,
      p_tipo_candidato: params?.tipoCandidato,
      p_tipo_resultado: params?.tipoResultado,
    };
  }
}
