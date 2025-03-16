import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  featuredPosts = [
    {
      id: 1,
      title: 'Getting Started with Angular',
      excerpt:
        'Learn the basics of Angular and how to create your first application.',
      imageUrl: 'https://via.placeholder.com/600x400',
      date: 'March 15, 2025',
    },
    {
      id: 2,
      title: 'Mastering Tailwind CSS',
      excerpt:
        'Discover how to use Tailwind CSS to create beautiful, responsive designs.',
      imageUrl: 'https://via.placeholder.com/600x400',
      date: 'March 10, 2025',
    },
    {
      id: 3,
      title: 'Web Development Trends 2025',
      excerpt:
        'Explore the latest trends in web development and what to expect in the coming year.',
      imageUrl: 'https://via.placeholder.com/600x400',
      date: 'March 5, 2025',
    },
  ];
}
