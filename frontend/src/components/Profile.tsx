import React from "react";
import type { Profile as ProfileData } from "../types/patient";
import { initials } from "../lib/format";

const ROLE_LABEL: Record<ProfileData["role"], string> = { doctor: "Doctor", nurse: "Nurse", other: "Clinician" };

const Profile: React.FC<{ profile: ProfileData }> = ({ profile }) => (
  <div className="flex items-center gap-3 p-4 glass-card">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
      {initials(profile.name)}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-800 truncate">{profile.name}</h3>
      <p className="text-xs text-gray-600 truncate">
        {ROLE_LABEL[profile.role]}
        {profile.specialty ? ` · ${profile.specialty}` : ""}
      </p>
    </div>
  </div>
);

export default Profile;
