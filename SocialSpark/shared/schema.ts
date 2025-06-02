import { z } from "zod";

// User schema for Firestore
export const userSchema = z.object({
  uid: z.string(),
  username: z.string(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertUserSchema = userSchema.omit({
  createdAt: true,
  updatedAt: true
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Content schemas
export const threadSchema = z.object({
  id: z.string(),
  authorUid: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  likes: z.number().default(0),
  dislikes: z.number().default(0),
  commentCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const videoSchema = z.object({
  id: z.string(),
  authorUid: z.string(),
  title: z.string(),
  description: z.string(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  likes: z.number().default(0),
  dislikes: z.number().default(0),
  commentCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const reelSchema = z.object({
  id: z.string(),
  authorUid: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  likes: z.number().default(0),
  dislikes: z.number().default(0),
  commentCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const commentSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  contentType: z.enum(['thread', 'video', 'reel']),
  authorUid: z.string(),
  text: z.string(),
  likes: z.number().default(0),
  parentCommentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const likeSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  contentType: z.enum(['thread', 'video', 'reel', 'comment']),
  userUid: z.string(),
  isLike: z.boolean(), // true for like, false for dislike
  createdAt: z.date()
});

// Insert schemas
export const insertThreadSchema = threadSchema.omit({
  id: true,
  likes: true,
  dislikes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertVideoSchema = videoSchema.omit({
  id: true,
  likes: true,
  dislikes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertReelSchema = reelSchema.omit({
  id: true,
  likes: true,
  dislikes: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertCommentSchema = commentSchema.omit({
  id: true,
  likes: true,
  createdAt: true,
  updatedAt: true
});

export const insertLikeSchema = likeSchema.omit({
  id: true,
  createdAt: true
});

export type Thread = z.infer<typeof threadSchema>;
export type Video = z.infer<typeof videoSchema>;
export type Reel = z.infer<typeof reelSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Like = z.infer<typeof likeSchema>;

export type InsertThread = z.infer<typeof insertThreadSchema>;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertReel = z.infer<typeof insertReelSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type ContentType = 'thread' | 'video' | 'reel';
export type Content = Thread | Video | Reel;
