import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Blog, BlogService } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-edit.component.html',
  styleUrls: ['./blog-edit.component.scss'],
})
export class BlogEditComponent implements OnInit {
  blog = {
    title: '',
    description: '',
    content: '',
    category: '',
    tags: '',
    image: undefined as File | undefined,
    removeImage: false,
  };

  originalBlog: Blog | null = null;
  slug = '';
  categories: string[] = ['Article', 'Tutorial', 'News', 'Review', 'Opinion'];
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  imagePreview: string | null = null;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.slug = slug;
        this.loadBlog(slug);
      }
    });
  }

  loadBlog(slug: string): void {
    this.isLoading = true;
    this.blogService.getBlogForEdit(slug).subscribe({
      next: (response) => {
        this.originalBlog = response.data;
        this.blog.title = response.data.title;
        this.blog.description = response.data.description;
        this.blog.content = response.data.content;
        this.blog.category = response.data.category;
        this.blog.removeImage = false;

        const cleanTags = response.data.tags
          .map((tag) => tag.replace(/[[\]"]/g, '').trim())
          .filter((tag) => tag);
        this.blog.tags = cleanTags.join(', ');

        if (response.data.image) {
          this.imagePreview = response.data.image;
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load blog. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.blog.image = file;
      this.blog.removeImage = false;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.blog.image = undefined;
    this.blog.removeImage = true;
    this.imagePreview = null;
  }

  updateBlog(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const blogDataCopy = { ...this.blog };

    this.blogService.updateBlog(this.slug, this.blog).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.router.navigate(['/blogs', response.data.slug]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error =
          err.error?.message || 'Failed to update blog. Please try again.';
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
