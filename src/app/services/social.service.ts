import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActivityService } from './activity.service';
import { EventService } from './event.service';

export interface SuggestedUser {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  bio?: string;
  blogCount: number;
}

export interface FollowResponse {
  message: string;
}

export interface SuggestedUsersResponse {
  success: boolean;
  data: {
    suggestions: SuggestedUser[];
  };
}

export interface FollowStatusResponse {
  success: boolean;
  data: {
    isFollowing: boolean;
  };
}

export interface FollowersResponse {
  success: boolean;
  data: {
    followers: Array<{
      _id: string;
      name: string;
      username?: string;
      image?: string;
      bio?: string;
    }>;
  };
}

export interface FollowingResponse {
  success: boolean;
  data: {
    following: Array<{
      _id: string;
      name: string;
      username?: string;
      image?: string;
      bio?: string;
    }>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SocialService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private activityService: ActivityService
  ) {}

  /**
   * Get suggested users to follow
   */
  getSuggestedUsers(limit: number = 5): Observable<SuggestedUser[]> {
    return this.http
      .get<SuggestedUsersResponse>(
        `${this.apiUrl}/api/social/suggestions?limit=${limit}`
      )
      .pipe(map((response) => response.data.suggestions));
  }

  /**
   * Follow a user
   */
  followUser(userId: string): Observable<FollowResponse> {
    return this.http
      .post<FollowResponse>(`${this.apiUrl}/api/social/follow/${userId}`, {})
      .pipe(
        tap(() => {
          this.eventService.emitSocialUpdate({ type: 'follow', userId });
          this.activityService.refreshActivities();
        })
      );
  }

  /**
   * Unfollow a user
   */
  unfollowUser(userId: string): Observable<FollowResponse> {
    return this.http
      .post<FollowResponse>(`${this.apiUrl}/api/social/unfollow/${userId}`, {})
      .pipe(
        tap(() => {
          this.eventService.emitSocialUpdate({ type: 'unfollow', userId });
          this.activityService.refreshActivities();
        })
      );
  }

  /**
   * Check if the current user is following another user
   */
  checkFollowingStatus(userId: string): Observable<boolean> {
    return this.http
      .get<FollowStatusResponse>(
        `${this.apiUrl}/api/social/is-following/${userId}`
      )
      .pipe(map((response) => response.data.isFollowing));
  }

  /**
   * Get user's followers
   */
  getFollowers(userId?: string): Observable<any[]> {
    const url = userId
      ? `${this.apiUrl}/api/social/followers?userId=${userId}`
      : `${this.apiUrl}/api/social/followers`;

    return this.http
      .get<FollowersResponse>(url)
      .pipe(map((response) => response.data.followers));
  }

  /**
   * Get users that the current user is following
   */
  getFollowing(userId?: string): Observable<any[]> {
    const url = userId
      ? `${this.apiUrl}/api/social/following?userId=${userId}`
      : `${this.apiUrl}/api/social/following`;

    return this.http
      .get<FollowingResponse>(url)
      .pipe(map((response) => response.data.following));
  }
}
