import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { HomeComponent } from './components/home/home.component';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { OAuthCallbackComponent } from './components/oauth-callback/oauth-callback.component';
import { RegisterComponent } from './components/register/register.component';
import { RequestVerificationComponent } from './components/request-verification/request-verification.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'request-verification', component: RequestVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'oauth-callback', component: OAuthCallbackComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard], // Protect this route
  },
  { path: '**', redirectTo: '' },
];
