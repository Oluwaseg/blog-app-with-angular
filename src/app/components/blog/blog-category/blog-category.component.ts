import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { RouterModule } from '@angular/router';
import type { BlogsByCategory } from '../../../services/blog.service'; // Type-only import (safe)
import { BlogService } from '../../../services/blog.service'; // Regular import for DI

@Component({
  selector: 'app-blog-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-category.component.html',
  styleUrls: ['./blog-category.component.scss'],
})
export class BlogCategoryComponent implements OnInit {
  blogsByCategory: BlogsByCategory = {};
  selectedCategory: string | null = null;
  categories: string[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute
  ) {}

  get selectedBlogs() {
    return this.selectedCategory
      ? this.blogsByCategory[this.selectedCategory] || []
      : [];
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const category = params.get('category');
      this.selectedCategory = category;
      this.loadBlogs();
    });
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.blogService.getBlogsByCategory().subscribe({
      next: (response) => {
        this.blogsByCategory = response.blogsByCategory;
        this.categories = Object.keys(this.blogsByCategory);

        if (!this.selectedCategory && this.categories.length > 0) {
          this.selectedCategory = this.categories[0];
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load blogs. Please try again later.';
        this.isLoading = false;
        console.error('Error loading blogs by category:', err);
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
}
