import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { Blog, BlogResponse, BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  blogs: Blog[] = [];
  isLoading = true;
  error: string | null = null;

  suggestedUsers = [
    {
      id: 1,
      name: 'Alice Johnson',
      image: 'https://via.placeholder.com/50',
      posts: 24,
    },
    {
      id: 2,
      name: 'Bob Smith',
      image: 'https://via.placeholder.com/50',
      posts: 18,
    },
    {
      id: 3,
      name: 'Carol Davis',
      image: 'https://via.placeholder.com/50',
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

  constructor(
    private authService: AuthService,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadBlogs();
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
}
