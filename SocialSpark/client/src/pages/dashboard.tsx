import { useState, useEffect } from "react";
import { onAuthStateChange } from "@/lib/auth";
import { User as FirebaseUser } from "firebase/auth";
import { getContentList } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthSection from "@/components/auth-section";
import ContentUpload from "@/components/content-upload";
import InteractionTesting from "@/components/interaction-testing";
import CodeExport from "@/components/code-export";
import type { Content, ContentType } from "@shared/schema";

export default function Dashboard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>("thread");
  const [content, setContent] = useState<{
    threads: Content[];
    videos: Content[];
    reels: Content[];
  }>({
    threads: [],
    videos: [],
    reels: []
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [threads, videos, reels] = await Promise.all([
        getContentList("thread", 10),
        getContentList("video", 10),
        getContentList("reel", 10)
      ]);
      
      setContent({ threads, videos, reels });
    } catch (error) {
      console.error("Failed to load content:", error);
    }
  };

  const getTimeAgo = (date: Date) => {
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const renderContentGrid = (contentType: ContentType) => {
    const items = content[`${contentType}s` as keyof typeof content] as Content[];
    
    if (items.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <i className={`fas ${contentType === 'thread' ? 'fa-comments' : contentType === 'video' ? 'fa-play' : 'fa-mobile-alt'} text-2xl text-gray-400`}></i>
          </div>
          <p className="text-lg font-medium">No {contentType}s yet</p>
          <p className="text-sm">Upload some content to get started</p>
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Content Thumbnail/Preview */}
        <div className="aspect-square bg-gray-100 relative">
          {'videoUrl' in item && item.videoUrl ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-play text-white text-3xl"></i>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <i className="fas fa-image text-gray-400 text-2xl"></i>
            </div>
          )}
          
          {/* Content Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
              {contentType}
            </Badge>
          </div>
          
          {/* Stats Overlay */}
          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
            <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
              <i className="fas fa-heart text-red-400"></i>
              <span>{item.likes || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Content Info */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {item.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>User {item.authorUid.slice(0, 6)}...</span>
            <span>{getTimeAgo(item.createdAt)}</span>
          </div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <Input 
                  placeholder="Search..." 
                  className="pl-10 bg-gray-50 border-0 focus:bg-white"
                />
              </div>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <i className="fas fa-bell text-gray-600"></i>
              </Button>
              <Button variant="ghost" size="sm">
                <i className="fas fa-comment-dots text-gray-600"></i>
              </Button>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Test User</div>
                  <div className="text-xs text-gray-500">
                    {user ? user.uid.slice(0, 8) : 'anonymous'}
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="thread" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                Threads
              </TabsTrigger>
              <TabsTrigger value="video" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                Videos
              </TabsTrigger>
              <TabsTrigger value="reel" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                Reels
              </TabsTrigger>
              <TabsTrigger value="comics" disabled className="opacity-50">
                Comics
              </TabsTrigger>
              <TabsTrigger value="chats" disabled className="opacity-50">
                Chats
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={loadContent} variant="outline" size="sm">
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </Button>
          </div>

          {/* Content Grids */}
          <TabsContent value="thread">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {renderContentGrid("thread")}
            </div>
          </TabsContent>
          
          <TabsContent value="video">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {renderContentGrid("video")}
            </div>
          </TabsContent>
          
          <TabsContent value="reel">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {renderContentGrid("reel")}
            </div>
          </TabsContent>
        </Tabs>

        {/* Development Tools Section */}
        <div className="mt-12 space-y-8">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Development Tools</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AuthSection user={user} />
              <ContentUpload user={user} />
              <InteractionTesting user={user} />
            </div>
          </div>
          
          <CodeExport />
        </div>
      </div>
    </div>
  );
}
