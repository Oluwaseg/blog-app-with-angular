import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Activity {
  _id: string;
  userId: string;
  type: string;
  message: string;
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    username?: string;
    image?: string;
  };
}

export interface ActivityResponse {
  success: boolean;
  data: {
    activities: Activity[];
    total: number;
    unreadCount: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private apiUrl = environment.apiUrl;
  private activitiesSubject = new Subject<void>();

  activities$ = this.activitiesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get user activities
   */
  getUserActivities(
    page: number = 1,
    limit: number = 5
  ): Observable<{
    activities: Activity[];
    total: number;
    unreadCount: number;
  }> {
    return this.http
      .get<ActivityResponse>(
        `${this.apiUrl}/api/activities?page=${page}&limit=${limit}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching activities:', error);
          return of({ activities: [], total: 0, unreadCount: 0 });
        })
      );
  }

  /**
   * Mark all activities as read
   */
  markAllActivitiesAsRead(): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/api/activities/read-all`, {})
      .pipe(
        map((response) => response.success),
        tap(() => this.activitiesSubject.next()),
        catchError((error) => {
          console.error('Error marking all activities as read:', error);
          return of(false);
        })
      );
  }

  /**
   * Mark specific activities as read
   */
  markActivitiesAsRead(activityIds: string[]): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/api/activities/read`, {
        activityIds,
      })
      .pipe(
        map((response) => response.success),
        tap(() => this.activitiesSubject.next()),
        catchError((error) => {
          console.error('Error marking activities as read:', error);
          return of(false);
        })
      );
  }

  refreshActivities(): void {
    this.activitiesSubject.next();
  }
}
