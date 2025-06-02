import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import type { 
  User, 
  InsertUser, 
  Thread, 
  Video, 
  Reel, 
  Comment, 
  Like,
  InsertThread,
  InsertVideo,
  InsertReel,
  InsertComment,
  InsertLike,
  ContentType,
  Content
} from "@shared/schema";

// Collections
const USERS_COLLECTION = "users";
const THREADS_COLLECTION = "threads";
const VIDEOS_COLLECTION = "videos";
const REELS_COLLECTION = "reels";
const COMMENTS_COLLECTION = "comments";
const LIKES_COLLECTION = "likes";

// User operations
export const createUserProfile = async (userData: InsertUser): Promise<string> => {
  try {
    const userDoc = doc(db, USERS_COLLECTION, userData.uid);
    await updateDoc(userDoc, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(async () => {
      // If document doesn't exist, create it
      await updateDoc(userDoc, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    return userData.uid;
  } catch (error: any) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<InsertUser>): Promise<void> => {
  try {
    const userDoc = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userDoc, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

// Content operations
export const createThread = async (threadData: InsertThread): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, THREADS_COLLECTION), {
      ...threadData,
      likes: 0,
      dislikes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
};

export const createVideo = async (videoData: InsertVideo): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      ...videoData,
      likes: 0,
      dislikes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create video: ${error.message}`);
  }
};

export const createReel = async (reelData: InsertReel): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, REELS_COLLECTION), {
      ...reelData,
      likes: 0,
      dislikes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create reel: ${error.message}`);
  }
};

// Get content operations
export const getContent = async (contentType: ContentType, id: string): Promise<Content | null> => {
  try {
    const collections = {
      thread: THREADS_COLLECTION,
      video: VIDEOS_COLLECTION,
      reel: REELS_COLLECTION
    };
    
    const docRef = doc(db, collections[contentType], id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Content;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get ${contentType}: ${error.message}`);
  }
};

export const getContentList = async (contentType: ContentType, limitCount = 20): Promise<Content[]> => {
  try {
    const collections = {
      thread: THREADS_COLLECTION,
      video: VIDEOS_COLLECTION,
      reel: REELS_COLLECTION
    };
    
    const q = query(
      collection(db, collections[contentType]),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Content[];
  } catch (error: any) {
    throw new Error(`Failed to get ${contentType} list: ${error.message}`);
  }
};

// Comment operations
export const createComment = async (commentData: InsertComment): Promise<string> => {
  try {
    const batch = writeBatch(db);
    
    // Add comment
    const commentRef = doc(collection(db, COMMENTS_COLLECTION));
    batch.set(commentRef, {
      ...commentData,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update comment count on content
    const contentCollections = {
      thread: THREADS_COLLECTION,
      video: VIDEOS_COLLECTION,
      reel: REELS_COLLECTION
    };
    
    const contentRef = doc(db, contentCollections[commentData.contentType], commentData.contentId);
    batch.update(contentRef, {
      commentCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
    return commentRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }
};

export const getComments = async (contentId: string, contentType: ContentType): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where("contentId", "==", contentId),
      where("contentType", "==", contentType),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Comment[];
  } catch (error: any) {
    throw new Error(`Failed to get comments: ${error.message}`);
  }
};

// Like/Dislike operations
export const toggleLike = async (likeData: InsertLike): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Check if user already liked/disliked this content
    const existingLikeQuery = query(
      collection(db, LIKES_COLLECTION),
      where("contentId", "==", likeData.contentId),
      where("contentType", "==", likeData.contentType),
      where("userUid", "==", likeData.userUid)
    );
    
    const existingLikes = await getDocs(existingLikeQuery);
    
    // Remove existing like/dislike
    existingLikes.docs.forEach(doc => {
      batch.delete(doc.ref);
      
      // Update content counters (decrement)
      const contentCollections = {
        thread: THREADS_COLLECTION,
        video: VIDEOS_COLLECTION,
        reel: REELS_COLLECTION,
        comment: COMMENTS_COLLECTION
      };
      
      const contentRef = doc(db, contentCollections[likeData.contentType], likeData.contentId);
      const existingData = doc.data();
      
      if (existingData.isLike) {
        batch.update(contentRef, { likes: increment(-1) });
      } else {
        batch.update(contentRef, { dislikes: increment(-1) });
      }
    });
    
    // Add new like/dislike if it's different from existing or no existing
    const shouldAddNew = existingLikes.empty || 
      existingLikes.docs.some(doc => doc.data().isLike !== likeData.isLike);
    
    if (shouldAddNew) {
      const likeRef = doc(collection(db, LIKES_COLLECTION));
      batch.set(likeRef, {
        ...likeData,
        createdAt: serverTimestamp()
      });
      
      // Update content counters (increment)
      const contentCollections = {
        thread: THREADS_COLLECTION,
        video: VIDEOS_COLLECTION,
        reel: REELS_COLLECTION,
        comment: COMMENTS_COLLECTION
      };
      
      const contentRef = doc(db, contentCollections[likeData.contentType], likeData.contentId);
      
      if (likeData.isLike) {
        batch.update(contentRef, { 
          likes: increment(1),
          updatedAt: serverTimestamp()
        });
      } else {
        batch.update(contentRef, { 
          dislikes: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    }
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(`Failed to toggle like: ${error.message}`);
  }
};

// Real-time listeners
export const subscribeToContent = (
  contentType: ContentType,
  callback: (content: Content[]) => void
) => {
  const collections = {
    thread: THREADS_COLLECTION,
    video: VIDEOS_COLLECTION,
    reel: REELS_COLLECTION
  };
  
  const q = query(
    collection(db, collections[contentType]),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const content = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Content[];
    
    callback(content);
  });
};

export const subscribeToComments = (
  contentId: string,
  contentType: ContentType,
  callback: (comments: Comment[]) => void
) => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where("contentId", "==", contentId),
    where("contentType", "==", contentType),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Comment[];
    
    callback(comments);
  });
};
