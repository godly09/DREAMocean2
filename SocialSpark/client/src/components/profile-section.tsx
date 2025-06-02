import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/lib/firestore";
import { uploadProfileImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ProfileSectionProps {
  user: FirebaseUser | null;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setDisplayName("");
      setBio("");
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setDisplayName(userProfile.displayName || "");
        setBio(userProfile.bio || "");
      }
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let profileImageUrl = profile?.profileImageUrl;
      
      // Upload profile image if selected
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(
          profileImage,
          user.uid,
          (progress) => setUploadProgress(progress.percentage)
        );
        setUploadProgress(0);
      }
      
      await updateUserProfile(user.uid, {
        uid: user.uid,
        displayName: displayName || undefined,
        bio: bio || undefined,
        profileImageUrl
      });
      
      await loadProfile();
      setProfileImage(null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Profile image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setProfileImage(file);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <i className="fas fa-user-cog text-material-blue"></i>
          <h2 className="text-lg font-semibold text-gray-900">Profile Management</h2>
        </div>
        <p className="text-sm text-gray-500">Please sign in to manage your profile</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-user-cog text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Profile Management</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
          <Input
            type="text"
            placeholder="Enter display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <Textarea
            placeholder="Enter bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profile?.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-camera text-gray-400"></i>
              )}
            </div>
            <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {profileImage && (
              <span className="text-sm text-gray-600">{profileImage.name}</span>
            )}
          </div>
        </div>
        
        {uploadProgress > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-material-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleUpdateProfile}
          disabled={loading}
          className="w-full bg-success text-white hover:bg-green-600"
        >
          <i className="fas fa-save mr-2"></i>
          Update Profile
        </Button>
      </div>
    </div>
  );
}
