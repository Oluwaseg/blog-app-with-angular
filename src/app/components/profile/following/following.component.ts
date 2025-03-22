import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { EventService } from '../../../services/event.service';
import { SocialService } from '../../../services/social.service';

interface Following {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
}

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  following: Following[] = [];
  isLoading = true;
  error: string | null = null;
  currentUser: User | null = null;

  constructor(
    private socialService: SocialService,
    private authService: AuthService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadFollowing();
  }

  loadFollowing(): void {
    this.isLoading = true;
    this.error = null;

    this.socialService.getFollowing().subscribe({
      next: (following) => {
        this.following = following;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading following:', err);
        this.error = 'Unable to load following users. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  unfollowUser(userId: string): void {
    this.socialService.unfollowUser(userId).subscribe({
      next: () => {
        // Remove the unfollowed user from the list
        this.following = this.following.filter((user) => user._id !== userId);
        // No need to emit an event here as the SocialService already does it
      },
      error: (err) => {
        console.error('Error unfollowing user:', err);
      },
    });
  }

  getUserImage(imageUrl?: string, userName?: string): string {
    if (imageUrl) {
      return imageUrl;
    }

    if (userName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userName
      )}&background=0D8ABC&color=fff`;
    }

    return 'https://ui-avatars.com/api/?background=0D8ABC&color=fff';
  }
}
