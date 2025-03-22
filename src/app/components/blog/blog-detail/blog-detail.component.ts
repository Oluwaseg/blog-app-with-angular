import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Blog, BlogService, Comment } from '../../../services/blog.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  isLoading = true;
  error: string | null = null;
  isAuthenticated = false;
  isOwner = false;
  newComment = '';
  replyContent: { [key: string]: string } = {};
  editingReplyId: string | null = null;
  editReplyContent: { [replyId: string]: string } = {};

  editingComment: string | null = null;
  editContent = '';
  relatedBlogs: Blog[] = [];

  // Properties for collapsed comments
  collapsedComments: Set<string> = new Set();
  collapsedReplies: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((isAuth) => {
      this.isAuthenticated = isAuth;
    });

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadBlog(slug);
      }
    });
  }

  loadBlog(slug: string): void {
    this.isLoading = true;
    this.blogService.getBlogBySlug(slug).subscribe({
      next: (response) => {
        this.blog = response.data.blog;

        if (this.blog && !this.blog.reactions) {
          this.blog.reactions = { likes: [], dislikes: [] };
        }

        if (this.blog && this.blog.comments) {
          this.blog.comments = this.blog.comments.map((comment) => {
            if (!comment.reactions) {
              comment.reactions = { likes: [], dislikes: [] };
            }

            if (!comment.replies) {
              comment.replies = [];
            } else {
              comment.replies = comment.replies.map((reply) => {
                if (!reply.reactions) {
                  reply.reactions = { likes: [], dislikes: [] };
                }
                return reply;
              });
            }

            return comment;
          });
        }

        this.isOwner = response.data.isOwner;
        this.relatedBlogs = response.data.relatedBlog || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load blog. Please try again later.';
        this.isLoading = false;
        console.error('Error loading blog:', err);
      },
    });
  }

  submitComment(): void {
    if (!this.blog || !this.newComment.trim()) return;

    const currentUserId = this.authService.getCurrentUserId();
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('User not found.');
      return;
    }

    this.blogService
      .addComment(this.blog._id, { content: this.newComment })
      .subscribe({
        next: (response) => {
          if (this.blog && response.data.comment) {
            const newComment: Comment = {
              _id: response.data.comment._id,
              content: response.data.comment.content,
              author: {
                _id: currentUserId,
                name: currentUser.name,
                image: currentUser.image,
              },
              createdAt: response.data.comment.createdAt,
              reactions: {
                likes: [],
                dislikes: [],
              },
              replies: [],
            };

            this.blog.comments.push(newComment);
            this.newComment = '';
          }
        },
        error: (err) => {
          console.error('Error adding comment:', err);
        },
      });
  }

  startReply(commentId: string): void {
    this.replyContent[commentId] = '';
  }

  cancelReply(commentId: string): void {
    delete this.replyContent[commentId];
  }

  submitReply(commentId: string): void {
    if (!this.replyContent[commentId]?.trim() || !this.blog) return;

    const currentUserId = this.authService.getCurrentUserId();
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('User not found.');
      return;
    }

    this.blogService
      .replyToComment(commentId, this.replyContent[commentId])
      .subscribe({
        next: (response) => {
          if (this.blog) {
            const parentComment = this.blog.comments.find(
              (c) => c._id === commentId
            );

            if (parentComment && response.data.reply) {
              const newReply: Comment = {
                _id: response.data.reply._id,
                content: response.data.reply.content,
                author: {
                  _id: currentUserId,
                  name: currentUser.name,
                  image: currentUser.image,
                },
                createdAt: response.data.reply.createdAt,
                reactions: {
                  likes: [],
                  dislikes: [],
                },
                replies: [],
              };

              if (!parentComment.replies) {
                parentComment.replies = [];
              }

              parentComment.replies.push(newReply);
            }

            delete this.replyContent[commentId];
          }
        },
        error: (err) => {
          console.error('Error adding reply:', err);
        },
      });
  }

  startEditReply(reply: Comment): void {
    this.editingReplyId = reply._id;
    this.editReplyContent[reply._id] = reply.content;
  }

  cancelEditReply(): void {
    if (this.editingReplyId) {
      delete this.editReplyContent[this.editingReplyId];
      this.editingReplyId = null;
    }
  }

  getEditReply(slug: string, commentId: string, replyId: string): void {
    this.blogService.getEditReply(slug, commentId, replyId).subscribe({
      next: (response) => {
        this.editReplyContent[replyId] = response.data.reply.content;
        this.editingReplyId = replyId;
      },
      error: (err) => {
        console.error('Error fetching reply for edit:', err);
      },
    });
  }

  updateReply(commentId: string, replyId: string): void {
    if (!this.editReplyContent[replyId]?.trim() || !this.blog) return;
    const slug = this.blog.slug;
    this.blogService
      .updateReply(slug, commentId, replyId, this.editReplyContent[replyId])
      .subscribe({
        next: (response) => {
          if (this.blog) {
            const parentComment = this.blog.comments.find(
              (c) => c._id === commentId
            );
            if (parentComment) {
              const reply = parentComment.replies.find(
                (r) => r._id === replyId
              );
              if (reply) {
                reply.content = this.editReplyContent[replyId];
              }
            }
            this.cancelEditReply();
          }
        },
        error: (err) => {
          console.error('Error updating reply:', err);
        },
      });
  }

  deleteReply(commentId: string, replyId: string): void {
    if (!this.blog || !this.isOwner) return;
    const slug = this.blog.slug;
    if (confirm('Are you sure you want to delete this reply?')) {
      this.blogService.deleteReply(slug, commentId, replyId).subscribe({
        next: () => {
          if (this.blog) {
            const parentComment = this.blog.comments.find(
              (c) => c._id === commentId
            );
            if (parentComment) {
              parentComment.replies = parentComment.replies.filter(
                (r) => r._id !== replyId
              );
            }
          }
        },
        error: (err) => {
          console.error('Error deleting reply:', err);
        },
      });
    }
  }

  reactToReply(replyId: string, reactionType: 'likes' | 'dislikes'): void {
    if (!this.blog) return;
    this.blogService.addReactionToReply(replyId, { reactionType }).subscribe({
      next: (response) => {
        if (this.blog) {
          for (const comment of this.blog.comments) {
            const reply = comment.replies.find((r) => r._id === replyId);
            if (reply) {
              reply.reactions.likes = response.data.likedReply
                ? [...reply.reactions.likes, this.getCurrentUserId() || '']
                : reply.reactions.likes.filter(
                    (id) => id !== (this.getCurrentUserId() || '')
                  );
              reply.reactions.dislikes = response.data.dislikedReply
                ? [...reply.reactions.dislikes, this.getCurrentUserId() || '']
                : reply.reactions.dislikes.filter(
                    (id) => id !== (this.getCurrentUserId() || '')
                  );
              break;
            }
          }
        }
      },
      error: (err) => {
        console.error('Error reacting to reply:', err);
      },
    });
  }

  startEditComment(comment: Comment): void {
    this.editingComment = comment._id;
    this.editContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingComment = null;
    this.editContent = '';
  }

  updateComment(commentId: string): void {
    if (!this.editContent.trim() || !this.blog) return;

    this.blogService.editComment(commentId, this.editContent).subscribe({
      next: () => {
        if (this.blog) {
          const comment = this.blog.comments.find((c) => c._id === commentId);
          if (comment) {
            comment.content = this.editContent;
          }
          this.editingComment = null;
          this.editContent = '';
        }
      },
      error: (err) => {
        console.error('Error updating comment:', err);
      },
    });
  }

  deleteComment(commentId: string): void {
    if (!this.blog || !this.isOwner) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.blogService.deleteComment(commentId).subscribe({
        next: () => {
          if (this.blog) {
            this.blog.comments = this.blog.comments.filter(
              (c) => c._id !== commentId
            );
          }
        },
        error: (err) => {
          console.error('Error deleting comment:', err);
        },
      });
    }
  }

  reactToBlog(reactionType: 'likes' | 'dislikes'): void {
    if (!this.blog) return;

    this.blogService
      .addReactionToBlog(this.blog.slug, { reactionType })
      .subscribe({
        next: () => {
          if (this.blog) {
            const currentUserId = this.getCurrentUserId();

            if (!this.blog.reactions) {
              this.blog.reactions = { likes: [], dislikes: [] };
            }

            if (reactionType === 'likes') {
              if (this.blog.reactions.likes.includes(currentUserId || '')) {
                this.blog.reactions.likes = this.blog.reactions.likes.filter(
                  (id) => id !== currentUserId
                );
              } else {
                this.blog.reactions.likes.push(currentUserId || '');
                this.blog.reactions.dislikes =
                  this.blog.reactions.dislikes.filter(
                    (id) => id !== currentUserId
                  );
              }
            } else {
              if (this.blog.reactions.dislikes.includes(currentUserId || '')) {
                this.blog.reactions.dislikes =
                  this.blog.reactions.dislikes.filter(
                    (id) => id !== currentUserId
                  );
              } else {
                this.blog.reactions.dislikes.push(currentUserId || '');
                this.blog.reactions.likes = this.blog.reactions.likes.filter(
                  (id) => id !== currentUserId
                );
              }
            }
          }
        },
        error: (err) => {
          console.error('Error reacting to blog:', err);
        },
      });
  }

  reactToComment(
    slug: string,
    commentId: string,
    reactionType: 'likes' | 'dislikes'
  ): void {
    if (!this.blog) return;

    this.blogService
      .addReactionToComment(slug, commentId, { reactionType })
      .subscribe({
        next: () => {
          if (this.blog) {
            const comment = this.blog.comments.find((c) => c._id === commentId);
            if (comment) {
              const currentUserId = this.getCurrentUserId();

              if (!comment.reactions) {
                comment.reactions = { likes: [], dislikes: [] };
              }

              if (reactionType === 'likes') {
                if (comment.reactions.likes.includes(currentUserId || '')) {
                  comment.reactions.likes = comment.reactions.likes.filter(
                    (id) => id !== currentUserId
                  );
                } else {
                  comment.reactions.likes.push(currentUserId || '');
                  comment.reactions.dislikes =
                    comment.reactions.dislikes.filter(
                      (id) => id !== currentUserId
                    );
                }
              } else {
                if (comment.reactions.dislikes.includes(currentUserId || '')) {
                  comment.reactions.dislikes =
                    comment.reactions.dislikes.filter(
                      (id) => id !== currentUserId
                    );
                } else {
                  comment.reactions.dislikes.push(currentUserId || '');
                  comment.reactions.likes = comment.reactions.likes.filter(
                    (id) => id !== currentUserId
                  );
                }
              }
            }
          }
        },
        error: (err) => {
          console.error('Error reacting to comment:', err);
        },
      });
  }

  deleteBlog(): void {
    if (!this.blog || !this.blog._id) return;

    if (
      confirm(
        'Are you sure you want to delete this blog post? This action cannot be undone.'
      )
    ) {
      this.blogService.deleteBlog(this.blog._id.toString()).subscribe({
        next: () => {
          this.router.navigate(['/blogs']);
        },
        error: (err) => {
          console.error('Error deleting blog:', err);
        },
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  getCurrentUserId(): string | undefined {
    return this.authService.getCurrentUserId();
  }

  isCommentOwner(comment: Comment): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? comment.author._id === currentUserId : false;
  }

  // Toggle comment collapse
  toggleComment(commentId: string): void {
    if (this.collapsedComments.has(commentId)) {
      this.collapsedComments.delete(commentId);
    } else {
      this.collapsedComments.add(commentId);
    }
  }

  // Toggle replies collapse
  toggleReplies(commentId: string): void {
    if (this.collapsedReplies.has(commentId)) {
      this.collapsedReplies.delete(commentId);
    } else {
      this.collapsedReplies.add(commentId);
    }
  }

  // Get parent replies (direct replies to comments)
  getParentReplies(replies: Comment[]): Comment[] {
    return replies; // All replies are parent replies now
  }
}
