import React from "react";
import { HardDrive } from "lucide-react";
import ProfileForm from "./ProfileForm";
import { initials } from "../lib/format";
import type { Profile } from "../types/patient";

const ProfilePage: React.FC<{ profile: Profile; onSave: (p: Profile) => Promise<void> }> = ({ profile, onSave }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
      <p className="text-gray-600">Your name and role appear on this workspace. They are stored only in this browser.</p>
    </div>

    <div className="glass-card p-6 sm:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white text-3xl font-semibold shrink-0">
          {initials(profile.name)}
        </div>
        <div className="flex-1 w-full">
          <ProfileForm initial={profile} submitLabel="Save profile" onSubmit={onSave} />
        </div>
      </div>
    </div>

    <div className="glass-card p-6 flex gap-3 text-sm text-gray-600">
      <HardDrive size={20} className="text-green-600 shrink-0" />
      <p>
        Workspace created {new Date(profile.createdAt).toLocaleDateString()}. DocLess has no accounts: anyone using this
        browser profile can open this workspace, and a different browser or device starts empty. Use Settings to export
        or delete your data.
      </p>
    </div>
  </div>
);

export default ProfilePage;
