import { useState } from "react";
import { generateCodeSnippets } from "@/lib/interactions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CodeExport() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const { toast } = useToast();

  const modules = [
    {
      name: 'auth.js',
      title: 'Authentication',
      description: 'Anonymous authentication & user management',
      status: 'Ready'
    },
    {
      name: 'firestore.js',
      title: 'Firestore',
      description: 'Database operations & real-time listeners',
      status: 'Ready'
    },
    {
      name: 'storage.js',
      title: 'Storage',
      description: 'File uploads & media management',
      status: 'Ready'
    },
    {
      name: 'interactions.js',
      title: 'Interactions',
      description: 'Likes, comments & real-time updates',
      status: 'Ready'
    }
  ];

  const handleViewCode = (moduleName: string) => {
    setSelectedModule(moduleName);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Code copied",
        description: "Code has been copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    });
  };

  const handleExportToGlitch = () => {
    const codeSnippets = generateCodeSnippets();
    const exportData = {
      timestamp: new Date().toISOString(),
      modules: codeSnippets,
      instructions: `
Firebase Integration Export
Generated on: ${new Date().toLocaleDateString()}

SETUP INSTRUCTIONS:
1. Install Firebase SDK: npm install firebase
2. Create firebase-config.js with your Firebase configuration
3. Copy and use the exported functions below
4. Ensure your Firebase project has the correct security rules

FIREBASE CONFIGURATION:
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

SECURITY RULES:
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
      `
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firebase-integration-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Firebase integration code has been exported",
    });
  };

  const codeSnippets = generateCodeSnippets();

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <i className="fas fa-code text-material-blue"></i>
          <h2 className="text-lg font-semibold text-gray-900">Ready-to-Export Functions</h2>
        </div>
        <Button
          onClick={handleExportToGlitch}
          className="bg-success text-white hover:bg-green-600"
        >
          <i className="fas fa-download mr-2"></i>
          Export to Glitch
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {modules.map((module) => (
          <div key={module.name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{module.name}</h3>
              <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                {module.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{module.description}</p>
            <Button
              onClick={() => handleViewCode(module.name)}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              View Code
            </Button>
          </div>
        ))}
      </div>

      {/* Code Preview Modal */}
      {selectedModule && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{selectedModule}</h3>
            <div className="space-x-2">
              <Button
                onClick={() => {
                  const moduleKey = selectedModule.replace('.js', '') as keyof typeof codeSnippets;
                  handleCopyCode(codeSnippets[moduleKey] || '');
                }}
                size="sm"
                className="bg-material-blue text-white hover:bg-blue-700"
              >
                <i className="fas fa-copy mr-1"></i>
                Copy
              </Button>
              <Button
                onClick={() => setSelectedModule(null)}
                size="sm"
                variant="outline"
              >
                <i className="fas fa-times mr-1"></i>
                Close
              </Button>
            </div>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">
              <code>
                {codeSnippets[selectedModule.replace('.js', '') as keyof typeof codeSnippets] || 'Code not available'}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
