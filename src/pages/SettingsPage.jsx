import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  Settings as SettingsIcon,
  Bell,
  MapPin,
  User,
  Save,
  Loader2,
  ShieldCheck,
  Users,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone,
  Plus,
  Trash2
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        // Fetch settings
        const settings = await api.get('/user/settings');
        if (settings) {
          setNotificationsEnabled(settings.notificationsEnabled ?? true);
          setLocationSharing(settings.locationSharing ?? true);
        }
      } catch (err) {
        console.error('Failed to load user settings.', err);
      }

      try {
        // Fetch guardians from backend
        const data = await api.get('/guardians');
        if (data.success && data.guardians.length > 0) {
          setGuardians(data.guardians.map(g => ({
            name: g.name,
            relation: g.relation,
            phone: g.phone,
            email: g.email || ''
          })));
        } else {
          // Default empty guardians if none exist
          setGuardians([
            { name: '', relation: '', phone: '', email: '' },
            { name: '', relation: '', phone: '', email: '' }
          ]);
        }
      } catch (err) {
        console.error('Failed to load guardians.', err);
        setGuardians([
          { name: '', relation: '', phone: '', email: '' },
          { name: '', relation: '', phone: '', email: '' }
        ]);
      }
      setFetching(false);
    };
    fetchData();
  }, []);

  const handleGuardianChange = (index, field, value) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
    setSuccess(false);
    setError('');
  };

  const addGuardian = () => {
    setGuardians([...guardians, { name: '', relation: '', phone: '', email: '' }]);
    setSuccess(false);
  };

  const removeGuardian = (index) => {
    if (guardians.length <= 1) return;
    setGuardians(guardians.filter((_, i) => i !== index));
    setSuccess(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSuccess(false);
    setError('');
    try {
      // Save settings
      await api.post('/user/settings', { notificationsEnabled, locationSharing });
      
      // Save guardians (only non-empty ones)
      const validGuardians = guardians.filter(g => g.name.trim() && g.phone.trim());
      await api.post('/guardians', { guardians: validGuardians });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings.', err);
      setError(err.message || 'Failed to save settings. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm("Are you sure you want to log out and clear local data? Your data in the database will be preserved.")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-semibold">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-6 space-y-6 overflow-hidden">
      {/* Modern floating ambient blur spheres */}
      <div className="absolute top-[-100px] left-[-50px] w-[350px] h-[350px] bg-gradient-to-br from-primary-light/30 to-accent-light/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-[#EEF2FF]/40 to-primary-light/20 rounded-full blur-[110px] pointer-events-none" />

      <header className="mb-6 relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-gradient-to-tr from-primary to-accent rounded-xl text-white shadow-md shadow-pink-100">
              <SettingsIcon className="w-6 h-6" />
            </div>
            Settings
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-xl">
            Configure safety tracking, alert parameters, and emergency contact networks.
          </p>
        </div>
        
        {/* Telemetry Status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-pink-100/50 shadow-sm self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">Connected to Server</span>
        </div>
      </header>

      {success && (
        <div className="p-4 bg-emerald-50/90 backdrop-blur-md border border-emerald-200 text-emerald-800 font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm relative z-10">
          <div className="p-1 bg-emerald-500 text-white rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm">Settings and guardian contacts saved to database successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50/90 backdrop-blur-md border border-rose-200 text-rose-800 font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm relative z-10">
          <div className="p-1 bg-rose-500 text-white rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-6 relative z-10">
        {/* Secure Profile Section */}
        <section className="backdrop-blur-md bg-white/70 border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[24px] p-6 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(255,182,193,0.14)] transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary-dark">
              <User className="w-4 h-4" />
            </div>
            Secure Profile Details
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/80 border border-pink-100/50 rounded-2xl hover:border-primary-light/60 transition-all duration-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <User className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Full Name</span>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">{user?.name || 'User'}</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/80 border border-pink-100/50 rounded-2xl hover:border-primary-light/60 transition-all duration-200 shadow-sm flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Email Address</span>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5 truncate max-w-[200px]">{user?.email || 'Not set'}</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/80 border border-pink-100/50 rounded-2xl hover:border-primary-light/60 transition-all duration-200 shadow-sm flex items-center gap-3 sm:col-span-2 md:col-span-1">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Phone</span>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">{user?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Device Tracking & Alerts Section */}
        <section className="backdrop-blur-md bg-white/70 border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[24px] p-6 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(255,182,193,0.14)] transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/10 to-[#EEF2FF]/40 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary-dark">
              <Bell className="w-4 h-4" />
            </div>
            Device Tracking & Alerts
          </h2>
          
          <div className="space-y-4">
            {/* Notifications Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/80 border border-pink-100/50 rounded-2xl hover:border-primary-light/60 hover:shadow-sm hover:scale-[1.005] transition-all duration-300">
              <div className="flex gap-4 items-start max-w-xl">
                <div className="p-2.5 bg-primary/10 border border-primary/20 text-accent-dark rounded-xl shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm text-slate-800 block tracking-tight font-extrabold">Regional Safety Notifications</strong>
                  <span className="text-xs text-slate-500 leading-normal block mt-1 font-medium">
                    Receive instant push warnings if any safety incidents or safety alerts are reported within 1km of your active GPS position.
                  </span>
                </div>
              </div>
              
              <div 
                onClick={() => { setNotificationsEnabled(!notificationsEnabled); setSuccess(false); }}
                className={`w-14 h-7 rounded-full transition-all duration-300 p-0.5 shadow-inner cursor-pointer relative shrink-0 self-end sm:self-auto ${
                  notificationsEnabled ? 'bg-gradient-to-r from-primary-dark to-accent shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]' : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center ${
                  notificationsEnabled ? 'translate-x-7 scale-105 border border-pink-200' : 'translate-x-0 border border-slate-100'
                }`} />
              </div>
            </div>

            {/* Location Sharing Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/80 border border-pink-100/50 rounded-2xl hover:border-primary-light/60 hover:shadow-sm hover:scale-[1.005] transition-all duration-300">
              <div className="flex gap-4 items-start max-w-xl">
                <div className="p-2.5 bg-success/15 border border-success/20 text-success-dark rounded-xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm text-slate-800 block tracking-tight font-extrabold">Continuous Location Sharing</strong>
                  <span className="text-xs text-slate-500 leading-normal block mt-1 font-medium">
                    Allow our secure background coordinate socket to store and map your position for real-time SOS streams and navigation telemetry.
                  </span>
                </div>
              </div>
              
              <div 
                onClick={() => { setLocationSharing(!locationSharing); setSuccess(false); }}
                className={`w-14 h-7 rounded-full transition-all duration-300 p-0.5 shadow-inner cursor-pointer relative shrink-0 self-end sm:self-auto ${
                  locationSharing ? 'bg-gradient-to-r from-success to-success-dark shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]' : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center ${
                  locationSharing ? 'translate-x-7 scale-105 border border-emerald-200' : 'translate-x-0 border border-slate-100'
                }`} />
              </div>
            </div>
          </div>
        </section>

        {/* Guardian SOS Contacts Section */}
        <section className="backdrop-blur-md bg-white/70 border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[24px] p-6 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(255,182,193,0.14)] transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/10 to-[#FFF5F6]/40 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary-dark">
                <Users className="w-4 h-4" />
              </div>
              Guardian SOS Emergency Network
            </h2>
            <button
              onClick={addGuardian}
              className="p-2 bg-primary/10 hover:bg-primary/20 text-primary-dark rounded-xl transition-all text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6 ml-9">
            Configure trusted contacts who will receive emergency SOS SMS alerts with your GPS location when you trigger the SOS button.
            <strong className="text-primary-dark"> Add their phone number to receive alerts.</strong>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guardians.map((g, idx) => (
              <div key={idx} className="p-5 bg-white/80 border border-pink-100/50 rounded-2xl space-y-4 hover:border-primary-light/60 transition-all duration-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-50/30 to-transparent rounded-full pointer-events-none" />
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-primary-dark flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-accent" /> Guardian {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase bg-pink-50 border border-pink-100 text-accent-dark px-2 py-0.5 rounded-full">
                      SOS Recipient
                    </span>
                    {guardians.length > 1 && (
                      <button onClick={() => removeGuardian(idx)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label text-[10px] text-slate-500 font-bold block mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      value={g.name} 
                      onChange={(e) => handleGuardianChange(idx, 'name', e.target.value)} 
                      placeholder="Guardian Name" 
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-primary/50 transition-all" 
                    />
                  </div>
                  
                  <div>
                    <label className="input-label text-[10px] text-slate-500 font-bold block mb-1">Relationship</label>
                    <input 
                      type="text" 
                      value={g.relation} 
                      onChange={(e) => handleGuardianChange(idx, 'relation', e.target.value)} 
                      placeholder="e.g. Brother" 
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-primary/50 transition-all" 
                    />
                  </div>
                  
                  <div>
                    <label className="input-label text-[10px] text-slate-500 font-bold block mb-1">Mobile Phone *</label>
                    <input 
                      type="tel" 
                      value={g.phone} 
                      onChange={(e) => handleGuardianChange(idx, 'phone', e.target.value)} 
                      placeholder="Phone Number" 
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50/50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-primary/50 transition-all" 
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Actions Section */}
        <section className="backdrop-blur-md bg-red-50/30 border border-red-100 shadow-[0_8px_32px_rgba(255,71,119,0.04)] rounded-[24px] p-6 relative overflow-hidden group hover:border-danger/35 hover:shadow-[0_12px_40px_rgba(255,71,119,0.1)] transition-all duration-300">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-danger/5 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-sm font-bold text-danger uppercase tracking-wider mb-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-danger/10 rounded-lg text-danger animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            Session Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mb-4 max-w-2xl ml-9">
            Log out and clear local session data. Your account data, guardians, and reports in the database will be preserved.
          </p>
          
          <div className="ml-9">
            <button
              type="button"
              onClick={handleResetDatabase}
              className="px-5 py-3 bg-white/70 hover:bg-danger/10 border border-slate-200 hover:border-danger/35 text-slate-600 hover:text-danger-dark font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Session & Logout
            </button>
          </div>
        </section>

        {/* Save Preferences Button */}
        <button 
          onClick={handleSaveSettings} 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-primary-dark via-primary to-accent hover:from-primary hover:to-accent text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(255,141,161,0.25)] hover:shadow-[0_10px_28px_rgba(255,141,161,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Saving to Database...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" /> Save All Settings & Guardians
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
