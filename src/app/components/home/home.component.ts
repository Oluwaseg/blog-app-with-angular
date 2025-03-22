import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Activity, ActivityService } from '../../services/activity.service';
import { AuthService, User } from '../../services/auth.service';
import { Blog, BlogResponse, BlogService } from '../../services/blog.service';
import { EventService } from '../../services/event.service';
import { SocialService, SuggestedUser } from '../../services/social.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user: User | null = null;
  blogs: Blog[] = [];
  isLoading = true;
  error: string | null = null;
  timestamp = Date.now();
  loadingSuggestions = true;
  suggestedUsers: SuggestedUser[] = [];
  loadingCounts = true;
  followersCount = 0;
  followingCount = 0;
  postsCount = 0;

  // Activity related properties
  activities: Activity[] = [];
  loadingActivities = true;
  unreadActivitiesCount = 0;

  private socialUpdateSubscription: Subscription | null = null;
  private activitySubscription: Subscription | null = null;

  trendingTopics = [
    'Angular',
    'Tailwind CSS',
    'Web Development',
    'JavaScript',
    'TypeScript',
    'Frontend',
  ];

  constructor(
    private authService: AuthService,
    private blogService: BlogService,
    private socialService: SocialService,
    private eventService: EventService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadSuggestedUsers();
    this.loadBlogs();

    if (this.user) {
      this.loadFollowCounts();
      this.loadActivities();

      // Subscribe to activity updates
      this.activitySubscription = this.activityService.activities$.subscribe(
        () => {
          this.loadActivities();
        }
      );
    }

    // Subscribe to authentication changes
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      this.timestamp = Date.now();
      if (user) {
        this.loadFollowCounts();
        this.loadActivities();
      }
    });

    // Subscribe to social update events
    this.socialUpdateSubscription = this.eventService.socialUpdate$.subscribe(
      (update) => {
        if (update.type === 'follow' || update.type === 'unfollow') {
          this.loadFollowCounts();
          this.loadSuggestedUsers();
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.socialUpdateSubscription) {
      this.socialUpdateSubscription.unsubscribe();
    }
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
    }
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.blogService.getAllBlogs().subscribe({
      next: (response: BlogResponse) => {
        this.blogs = response.data.blogs;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load blogs. Please try again later.';
        this.isLoading = false;
        console.error('Error loading blogs:', err);
      },
    });
  }

  loadSuggestedUsers(): void {
    this.loadingSuggestions = true;
    this.socialService.getSuggestedUsers().subscribe({
      next: (suggestions) => {
        this.suggestedUsers = suggestions;
        this.loadingSuggestions = false;
      },
      error: (err) => {
        console.error('Error loading suggested users:', err);
        this.loadingSuggestions = false;
      },
    });
  }

  followUser(userId: string): void {
    this.socialService.followUser(userId).subscribe({
      next: () => {
        // Remove the user from suggestions after following
        this.suggestedUsers = this.suggestedUsers.filter(
          (user) => user._id !== userId
        );
        // The follow counts will be updated through the event service
      },
      error: (err) => {
        console.error('Error following user:', err);
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }

  logout(): void {
    this.authService.logout();
  }

  reactToBlog(blog: Blog, reactionType: 'likes' | 'dislikes'): void {
    this.blogService.addReactionToBlog(blog.slug, { reactionType }).subscribe({
      next: (response) => {
        const index = this.blogs.findIndex((b) => b._id === blog._id);
        if (index !== -1) {
          this.blogs[index].reactions.likes = Array(
            response.data.likesCount
          ).fill('');
          this.blogs[index].reactions.dislikes = Array(
            response.data.dislikesCount
          ).fill('');
        }
      },
      error: (err) => {
        console.error('Error reacting to blog:', err);
      },
    });
  }

  getCurrentUserId(): string | undefined {
    return this.authService.getCurrentUserId();
  }

  getUserAvatar(): string {
    if (this.user?.image) {
      const baseUrl = this.user.image.split('?')[0];
      return `${baseUrl}?_t=${this.timestamp}`;
    }

    if (this.user?.name) {
      const name = encodeURIComponent(this.user.name);
      return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`;
    }

    return 'https://ui-avatars.com/api/?background=0D8ABC&color=fff';
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

  loadFollowCounts(): void {
    this.loadingCounts = true;

    // Load followers count
    this.socialService.getFollowers().subscribe({
      next: (followers) => {
        this.followersCount = followers.length;
      },
      error: (err) => {
        console.error('Error loading followers:', err);
      },
    });

    // Load following count
    this.socialService.getFollowing().subscribe({
      next: (following) => {
        this.followingCount = following.length;
        this.loadingCounts = false;
      },
      error: (err) => {
        console.error('Error loading following:', err);
        this.loadingCounts = false;
      },
    });

    // Get posts count (blog count for current user)
    this.blogService.getUserBlogs().subscribe({
      next: (response) => {
        if (response.data && response.data.blogs) {
          this.postsCount = response.data.blogs.length;
        }
      },
      error: (err) => {
        console.error('Error loading user blogs:', err);
      },
    });
  }

  loadActivities(): void {
    this.loadingActivities = true;

    this.activityService.getUserActivities(1, 5).subscribe({
      next: (data) => {
        this.activities = data.activities;
        this.unreadActivitiesCount = data.unreadCount;
        this.loadingActivities = false;
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.loadingActivities = false;
      },
    });
  }

  markActivitiesAsRead(): void {
    this.activityService.markAllActivitiesAsRead().subscribe({
      next: () => {
        this.activities.forEach((activity) => (activity.read = true));
        this.unreadActivitiesCount = 0;
      },
      error: (err) => {
        console.error('Error marking activities as read:', err);
      },
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'like':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        `;
      case 'comment':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        `;
      case 'reply':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        `;
      case 'follow':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;
      default:
        return '';
    }
  }

  getEntityTitle(activity: Activity): string {
    // This is a placeholder - in a real app, you would fetch the entity title
    // from a service or it would be provided as part of the activity data
    return activity.entityType === 'blog' ? `"Blog post"` : '';
  }

  getTimeAgo(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds} seconds ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
