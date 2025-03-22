import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Blog, BlogResponse } from '../../services/blog.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  featuredPosts: Blog[] = [];
  loading = true;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadGuestBlogs();
  }

  loadGuestBlogs(): void {
    // Create custom headers for the request to bypass the auth interceptor
    const headers = new HttpHeaders({
      'x-skip-interceptor': 'true',
    });

    this.http
      .get<BlogResponse>(`${this.apiUrl}/api/blogs/guest`, { headers })
      .subscribe({
        next: (response) => {
          this.featuredPosts = response.data.blogs.slice(0, 3);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching guest blogs:', error);
          // Fallback to hardcoded data if the API call fails
          this.loadHardcodedBlogs();
        },
      });
  }

  loadHardcodedBlogs(): void {
    // Simulate loading
    setTimeout(() => {
      this.featuredPosts = [
        {
          _id: '1',
          title: 'Getting Started with Angular',
          slug: 'getting-started-with-angular',
          description:
            'Learn the basics of Angular and how to create your first application.',
          content: '',
          author: {
            _id: '1',
            name: 'John Doe',
            username: 'johndoe',
            image: 'https://via.placeholder.com/50',
          },
          createdAt: new Date().toISOString(),
          comments: [],
          reactions: {
            likes: ['user1', 'user2', 'user3'],
            dislikes: [],
          },
          image: 'https://via.placeholder.com/600x400',
          category: 'Angular',
          tags: ['Angular', 'Web Development', 'JavaScript'],
        },
        {
          _id: '2',
          title: 'Mastering TypeScript',
          slug: 'mastering-typescript',
          description:
            'Discover how to use TypeScript to build scalable and maintainable applications.',
          content: '',
          author: {
            _id: '2',
            name: 'Jane Smith',
            username: 'janesmith',
            image: 'https://via.placeholder.com/50',
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          comments: [],
          reactions: {
            likes: ['user1', 'user4'],
            dislikes: [],
          },
          image: 'https://via.placeholder.com/600x400',
          category: 'TypeScript',
          tags: ['TypeScript', 'JavaScript', 'Programming'],
        },
        {
          _id: '3',
          title: 'Modern Web Development Techniques',
          slug: 'modern-web-development-techniques',
          description:
            'Explore the latest trends and technologies in web development.',
          content: '',
          author: {
            _id: '3',
            name: 'Alex Johnson',
            username: 'alexj',
            image: 'https://via.placeholder.com/50',
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          comments: [],
          reactions: {
            likes: ['user2', 'user3', 'user4', 'user5'],
            dislikes: ['user6'],
          },
          image: 'https://via.placeholder.com/600x400',
          category: 'Web Development',
          tags: ['Web Development', 'Frontend', 'Backend'],
        },
      ];
      this.loading = false;
    }, 500);
  }
}
