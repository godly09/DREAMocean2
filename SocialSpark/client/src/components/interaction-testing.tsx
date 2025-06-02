import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { likeContent, dislikeContent, getInteractionStats } from "@/lib/interactions";
import { getContentList } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Content, ContentType } from "@shared/schema";

interface InteractionTestingProps {
  user: FirebaseUser | null;
}

export default function InteractionTesting({ user }: InteractionTestingProps) {
  const [sampleContent, setSampleContent] = useState<Content | null>(null);
  const [stats, setStats] = useState({ likes: 0, dislikes: 0, comments: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSampleContent();
  }, []);

  const loadSampleContent = async () => {
    try {
      // Try to get existing content from each type
      const [threads, videos, reels] = await Promise.all([
        getContentList("thread", 1),
        getContentList("video", 1),
        getContentList("reel", 1)
      ]);
      
      const content = threads[0] || videos[0] || reels[0];
      
      if (content) {
        setSampleContent(content);
        loadInteractionStats(content.id, getContentType(content));
      }
    } catch (error: any) {
      console.error("Failed to load sample content:", error);
    }
  };

  const getContentType = (content: Content): ContentType => {
    if ('videoUrl' in content) {
      return 'duration' in content && content.duration ? 'reel' : 'video';
    }
    return 'thread';
  };

  const loadInteractionStats = async (contentId: string, contentType: ContentType) => {
    try {
      const interactionStats = await getInteractionStats(contentId, contentType);
      setStats(interactionStats);
    } catch (error: any) {
      console.error("Failed to load interaction stats:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like content",
        variant: "destructive",
      });
      return;
    }

    if (!sampleContent) {
      toast({
        title: "No content available",
        description: "Please upload some content first to test interactions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contentType = getContentType(sampleContent);
      await likeContent(sampleContent.id, contentType);
      await loadInteractionStats(sampleContent.id, contentType);
      
      toast({
        title: "Content liked",
        description: "Successfully liked the content",
      });
    } catch (error: any) {
      toast({
        title: "Failed to like content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to dislike content",
        variant: "destructive",
      });
      return;
    }

    if (!sampleContent) {
      toast({
        title: "No content available",
        description: "Please upload some content first to test interactions",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contentType = getContentType(sampleContent);
      await dislikeContent(sampleContent.id, contentType);
      await loadInteractionStats(sampleContent.id, contentType);
      
      toast({
        title: "Content disliked",
        description: "Successfully disliked the content",
      });
    } catch (error: any) {
      toast({
        title: "Failed to dislike content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-heart text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Like/Dislike Testing</h2>
      </div>
      
      <div className="space-y-4">
        {/* Sample Content Item */}
        {sampleContent ? (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-gray-400 text-sm"></i>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  User {sampleContent.authorUid.slice(0, 8)}...
                </div>
                <div className="text-xs text-gray-500">
                  {getTimeAgo(sampleContent.createdAt)}
                </div>
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-gray-900 mb-1">{sampleContent.title}</h3>
            <p className="text-sm text-gray-800 mb-3">{sampleContent.description}</p>
            
            {/* Interaction Buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLike}
                disabled={loading}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <i className="far fa-heart"></i>
                <span className="text-sm">{stats.likes}</span>
              </button>
              <button 
                onClick={handleDislike}
                disabled={loading}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <i className="far fa-thumbs-down"></i>
                <span className="text-sm">{stats.dislikes}</span>
              </button>
              <div className="flex items-center space-x-1 text-gray-600">
                <i className="far fa-comment"></i>
                <span className="text-sm">{stats.comments}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">No content available for testing</p>
            <p className="text-xs text-gray-400">Upload some content first to test interactions</p>
          </div>
        )}
        
        {/* Test Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleLike}
            disabled={loading || !user || !sampleContent}
            className="w-full bg-red-500 text-white hover:bg-red-600"
          >
            <i className="fas fa-heart mr-2"></i>
            Test Like Function
          </Button>
          <Button
            onClick={handleDislike}
            disabled={loading || !user || !sampleContent}
            className="w-full bg-gray-500 text-white hover:bg-gray-600"
          >
            <i className="fas fa-thumbs-down mr-2"></i>
            Test Dislike Function
          </Button>
        </div>

        {!user && (
          <p className="text-sm text-gray-500 text-center">Please sign in to test interactions</p>
        )}
      </div>
    </div>
  );
}
