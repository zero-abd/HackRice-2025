import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { User, Mail, Shield, Calendar } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name || "User"} 
                className="w-32 h-32 rounded-full border-4 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User size={48} className="text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.name || "User Name"}
            </h2>
            <p className="text-gray-600 mb-4">{user?.email}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Shield className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Email Verified</p>
                    <p className="font-medium text-gray-900">
                      {user?.email_verified ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="text-purple-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="text-orange-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">User ID</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {user?.sub?.substring(0, 20)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Update Profile
          </button>
          <button className="w-full sm:w-auto ml-0 sm:ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
