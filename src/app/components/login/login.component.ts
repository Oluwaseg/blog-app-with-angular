import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isEmailNotVerified = false;
  unverifiedEmail = '';
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.isEmailNotVerified = false;

    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.isEmailNotVerified = true;
          this.unverifiedEmail = this.loginForm.value.email;
          this.errorMessage =
            'Your email has not been verified. Please verify your email to continue.';
        } else {
          this.errorMessage =
            error.error?.message ||
            'Login failed. Please check your credentials.';
        }
      },
    });
  }

  requestVerification() {
    this.router.navigate(['/request-verification'], {
      queryParams: { email: this.unverifiedEmail },
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
