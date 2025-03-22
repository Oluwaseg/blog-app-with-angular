import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isProfileMenuOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  defaultAvatar = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff';
  private subscriptions: Subscription[] = [];
  private userImageCache = new Map<string, string>();
  private avatarUrl: string = this.defaultAvatar;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadUserFromLocalStorage();
    this.subscribeToAuthChanges();

    // Only fetch user profile if already authenticated from local storage
    if (this.isAuthenticated) {
      // Run outside Angular zone to avoid ExpressionChangedAfterItHasBeenCheckedError
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          // Force fetch user profile on init to ensure fresh data
          this.ngZone.run(() => {
            this.authService.getUserProfile().subscribe({
              next: () => this.cdr.detectChanges(),
              error: () => {},
            });
          });
        }, 0);
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadUserFromLocalStorage(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const storedUser = JSON.parse(userJson);
        this.currentUser = storedUser;
        this.isAuthenticated = true;
        this.prepareUserAvatar();
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }

  private subscribeToAuthChanges(): void {
    // Subscribe to authentication state
    this.subscriptions.push(
      this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;
        if (!isAuthenticated) {
          this.currentUser = null;
          this.avatarUrl = this.defaultAvatar;
        }
        this.cdr.detectChanges();
      })
    );

    // Subscribe to user data changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user) => {
        if (JSON.stringify(this.currentUser) !== JSON.stringify(user)) {
          // Only update if user data actually changed
          this.currentUser = user ? { ...user } : null;
          this.userImageCache.clear();
          this.prepareUserAvatar();
          this.cdr.detectChanges();
        }
      })
    );
  }

  private prepareUserAvatar(): void {
    this.avatarUrl = this.generateAvatarUrl();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isProfileMenuOpen = false;
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const profileMenuTrigger = document.getElementById('profile-menu-trigger');
    const profileMenu = document.getElementById('profile-menu');

    if (profileMenuTrigger && profileMenu) {
      if (
        !profileMenuTrigger.contains(event.target as Node) &&
        !profileMenu.contains(event.target as Node)
      ) {
        this.isProfileMenuOpen = false;
      }
    }
  }

  getUserAvatar(): string {
    return this.avatarUrl;
  }

  private generateAvatarUrl(): string {
    // Generate consistent cache-busting URL when user changes
    if (this.currentUser?.image) {
      const imageUrl = this.currentUser.image;

      // If image URL already contains timestamp, use it directly
      if (imageUrl.includes('_t=')) {
        return imageUrl;
      }

      // Otherwise create a new timestamped URL
      const cacheKey = this.currentUser.id
        ? this.currentUser.id.toString()
        : 'temp-user';

      // Check if we have a cached version already
      if (this.userImageCache.has(cacheKey)) {
        return this.userImageCache.get(cacheKey) || imageUrl;
      }

      // Create a new cache-busted URL
      const timestamp = Date.now();
      const cacheBustedUrl = imageUrl.includes('?')
        ? `${imageUrl.split('?')[0]}?_t=${timestamp}`
        : `${imageUrl}?_t=${timestamp}`;

      this.userImageCache.set(cacheKey, cacheBustedUrl);
      return cacheBustedUrl;
    }

    // Use default avatar if no user image
    if (this.currentUser?.name) {
      const name = encodeURIComponent(this.currentUser.name);
      return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
    }

    return this.defaultAvatar;
  }

  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
    this.userImageCache.clear();
    this.avatarUrl = this.defaultAvatar;
  }
}
