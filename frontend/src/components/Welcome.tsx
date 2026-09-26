import React from "react";
import { HardDrive, KeyRound, Mic } from "lucide-react";
import ProfileForm from "./ProfileForm";
import type { Profile } from "../types/patient";
import { REPO_URL } from "../services/ai";

const Welcome: React.FC<{ onCreate: (profile: Profile) => Promise<void> }> = ({ onCreate }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/90 via-violet-50/70 to-purple-50/80 relative overflow-hidden p-4">
    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/15 via-purple-300/8 to-transparent rounded-full blur-3xl" />
    <div className="absolute inset-0 grid-pattern opacity-30" />

    <div className="glass-card p-6 sm:p-8 w-full max-w-xl relative z-10">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-violet-800 bg-clip-text text-transparent mb-2">DocLess</h1>
        <p className="text-gray-600">Turn nurse-patient conversations into structured visit notes.</p>
      </div>

      <ul className="space-y-2 text-sm text-gray-700 mb-6">
        <li className="flex gap-2"><Mic size={16} className="text-blue-600 shrink-0 mt-0.5" />Record a visit with your browser's speech recognition, or paste a transcript.</li>
        <li className="flex gap-2"><KeyRound size={16} className="text-violet-600 shrink-0 mt-0.5" />Extract vitals, symptoms, history and concerns with your own AI key (Claude, OpenAI, Gemini) or a local Ollama model.</li>
        <li className="flex gap-2"><HardDrive size={16} className="text-green-600 shrink-0 mt-0.5" />Your workspace lives only in this browser (IndexedDB). There is no DocLess server and no account.</li>
      </ul>

      <ProfileForm submitLabel="Create my local workspace" onSubmit={onCreate} />

      <p className="mt-6 text-xs text-gray-500">
        Hackathon project (HackRice 2025), not a certified medical device and not HIPAA compliant. Use fictional data.{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-blue-700 underline">Source on GitHub</a>
      </p>
    </div>
  </div>
);

export default Welcome;
