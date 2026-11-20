/* eslint-disable */
/* Escrito con el mismo formato que ng-openapi-gen para POST /api/Actas/eliminar-pruebas. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { EliminarActasPruebaDto } from '../../models/eliminar-actas-prueba-dto';

export interface ApiActasEliminarPruebasPost$Params {
      body?: EliminarActasPruebaDto
}

export function apiActasEliminarPruebasPost(http: HttpClient, rootUrl: string, params?: ApiActasEliminarPruebasPost$Params, context?: HttpContext): Observable<StrictHttpResponse<string>> {
  const rb = new RequestBuilder(rootUrl, apiActasEliminarPruebasPost.PATH, 'post');
  if (params) {
    rb.body(params.body, 'application/*+json');
  }

  return http.request(
    rb.build({ responseType: 'text', accept: '*/*', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<string>;
    })
  );
}

apiActasEliminarPruebasPost.PATH = '/api/Actas/eliminar-pruebas';
