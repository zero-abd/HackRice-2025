import React, { useRef, useState } from "react";
import { Sparkles, Database, Download, Upload, Trash2, ShieldCheck } from "lucide-react";
import AiSettingsPanel from "./AiSettingsPanel";
import * as db from "../services/db";

const Settings: React.FC<{ onDataCleared: () => void }> = ({ onDataCleared }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleExport = async () => {
    const bundle = await db.exportAll();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docless-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: `Exported ${bundle.patients.length} patients and ${bundle.sessions.length} sessions.` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await db.importAll(JSON.parse(await file.text()));
      setMessage({ ok: true, text: `Imported ${result.patients} patients and ${result.sessions} sessions.` });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Import failed." });
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Delete your profile, all patients and all sessions from this browser? This cannot be undone.")) return;
    await db.clearAll();
    onDataCleared();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">AI provider and your local data.</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-violet-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">AI provider (bring your own key)</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Used to turn transcripts into structured notes and to answer questions about a patient. Requests go straight
          from your browser to the provider you pick.
        </p>
        <AiSettingsPanel />
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Where your data lives</h2>
        </div>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
          <li>Profile, patients and sessions: IndexedDB in this browser only. DocLess has no server or database.</li>
          <li>AI key: this tab's session storage; it is cleared when the tab closes.</li>
          <li>When you generate a note or ask a question, that transcript or record is sent to your chosen AI provider.</li>
          <li>This is a hackathon project, not HIPAA compliant. Use fictional data.</li>
        </ul>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-purple-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Data management</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition-colors">
            <Download size={16} /> Export data (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-5 py-2 rounded-lg transition-colors">
            <Upload size={16} /> Import export file
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
          <button onClick={handleClear} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-colors">
            <Trash2 size={16} /> Delete all local data
          </button>
        </div>
        {message && <p className={`text-sm mt-3 ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
        <p className="text-sm text-gray-500 mt-3">
          Deleting removes everything DocLess stored in this browser. Export first if you want a copy.
        </p>
      </div>
    </div>
  );
};

export default Settings;
