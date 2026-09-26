import React, { useState } from "react";
import type { Profile, Role } from "../types/patient";

interface Props {
  initial?: Profile;
  submitLabel: string;
  onSubmit: (profile: Profile) => Promise<void> | void;
}

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const ProfileForm: React.FC<Props> = ({ initial, submitLabel, onSubmit }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "nurse");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [facility, setFacility] = useState(initial?.facility ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const ts = new Date().toISOString();
    await onSubmit({
      name: name.trim(),
      role,
      specialty: specialty.trim() || undefined,
      facility: facility.trim() || undefined,
      createdAt: initial?.createdAt ?? ts,
      updatedAt: ts,
    });
    setBusy(false);
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
        <input id="pf-name" value={name} onChange={(e) => { setName(e.target.value); setDone(false); }} required placeholder="e.g. Jordan Lee" className={inputClass} />
      </div>
      <div>
        <label htmlFor="pf-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select id="pf-role" value={role} onChange={(e) => { setRole(e.target.value as Role); setDone(false); }} className={inputClass}>
          <option value="nurse">Nurse</option>
          <option value="doctor">Doctor</option>
          <option value="other">Other clinician</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-spec" className="block text-sm font-medium text-gray-700 mb-1">Specialty (optional)</label>
          <input id="pf-spec" value={specialty} onChange={(e) => { setSpecialty(e.target.value); setDone(false); }} placeholder="e.g. Family medicine" className={inputClass} />
        </div>
        <div>
          <label htmlFor="pf-fac" className="block text-sm font-medium text-gray-700 mb-1">Facility (optional)</label>
          <input id="pf-fac" value={facility} onChange={(e) => { setFacility(e.target.value); setDone(false); }} placeholder="e.g. Riverside Clinic" className={inputClass} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
        >
          {submitLabel}
        </button>
        {done && initial && <span className="text-sm text-green-700">Saved</span>}
      </div>
    </form>
  );
};

export default ProfileForm;
