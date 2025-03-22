import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { EventService } from '../../../services/event.service';
import { SocialService } from '../../../services/social.service';

interface Follower {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  isFollowing?: boolean;
}

@Component({
  selector: 'app-followers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss'],
})
export class FollowersComponent implements OnInit {
  followers: Follower[] = [];
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
    this.loadFollowers();
  }

  loadFollowers(): void {
    this.isLoading = true;
    this.error = null;

    this.socialService.getFollowers().subscribe({
      next: (followers) => {
        this.followers = followers;
        this.checkFollowStatus();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading followers:', err);
        this.error = 'Unable to load followers. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  checkFollowStatus(): void {
    // For each follower, check if current user is following them
    this.followers.forEach((follower, index) => {
      this.socialService.checkFollowingStatus(follower._id).subscribe({
        next: (isFollowing) => {
          this.followers[index].isFollowing = isFollowing;
        },
        error: (err) => {
          console.error('Error checking follow status:', err);
        },
      });
    });
  }

  followUser(userId: string): void {
    this.socialService.followUser(userId).subscribe({
      next: () => {
        const index = this.followers.findIndex((user) => user._id === userId);
        if (index !== -1) {
          this.followers[index].isFollowing = true;
        }
      },
      error: (err) => {
        console.error('Error following user:', err);
      },
    });
  }

  unfollowUser(userId: string): void {
    this.socialService.unfollowUser(userId).subscribe({
      next: () => {
        const index = this.followers.findIndex((user) => user._id === userId);
        if (index !== -1) {
          this.followers[index].isFollowing = false;
        }
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
