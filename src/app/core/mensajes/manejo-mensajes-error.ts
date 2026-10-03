import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ManejoMensajesError {

  getMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      // Backend devuelve { message: '...' }
      if (error.error?.message) {
        return error.error.message;
      }
      // Backend devuelve directamente un string
      if (typeof error.error === 'string') {
        try {
          const errorJson = JSON.parse(error.error);
          if (errorJson?.message) {
            return errorJson.message;
          }
        } catch {
          // No era JSON válido, usamos el string directamente
        }
        return error.error;
      }
      // Mensaje propio de HttpClient
      if (error.message) {
        return error.message;
      }
    }
    return 'Ocurrió un error inesperado.';
  }

}
