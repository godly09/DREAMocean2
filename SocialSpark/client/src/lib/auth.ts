import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getUserProfile } from "./firestore";

export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

// Sign in anonymously
export const signInAnonymouslyUser = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInAnonymously(auth);
    
    // Create user profile in Firestore if it doesn't exist
    const userProfile = await getUserProfile(result.user.uid);
    if (!userProfile) {
      await createUserProfile({
        uid: result.user.uid,
        displayName: `User_${result.user.uid.slice(0, 8)}`,
        bio: ""
      });
    }
    
    return result.user;
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};
