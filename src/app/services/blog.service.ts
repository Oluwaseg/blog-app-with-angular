import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  createdAt: string;
  comments: Comment[];
  reactions: {
    likes: string[];
    dislikes: string[];
  };
  image?: string;
  category: string;
  tags: string[];
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
  formattedTime?: string;
  reactions: {
    likes: string[];
    dislikes: string[];
  };
  replies: Comment[];
}

export interface BlogsByCategory {
  [category: string]: Blog[];
}

export interface BlogResponse {
  success: boolean;
  data: {
    blogs: Blog[];
    randomBlogByCategory: BlogsByCategory;
    blogsByCategory: BlogsByCategory;
  };
}

export interface SingleBlogResponse {
  success: boolean;
  data: {
    blog: Blog;
    isOwner: boolean;
    commentCount: number;
    relatedBlog: Blog[];
    randomBlogByCategory: BlogsByCategory;
    displayedReplies: number;
  };
}

export interface CreateBlogRequest {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  image?: File;
}

export interface CommentRequest {
  content: string;
}

export interface ReactionRequest {
  reactionType: 'likes' | 'dislikes';
}

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllBlogs(): Observable<BlogResponse> {
    return this.http.get<BlogResponse>(`${this.apiUrl}/api/blogs`);
  }

  getBlogsByCategory(): Observable<{ blogsByCategory: BlogsByCategory }> {
    return this.http.get<{ blogsByCategory: BlogsByCategory }>(
      `${this.apiUrl}/api/blogs/categories`
    );
  }

  getBlogBySlug(slug: string): Observable<SingleBlogResponse> {
    return this.http.get<SingleBlogResponse>(
      `${this.apiUrl}/api/blogs/${slug}`
    );
  }

  getBlogForEdit(slug: string): Observable<{ success: boolean; data: Blog }> {
    return this.http.get<{ success: boolean; data: Blog }>(
      `${this.apiUrl}/api/blogs/${slug}/edit`
    );
  }

  createBlog(
    blogData: CreateBlogRequest
  ): Observable<{ success: boolean; message: string; data: Blog }> {
    const formData = new FormData();
    formData.append('title', blogData.title);
    formData.append('description', blogData.description);
    formData.append('content', blogData.content);
    formData.append('category', blogData.category);
    formData.append('tags', blogData.tags);

    if (blogData.image) {
      formData.append('image', blogData.image);
    }

    return this.http.post<{ success: boolean; message: string; data: Blog }>(
      `${this.apiUrl}/api/blogs/create`,
      formData
    );
  }

  updateBlog(
    slug: string,
    blogData: Partial<CreateBlogRequest & { removeImage: boolean }>
  ): Observable<{ success: boolean; message: string; data: Blog }> {
    const formData = new FormData();
    formData.append('title', blogData.title || '');
    formData.append('description', blogData.description || '');
    formData.append('content', blogData.content || '');
    formData.append('category', blogData.category || '');
    formData.append('removeImage', blogData.removeImage ? 'true' : 'false');

    if (blogData.tags) {
      const cleanTags = blogData.tags
        .replace(/[[\]"]/g, '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)
        .join(',');
      formData.append('tags', cleanTags);
    }

    if (blogData.image) {
      formData.append('image', blogData.image);
    }

    return this.http.put<{ success: boolean; message: string; data: Blog }>(
      `${this.apiUrl}/api/blogs/${slug}/edit`,
      formData
    );
  }

  deleteBlog(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/api/blogs/${id}`
    );
  }

  addComment(
    blogId: string,
    comment: CommentRequest
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/${blogId}/comment`,
      comment
    );
  }

  editComment(
    commentId: string,
    content: string
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/${commentId}/edit`,
      { content }
    );
  }

  getEditComment(
    commentId: string
  ): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/api/blogs/edit-comment/${commentId}`
    );
  }

  deleteComment(
    commentId: string
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.delete<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/comment/${commentId}`
    );
  }

  addReactionToBlog(
    slug: string,
    reaction: ReactionRequest
  ): Observable<{
    success: boolean;
    data: {
      userLiked: boolean;
      userDisliked: boolean;
      likesCount: number;
      dislikesCount: number;
    };
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        userLiked: boolean;
        userDisliked: boolean;
        likesCount: number;
        dislikesCount: number;
      };
    }>(`${this.apiUrl}/api/blogs/${slug}/react`, reaction);
  }

  addReactionToComment(
    slug: string,
    commentId: string,
    reaction: ReactionRequest
  ): Observable<{
    success: boolean;
    data: {
      commentId: string;
      likedComment: boolean;
      dislikedComment: boolean;
      likesComment: number;
      dislikesComment: number;
    };
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        commentId: string;
        likedComment: boolean;
        dislikedComment: boolean;
        likesComment: number;
        dislikesComment: number;
      };
    }>(`${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/react`, reaction);
  }

  replyToComment(
    commentId: string,
    content: string
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/comment/${commentId}/reply`,
      { content }
    );
  }

  updateReply(
    slug: string,
    commentId: string,
    replyId: string,
    content: string
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/edit-reply/${replyId}`,
      { content }
    );
  }

  deleteReply(
    slug: string,
    commentId: string,
    replyId: string
  ): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.delete<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/delete-reply/${replyId}`
    );
  }

  addReactionToReply(
    replyId: string,
    reaction: ReactionRequest
  ): Observable<{
    success: boolean;
    data: {
      replyId: string;
      likedReply: boolean;
      dislikedReply: boolean;
      likesReply: number;
      dislikesReply: number;
      blogSlug: string;
    };
  }> {
    return this.http.post<{
      success: boolean;
      data: {
        replyId: string;
        likedReply: boolean;
        dislikedReply: boolean;
        likesReply: number;
        dislikesReply: number;
        blogSlug: string;
      };
    }>(`${this.apiUrl}/api/blogs/reply/${replyId}/react`, reaction);
  }

  getEditReply(
    slug: string,
    commentId: string,
    replyId: string
  ): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/edit-reply/${replyId}`
    );
  }
}
