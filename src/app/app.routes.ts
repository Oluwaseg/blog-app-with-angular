import { Routes } from '@angular/router';
import { BlogCategoryComponent } from './components/blog/blog-category/blog-category.component';
import { BlogCreateComponent } from './components/blog/blog-create/blog-create.component';
import { BlogDetailComponent } from './components/blog/blog-detail/blog-detail.component';
import { BlogEditComponent } from './components/blog/blog-edit/blog-edit.component';
import { BlogListComponent } from './components/blog/blog-list/blog-list.component';
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
    canActivate: [AuthGuard],
  },
  {
    path: 'blogs',
    component: BlogListComponent,
  },
  {
    path: 'blogs/category',
    component: BlogCategoryComponent,
  },
  {
    path: 'blogs/create',
    component: BlogCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'blogs/:slug',
    component: BlogDetailComponent,
  },
  {
    path: 'blogs/:slug/edit',
    component: BlogEditComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
];
