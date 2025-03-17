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
  author: any;
  createdAt: Date;
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
  author: any;
  createdAt: Date;
  reactions: {
    likes: string[];
    dislikes: string[];
  };
  replies: Comment[];
}

export interface BlogsByCategory {
  [category: string]: Blog[];
}

export interface CommentRequest {
  content: string;
}

export interface ReplyRequest {
  content: string;
}

export interface ReactionRequest {
  type: 'like' | 'dislike';
}

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get all blogs
  getAllBlogs(): Observable<{
    success: boolean;
    data: {
      blogs: Blog[];
      randomBlogByCategory: any;
      blogsByCategory: BlogsByCategory;
    };
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        blogs: Blog[];
        randomBlogByCategory: any;
        blogsByCategory: BlogsByCategory;
      };
    }>(`${this.apiUrl}/api/blogs`);
  }

  // Get blogs grouped by category
  getBlogsByCategory(): Observable<{
    success: boolean;
    data: { blogsByCategory: BlogsByCategory };
  }> {
    return this.http.get<{
      success: boolean;
      data: { blogsByCategory: BlogsByCategory };
    }>(`${this.apiUrl}/api/blogs/categories`);
  }

  // Get blog by slug
  getBlogBySlug(slug: string): Observable<{
    success: boolean;
    data: {
      blog: Blog;
      isOwner: boolean;
      commentCount: number;
      relatedBlog: Blog[];
      randomBlogByCategory: any;
      displayedReplies: number;
    };
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        blog: Blog;
        isOwner: boolean;
        commentCount: number;
        relatedBlog: Blog[];
        randomBlogByCategory: any;
        displayedReplies: number;
      };
    }>(`${this.apiUrl}/api/blogs/${slug}`);
  }

  // Create new blog
  createBlog(
    blogData: FormData
  ): Observable<{ success: boolean; message: string; data: Blog }> {
    return this.http.post<{ success: boolean; message: string; data: Blog }>(
      `${this.apiUrl}/api/blogs/create`,
      blogData
    );
  }

  // Update blog
  updateBlog(slug: string, blogData: FormData): Observable<Blog> {
    return this.http.put<Blog>(
      `${this.apiUrl}/api/blogs/${slug}/edit`,
      blogData
    );
  }

  // Delete blog
  deleteBlog(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/api/blogs/${id}`
    );
  }

  // Get blog for editing
  getBlogForEdit(slug: string): Observable<Blog> {
    return this.http.get<Blog>(`${this.apiUrl}/api/blogs/${slug}/edit`);
  }

  // Add comment to blog
  addComment(blogId: string, comment: CommentRequest): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/api/blogs/${blogId}/comment`,
      comment
    );
  }

  // Delete comment
  deleteComment(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/api/blogs/comment/${commentId}`
    );
  }

  // Edit comment
  editComment(commentId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/api/blogs/${commentId}/edit`,
      { content }
    );
  }

  // Get comment for editing
  getEditComment(commentId: string): Observable<Comment> {
    return this.http.get<Comment>(
      `${this.apiUrl}/api/blogs/edit-comment/${commentId}`
    );
  }

  // Reply to comment
  replyToComment(commentId: string, reply: ReplyRequest): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/api/blogs/comment/${commentId}/reply`,
      reply
    );
  }

  // Delete reply
  deleteReply(
    slug: string,
    commentId: string,
    replyId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/delete-reply/${replyId}`
    );
  }

  // Edit reply
  editReply(
    slug: string,
    commentId: string,
    replyId: string,
    content: string
  ): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/api/blogs/${slug}/comment/${commentId}/edit-reply/${replyId}`,
      {
        content,
      }
    );
  }

  // Add reaction to blog
  addReactionToBlog(
    slug: string,
    reaction: { reactionType: 'likes' | 'dislikes' }
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

  // Add reaction to comment
  addReactionToComment(
    slug: string,
    commentId: string,
    reaction: { reactionType: 'likes' | 'dislikes' }
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
}
