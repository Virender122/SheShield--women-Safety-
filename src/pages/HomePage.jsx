import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import ChatbotWidget from '../components/ChatbotWidget';
import VoiceSOSWidget from '../components/VoiceSOSWidget';
import {
  Radio,
  MapPin,
  ShieldAlert,
  MessageSquare,
  Bell,
  Navigation,
  Eye,
  Shield,
  Compass,
  LogOut,
  ChevronDown,
  User,
  HeartPulse,
  Lock,
  Plus,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Camera,
  FileText,
  Settings
} from 'lucide-react';

const HomePage = () => {
  const { user, fetchUser, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  const leftMenuItems = [
    {
      id: 'safe-routes',
      name: 'Safe Routes',
      description: 'Analyze secure corridor safety index ratings.',
      icon: Navigation,
      path: '/safe-routes',
      color: 'primary',
    },
    {
      id: 'incident-report',
      name: 'Report Incident',
      description: 'Submit a safety incident report.',
      icon: AlertTriangle,
      path: '/incident-report',
      color: 'warning',
    },
    {
      id: 'my-reports',
      name: 'My Reports',
      description: 'View your submitted safety reports.',
      icon: FileText,
      path: '/my-reports',
      color: 'accent',
    },
    {
      id: 'sos-center',
      name: 'SOS Center',
      description: 'Tap for instant help and emergency SOS.',
      icon: ShieldAlert,
      path: '/sos-center',
      color: 'danger',
      isSOS: true
    },
    {
      id: 'community',
      name: 'Community',
      description: 'We are stronger together. Join community support.',
      icon: MessageSquare,
      path: '/community',
      color: 'success',
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Manage your safety contacts and system settings.',
      icon: Settings,
      path: '/settings',
      color: 'primary',
    }
  ];

  const rightHotspots = [
    {
      id: 'safe-routes',
      name: 'Safe Routes',
      description: 'Analyze secure corridor safety index ratings.',
      label: 'Safe Routes',
      sublabel: 'Find secure routes',
      icon: ShieldCheck,
      path: '/safe-routes',
      style: {
        left: '83.6%',
        top: '10.6%',
        width: '16.5%',
        height: '9%'
      },
      beaconStyle: {
        left: '88.1%',
        top: '15.3%'
      },
      color: 'primary'
    },
    {
      id: 'cctv-protection',
      name: 'CCTV Protection',
      description: 'Monitor active street-level surveillance coverage.',
      label: 'CCTV Protection',
      sublabel: '24/7 Surveillance',
      icon: Camera,
      path: '/safe-routes',
      style: {
        left: '86.4%',
        top: '24.8%',
        width: '14.5%',
        height: '9%'
      },
      beaconStyle: {
        left: '91.1%',
        top: '29.3%'
      },
      color: 'success'
    },
    {
      id: 'nearby-police',
      name: 'Nearby Police',
      description: 'Locate closest active state safety precincts.',
      label: 'Nearby Police',
      sublabel: 'Find help nearby',
      icon: Shield,
      path: '/safe-routes',
      params: { filter: 'police' },
      style: {
        left: '86.3%',
        top: '41.3%',
        width: '15.5%',
        height: '9%'
      },
      beaconStyle: {
        left: '91.0%',
        top: '45.9%'
      },
      color: 'primary'
    },
    {
      id: 'nearby-hospitals',
      name: 'Nearby Hospitals',
      description: 'Rapid health support navigation & clinic locations.',
      label: 'Nearby Hospitals',
      sublabel: 'Medical assistance',
      icon: HeartPulse,
      path: '/safe-routes',
      params: { filter: 'medical' },
      style: {
        left: '83.5%',
        top: '55.9%',
        width: '16.5%',
        height: '9%'
      },
      beaconStyle: {
        left: '88.5%',
        top: '60.5%'
      },
      color: 'danger'
    }
  ];

  const bottomMapPins = [
    { id: 'pin-1', label: 'Safe Node Alpha', style: { left: '39.9%', top: '87.3%' } },
    { id: 'pin-2', label: 'Secure Hub Beta', style: { left: '66.6%', top: '81.2%' } },
    { id: 'pin-3', label: 'Safe Node Gamma', style: { left: '80.5%', top: '87.5%' } }
  ];

  const handleHotspotClick = (spot) => {
    if (spot.params) {
      navigate(spot.path, { state: spot.params });
    } else {
      navigate(spot.path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen p-4 md:p-6 flex flex-col justify-between overflow-hidden bg-gradient-to-tr from-[#FFF8F9] via-[#FFF5F6] to-[#EEF2FF]">
      
      {/* Background vector glow effects */}
      <div className="absolute top-[-100px] left-[-50px] w-[350px] h-[350px] bg-gradient-to-br from-[#FFD5DC]/35 to-[#FFF0F2]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-100px] right-[-50px] w-[400px] h-[400px] bg-gradient-to-br from-[#EEF2FF]/40 to-[#FFF0F2]/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Floating Glassmorphic Top Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 backdrop-blur-md bg-white/75 border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[24px] p-2.5 xs:p-3 sm:p-4 flex flex-row items-center justify-between gap-2 sm:gap-4 max-w-[96%] sm:max-w-[94%] xl:max-w-7xl 2xl:max-w-[1500px] w-full mx-auto mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/logo.jpg"
            alt="SheShield Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-pink-100/50 shadow-sm"
          />
          <div>
            <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 tracking-tight leading-none">
              Welcome, <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-[#E67388] bg-clip-text text-transparent font-black">{user?.name || 'Secure User'}</span>
            </h2>
            <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
              Active Shield Telemetry Control
            </p>
          </div>
        </div>

        {/* Live System Metric Widgets */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/85 border border-emerald-100/60 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">GPS Connected</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/85 border border-rose-100/60 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[#FF4777] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4777]"></span>
              </span>
              <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">SOS Ready</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50/85 border border-purple-100/60 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">Community Online</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/85 border border-blue-100/60 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">AI Monitoring</span>
            </div>
          </div>

          {/* Premium Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black rounded-full bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 text-[#E67388] transition-all duration-300 shadow-sm active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Safe Menu</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2.5 w-56 backdrop-blur-xl bg-white/95 border border-pink-100/60 shadow-[0_20px_50px_rgba(255,182,193,0.18)] rounded-2xl p-2 z-50 flex flex-col gap-0.5"
                  >
                    <div className="px-3.5 py-2.5 border-b border-pink-50/50 mb-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Security Access</p>
                      <p className="text-xs text-slate-800 font-extrabold truncate">{user?.email || 'secure-channel'}</p>
                    </div>

                    <Link
                      to="/home"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-pink-600 rounded-xl bg-pink-50/50 border border-pink-100/30"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Console Home</span>
                    </Link>

                    <Link
                      to="/safe-routes"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <Navigation className="w-4 h-4 text-slate-400" />
                      <span>Safe Routes Planner</span>
                    </Link>

                    <Link
                      to="/incident-report"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      <span>Report Incident</span>
                    </Link>

                    <Link
                      to="/my-reports"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>My Safety Logs</span>
                    </Link>

                    <Link
                      to="/sos-center"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <HeartPulse className="w-4 h-4 text-slate-400" />
                      <span>Emergency SOS Hub</span>
                    </Link>

                    <Link
                      to="/community"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>Community Support</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-pink-600 rounded-xl hover:bg-pink-50/30 border border-transparent transition-all"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>System Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent rounded-xl mt-1.5 transition-all"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <main className="relative flex-1 flex flex-col items-center justify-center w-full max-w-[96%] sm:max-w-[94%] xl:max-w-7xl 2xl:max-w-[1500px] mx-auto my-auto z-10 gap-3.5 sm:gap-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full aspect-[3/2] rounded-[20px] sm:rounded-[32px] overflow-hidden border border-pink-100/60 shadow-[0_20px_50px_rgba(255,182,193,0.18)] bg-white/40 group select-none">
          
          {/* Main Background Illustration (Properly visible background image artwork!) */}
          <img
            src="/background.jpg"
            alt="SheShield Home Portal"
            className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none -z-20"
          />

          {/* Dynamic glassmorphic overlay for responsive sharpness and glows */}
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/5 via-transparent to-[#EEF2FF]/5 pointer-events-none z-10" />

          {/* Logo and Title Overlay */}
          <div className="absolute left-[6.2%] top-[5.8%] w-[32%] xs:w-[28%] sm:w-[25%] md:w-[21.5%] select-none z-20 pointer-events-none">
            {/* Branding Header Block */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
              <img
                src="/logo.jpg"
                alt="SheShield logo badge"
                className="w-6 h-6 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-[6px] sm:rounded-[10px] md:rounded-[14px] object-cover border border-pink-100/60 shadow-sm"
              />
              <div>
                <h1 className="text-[11px] xs:text-xs sm:text-sm md:text-lg font-black text-slate-800 tracking-tight leading-none uppercase">
                  SheShield
                </h1>
                <p className="text-[5.5px] xs:text-[6.5px] sm:text-[7px] md:text-[8px] text-[#FF4777] font-extrabold uppercase tracking-widest mt-0.5 sm:mt-1 font-sans">
                  Be Safe. Be Strong. Be You.
                </p>
              </div>
            </div>

            {/* Central Typography Header */}
            <div className="mt-1.5 sm:mt-4 md:mt-6">
              <h2 className="font-serif text-slate-800 font-black text-[10px] xs:text-[12px] sm:text-lg md:text-2xl lg:text-3xl leading-[1.05] tracking-wide">
                SAFETY<br />EMPOWERS<br />FREEDOM
              </h2>
              <p className="text-[6.5px] xs:text-[7.5px] sm:text-[8px] md:text-[10px] text-slate-500 font-bold tracking-tight mt-0.5 sm:mt-1 font-sans leading-tight">
                Smart Technology. Stronger Women. Safer Tomorrow.
              </p>
            </div>
          </div>

          {/* DYNAMIC LEFT MENU PANEL (Aligned perfectly on top of the pre-printed layout capsules) */}
          <div className="hidden sm:flex absolute left-[5.5%] top-[40.8%] w-[25.5%] sm:w-[23%] h-[52%] flex-col justify-between select-none z-20 pointer-events-none">
            {leftMenuItems.map((item) => {
              const Icon = item.icon;
              
              let themeClasses = "hover:border-pink-200/60 hover:bg-white/45 bg-transparent border-transparent sm:bg-white/35 sm:border sm:border-pink-100/30";
              let badgeClasses = "bg-pink-500/10 border-pink-100 text-[#E67388]";
              let dotColor = "bg-[#E67388] shadow-[0_0_8px_#E67388]";
              
              if (item.color === 'success') {
                badgeClasses = "bg-emerald-500/10 border-emerald-100 text-emerald-600";
                dotColor = "bg-emerald-500 shadow-[0_0_8px_#10B981]";
              } else if (item.color === 'danger') {
                themeClasses = "hover:border-rose-200/60 hover:bg-white/45 bg-transparent border-transparent sm:bg-white/35 sm:border sm:border-rose-100/30";
                badgeClasses = "bg-rose-500/10 border-rose-100 text-rose-600";
                dotColor = "bg-rose-500 shadow-[0_0_10px_#F43F5E]";
              } else if (item.color === 'warning') {
                badgeClasses = "bg-amber-500/10 border-amber-100 text-amber-600";
                dotColor = "bg-amber-500 shadow-[0_0_8px_#F59E0B]";
              } else if (item.color === 'accent') {
                badgeClasses = "bg-indigo-500/10 border-indigo-100 text-indigo-600";
                dotColor = "bg-indigo-500 shadow-[0_0_8px_#8B5CF6]";
              }

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleHotspotClick(item)}
                  whileHover={{ scale: 1.03, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group/row relative w-full h-[22%] sm:h-auto flex items-center justify-between p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl md:rounded-[18px] transition-all duration-300 pointer-events-auto text-left cursor-pointer select-none ${themeClasses} hover:shadow-[0_4px_18px_rgba(255,182,193,0.08)]`}
                >
                  {/* Blinking signal beacon core (Aligned precisely over printed dots) */}
                  <span className="absolute top-1/2 -translate-y-1/2 right-[11.5%] flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`}></span>
                  </span>

                  {/* Concentric ripples for critical SOS activator */}
                  {item.isSOS && (
                    <>
                      <span className="absolute left-[3%] top-[10%] w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-rose-500/10 animate-ping opacity-60 pointer-events-none" />
                    </>
                  )}

                  {/* Left icon & text group */}
                  <div className="hidden sm:flex items-center gap-1 sm:gap-2.5 md:gap-3.5 truncate">
                    {/* Icon circle */}
                    <div className={`w-5.5 h-5.5 sm:w-8 sm:h-8 md:w-[38px] md:h-[38px] rounded-md sm:rounded-lg md:rounded-xl bg-white border flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover/row:scale-110 ${badgeClasses}`}>
                      <Icon className="w-3 h-3 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                    </div>

                    {/* Labels */}
                    <div className="truncate">
                      <span className="text-[8.5px] sm:text-[10px] md:text-[15px] font-extrabold sm:font-black text-slate-800 tracking-tighter sm:tracking-tight block leading-tight">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {/* Right Chevron */}
                  <ChevronRight className="hidden sm:block w-3.5 h-3.5 md:w-5 md:h-5 text-slate-400 group-hover/row:text-pink-500 group-hover/row:translate-x-0.5 transition-all shrink-0 mr-1.5" />

                  {/* Premium Glassmorphic Tooltip Capsule on Hover */}
                  <div className="absolute bottom-[115%] left-0 w-28 sm:w-44 md:w-56 p-1.5 sm:p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl text-left shadow-lg opacity-0 pointer-events-none group-hover/row:opacity-100 transition-opacity duration-300 z-50">
                    <p className="text-[7px] sm:text-[8px] md:text-[10px] text-white font-extrabold tracking-wide uppercase">
                      {item.name}
                    </p>
                    <p className="text-[6px] sm:text-[7px] md:text-[9px] text-slate-300 font-semibold mt-0.5 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* DYNAMIC SHIELD CORE ACTIVATION HALO (Pulsing around padlock inside shield) */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-auto group/padlock cursor-pointer"
            style={{ left: '61.2%', top: '58.5%', width: '7%', height: '11.5%' }}
            onClick={() => navigate('/sos-center')}
          >
            {/* Pulsing rings around lock */}
            <span className="absolute inset-0 rounded-full border border-pink-400/20 animate-ping opacity-70 scale-125" />
            <span className="absolute inset-[-10px] rounded-full border border-pink-500/5 animate-pulse opacity-40 [animation-duration:3s]" />
            <div className="w-full h-full rounded-full border border-transparent group-hover:border-pink-300/30 group-hover:bg-pink-100/10 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="w-full h-full flex items-center justify-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
              </motion.div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-40 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl text-center shadow-lg opacity-0 pointer-events-none group-hover/padlock:opacity-100 transition-opacity duration-300 z-50">
              <p className="text-[9px] text-white font-extrabold uppercase tracking-wide">Shield Core Lock</p>
              <p className="text-[8px] text-emerald-400 font-semibold mt-0.5 leading-none flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                TELEMETRY ENCRYPTED
              </p>
            </div>
          </div>

          {/* DYNAMIC RIGHT SIDE HOTSPOTS (Transparent button overlays aligned on top of the hubs in the background image!) */}
          {rightHotspots.map((spot) => {
            let activeColor = "border-pink-200/40 hover:bg-white/10 shadow-[0_0_20px_rgba(255,182,193,0.15)]";
            let dotColor = "bg-[#E67388] shadow-[0_0_8px_#E67388]";
            
            if (spot.color === 'success') {
              activeColor = "hover:border-emerald-200/40 hover:bg-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
              dotColor = "bg-emerald-500 shadow-[0_0_8px_#10B981]";
            } else if (spot.color === 'danger') {
              activeColor = "hover:border-rose-200/40 hover:bg-white/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]";
              dotColor = "bg-rose-500 shadow-[0_0_10px_#F43F5E]";
            }

            return (
              <React.Fragment key={spot.id}>
                {/* 1. Pulsing signal beacon dot placed EXACTLY centered on the printed circular icon */}
                <div
                  className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2 flex h-2 w-2"
                  style={spot.beaconStyle}
                >
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                </div>

                {/* 2. Transparent interactive hotspot button spanning the circle and option label */}
                <motion.button
                  type="button"
                  onClick={() => handleHotspotClick(spot)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`absolute pointer-events-auto rounded-2xl border border-transparent backdrop-blur-[0.5px] transition-all duration-300 group/btn z-30 cursor-pointer ${activeColor}`}
                  style={spot.style}
                >
                  {/* Concentric rings on hover inside the button centered on the circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span className="w-16 h-16 rounded-full bg-pink-500/5 border border-pink-400/10 scale-0 group-hover/btn:scale-125 transition-transform duration-500 animate-pulse" />
                  </div>

                  {/* Dynamic description tooltip on hover */}
                  <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 w-28 sm:w-44 p-1.5 sm:p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl text-center shadow-lg opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-300 z-50">
                    <p className="text-[7px] sm:text-[9px] text-white font-extrabold tracking-wide uppercase">
                      {spot.name}
                    </p>
                    <p className="text-[6px] sm:text-[8px] text-slate-300 font-semibold mt-0.5 leading-tight">
                      {spot.description}
                    </p>
                  </div>
                </motion.button>
              </React.Fragment>
            );
          })}

          {/* STANDALONE circular "+" node link next to nearby hospitals */}
          <motion.div
            style={{ left: '83%', top: '73%' }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            className="absolute z-20 w-8 h-8 rounded-full bg-pink-500/10 border border-pink-200 text-pink-600 flex items-center justify-center shadow-sm cursor-pointer hover:bg-pink-500 hover:text-white transition-all duration-300 pointer-events-auto"
          >
            <Plus className="w-4 h-4" />
          </motion.div>

          {/* BOUNCY MAP PIN ANCHORS (Placed exactly over the printed nodes in the illustration) */}
          {bottomMapPins.map((pin) => (
            <div
              key={pin.id}
              className="absolute z-20 pointer-events-auto group/pin cursor-pointer -translate-x-1/2 -translate-y-1/2"
              style={pin.style}
              onClick={() => navigate('/safe-routes')}
            >
              {/* Double bounce beacon */}
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                className="w-5 h-5 flex items-center justify-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#E67388] shadow-[0_0_8px_#E67388] animate-pulse" />
                <span className="absolute w-5 h-5 rounded-full border border-pink-400/20 animate-ping opacity-60 scale-75" />
              </motion.div>

              {/* Map pin node tooltip */}
              <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 w-24 sm:w-32 p-1 sm:p-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg text-center shadow-lg opacity-0 pointer-events-none group-hover/pin:opacity-100 transition-opacity duration-300 z-50">
                <p className="text-[6px] sm:text-[8px] text-white font-extrabold uppercase tracking-wider">{pin.label}</p>
                <p className="text-[5.5px] sm:text-[7px] text-emerald-400 font-bold leading-none mt-0.5">SECURE CORRIDOR NODE</p>
              </div>
            </div>
          ))}

          {/* DYNAMIC EMERGENCY PROMPT (Overlayed exactly on top of the bottom card inside background.jpg) */}
          <div className="absolute left-[45%] bottom-[4.8%] w-[51%] h-[9%] pointer-events-auto flex items-center justify-between select-none z-20">
            <Link
              to="/sos-center"
              className="sos-glow w-full h-full flex items-center justify-between pl-4 sm:pl-12 pr-1 sm:pr-2 py-1 sm:py-2 rounded-full cursor-pointer hover:bg-pink-100/5 hover:border hover:border-pink-200/20 transition-all pointer-events-auto"
            >
              {/* Invisible spacer to block left side clicks and trigger only in SOS area if desired, or whole block links */}
              <div className="flex-1 h-full" />
              
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-rose-500 to-[#FF4777] text-white text-[7px] sm:text-[10px] font-black rounded-full shadow-md shadow-rose-200 hover:opacity-95 active:scale-95 transition-all">
                <span>Emergency SOS</span>
                <ChevronRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              </div>
            </Link>
          </div>

        </motion.div>

        {/* MOBILE INTERACTIVE OPTIONS GRID */}
        {/* Renders underneath the main dashboard card image on small viewports (< sm) for ideal mobile touch usability */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="block sm:hidden w-full mt-1.5 z-20 px-0.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1 mb-2">
            Safety Telemetry Console
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {leftMenuItems.map((item) => {
              const Icon = item.icon;
              
              let badgeClasses = "bg-pink-500/10 border-pink-100 text-[#E67388]";
              let themeClasses = "bg-white/80 border-white/60 hover:bg-white/95 hover:border-pink-200/50 shadow-[0_4px_18px_rgba(255,182,193,0.08)]";
              
              if (item.color === 'success') {
                badgeClasses = "bg-emerald-500/10 border-emerald-100 text-emerald-600";
              } else if (item.color === 'danger') {
                badgeClasses = "bg-rose-500/10 border-rose-100 text-rose-600";
                themeClasses = "bg-rose-50/70 border-rose-100/40 hover:bg-rose-50/90 shadow-[0_4px_18px_rgba(244,63,94,0.06)]";
              } else if (item.color === 'warning') {
                badgeClasses = "bg-amber-500/10 border-amber-100 text-amber-600";
              } else if (item.color === 'accent') {
                badgeClasses = "bg-indigo-500/10 border-indigo-100 text-indigo-600";
              }

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleHotspotClick(item)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.5 + leftMenuItems.indexOf(item) * 0.06, ease: 'easeOut' }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className={`flex items-center gap-2.5 p-2 rounded-2xl text-left border backdrop-blur-md transition-all active:scale-[0.98] ${themeClasses}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${badgeClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate flex-1">
                    <span className="text-[11.5px] font-black text-slate-800 tracking-tight block leading-none">
                      {item.name}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold block mt-1 leading-none truncate">
                      {item.description}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

      </main>

      {/* Floating Glassmorphic Footer Guidance bar */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 backdrop-blur-md bg-white/75 border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[24px] p-3.5 flex items-center justify-between max-w-[94%] xl:max-w-7xl 2xl:max-w-[1500px] w-full mx-auto mt-6 text-xs text-slate-500 font-bold">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-pink-600 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Interactive Safety Grid • Select console parameters to activate coordinates.</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          <span>ID: <span className="font-mono text-[10px] text-slate-400">{user?.id ? user.id.slice(0, 10) : 'GUEST'}</span></span>
          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
          <span>SSL Tunnel Secured</span>
        </div>
      </motion.footer>

      <ChatbotWidget />
      <VoiceSOSWidget />
    </div>
  );
};

export default HomePage;
