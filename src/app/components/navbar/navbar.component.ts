import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isProfileMenuOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  defaultAvatar = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;
    });

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
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
    if (this.currentUser?.image) {
      return this.currentUser.image;
    }

    if (this.currentUser?.name) {
      const name = encodeURIComponent(this.currentUser.name);
      return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
    }

    return this.defaultAvatar;
  }

  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
  }
}
