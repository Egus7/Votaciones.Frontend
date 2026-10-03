import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ManejoMensajesError {

  getMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error?.message) {
        return error.error.message;
      }

      if (typeof error.error === 'string') {
        return error.error;
      }

      if (error.message) {
        return error.message;
      }
    }
    return 'Ocurrió un error inesperado.';
  }
  
}
