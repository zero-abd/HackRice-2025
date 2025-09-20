import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-blue-600",
}) => {
  const changeColorClass = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  }[changeType];

  return (
    <div className="glass-card p-6 hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <p className={`text-sm font-medium ${changeColorClass}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-white/20 ${iconColor}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
