'use client'

import { useState } from 'react'
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Key,
  Monitor,
  Moon,
  Sun,
  Check,
  AlertCircle,
  Save,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ThemeMode = 'light' | 'dark' | 'system'
type NotificationLevel = 'all' | 'errors' | 'none'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  
  // Settings state
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [notifications, setNotifications] = useState<NotificationLevel>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [maxConcurrent, setMaxConcurrent] = useState(5)
  const [timeout, setTimeout] = useState(120)
  const [apiKey, setApiKey] = useState('')
  const [enableCache, setEnableCache] = useState(true)
  const [cacheTime, setCacheTime] = useState(300)

  const handleSave = () => {
    // Save settings to localStorage
    const settings = {
      apiUrl,
      theme,
      notifications,
      autoRefresh,
      refreshInterval,
      maxConcurrent,
      timeout,
      enableCache,
      cacheTime
    }
    localStorage.setItem('insightloop_settings', JSON.stringify(settings))
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setApiUrl('http://localhost:8000')
    setTheme('dark')
    setNotifications('all')
    setAutoRefresh(true)
    setRefreshInterval(30)
    setMaxConcurrent(5)
    setTimeout(120)
    setEnableCache(true)
    setCacheTime(300)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'api', label: 'API', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Database },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
            Settings
          </span>
        </h1>
        <p className="text-gray-400">
          Configure application settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl p-4 backdrop-blur-md bg-glass border-glass-border border">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg text-left",
                      "flex items-center space-x-3",
                      "transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "hover:bg-white/10 text-gray-400"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl p-6 backdrop-blur-md bg-glass border-glass-border border">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Application Name</label>
                    <input
                      type="text"
                      value="InsightLoop"
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Version</label>
                    <input
                      type="text"
                      value="1.0.0"
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Auto-refresh Data</p>
                      <p className="text-sm text-gray-400">Automatically refresh server data</p>
                    </div>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        autoRefresh ? "bg-purple-500" : "bg-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        autoRefresh ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {autoRefresh && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Refresh Interval (seconds)
                      </label>
                      <input
                        type="number"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        min="10"
                        max="300"
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">API Base URL</label>
                    <input
                      type="url"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="http://localhost:8000"
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Request Timeout (seconds)</label>
                    <input
                      type="number"
                      value={timeout}
                      onChange={(e) => setTimeout(Number(e.target.value))}
                      min="30"
                      max="600"
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Max Concurrent Requests</label>
                    <input
                      type="number"
                      value={maxConcurrent}
                      onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                    />
                  </div>

                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-400 font-medium">Connection Status</p>
                        <p className="text-xs text-gray-400 mt-1">
                          API is connected and responding normally
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setTheme(mode)}
                          className={cn(
                            "px-4 py-3 rounded-lg flex items-center justify-center space-x-2",
                            "border transition-all duration-200",
                            theme === mode
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {mode === 'light' && <Sun className="w-4 h-4" />}
                          {mode === 'dark' && <Moon className="w-4 h-4" />}
                          {mode === 'system' && <Monitor className="w-4 h-4" />}
                          <span className="capitalize">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Accent Color</label>
                    <div className="flex space-x-2">
                      {['purple', 'blue', 'green', 'red', 'orange'].map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-10 h-10 rounded-lg",
                            color === 'purple' && "bg-gradient-to-br from-purple-500 to-pink-600",
                            color === 'blue' && "bg-gradient-to-br from-blue-500 to-cyan-600",
                            color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600",
                            color === 'red' && "bg-gradient-to-br from-red-500 to-orange-600",
                            color === 'orange' && "bg-gradient-to-br from-orange-500 to-yellow-600"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Animations</p>
                      <p className="text-sm text-gray-400">Enable UI animations</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-purple-500">
                      <div className="absolute top-1 translate-x-6 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Notification Level</label>
                    <div className="space-y-2">
                      {(['all', 'errors', 'none'] as NotificationLevel[]).map(level => (
                        <button
                          key={level}
                          onClick={() => setNotifications(level)}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg text-left",
                            "border transition-all duration-200",
                            "flex items-center justify-between",
                            notifications === level
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div>
                            <p className="font-medium capitalize">{level}</p>
                            <p className="text-xs text-gray-400">
                              {level === 'all' && 'Show all notifications'}
                              {level === 'errors' && 'Only show error notifications'}
                              {level === 'none' && 'Disable all notifications'}
                            </p>
                          </div>
                          {notifications === level && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Notification Types</p>
                    {['Deployment Success', 'Deployment Failure', 'Server Status Change', 'Task Completion'].map(type => (
                      <div key={type} className="flex items-center justify-between py-2">
                        <span className="text-sm">{type}</span>
                        <button className="relative w-12 h-6 rounded-full bg-purple-500">
                          <div className="absolute top-1 translate-x-6 w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Settings */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Performance</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Enable Cache</p>
                      <p className="text-sm text-gray-400">Cache API responses for better performance</p>
                    </div>
                    <button
                      onClick={() => setEnableCache(!enableCache)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        enableCache ? "bg-purple-500" : "bg-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        enableCache ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {enableCache && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Cache Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={cacheTime}
                        onChange={(e) => setCacheTime(Number(e.target.value))}
                        min="60"
                        max="3600"
                        className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                    <h3 className="text-sm font-medium text-green-400 mb-2">Performance Stats</h3>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>Average API Response Time: 45ms</p>
                      <p>Cache Hit Rate: 78%</p>
                      <p>Memory Usage: 124 MB</p>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Security</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full px-4 py-2 pr-10 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500"
                      />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Security Options</p>
                    {[
                      'Require authentication for API calls',
                      'Enable SSL/TLS verification',
                      'Log security events',
                      'Auto-logout after inactivity'
                    ].map(option => (
                      <div key={option} className="flex items-center justify-between py-2">
                        <span className="text-sm">{option}</span>
                        <button className="relative w-12 h-6 rounded-full bg-purple-500">
                          <div className="absolute top-1 translate-x-6 w-4 h-4 bg-white rounded-full" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-400 font-medium">Security Notice</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Keep your API key secure and never share it publicly
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  "px-6 py-2 rounded-lg flex items-center space-x-2",
                  "transition-all duration-200",
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                )}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}