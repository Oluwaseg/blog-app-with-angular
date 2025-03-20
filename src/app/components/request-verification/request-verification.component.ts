import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, VerifyEmailRequest } from '../../services/auth.service';

@Component({
  selector: 'app-request-verification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './request-verification.component.html',
  styleUrls: ['./request-verification.component.scss'],
})
export class RequestVerificationComponent implements OnInit {
  verificationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.verificationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.verificationForm.patchValue({ email });
    }
  }

  onSubmit() {
    if (this.verificationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const verifyRequest: VerifyEmailRequest = this.verificationForm.value;

    this.authService.requestVerificationEmail(verifyRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage =
          response.message ||
          'Verification email sent. Please check your inbox.';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ||
          'Failed to send verification email. Please try again.';
      },
    });
  }
}
