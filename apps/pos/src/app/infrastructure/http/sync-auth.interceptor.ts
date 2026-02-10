import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../application/services/auth.service';

function withAuthHeaders(
  req: HttpRequest<unknown>,
  authService: AuthService,
): HttpRequest<unknown> {
  const accessToken = authService.getCloudAccessToken();
  const tenantId = authService.getCloudTenantId();

  let request = req;

  if (accessToken) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  if (tenantId) {
    request = request.clone({
      setHeaders: {
        'X-Tenant-ID': tenantId,
      },
    });
  }

  return request;
}

export const syncAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const isAuthRefresh = req.url.includes('/auth/refresh');
  const isAuthLogin = req.url.includes('/auth/login');
  const shouldSkipRefresh = isAuthRefresh || isAuthLogin;

  const authorizedRequest = withAuthHeaders(req, authService);

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (shouldSkipRefresh) {
        return throwError(() => error);
      }

      const refreshToken = authService.getCloudRefreshToken();
      if (!refreshToken) {
        return throwError(() => error);
      }

      return from(authService.refreshCloudSession()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            return throwError(() => error);
          }
          const retried = withAuthHeaders(req, authService);
          return next(retried);
        }),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
