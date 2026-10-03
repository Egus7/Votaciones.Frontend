import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthCoreServiceCore } from '../auth/auth-core.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthCoreServiceCore);
  const router = inject(Router);

  const token = authService.getToken();

  const authReq = token ? req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }) : req;

  return next(authReq).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && token) {
      authService.clearSession();
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
