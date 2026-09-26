import React, { useEffect, useState } from "react";
import { Users, FileText, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatCard from "./StatCard";
import * as db from "../services/db";
import type { Patient, Profile, Session } from "../types/patient";

interface DashboardProps {
  profile: Profile;
  onNavigate: (page: string) => void;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const Dashboard: React.FC<DashboardProps> = ({ profile, onNavigate }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    Promise.all([db.listPatients(), db.listSessions()]).then(([p, s]) => {
      setPatients(p);
      setSessions(s);
    });
  }, []);

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    return d;
  });
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.createdAt));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const chartData = days.map((d) => ({
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    sessions: counts.get(dayKey(d)) ?? 0,
  }));

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = sessions.filter((s) => new Date(s.createdAt).getTime() >= weekAgo).length;
  const withNotes = sessions.filter((s) => s.note).length;
  const patientName = new Map(patients.map((p) => [p.id, p.name]));
  const recent = sessions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {profile.name.split(" ")[0]}</h1>
        <p className="text-gray-600">Your patients and visit notes, stored only in this browser.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Patients" value={patients.length} icon={Users} iconColor="text-blue-600" />
        <StatCard title="Sessions recorded" value={sessions.length} icon={FileText} iconColor="text-green-600" />
        <StatCard
          title="Structured notes"
          value={withNotes}
          change={sessions.length ? `${Math.round((withNotes / sessions.length) * 100)}% of sessions` : undefined}
          icon={Sparkles}
          iconColor="text-violet-600"
        />
        <StatCard title="Sessions this week" value={thisWeek} icon={Calendar} iconColor="text-orange-600" />
      </div>

      {patients.length === 0 && (
        <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Get started</h3>
            <p className="text-gray-600 text-sm">
              Add a patient (or the fictional sample patient), start a session, record or paste the conversation, and
              generate a structured note with your own AI key.
            </p>
          </div>
          <button
            onClick={() => onNavigate("patients")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            Go to patients <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions, last 14 days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" allowDecimals={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="sessions" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent sessions</h3>
          {recent.length ? (
            <ul className="space-y-3">
              {recent.map((s) => (
                <li key={s.id} className="text-sm">
                  <p className="font-medium text-gray-900 truncate">{s.title}</p>
                  <p className="text-gray-500 truncate">
                    {patientName.get(s.patientId) ?? "Unknown patient"} ·{" "}
                    {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {s.note ? " · note" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No sessions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
