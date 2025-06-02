import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { addComment, getContentComments, subscribeToContentComments } from "@/lib/interactions";
import { getContentList } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Comment, Content, ContentType } from "@shared/schema";

interface CommentSystemProps {
  user: FirebaseUser | null;
}

export default function CommentSystem({ user }: CommentSystemProps) {
  const [sampleContent, setSampleContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSampleContent();
  }, []);

  useEffect(() => {
    if (sampleContent) {
      const contentType = getContentType(sampleContent);
      
      // Subscribe to real-time comment updates
      const unsubscribe = subscribeToContentComments(
        sampleContent.id,
        contentType,
        (updatedComments) => {
          setComments(updatedComments);
        }
      );

      return () => unsubscribe();
    }
  }, [sampleContent]);

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

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!sampleContent) {
      toast({
        title: "No content available",
        description: "Please upload some content first to test comments",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contentType = getContentType(sampleContent);
      await addComment(sampleContent.id, contentType, newComment);
      setNewComment("");
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error: any) {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-comments text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Comment System</h2>
      </div>
      
      <div className="space-y-4">
        {/* Add Comment */}
        {sampleContent ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 mb-2">
              Testing on: <span className="font-medium">{sampleContent.title}</span>
            </div>
            <Textarea
              placeholder="Write a test comment..."
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none"
            />
            <Button
              onClick={handleAddComment}
              disabled={loading || !user}
              className="bg-material-blue text-white hover:bg-blue-700"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Add Comment
            </Button>
          </div>
        ) : (
          <div className="text-center p-4">
            <p className="text-sm text-gray-500">No content available for testing</p>
            <p className="text-xs text-gray-400">Upload some content first</p>
          </div>
        )}
        
        {/* Comments List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-gray-400 text-xs"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    User {comment.authorUid.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-1">{comment.text}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <i className="far fa-heart text-xs"></i>
                    <span className="text-xs">{comment.likes}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No comments yet</p>
              <p className="text-xs text-gray-400">Be the first to comment!</p>
            </div>
          )}
        </div>

        {!user && (
          <p className="text-sm text-gray-500 text-center">Please sign in to comment</p>
        )}
      </div>
    </div>
  );
}
