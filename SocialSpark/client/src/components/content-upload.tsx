import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { createThread, createVideo, createReel } from "@/lib/firestore";
import { uploadVideo, uploadThumbnail } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ContentType } from "@shared/schema";

interface ContentUploadProps {
  user: FirebaseUser | null;
}

export default function ContentUpload({ user }: ContentUploadProps) {
  const [selectedType, setSelectedType] = useState<ContentType>("thread");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleTypeSelect = (type: ContentType) => {
    setSelectedType(type);
    setFiles(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      // Validate file types based on content type
      const validTypes = selectedType === "thread" 
        ? ["image/jpeg", "image/png", "image/gif", "image/webp"]
        : ["video/mp4", "video/avi", "video/mov", "video/wmv"];
      
      const invalidFiles = Array.from(selectedFiles).filter(
        file => !validTypes.some(type => file.type.startsWith(type.split('/')[0]))
      );
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: `Please select ${selectedType === "thread" ? "image" : "video"} files only`,
          variant: "destructive",
        });
        return;
      }
      
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload content",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your content",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contentData = {
        authorUid: user.uid,
        title: title.trim(),
        description: description.trim()
      };

      let contentId: string;

      if (selectedType === "thread") {
        contentId = await createThread(contentData);
        toast({
          title: "Thread created",
          description: "Your thread has been posted successfully",
        });
      } else {
        // For videos and reels, upload files first
        let videoUrl = "";
        let thumbnailUrl = "";

        if (files && files.length > 0) {
          const videoFile = files[0];
          
          // Upload video
          videoUrl = await uploadVideo(
            videoFile,
            user.uid,
            selectedType,
            (progress) => setUploadProgress(progress.percentage)
          );

          // If there's a second file, use it as thumbnail
          if (files.length > 1) {
            const thumbnailFile = files[1];
            thumbnailUrl = await uploadThumbnail(
              thumbnailFile,
              user.uid,
              selectedType,
              (progress) => setUploadProgress(progress.percentage)
            );
          }
        }

        const videoData = {
          ...contentData,
          videoUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          duration: undefined // Could be extracted from video metadata
        };

        if (selectedType === "video") {
          contentId = await createVideo(videoData);
          toast({
            title: "Video uploaded",
            description: "Your video has been uploaded successfully",
          });
        } else {
          contentId = await createReel(videoData);
          toast({
            title: "Reel uploaded",
            description: "Your reel has been uploaded successfully",
          });
        }
      }

      // Reset form
      setTitle("");
      setDescription("");
      setFiles(null);
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById("contentFiles") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-cloud-upload-alt text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Content Upload</h2>
      </div>
      
      {/* Content Type Selector */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(["thread", "video", "reel"] as ContentType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                selectedType === type
                  ? "bg-white text-material-blue shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <Input
            type="text"
            placeholder="Enter content title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <Textarea
            placeholder="Enter description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
          />
        </div>
        
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <i className="fas fa-file-upload text-gray-400 text-2xl mb-2"></i>
          <p className="text-sm text-gray-600 mb-2">
            Drop {selectedType === "thread" ? "images" : "videos"} here or click to select
          </p>
          <label className="cursor-pointer bg-material-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Select Files
            <input
              type="file"
              id="contentFiles"
              accept={selectedType === "thread" ? "image/*" : "video/*"}
              multiple={selectedType !== "thread"}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {files && files.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <div className="text-xs text-gray-500">
                {Array.from(files).map(file => file.name).join(", ")}
              </div>
            </div>
          )}
        </div>
        
        {/* Upload Progress */}
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
          onClick={handleUpload}
          disabled={loading || !user}
          className="w-full bg-material-blue text-white hover:bg-blue-700"
        >
          <i className="fas fa-upload mr-2"></i>
          Upload Content
        </Button>
      </div>
    </div>
  );
}
