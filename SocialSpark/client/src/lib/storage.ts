import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface StorageStats {
  videoCount: number;
  imageCount: number;
  totalSize: number;
  videoSize: number;
  imageSize: number;
}

// Upload file with progress tracking
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    
    if (onProgress) {
      // Use resumable upload for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            onProgress(progress);
          },
          (error) => {
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error: any) {
              reject(new Error(`Failed to get download URL: ${error.message}`));
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    }
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Upload profile image
export const uploadProfileImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = `profile_${Date.now()}.${file.name.split('.').pop()}`;
  const path = `profiles/${userId}/${fileName}`;
  return uploadFile(file, path, onProgress);
};

// Upload video content
export const uploadVideo = async (
  file: File,
  userId: string,
  contentType: 'video' | 'reel',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = `${contentType}_${Date.now()}.${file.name.split('.').pop()}`;
  const path = `${contentType}s/${userId}/${fileName}`;
  return uploadFile(file, path, onProgress);
};

// Upload thumbnail
export const uploadThumbnail = async (
  file: File,
  userId: string,
  contentType: 'video' | 'reel',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = `thumb_${Date.now()}.${file.name.split('.').pop()}`;
  const path = `thumbnails/${contentType}s/${userId}/${fileName}`;
  return uploadFile(file, path, onProgress);
};

// Delete file
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Get storage stats
export const getStorageStats = async (userId?: string): Promise<StorageStats> => {
  try {
    const basePath = userId ? `${userId}/` : '';
    const paths = [
      `videos/${basePath}`,
      `reels/${basePath}`,
      `thumbnails/${basePath}`,
      `profiles/${basePath}`
    ];
    
    let videoCount = 0;
    let imageCount = 0;
    let totalSize = 0;
    let videoSize = 0;
    let imageSize = 0;
    
    for (const path of paths) {
      try {
        const listRef = ref(storage, path);
        const result = await listAll(listRef);
        
        for (const item of result.items) {
          try {
            const metadata = await getMetadata(item);
            const size = metadata.size || 0;
            totalSize += size;
            
            if (metadata.contentType?.startsWith('video/')) {
              videoCount++;
              videoSize += size;
            } else if (metadata.contentType?.startsWith('image/')) {
              imageCount++;
              imageSize += size;
            }
          } catch {
            // Skip files that can't be accessed
          }
        }
      } catch {
        // Skip paths that don't exist
      }
    }
    
    return {
      videoCount,
      imageCount,
      totalSize,
      videoSize,
      imageSize
    };
  } catch (error: any) {
    throw new Error(`Failed to get storage stats: ${error.message}`);
  }
};

// Get recent uploads
export const getRecentUploads = async (userId?: string, limit = 10): Promise<Array<{
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
}>> => {
  try {
    const basePath = userId ? `${userId}/` : '';
    const paths = [
      `videos/${basePath}`,
      `reels/${basePath}`,
      `thumbnails/${basePath}`,
      `profiles/${basePath}`
    ];
    
    const uploads: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
      createdAt: Date;
    }> = [];
    
    for (const path of paths) {
      try {
        const listRef = ref(storage, path);
        const result = await listAll(listRef);
        
        for (const item of result.items) {
          try {
            const metadata = await getMetadata(item);
            const url = await getDownloadURL(item);
            
            uploads.push({
              name: item.name,
              url,
              type: metadata.contentType || 'unknown',
              size: metadata.size || 0,
              createdAt: new Date(metadata.timeCreated)
            });
          } catch {
            // Skip files that can't be accessed
          }
        }
      } catch {
        // Skip paths that don't exist
      }
    }
    
    // Sort by creation date and limit
    return uploads
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } catch (error: any) {
    throw new Error(`Failed to get recent uploads: ${error.message}`);
  }
};

// Clear user storage (for testing)
export const clearUserStorage = async (userId: string): Promise<void> => {
  try {
    const paths = [
      `videos/${userId}/`,
      `reels/${userId}/`,
      `thumbnails/${userId}/`,
      `profiles/${userId}/`
    ];
    
    for (const path of paths) {
      try {
        const listRef = ref(storage, path);
        const result = await listAll(listRef);
        
        const deletePromises = result.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
      } catch {
        // Skip paths that don't exist or can't be deleted
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to clear storage: ${error.message}`);
  }
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileType = (filename: string): 'video' | 'image' | 'other' => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
    return 'video';
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return 'image';
  }
  
  return 'other';
};
