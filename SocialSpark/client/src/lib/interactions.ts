import { getCurrentUser } from "./auth";
import { 
  toggleLike as firestoreToggleLike,
  createComment,
  getComments,
  subscribeToComments,
  subscribeToContent,
  getContent
} from "./firestore";
import type { 
  ContentType, 
  InsertComment,
  InsertLike,
  Comment,
  Content
} from "@shared/schema";

// Like/Dislike functionality
export const likeContent = async (
  contentId: string,
  contentType: ContentType
): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to like content");
  }

  const likeData: InsertLike = {
    contentId,
    contentType,
    userUid: user.uid,
    isLike: true
  };

  await firestoreToggleLike(likeData);
};

export const dislikeContent = async (
  contentId: string,
  contentType: ContentType
): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to dislike content");
  }

  const likeData: InsertLike = {
    contentId,
    contentType,
    userUid: user.uid,
    isLike: false
  };

  await firestoreToggleLike(likeData);
};

// Comment functionality
export const addComment = async (
  contentId: string,
  contentType: ContentType,
  text: string,
  parentCommentId?: string
): Promise<string> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to comment");
  }

  if (!text.trim()) {
    throw new Error("Comment text cannot be empty");
  }

  const commentData: InsertComment = {
    contentId,
    contentType,
    authorUid: user.uid,
    text: text.trim(),
    parentCommentId
  };

  return await createComment(commentData);
};

export const getContentComments = async (
  contentId: string,
  contentType: ContentType
): Promise<Comment[]> => {
  return await getComments(contentId, contentType);
};

// Real-time subscriptions
export const subscribeToContentUpdates = (
  contentType: ContentType,
  callback: (content: Content[]) => void
) => {
  return subscribeToContent(contentType, callback);
};

export const subscribeToContentComments = (
  contentId: string,
  contentType: ContentType,
  callback: (comments: Comment[]) => void
) => {
  return subscribeToComments(contentId, contentType, callback);
};

// Interaction testing utilities
export const simulateInteraction = async (
  action: 'like' | 'dislike' | 'comment',
  contentId: string,
  contentType: ContentType,
  data?: { text?: string }
): Promise<void> => {
  try {
    switch (action) {
      case 'like':
        await likeContent(contentId, contentType);
        break;
      case 'dislike':
        await dislikeContent(contentId, contentType);
        break;
      case 'comment':
        if (!data?.text) {
          throw new Error("Comment text is required");
        }
        await addComment(contentId, contentType, data.text);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to simulate ${action}: ${error.message}`);
  }
};

// Get interaction stats for testing
export const getInteractionStats = async (
  contentId: string,
  contentType: ContentType
): Promise<{
  likes: number;
  dislikes: number;
  comments: number;
}> => {
  try {
    const content = await getContent(contentType, contentId);
    if (!content) {
      throw new Error("Content not found");
    }

    return {
      likes: content.likes || 0,
      dislikes: content.dislikes || 0,
      comments: content.commentCount || 0
    };
  } catch (error: any) {
    throw new Error(`Failed to get interaction stats: ${error.message}`);
  }
};

// Export ready-to-use functions for Glitch integration
export const exportableInteractions = {
  // Authentication required functions
  likeContent,
  dislikeContent,
  addComment,
  
  // Read-only functions
  getContentComments,
  getInteractionStats,
  
  // Real-time functions
  subscribeToContentUpdates,
  subscribeToContentComments,
  
  // Testing utilities
  simulateInteraction
};

// Generate code snippets for export
export const generateCodeSnippets = () => {
  return {
    auth: `
// Firebase Authentication
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';

export const signInUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    throw new Error('Authentication failed: ' + error.message);
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
    `,
    
    firestore: `
// Firestore Operations
import { 
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, increment 
} from 'firebase/firestore';
import { db } from './firebase-config';

export const createContent = async (contentType, data) => {
  const docRef = await addDoc(collection(db, contentType + 's'), {
    ...data,
    likes: 0,
    dislikes: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const toggleLike = async (contentId, contentType, userId, isLike) => {
  const contentRef = doc(db, contentType + 's', contentId);
  const field = isLike ? 'likes' : 'dislikes';
  await updateDoc(contentRef, {
    [field]: increment(1),
    updatedAt: serverTimestamp()
  });
};
    `,
    
    storage: `
// Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase-config';

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    throw new Error('Upload failed: ' + error.message);
  }
};

export const uploadVideo = async (file, userId) => {
  const fileName = \`video_\${Date.now()}.\${file.name.split('.').pop()}\`;
  const path = \`videos/\${userId}/\${fileName}\`;
  return uploadFile(file, path);
};
    `,
    
    interactions: `
// Content Interactions
import { toggleLike, createComment } from './firestore-helpers';

export const likeContent = async (contentId, contentType, userId) => {
  await toggleLike(contentId, contentType, userId, true);
};

export const dislikeContent = async (contentId, contentType, userId) => {
  await toggleLike(contentId, contentType, userId, false);
};

export const addComment = async (contentId, contentType, userId, text) => {
  if (!text.trim()) throw new Error('Comment cannot be empty');
  
  return await createComment({
    contentId,
    contentType,
    authorUid: userId,
    text: text.trim()
  });
};
    `
  };
};
