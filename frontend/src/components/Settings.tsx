import React, { useState } from "react";
import { 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database
} from "lucide-react";

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sound, setSound] = useState(true);
  const [language, setLanguage] = useState("en");

  const settingSections = [
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          label: "Push Notifications",
          description: "Receive notifications about patient updates",
          value: notifications,
          onChange: setNotifications,
          type: "toggle" as const
        },
        {
          label: "Sound Alerts",
          description: "Play sound for critical alerts",
          value: sound,
          onChange: setSound,
          type: "toggle" as const
        }
      ]
    },
    {
      title: "Appearance",
      icon: Palette,
      settings: [
        {
          label: "Dark Mode",
          description: "Switch to dark theme",
          value: darkMode,
          onChange: setDarkMode,
          type: "toggle" as const
        }
      ]
    },
    {
      title: "Language & Region",
      icon: Globe,
      settings: [
        {
          label: "Language",
          description: "Choose your preferred language",
          value: language,
          onChange: setLanguage,
          type: "select" as const,
          options: [
            { value: "en", label: "English" },
            { value: "es", label: "Spanish" },
            { value: "fr", label: "French" },
            { value: "de", label: "German" }
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Customize your dashboard experience</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              </div>
              
              <div className="space-y-4">
                {section.settings.map((setting, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    
                    <div className="ml-4">
                      {setting.type === "toggle" && (
                        <button
                          onClick={() => setting.onChange(!setting.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            setting.value ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              setting.value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                      
                      {setting.type === "select" && setting.options && (
                        <select
                          value={setting.value}
                          onChange={(e) => setting.onChange(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {setting.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
        </div>
        
        <div className="space-y-4">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Change Password
          </button>
          <button className="w-full sm:w-auto ml-0 sm:ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors">
            Two-Factor Authentication
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-purple-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        </div>
        
        <div className="space-y-4">
          <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
            Export Data
          </button>
          <button className="w-full sm:w-auto ml-0 sm:ml-3 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Delete Account
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          Note: Deleting your account will permanently remove all your data and cannot be undone.
        </p>
      </div>
    </div>
  );
};

export default Settings;
