import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BlogService } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-create.component.html',
  styleUrls: ['./blog-create.component.scss'],
})
export class BlogCreateComponent implements OnInit {
  blog = {
    title: '',
    description: '',
    content: '',
    category: '',
    tags: '',
    image: undefined as File | undefined,
  };

  categories: string[] = ['Article', 'Tutorial', 'News', 'Review', 'Opinion'];
  isSubmitting = false;
  error: string | null = null;
  imagePreview: string | null = null;

  constructor(private blogService: BlogService, private router: Router) {}

  ngOnInit(): void {
    // Default category
    this.blog.category = this.categories[0];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.blog.image = file;

      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.blog.image = undefined;
    this.imagePreview = null;
  }

  submitBlog(): void {
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    this.error = null;

    this.blogService.createBlog(this.blog).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        // Navigate to the newly created blog
        this.router.navigate(['/blogs', response.data.slug]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error =
          err.error?.message || 'Failed to create blog. Please try again.';
        console.error('Error creating blog:', err);
      },
    });
  }

  validateForm(): boolean {
    if (!this.blog.title.trim()) {
      this.error = 'Title is required';
      return false;
    }

    if (!this.blog.description.trim()) {
      this.error = 'Description is required';
      return false;
    }

    if (!this.blog.content.trim()) {
      this.error = 'Content is required';
      return false;
    }

    if (!this.blog.category) {
      this.error = 'Category is required';
      return false;
    }

    if (!this.blog.tags.trim()) {
      this.error = 'At least one tag is required';
      return false;
    }

    return true;
  }
}
