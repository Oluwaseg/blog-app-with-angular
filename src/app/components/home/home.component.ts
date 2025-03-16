import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User | null = null;

  posts = [
    {
      id: 1,
      title: 'Getting Started with Angular',
      content:
        'Angular is a platform for building mobile and desktop web applications. Join the community of millions of developers who build compelling user interfaces with Angular.',
      author: 'Jane Smith',
      date: 'March 15, 2025',
      likes: 42,
      comments: 12,
      imageUrl: 'https://via.placeholder.com/800x400',
    },
    {
      id: 2,
      title: 'Mastering Tailwind CSS',
      content:
        'Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.',
      author: 'Mike Johnson',
      date: 'March 10, 2025',
      likes: 38,
      comments: 8,
      imageUrl: 'https://via.placeholder.com/800x400',
    },
    {
      id: 3,
      title: 'Web Development Trends 2025',
      content:
        "Stay ahead of the curve with the latest web development trends. From AI-powered tools to new frameworks, discover what's shaping the future of web development.",
      author: 'Sarah Williams',
      date: 'March 5, 2025',
      likes: 56,
      comments: 15,
      imageUrl: 'https://via.placeholder.com/800x400',
    },
  ];

  suggestedUsers = [
    {
      id: 1,
      name: 'Alice Johnson',
      avatar: 'https://via.placeholder.com/50',
      posts: 24,
    },
    {
      id: 2,
      name: 'Bob Smith',
      avatar: 'https://via.placeholder.com/50',
      posts: 18,
    },
    {
      id: 3,
      name: 'Carol Davis',
      avatar: 'https://via.placeholder.com/50',
      posts: 32,
    },
  ];

  trendingTopics = [
    'Angular',
    'Tailwind CSS',
    'Web Development',
    'JavaScript',
    'TypeScript',
    'Frontend',
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
