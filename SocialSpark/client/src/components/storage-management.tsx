import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { getStorageStats, getRecentUploads, clearUserStorage, formatFileSize } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StorageManagementProps {
  user: FirebaseUser | null;
}

export default function StorageManagement({ user }: StorageManagementProps) {
  const [stats, setStats] = useState({
    videoCount: 0,
    imageCount: 0,
    totalSize: 0,
    videoSize: 0,
    imageSize: 0
  });
  const [recentUploads, setRecentUploads] = useState<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: Date;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadStorageData();
    } else {
      setStats({
        videoCount: 0,
        imageCount: 0,
        totalSize: 0,
        videoSize: 0,
        imageSize: 0
      });
      setRecentUploads([]);
    }
  }, [user]);

  const loadStorageData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [storageStats, uploads] = await Promise.all([
        getStorageStats(user.uid),
        getRecentUploads(user.uid, 5)
      ]);
      
      setStats(storageStats);
      setRecentUploads(uploads);
    } catch (error: any) {
      toast({
        title: "Failed to load storage data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = async () => {
    if (!user) return;
    
    if (!confirm("Are you sure you want to clear all test data? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      await clearUserStorage(user.uid);
      await loadStorageData();
      
      toast({
        title: "Storage cleared",
        description: "All test data has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Failed to clear storage",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) {
      return 'fas fa-video';
    } else if (type.startsWith('image/')) {
      return 'fas fa-image';
    }
    return 'fas fa-file';
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <i className="fas fa-hdd text-material-blue"></i>
          <h2 className="text-lg font-semibold text-gray-900">Storage Management</h2>
        </div>
        <p className="text-sm text-gray-500">Please sign in to view storage information</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-hdd text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Storage Management</h2>
      </div>
      
      <div className="space-y-4">
        {/* Storage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Videos</div>
            <div className="text-lg font-semibold text-gray-900">{stats.videoCount}</div>
            <div className="text-xs text-gray-500">{formatFileSize(stats.videoSize)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Images</div>
            <div className="text-lg font-semibold text-gray-900">{stats.imageCount}</div>
            <div className="text-xs text-gray-500">{formatFileSize(stats.imageSize)}</div>
          </div>
        </div>
        
        {/* Recent Uploads */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Uploads</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-material-blue"></div>
              </div>
            ) : recentUploads.length > 0 ? (
              recentUploads.map((upload, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <i className={`${getFileIcon(upload.type)} text-gray-400`}></i>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-800 truncate block">{upload.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(upload.size)}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {getTimeAgo(upload.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">No uploads yet</div>
            )}
          </div>
        </div>
        
        <Button
          onClick={handleClearStorage}
          disabled={loading}
          variant="outline"
          className="w-full text-error hover:bg-error/10"
        >
          <i className="fas fa-trash mr-2"></i>
          Clear Test Data
        </Button>
      </div>
    </div>
  );
}
