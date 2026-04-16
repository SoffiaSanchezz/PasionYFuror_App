import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { Router } from '@angular/router';

// Rutas públicas que NO deben redirigir al login ante un 401
const PUBLIC_API_ROUTES = [
  '/face/identify-schedule',
  '/attendance',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly sessionService: SessionProviderService,
    private readonly router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.sessionService.getInformationToken();

    // 1. Inyectar Token Bearer si existe y NO es una petición de login
    if (token && !request.url.includes('/auth/login')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isPublicRoute = PUBLIC_API_ROUTES.some(route => request.url.includes(route));

        // 2. Redirigir al login solo si es 401, no es login y no es ruta pública
        if (error.status === 401 && !request.url.includes('/auth/login') && !isPublicRoute) {
          this.sessionService.clearSession();
          this.router.navigate(['/login'], { replaceUrl: true });
        }
        return throwError(() => error);
      })
    );
  }
}
