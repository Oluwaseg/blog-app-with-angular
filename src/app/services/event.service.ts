import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SocialUpdateEvent {
  type: 'follow' | 'unfollow';
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private socialUpdateSubject = new Subject<SocialUpdateEvent>();
  public socialUpdate$ = this.socialUpdateSubject.asObservable();

  constructor() {}

  emitSocialUpdate(event: SocialUpdateEvent): void {
    this.socialUpdateSubject.next(event);
  }
}
