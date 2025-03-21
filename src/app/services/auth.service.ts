import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  _id?: string;
  name: string;
  email: string;
  image?: string;
  isVerified: boolean;
  username?: string;
  bio?: string;
  dob?: string;
  profession?: string;
  interests?: string[];
  contact?: {
    phone?: string;
    alternateEmail?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface OAuthResponse {
  success: boolean;
  token: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken()
  );
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
    this.verifyAuthState();
  }

  public getCurrentUserId(): string {
    return this.currentUserSubject.value?.id?.toString() || '';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(userData: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/register`,
      userData
    );
  }
  verifyEmail(token: string): Observable<{ message: string }> {
    // For GET request with query param
    return this.http.get<{ message: string }>(
      `${this.apiUrl}/api/verify-email?token=${token}`
    );
  }

  verifyEmailWithBody(token: string): Observable<{ message: string }> {
    // For POST request with body
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/verify-email`,
      { token }
    );
  }

  requestVerificationEmail(
    email: VerifyEmailRequest
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/request-verification`,
      email
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Clear any existing tokens before login
    this.logout();

    interface ApiResponse {
      user?: User;
      token?: string;
      message?: string;
      data?: {
        user?: User;
        token?: string;
      };
    }

    return this.http
      .post<ApiResponse>(`${this.apiUrl}/api/login`, credentials)
      .pipe(
        map((response) => {
          // Extract data from response based on structure
          let user: User | undefined;
          let token: string | undefined;

          if (response.data?.user) {
            user = response.data.user;
          } else if (response.user) {
            user = response.user;
          }

          if (response.data?.token) {
            token = response.data.token;
          } else if (response.token) {
            token = response.token;
          }

          if (!token || !user) {
            console.error('Login response missing token or user');
            throw new Error('Token or user missing in login response');
          }

          const authResponse: AuthResponse = {
            user: user,
            token: token,
            message: response.message,
          };

          this.handleAuthentication(authResponse);
          return authResponse;
        }),
        catchError((error) => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  forgotPassword(
    email: ForgotPasswordRequest
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/forgot-password`,
      email
    );
  }

  resetPassword(
    resetData: ResetPasswordRequest
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/reset-password`,
      resetData
    );
  }

  loginWithGoogle(): void {
    localStorage.setItem('oauth_redirect', this.router.url);
    window.location.href = `${this.apiUrl}/api/auth/google`;
  }

  handleOAuthToken(token: string): Observable<boolean> {
    try {
      if (!token) {
        console.error('OAuth token is empty');
        return of(false);
      }

      // First validate the token format and decode it
      const user = this.decodeToken(token);
      if (!user) {
        console.error('Failed to decode OAuth token');
        return of(false);
      }

      // Only store the token if it's valid
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      return of(true);
    } catch (error) {
      console.error('Error handling OAuth token:', error);
      return of(false);
    }
  }

  private decodeToken(token: string): User | null {
    try {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Invalid token format: empty or not a string');
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format: not a JWT token (missing parts)');
        return null;
      }

      let payload;
      try {
        payload = JSON.parse(atob(parts[1]));
      } catch (e) {
        console.error('Failed to decode token payload:', e);
        return null;
      }

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.error('Token expired at:', new Date(payload.exp * 1000));
        return null;
      }

      // Check required fields
      if (!payload.userId || !payload.email) {
        console.error('Token missing required fields');
        return null;
      }

      return {
        id: payload.userId,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        isVerified: true,
        image: payload.image,
        username: payload.username,
        bio: payload.bio,
        dob: payload.dob,
        profession: payload.profession,
        interests: payload.interests,
        contact: payload.contact,
        address: payload.address,
        social: payload.social,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private handleAuthentication(response: AuthResponse): void {
    if (!response?.token) {
      console.error('Authentication failed: Missing token in response');
      return;
    }

    // Validate token format
    try {
      const parts = response.token.split('.');
      if (parts.length !== 3) {
        console.error('Authentication failed: Invalid token format');
        return;
      }

      // Try to decode the payload to validate it
      JSON.parse(atob(parts[1]));
    } catch (e) {
      console.error('Authentication failed: Could not decode token', e);
      return;
    }

    // If we got here, token looks valid
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private loadUser(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');

    if (token) {
      // If token exists but no user in localStorage, try to get user from token
      if (!userJson) {
        const decodedUser = this.decodeToken(token);
        if (decodedUser) {
          localStorage.setItem('user', JSON.stringify(decodedUser));
          this.currentUserSubject.next(decodedUser);
          this.isAuthenticatedSubject.next(true);
          return;
        } else {
          // Token invalid, clear it
          this.logout();
          return;
        }
      }

      try {
        const user = JSON.parse(userJson) as User;
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    } else if (userJson) {
      // User exists in localStorage but no token, clear user too
      localStorage.removeItem('user');
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  // Check the auth state using an API call to confirm token validity
  verifyAuthState(): void {
    const token = this.getToken();
    if (!token) return;

    // Validate token format before making API call
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Token has invalid format - not a valid JWT');
        this.logout();
        return;
      }

      // Basic validation only
      JSON.parse(atob(tokenParts[0]));
      atob(tokenParts[1]);
    } catch (e) {
      console.error('Error inspecting token:', e);
      this.logout();
      return;
    }

    // Silent API call to verify token
    this.http
      .get<{ authenticated: boolean }>(`${this.apiUrl}/api/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        error: (err) => {
          console.error('Auth verification failed:', err);
          if (err.status === 401) {
            this.logout();
          }
        },
      });
  }

  // USER PROFILE ENDPOINTS

  getUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/api/user/profile`).pipe(
      map((response) => {
        // Extract user data from the response based on structure
        let userData: any = null;

        if (response.data?.user) {
          userData = response.data.user;
        } else if (response.user) {
          userData = response.user;
        } else if (response.data) {
          userData = response.data;
        } else {
          userData = response;
        }

        // If we found a valid user with an ID, update stored data
        if (userData && (userData._id || userData.id)) {
          // Create a proper User object with correct ID field
          const user: User = {
            ...userData,
            // Ensure id is set (use _id if id is not available)
            id: userData.id || userData._id,
          };

          // Create a timestamp for the image to force reload
          if (user.image) {
            const timestamp = Date.now();
            user.image = user.image.includes('?')
              ? `${user.image.split('?')[0]}?_t=${timestamp}`
              : `${user.image}?_t=${timestamp}`;
          }

          // Store in localStorage and notify subscribers
          localStorage.setItem('user', JSON.stringify(user));

          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.currentUserSubject.next({ ...user });
          }, 0);

          return user;
        }

        // If we can't find a valid user, return an empty user to avoid type errors
        return (
          this.currentUserSubject.getValue() || {
            id: 0,
            name: '',
            email: '',
            isVerified: false,
          }
        );
      })
    );
  }

  updateUserDetails(userDetails: any): Observable<User> {
    return this.http
      .put<{ user: User; message: string }>(
        `${this.apiUrl}/api/user/profile`,
        userDetails
      )
      .pipe(
        map((response) => {
          if (response.user) {
            // Get current user data to ensure we don't lose fields
            const currentUser = this.currentUserSubject.getValue();

            // Create a complete user object with all fields
            const updatedUser: User = {
              ...currentUser,
              ...response.user,
            };

            // Update localStorage with complete user data
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Emit the updated user to all subscribers
            this.currentUserSubject.next({ ...updatedUser });
          }
          return response.user;
        })
      );
  }

  updatePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/api/user/profile/password`,
      passwordData
    );
  }

  updateProfilePicture(imageFile: File): Observable<User> {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Get the current user first
    const currentUser = this.currentUserSubject.getValue();

    return this.http
      .put<{ user: User; message: string }>(
        `${this.apiUrl}/api/user/profile/picture`,
        formData
      )
      .pipe(
        map((response) => {
          if (response.user) {
            // Create a merged user object with new cache timestamp
            const timestamp = Date.now();
            const updatedUser: User = {
              ...currentUser,
              ...response.user,
              // Ensure image has a fresh timestamp
              image: response.user.image
                ? response.user.image.includes('?')
                  ? `${response.user.image.split('?')[0]}?_t=${timestamp}`
                  : `${response.user.image}?_t=${timestamp}`
                : undefined,
            };

            // Update localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Force update of all components
            this.currentUserSubject.next({ ...updatedUser });

            return updatedUser;
          }
          return response.user;
        })
      );
  }

  // Method to force refresh of user data
  refreshUserData(): Observable<User> {
    return this.getUserProfile();
  }
}
