import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuthService,
  ForgotPasswordRequest,
} from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const forgotPasswordData: ForgotPasswordRequest =
      this.forgotPasswordForm.value;

    this.authService.forgotPassword(forgotPasswordData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.emailSent = true;
        this.successMessage =
          response.message ||
          'Password reset email sent. Please check your inbox.';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ||
          'Failed to send password reset email. Please try again.';
      },
    });
  }
}
