import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { User } from "lucide-react";

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  return (
    isAuthenticated && user && (
      <div className="flex items-center gap-3 p-4 glass-card">
        <div className="relative">
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || "User"} 
              className="w-10 h-10 rounded-full border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {user.name || "User"}
          </h3>
          <p className="text-xs text-gray-600 truncate">
            {user.email}
          </p>
        </div>
      </div>
    )
  );
};

export default Profile;
