import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import ChatbotWidget from './ChatbotWidget';
import VoiceSOSWidget from './VoiceSOSWidget';
import { connectSocket } from '../services/socket';
import { useNotificationStore } from '../context/notificationStore';
import { useAuthStore } from '../context/authStore';

const DashboardLayout = ({ children, title = 'Home' }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const addNotification = useNotificationStore(state => state.addNotification);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const socket = connectSocket();

    const handleNewIncident = (incident) => {
      if (incident.severity === 'High' || incident.severity === 'Critical') {
        addNotification({
          type: 'alert',
          title: `${incident.severity} Severity Incident`,
          message: `${incident.type} reported near ${incident.location}`,
          link: '/safe-routes'
        });
      }
    };

    const handleNewMessage = (msg) => {
      if (msg.replyTo && user && msg.replyTo.username === user.name && msg.username !== user.name) {
        addNotification({
          type: 'community',
          title: 'New Reply',
          message: `${msg.username} replied to your message.`,
          link: '/community'
        });
      }
    };

    socket.on('new_incident', handleNewIncident);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_incident', handleNewIncident);
      socket.off('new_message', handleNewMessage);
    };
  }, [user, addNotification]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="h-screen flex relative overflow-hidden text-slate-800">
      {/* Immersive brand background graphic with custom high-end glassmorphism overlay */}
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat -z-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/75 via-[#FFF5F6]/70 to-[#FFF0F2]/60 backdrop-blur-[1.5px] -z-10" />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopHeader
          title={title}
          onMenuToggle={handleMenuToggle}
        />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <ChatbotWidget />
      <VoiceSOSWidget />
    </div>
  );
};

export default DashboardLayout;
