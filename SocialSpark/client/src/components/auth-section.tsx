import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { signInAnonymouslyUser, signOutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AuthSectionProps {
  user: FirebaseUser | null;
}

export default function AuthSection({ user }: AuthSectionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymouslyUser();
      toast({
        title: "Authentication successful",
        description: "Signed in anonymously",
      });
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      toast({
        title: "Signed out",
        description: "Successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <i className="fas fa-shield-alt text-material-blue"></i>
        <h2 className="text-lg font-semibold text-gray-900">Authentication</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            user 
              ? 'bg-success/10 text-success' 
              : 'bg-error/10 text-error'
          }`}>
            {user ? 'Authenticated' : 'Not authenticated'}
          </span>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={handleSignIn}
            disabled={loading || !!user}
            className="w-full bg-material-blue text-white hover:bg-blue-700"
          >
            <i className="fas fa-user-secret mr-2"></i>
            Sign In Anonymously
          </Button>
          
          <Button
            onClick={handleSignOut}
            disabled={loading || !user}
            variant="outline"
            className="w-full"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Sign Out
          </Button>
        </div>
        
        {user && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
            <code className="text-xs font-mono text-gray-800 break-all">{user.uid}</code>
          </div>
        )}
      </div>
    </div>
  );
}
