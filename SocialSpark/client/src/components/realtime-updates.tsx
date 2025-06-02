import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { subscribeToContentUpdates } from "@/lib/interactions";
import { Button } from "@/components/ui/button";
import type { Content, ContentType } from "@shared/schema";

interface RealTimeUpdatesProps {
  user: FirebaseUser | null;
}

interface ActivityUpdate {
  id: string;
  message: string;
  timestamp: Date;
  type: 'like' | 'comment' | 'upload' | 'update';
}

export default function RealTimeUpdates({ user }: RealTimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<ActivityUpdate[]>([]);
  const [contentUpdates, setContentUpdates] = useState<{
    threads: Content[];
    videos: Content[];
    reels: Content[];
  }>({
    threads: [],
    videos: [],
    reels: []
  });

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates for all content types
    const unsubscribers: (() => void)[] = [];

    // Subscribe to threads
    const unsubscribeThreads = subscribeToContentUpdates("thread", (threads) => {
      setContentUpdates(prev => ({ ...prev, threads }));
      addActivity(`Content updated: ${threads.length} threads`, 'update');
    });
    unsubscribers.push(unsubscribeThreads);

    // Subscribe to videos
    const unsubscribeVideos = subscribeToContentUpdates("video", (videos) => {
      setContentUpdates(prev => ({ ...prev, videos }));
      addActivity(`Content updated: ${videos.length} videos`, 'update');
    });
    unsubscribers.push(unsubscribeVideos);

    // Subscribe to reels
    const unsubscribeReels = subscribeToContentUpdates("reel", (reels) => {
      setContentUpdates(prev => ({ ...prev, reels }));
      addActivity(`Content updated: ${reels.length} reels`, 'update');
    });
    unsubscribers.push(unsubscribeReels);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const addActivity = (message: string, type: ActivityUpdate['type']) => {
    const newActivity: ActivityUpdate = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only 10 recent activities
    setLastUpdate(new Date());
  };

  const simulateUpdate = () => {
    const activities = [
      { message: 'New like on "Sample Thread"', type: 'like' as const },
      { message: 'Comment added to "Test Video"', type: 'comment' as const },
      { message: 'New reel uploaded', type: 'upload' as const },
      { message: 'User profile updated', type: 'update' as const },
      { message: 'File uploaded to storage', type: 'upload' as const }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    addActivity(randomActivity.message, randomActivity.type);
  };

  const getActivityIcon = (type: ActivityUpdate['type']) => {
    switch (type) {
      case 'like':
        return 'fas fa-heart text-red-500';
      case 'comment':
        return 'fas fa-comment text-blue-500';
      case 'upload':
        return 'fas fa-upload text-green-500';
      case 'update':
        return 'fas fa-sync-alt text-yellow-500';
      default:
        return 'fas fa-bell text-gray-500';
    }
  };

  const getTimeAgo = (date: Date) => {
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (diffSeconds < 1) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-sync-alt text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Real-time Updates</h2>
      </div>
      
      <div className="space-y-4">
        {/* Activity Feed */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Live Activity</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="text-xs text-gray-600 flex items-center space-x-2">
                  <i className={getActivityIcon(activity.type)}></i>
                  <span className="flex-1">{activity.message}</span>
                  <span className="text-gray-400">{getTimeAgo(activity.timestamp)}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                No recent activity
              </div>
            )}
          </div>
        </div>
        
        {/* Connection Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          isConnected ? 'bg-success/10' : 'bg-error/10'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse' : 'bg-error'
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected ? 'text-success' : 'text-error'
            }`}>
              {isConnected ? 'Real-time Connected' : 'Connection Lost'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Updated {getTimeAgo(lastUpdate)}
          </span>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-600">Threads</div>
            <div className="text-lg font-semibold text-gray-900">
              {contentUpdates.threads.length}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-600">Videos</div>
            <div className="text-lg font-semibold text-gray-900">
              {contentUpdates.videos.length}
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-600">Reels</div>
            <div className="text-lg font-semibold text-gray-900">
              {contentUpdates.reels.length}
            </div>
          </div>
        </div>
        
        <Button
          onClick={simulateUpdate}
          className="w-full bg-warning text-white hover:bg-orange-600"
        >
          <i className="fas fa-bolt mr-2"></i>
          Simulate Real-time Update
        </Button>

        {!user && (
          <p className="text-sm text-gray-500 text-center">Please sign in to see real-time updates</p>
        )}
      </div>
    </div>
  );
}
