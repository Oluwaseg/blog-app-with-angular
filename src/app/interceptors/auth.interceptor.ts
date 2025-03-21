import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Helper service function to get token from localStorage directly
// This avoids circular dependency with AuthService
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to remove token from localStorage
const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token directly from localStorage instead of through AuthService
  const token = getAuthToken();

  // Skip token for login/register endpoints
  const isAuthEndpoint =
    req.url.includes('/api/login') ||
    req.url.includes('/api/register') ||
    req.url.includes('/api/forgot-password') ||
    req.url.includes('/api/reset-password');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    // Validate token format before adding to request
    if (token.split('.').length !== 3) {
      console.error('Invalid token format, removing invalid token');
      // Clear invalid token
      removeAuthToken();
    } else {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Only logout and redirect for non-auth endpoints
        if (!isAuthEndpoint) {
          // Clear the token directly
          removeAuthToken();

          // Redirect to login page
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, error: 'session_expired' },
          });
        }
      }
      return throwError(() => error);
    })
  );
};
