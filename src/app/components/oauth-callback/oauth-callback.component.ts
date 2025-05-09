import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './oauth-callback.component.html',
  styleUrls: ['./oauth-callback.component.scss'],
})
export class OAuthCallbackComponent implements OnInit {
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.isLoading = false;
      this.errorMessage = decodeURIComponent(error);
    } else if (token) {
      this.authService.handleOAuthToken(token).subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to authenticate. Please try again.';
          console.error('OAuth authentication error:', err);
        },
      });
    } else {
      this.isLoading = false;
      this.errorMessage = 'No authentication token received. Please try again.';
    }
  }
}
