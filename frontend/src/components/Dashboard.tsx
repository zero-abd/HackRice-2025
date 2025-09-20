import React from "react";
import { 
  Users, 
  Heart, 
  TrendingUp, 
  Calendar,
  Activity,
  UserCheck
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "./StatCard";

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const patientTrendData = [
    { month: "Jan", patients: 120, recovered: 85 },
    { month: "Feb", patients: 135, recovered: 92 },
    { month: "Mar", patients: 148, recovered: 110 },
    { month: "Apr", patients: 162, recovered: 125 },
    { month: "May", patients: 178, recovered: 140 },
    { month: "Jun", patients: 195, recovered: 158 },
  ];

  const treatmentData = [
    { name: "Cardiology", patients: 45, color: "#3B82F6" },
    { name: "Neurology", patients: 32, color: "#10B981" },
    { name: "Orthopedics", patients: 28, color: "#F59E0B" },
    { name: "Pediatrics", patients: 35, color: "#EF4444" },
    { name: "General", patients: 55, color: "#8B5CF6" },
  ];

  const weeklyData = [
    { day: "Mon", appointments: 24 },
    { day: "Tue", appointments: 18 },
    { day: "Wed", appointments: 32 },
    { day: "Thu", appointments: 28 },
    { day: "Fri", appointments: 35 },
    { day: "Sat", appointments: 15 },
    { day: "Sun", appointments: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your patients today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value="1,247"
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Patients Recovered"
          value="1,089"
          change="+8% from last month"
          changeType="positive"
          icon={Heart}
          iconColor="text-green-600"
        />
        <StatCard
          title="Active Treatments"
          value="158"
          change="+3% from last month"
          changeType="positive"
          icon={Activity}
          iconColor="text-orange-600"
        />
        <StatCard
          title="Today's Appointments"
          value="24"
          change="2 more than yesterday"
          changeType="positive"
          icon={Calendar}
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Trends Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={patientTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="patients" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                name="Total Patients"
              />
              <Line 
                type="monotone" 
                dataKey="recovered" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                name="Recovered"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Appointments */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Appointments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <Bar 
                dataKey="appointments" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                name="Appointments"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treatment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={treatmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="patients"
              >
                {treatmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <UserCheck className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recovery Rate</p>
                <p className="text-xl font-bold text-gray-900">87.3%</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Treatment Time</p>
                <p className="text-xl font-bold text-gray-900">12.5 days</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Activity className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient Satisfaction</p>
                <p className="text-xl font-bold text-gray-900">4.8/5.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
