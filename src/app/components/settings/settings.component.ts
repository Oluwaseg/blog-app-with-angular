import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  userProfileForm!: FormGroup;
  passwordForm!: FormGroup;
  user: User | null = null;
  isLoading = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  activeTab = 'profile'; // Options: 'profile', 'account', 'security', 'social'
  defaultAvatar = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff';
  private cachedAvatarUrl: string | null = null;
  private lastUserImageUrl: string | null = null;
  private subscriptions: Subscription[] = [];
  private currentTimestamp = Date.now();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();

    // Initialize the timestamp once at component startup
    this.currentTimestamp = Date.now();

    // Refresh data to get latest image
    this.authService.refreshUserData().subscribe({
      next: (user) => {
        // After getting fresh user data, refresh the timestamp once
        this.refreshImageTimestamp();
      },
    });

    // Subscribe to user changes to reset avatar cache when user changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user) => {
        if (user?.image !== this.lastUserImageUrl) {
          this.lastUserImageUrl = user?.image || null;
          this.cachedAvatarUrl = null; // Reset cache when image URL changes
          // Update timestamp when user image changes
          this.refreshImageTimestamp();
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadUserProfile(): void {
    this.isLoading = true;

    // First try to get the current user from the service cache
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      this.user = currentUser;
      this.populateForm();
      this.isLoading = false;
      // Refresh timestamp when we load user data
      this.refreshImageTimestamp();
    }

    // Also fetch fresh data from API
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm();
        this.isLoading = false;
        // Refresh timestamp when we get fresh user data
        this.refreshImageTimestamp();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;

        // If we already had a cached user, at least we have some data
        if (!this.user) {
          if (error.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      },
    });
  }

  initForms(): void {
    this.userProfileForm = this.fb.group({
      username: ['', [Validators.maxLength(30)]],
      name: ['', [Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(500)]],
      dob: [''],
      profession: ['', [Validators.maxLength(100)]],
      interests: [''],
      contact: this.fb.group({
        phone: ['', [Validators.maxLength(20)]],
        alternateEmail: ['', [Validators.email]],
        website: [''],
      }),
      address: this.fb.group({
        street: ['', [Validators.maxLength(100)]],
        city: ['', [Validators.maxLength(50)]],
        state: ['', [Validators.maxLength(50)]],
        country: ['', [Validators.maxLength(50)]],
        postalCode: ['', [Validators.maxLength(20)]],
      }),
      social: this.fb.group({
        github: [''],
        twitter: [''],
        linkedin: [''],
        facebook: [''],
        instagram: [''],
      }),
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  populateForm(): void {
    if (!this.user) {
      return;
    }

    // Format date of birth if it exists
    let formattedDob = '';
    if (this.user.dob) {
      try {
        // Try to parse and format the date (assuming ISO format from API)
        const date = new Date(this.user.dob);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for HTML date input
          formattedDob = date.toISOString().split('T')[0];
        } else {
          formattedDob = this.user.dob; // Keep as is if not valid date
        }
      } catch (e) {
        formattedDob = this.user.dob; // Keep as is if error
      }
    }

    // Create a deep copy of user data to work with
    const formData = {
      username: this.user.username || '',
      name: this.user.name || '',
      bio: this.user.bio || '',
      dob: formattedDob,
      profession: this.user.profession || '',
      interests: this.user.interests ? this.user.interests.join(', ') : '',
      contact: {
        phone: this.user.contact?.phone || '',
        alternateEmail: this.user.contact?.alternateEmail || '',
        website: this.user.contact?.website || '',
      },
      address: {
        street: this.user.address?.street || '',
        city: this.user.address?.city || '',
        state: this.user.address?.state || '',
        country: this.user.address?.country || '',
        postalCode: this.user.address?.postalCode || '',
      },
      social: {
        github: this.user.social?.github || '',
        twitter: this.user.social?.twitter || '',
        linkedin: this.user.social?.linkedin || '',
        facebook: this.user.social?.facebook || '',
        instagram: this.user.social?.instagram || '',
      },
    };

    // Use patchValue for the entire form, which is better for nested structures
    this.userProfileForm.patchValue(formData);

    // Ensure each form control is marked as pristine and untouched initially
    this.userProfileForm.markAsPristine();
    this.userProfileForm.markAsUntouched();
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onImageChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length) {
      // Clear previous selected image and preview
      this.imagePreview = null;

      this.selectedImage = element.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        // Run this code outside Angular's zone to avoid triggering change detection
        this.ngZone.runOutsideAngular(() => {
          this.imagePreview = e.target?.result as string;

          // Re-enter Angular zone only after setting the preview
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        });
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedImage) return;

    this.isSubmitting = true;
    this.authService.updateProfilePicture(this.selectedImage).subscribe({
      next: (user) => {
        // Clear all caches and update timestamp
        this.cachedAvatarUrl = null;
        this.lastUserImageUrl = null;
        this.refreshImageTimestamp();

        // Update the local user object with the new user data
        this.user = { ...user };

        // Force a UI refresh by triggering change detection
        setTimeout(() => {
          // Force refresh of user data in all components
          this.authService.refreshUserData().subscribe({
            next: (latestUser) => {
              // Update local user again with the latest data
              this.user = { ...latestUser };
            },
          });
        }, 0);

        this.successMessage = 'Profile picture updated successfully!';
        this.isSubmitting = false;
        this.selectedImage = null;

        // Clear the preview after successful upload
        this.imagePreview = null;

        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Failed to update profile picture.';
        this.isSubmitting = false;
        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  saveProfile(): void {
    // Ensure form is stable and fully initialized
    if (this.isLoading) {
      this.errorMessage = 'Please wait for the form to load completely.';
      return;
    }

    if (this.userProfileForm.invalid) {
      this.errorMessage = 'Please fix the validation errors and try again.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Format form data for API submission
    const formValue = { ...this.userProfileForm.value };

    // Handle date format
    if (formValue.dob) {
      try {
        // Try to ensure date is in ISO format
        const date = new Date(formValue.dob);
        if (!isNaN(date.getTime())) {
          formValue.dob = date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      } catch (e) {
        // Keep as is if error
      }
    } else {
      delete formValue.dob; // Remove empty date field
    }

    // Convert comma-separated interests to array
    if (formValue.interests) {
      formValue.interests = formValue.interests
        .split(',')
        .map((interest: string) => interest.trim())
        .filter((interest: string) => interest);
    } else {
      delete formValue.interests; // Remove empty interests field
    }

    // Clean empty strings from nested objects
    this.cleanEmptyValues(formValue);

    this.authService.updateUserDetails(formValue).subscribe({
      next: (user) => {
        // Clear all caches and update timestamp once
        this.cachedAvatarUrl = null;
        this.lastUserImageUrl = null;
        this.refreshImageTimestamp();

        // Update local user with returned data
        this.user = { ...user };

        this.successMessage = 'Profile updated successfully!';
        this.isSubmitting = false;

        // Force UI refresh and ensure all components have latest data
        setTimeout(() => {
          this.authService.refreshUserData().subscribe({
            next: (latestUser) => {
              // Update local user again with the latest data
              this.user = { ...latestUser };
            },
          });
        }, 0);

        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update profile.';
        this.isSubmitting = false;
        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  // Helper to clean empty values from objects
  cleanEmptyValues(obj: any): void {
    if (!obj) return;

    Object.keys(obj).forEach((key) => {
      // Handle nested objects
      if (
        obj[key] &&
        typeof obj[key] === 'object' &&
        !Array.isArray(obj[key])
      ) {
        this.cleanEmptyValues(obj[key]);
        // Remove empty objects
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      } else if (
        obj[key] === '' ||
        obj[key] === null ||
        obj[key] === undefined
      ) {
        // Remove empty primitives
        delete obj[key];
      } else if (Array.isArray(obj[key]) && obj[key].length === 0) {
        // Remove empty arrays
        delete obj[key];
      }
    });
  }

  getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.userProfileForm.controls).forEach((key) => {
      const control = this.userProfileForm.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }

      // Check nested form groups
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          const nestedControl = control.get(nestedKey);
          if (nestedControl?.errors) {
            errors[`${key}.${nestedKey}`] = nestedControl.errors;
          }
        });
      }
    });
    return errors;
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isSubmitting = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    this.authService.updatePassword(passwordData).subscribe({
      next: (response) => {
        this.passwordSuccessMessage =
          response.message || 'Password updated successfully!';
        this.isSubmitting = false;
        this.passwordForm.reset();
        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.passwordSuccessMessage = ''), 3000);
      },
      error: (error) => {
        this.passwordErrorMessage =
          error.error?.message || 'Failed to update password.';
        this.isSubmitting = false;
        // Wait for 3 seconds then clear the message
        setTimeout(() => (this.passwordErrorMessage = ''), 3000);
      },
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Get user avatar with fallback to generated avatar
  getUserAvatar(): string {
    // First check for preview image when uploading
    if (this.imagePreview) {
      return this.imagePreview;
    }

    // Always check if we need to force a fresh image URL
    if (this.user?.image) {
      // Split the URL at '?' to remove any existing query parameters
      const baseUrl = this.user.image.split('?')[0];

      // Add a timestamp parameter using the stable timestamp
      return `${baseUrl}?_t=${this.currentTimestamp}`;
    }

    // Fallback to generated avatar
    if (this.user?.name) {
      const name = encodeURIComponent(this.user.name);
      return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
    }

    return this.defaultAvatar;
  }

  // Add a method to refresh the timestamp when needed
  refreshImageTimestamp(): void {
    this.currentTimestamp = Date.now();
  }
}
