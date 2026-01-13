import React, { useState, useEffect } from 'react';
import Monitoring from './pages/Monitoring';
import Jobs from './pages/Jobs';
import Robots from './pages/Robots';
import Servos from './pages/Servos';
import Reports from './pages/Reports';
import Sensors from './pages/Sensors';
import Login from './pages/Login';
import { Activity, Wifi, WifiOff, Clock, Zap, AlertCircle, BookOpen, CheckCircle, HelpCircle, X, Compass, LogOut, User, Menu, Sun, Moon } from 'lucide-react';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ToastContainer from './components/Toast';
import { apiService } from './utils/api';

interface RobotData {
  robot_id: string;
  battery_level: number;
  location: { x: number; y: number; z: number };
  sensors: { [key: string]: number };
  status: string;
  last_seen: string;
}

interface SensorReading {
  timestamp: string;
  sensor_type: string;
  value: number;
  unit: string;
}

// Inner component that uses notifications and authentication
const TonyPiAppContent: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [systemStatus] = useState<string>('Online');
  const [robotData, setRobotData] = useState<RobotData | null>(null);
  const [allRobots, setAllRobots] = useState<RobotData[]>([]);
  const [recentSensors, setRecentSensors] = useState<SensorReading[]>([]);
  const [jobStats, setJobStats] = useState<any>({ activeJobs: 0, completedToday: 0, totalItems: 0 });
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [selectedRobotId, setSelectedRobotId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [systemServices, setSystemServices] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  
  // useNotification available if needed for future features

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch robot data periodically (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRobotData = async () => {
      try {
        const [robots, status] = await Promise.all([
          apiService.getRobotStatus(),
          apiService.getSystemStatus()
        ]);
        
        setAllRobots(robots as any);
        if (status?.services) {
          setSystemServices(status.services);
        }
        
        if (robots.length > 0) {
          // Use selected robot or default to first robot
          const targetRobot = selectedRobotId 
            ? robots.find(r => r.robot_id === selectedRobotId) 
            : robots[0];
          
          if (targetRobot) {
            setRobotData(targetRobot as any);
            // Auto-set selected robot if not set
            if (!selectedRobotId) {
              setSelectedRobotId(targetRobot.robot_id);
            }
          }
          setIsConnected(true);
          
          // Fetch job statistics
          let activeCount = 0;
          let completedCount = 0;
          let totalItemsProcessed = 0;
          
          for (const robot of robots) {
            try {
              const jobData = await apiService.getJobSummary(robot.robot_id);
              if (jobData.start_time && !jobData.end_time) {
                activeCount++;
              } else if (jobData.end_time) {
                const today = new Date().toDateString();
                const endDate = new Date(jobData.end_time).toDateString();
                if (today === endDate) {
                  completedCount++;
                }
              }
              totalItemsProcessed += jobData.items_done || 0;
            } catch (e) {
              // Job summary might not exist yet
            }
          }
          setJobStats({ activeJobs: activeCount, completedToday: completedCount, totalItems: totalItemsProcessed });
        } else {
          setIsConnected(false);
        }

        const sensors = await apiService.getSensorData('sensors', '1m');
        setRecentSensors(sensors.slice(-10) as any);
      } catch (err) {
        console.error('Error fetching robot data:', err);
        setIsConnected(false);
      }
    };

    fetchRobotData();
    const interval = setInterval(fetchRobotData, 5000);
    return () => clearInterval(interval);
  }, [selectedRobotId, isAuthenticated]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserMenu) setShowUserMenu(false);
      if (showMobileMenu) setShowMobileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showMobileMenu]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'sensors', label: 'Sensors', icon: Compass },
    { id: 'robots', label: 'Robots', icon: Activity },
    { id: 'servos', label: 'Servos', icon: Zap },
    { id: 'jobs', label: 'Jobs', icon: Zap },
    { id: 'reports', label: 'Reports', icon: AlertCircle }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'}`}>
      {/* Header */}
      <div className={`backdrop-blur-lg shadow-lg border-b sticky top-0 z-40 transition-colors duration-300 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  TonyPi Monitor
                </h1>
                <p className={`text-xs sm:text-sm hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real-time monitoring and control</p>
              </div>
            </div>
            
            {/* Desktop Header Items */}
            <div className="hidden lg:flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Clock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{currentTime || 'Loading...'}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isConnected ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-700')}`}>
                {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setShowHelpModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                title="Getting Started Guide"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Help</span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-purple-900/50 text-purple-400 hover:bg-purple-900/70' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user?.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${isDark ? 'bg-purple-800 text-purple-300' : 'bg-purple-200 text-purple-800'}`}>
                    {user?.role}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{user?.username}</p>
                      <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role: {user?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Header Items */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Dark Mode Toggle - Mobile */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Connection Status - Mobile */}
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${isConnected ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-700')}`}>
                {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Menu className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className={`lg:hidden mt-3 pt-3 border-t space-y-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Clock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{currentTime || 'Loading...'}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                <User className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{user?.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${isDark ? 'bg-purple-800 text-purple-300' : 'bg-purple-200 text-purple-800'}`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowHelpModal(true);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Help Guide</span>
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`backdrop-blur-sm border-b sticky top-[57px] sm:top-[73px] z-30 transition-colors duration-300 ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white/60 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex gap-1 sm:gap-2 py-2 sm:py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`whitespace-nowrap text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Performance Tab */}
        {selectedTab === 'performance' && (
          <div className="fade-in">
            <Monitoring />
          </div>
        )}

        {/* Jobs Tab */}
        {selectedTab === 'jobs' && (
          <div className="fade-in">
            <Jobs />
          </div>
        )}

        {/* Robots Tab */}
        {selectedTab === 'robots' && (
          <div className="fade-in">
            <Robots />
          </div>
        )}

        {/* Servos Tab */}
        {selectedTab === 'servos' && (
          <div className="fade-in">
            <Servos />
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="fade-in">
            <Reports />
          </div>
        )}

        {/* Sensors Tab */}
        {selectedTab === 'sensors' && (
          <div className="fade-in">
            <Sensors />
          </div>
        )}

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6 fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                    <Activity className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Robots</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{allRobots.filter(r => r.status === 'online').length}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-50'}`}>
                    <Activity className={`h-6 w-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{jobStats.activeJobs}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/50' : 'bg-green-50'}`}>
                    <CheckCircle className={`h-6 w-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed Today</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{jobStats.completedToday}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                    <CheckCircle className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Items Processed</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{jobStats.totalItems}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Card */}
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="h-5 w-5 text-blue-600" />
                  System Status
                </h2>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${systemStatus === 'Online' ? (isDark ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200') : (isDark ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200')}`}>
                  {systemStatus}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Backend Status</p>
                  <p className={`text-lg font-semibold ${systemStatus === 'Online' ? 'text-green-500' : 'text-red-500'}`}>
                    {systemStatus}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-100'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Robot Connection</p>
                  <p className={`text-lg font-semibold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Current Time</p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentTime || 'Loading...'}</p>
                </div>
              </div>
            </div>

            {/* Robot Status Card */}
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Robot Status
                </h2>
                {allRobots.length > 0 && (
                  <select
                    value={selectedRobotId}
                    onChange={(e) => setSelectedRobotId(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border`}
                  >
                    {allRobots.map((robot) => (
                      <option key={robot.robot_id} value={robot.robot_id}>
                        {robot.robot_id} {robot.status === 'online' ? '(Online)' : '(Offline)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {robotData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Robot ID</p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{robotData.robot_id}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-green-900/30 border-green-800' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                      <p className={`text-lg font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{robotData.status}</p>
                    </div>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/30 border-yellow-800' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'}`}>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Battery Level</p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{robotData.battery_level?.toFixed(1) || 'N/A'}%</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/30 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Position</p>
                      <div className="space-y-1">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>X: {robotData.location?.x?.toFixed(2) || 0}</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Y: {robotData.location?.y?.toFixed(2) || 0}</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Z: {robotData.location?.z?.toFixed(2) || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No robot connected. Start the robot simulator to see data.</p>
                </div>
              )}
            </div>

            {/* System Services Status */}
            {systemServices && Object.keys(systemServices).length > 0 && (
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(systemServices).map(([service, status]) => (
                    <div key={service} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'running' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <p className={`text-sm font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {service.replace('_', ' ')}
                        </p>
                        <p className={`text-xs ${
                          status === 'running' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {String(status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sensor Data Card */}
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="h-5 w-5 text-purple-600" />
                  Recent Sensor Data
                </h2>
                {selectedRobotId && (
                  <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'}`}>
                    {selectedRobotId}
                  </span>
                )}
              </div>
              {recentSensors.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {recentSensors.slice(-6).map((sensor, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-shadow hover:shadow-md ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{sensor.sensor_type}</span>
                        <span className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {sensor.value} <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{sensor.unit}</span>
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(sensor.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No sensor data available. Start robot to see live data.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className={`rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BookOpen className="h-5 w-5 text-green-500" />
                Getting Started with TonyPi Robot
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className={`transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Connect Your TonyPi Robot</h3>
                <ol className={`list-decimal list-inside space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li className="pl-2">
                    <span className="font-medium">Copy robot_client folder</span> to your Raspberry Pi 5
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Install dependencies:</span>
                    <code className={`ml-2 px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>pip install -r requirements.txt</code>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Run the client:</span>
                    <code className={`ml-2 px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>python3 tonypi_client.py --broker YOUR_PC_IP</code>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">Or test with simulator:</span>
                    <code className={`ml-2 px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>python3 simulator.py</code>
                  </li>
                </ol>
              </div>

              <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Note:</strong> Replace YOUR_PC_IP with the IP address of this computer running the monitoring system.
                </p>
              </div>

              <div className={`border-t pt-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Tab Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { title: 'Overview', desc: 'System status and robot summary' },
                    { title: 'Performance', desc: 'CPU, Memory, Disk metrics' },
                    { title: 'Sensors', desc: 'IMU & environmental sensor data' },
                    { title: 'Robots', desc: 'Robot management & control' },
                    { title: 'Servos', desc: 'Servo motor monitoring' },
                    { title: 'Jobs', desc: 'Task tracking & progress' },
                    { title: 'Reports', desc: 'Generate PDF reports with AI' },
                  ].map((item) => (
                    <div key={item.title} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{item.title}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border-t pt-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                    <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Documentation</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Check the GETTING_STARTED_WITH_TONYPI_ROBOT.md file for detailed setup instructions.</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-purple-900/30 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                    <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Simulator</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Use the simulator to test the system without a physical robot.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component wrapped with providers
const TonyPiApp: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <TonyPiAppContent />
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default TonyPiApp;
