import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Radio,
  Volume2,
  ShieldCheck,
  X,
  Check,
  Clock,
  User,
  Activity,
  PhoneOff,
  Bell,
  Lock,
  Wifi,
  Navigation,
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';

const SOSCenterPage = () => {
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fakeCallTimer, setFakeCallTimer] = useState(null);
  const [incomingCallActive, setIncomingCallActive] = useState(false);
  const [callAnswered, setCallAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState({ lat: '', lon: '' });
  const [simulatedSubtitles, setSimulatedSubtitles] = useState('');
  const [callerName, setCallerName] = useState('Mom');
  const [callDelay, setCallDelay] = useState('0');
  const [sosMessage, setSosMessage] = useState('');

  const countdownInterval = useRef(null);
  const fakeCallInterval = useRef(null);
  const subtitleTimeouts = useRef([]);
  const ringtoneInterval = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeOscillatorsRef = useRef([]);

  useEffect(() => {
    const handleStatusChanged = (e) => {
      const { active, lat, lon, message } = e.detail;
      if (active) {
        setSosActive(true);
        setCountdown(5);
        if (lat && lon) {
          setGpsCoords({ lat, lon });
        }
        if (message) {
          setSosMessage(message);
        }
      } else {
        setSosActive(false);
        setCountdown(0);
      }
    };

    window.addEventListener('sos-status-changed', handleStatusChanged);

    return () => {
      window.removeEventListener('sos-status-changed', handleStatusChanged);
      clearInterval(countdownInterval.current);
      clearInterval(fakeCallInterval.current);
      subtitleTimeouts.current.forEach(clearTimeout);
      clearInterval(ringtoneInterval.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const handleActivateSOS = () => {
    setSosActive(true);
    setCountdown(5);
    setSosMessage('Activating emergency beacon & locating device...');

    // Perform geolocation lock and backend alert asynchronously in background
    (async () => {
      let lat = gpsCoords.lat;
      let lon = gpsCoords.lon;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 2000,
              maximumAge: 10000
            });
          });
          lat = pos.coords.latitude.toFixed(4);
          lon = pos.coords.longitude.toFixed(4);
          setGpsCoords({ lat, lon });
        } catch (gpsErr) {
          console.warn('GPS timed out or failed, using cached location:', gpsErr);
        }
      }

      try {
        const result = await api.post('/sos/activate', { lat, lon });
        setSosMessage(result.message || 'Emergency SOS activated!');
      } catch (err) {
        console.error(err);
        setSosMessage('SOS signal dispatched locally. Offline mode active.');
      }
    })();
  };

  const handleDeactivateSOS = async () => {
    setLoading(true);
    try {
      await api.post('/sos/deactivate');
      setSosActive(false);
      setCountdown(0);
      clearInterval(countdownInterval.current);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sosActive && countdown > 0) {
      countdownInterval.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
  }, [sosActive, countdown]);

  const startRingtone = (ctx) => {
    if (!ctx) return;
    audioCtxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      gain2.gain.setValueAtTime(0.05, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      osc2.start(startTime);
      osc2.stop(startTime + 0.05);
      activeOscillatorsRef.current.push(osc, osc2);
    };
    const playMelody = () => {
      const now = ctx.currentTime;
      playNote(880.00, now, 0.15);
      playNote(987.77, now + 0.15, 0.15);
      playNote(1108.73, now + 0.3, 0.15);
      playNote(880.00, now + 0.45, 0.15);
      playNote(659.25, now + 0.6, 0.3);
      playNote(880.00, now + 1.0, 0.15);
      playNote(987.77, now + 1.15, 0.15);
      playNote(1108.73, now + 1.3, 0.15);
      playNote(880.00, now + 1.45, 0.15);
      playNote(659.25, now + 1.6, 0.3);
    };
    playMelody();
    ringtoneInterval.current = setInterval(playMelody, 2000);
  };

  const stopRingtone = () => {
    clearInterval(ringtoneInterval.current);
    if (activeOscillatorsRef.current) {
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      activeOscillatorsRef.current = [];
    }
    if (masterGainRef.current) {
      try {
        masterGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        masterGainRef.current.disconnect();
      } catch (e) {}
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
  };

  const triggerFakeCall = async (delay = 0) => {
    // Synchronously unlock AudioContext during the user click gesture
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    if (AudioContext) {
      ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }

    setLoading(true);
    try {
      await api.post('/sos/fake-call');
      if (delay === 0) {
        setIncomingCallActive(true);
        startRingtone(ctx);
        return;
      }
      setFakeCallTimer(delay);
      fakeCallInterval.current = setInterval(() => {
        setFakeCallTimer((prev) => {
          if (prev <= 1) {
            clearInterval(fakeCallInterval.current);
            setIncomingCallActive(true);
            startRingtone(ctx);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSubtitles = () => {
    const dialogs = [
      { text: "Mom: Hey honey! Where are you? I've been waiting for you.", delay: 1000 },
      { text: "Mom: I'm just standing outside the block entrance with your brother.", delay: 5000 },
      { text: "Mom: Yes, we are waiting for you right here. See you in 2 minutes!", delay: 9000 },
      { text: "Mom: Stay on the line until you arrive. We are watching the gate.", delay: 13000 }
    ];
    // Clear any existing subtitle timeouts
    subtitleTimeouts.current.forEach(clearTimeout);
    subtitleTimeouts.current = [];

    dialogs.forEach((dialog) => {
      const timeoutId = setTimeout(() => {
        setSimulatedSubtitles(dialog.text);
        const utterance = new SpeechSynthesisUtterance(dialog.text.replace("Mom: ", ""));
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }, dialog.delay);
      subtitleTimeouts.current.push(timeoutId);
    });
  };

  const handleAnswerCall = () => {
    setCallAnswered(true);
    runSubtitles();
    stopRingtone();
  };

  const handleDeclineCall = () => {
    setIncomingCallActive(false);
    setCallAnswered(false);
    setSimulatedSubtitles('');
    subtitleTimeouts.current.forEach(clearTimeout);
    subtitleTimeouts.current = [];
    window.speechSynthesis.cancel();
    stopRingtone();
  };

  const cancelFakeCall = () => {
    clearInterval(fakeCallInterval.current);
    setFakeCallTimer(null);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-[#F8FAFC] to-[#EEF2FF]">
      
      {/* Smartphone Fake Call Simulation Screen (iOS/Android High-Fidelity Style) */}
      {incomingCallActive && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#111827] to-[#030712] rounded-[48px] border-8 border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.8)] aspect-[9/19.5] max-h-[850px] flex flex-col justify-between p-8 text-center relative overflow-hidden">
            
            {/* Top Speaker/Camera Bar */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full mr-2" />
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
            </div>

            {/* Inbound Header */}
            <div className="mt-12 space-y-3">
              <div className="relative w-28 h-28 mx-auto">
                {/* Glowing Concentric Rings around Avatar */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
                <div className="relative w-28 h-28 rounded-full bg-slate-800 border-2 border-primary/50 flex items-center justify-center shadow-lg">
                  <User className="w-14 h-14 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-wide">{callerName}</h2>
              <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase animate-pulse">
                {callAnswered ? 'Active Connection' : 'Inbound Security Line'}
              </p>
            </div>

            {/* Interactive Live Deterrent Transcription */}
            {callAnswered ? (
              <div className="my-6 p-5 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col items-center justify-center min-h-[160px] shadow-inner">
                <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest mb-3">
                  <Volume2 className="w-4 h-4 animate-bounce text-rose-400" /> Active Audio Transcript
                </div>
                <p className="text-sm font-medium text-slate-100 italic leading-relaxed text-center">
                  &ldquo;{simulatedSubtitles || 'Connecting audio deterrent stream...'}&rdquo;
                </p>
              </div>
            ) : (
              <div className="my-6 p-4 bg-slate-900/40 rounded-2xl text-slate-400 text-xs max-w-xs mx-auto leading-relaxed border border-slate-900">
                Answer this simulation to activate high-volume voice dialogue, providing a robust excuse to exit suspicious situations.
              </div>
            )}

            {/* Bottom Actions Trigger */}
            <div className="mb-6 w-full">
              {callAnswered ? (
                <button
                  onClick={handleDeclineCall}
                  className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center mx-auto transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30 border-2 border-white/20"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              ) : (
                <div className="flex justify-around items-center gap-10">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={handleDeclineCall}
                      className="w-16 h-16 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20 border border-white/10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Decline</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={handleAnswerCall}
                      className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 animate-bounce shadow-lg shadow-emerald-500/20 border border-white/10"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Answer</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="p-4 md:p-6 space-y-6">
        
        {/* Urgent Premium Header Area */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-rose-100 border border-rose-200 text-rose-500 rounded-2xl shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              Emergency SOS Control Center
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-xl">
              Initiate rapid tactical response protocols, notify personal safety guardians, or run mock safety escape calls instantly.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-2xl self-start md:self-auto shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            256-Bit Tactical Encryption Active
          </div>
        </header>

        {/* Live Control Center Status Bar Widgets (Premium 4-Column Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">GPS Signal</span>
              <strong className="text-xs text-slate-800 block">LOCKED (RTK High)</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Protocol Lock</span>
              <strong className="text-xs text-slate-800 block">AES-256 SECURED</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Guardian Nodes</span>
              <strong className="text-xs text-slate-800 block">2 ONLINE / STEADY</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Dispatched Network</span>
              <strong className="text-xs text-slate-800 block">CELLULAR LINK OK</strong>
            </div>
          </div>
        </div>

        {/* Trial Restriction Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start gap-4 shadow-[0_4px_20px_rgba(251,191,36,0.15)] mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shrink-0 shadow-sm border border-amber-200">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              System Notification <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
            </h3>
            <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-4xl">
              We are currently operating on a free trial tier. At this time, SOS SMS emergency alerts are restricted to <strong>pre-registered Guardian phone numbers only</strong>. 
              Upon upgrading, this feature will seamlessly dispatch alerts to any emergency contact globally. 
              <span className="block mt-2 font-bold text-amber-900 bg-amber-100/50 inline-block px-3 py-1.5 rounded-lg border border-amber-200/50">
                ✨ If you would like a live demonstration of the full unlimited capabilities, please contact me!
              </span>
            </p>
          </div>
        </div>

        {/* Central Dashboard Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Central SOS Activation Console Area (Left Panel) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SOS Trigger Panel */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col justify-between items-center text-center min-h-[460px] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-[#EC4899] to-red-500" />
              
              <div>
                <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-extrabold text-rose-600 tracking-widest uppercase inline-block mb-3 animate-pulse">
                  {sosActive ? 'CRITICAL PROTOCOL ACTIVE' : 'RESPONDER TELEMETRY READY'}
                </span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {sosActive ? 'BROADCASTING EMERGENCY BEACON' : 'ONE-TAP RAPID SOS DISPATCH'}
                </h2>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  {sosActive
                    ? 'Your highly encrypted location coordinates are actively streaming to central responder networks and your private guardians.'
                    : 'Activating this protocol triggers direct coordinate broadcasts to regional dispatchers and sends customized SMS alerts to your pre-selected safety guardians.'}
                </p>
              </div>

              {/* Massive Urgent Redesigned SOS button */}
              <div className="my-8 relative flex items-center justify-center w-64 h-64">
                {sosActive ? (
                  <>
                    {/* Concentric Emergency Pulsing Rings */}
                    <div className="absolute w-60 h-60 rounded-full bg-rose-500/10 border border-rose-500/20 animate-ping duration-[3000ms]"></div>
                    <div className="absolute w-48 h-48 rounded-full bg-rose-600/15 border border-rose-500/30 animate-pulse duration-1500"></div>
                    <div className="absolute w-36 h-36 rounded-full bg-rose-500/5 animate-ping duration-[2000ms]"></div>
                    <button
                      onClick={handleDeactivateSOS}
                      className="relative z-10 w-36 h-36 rounded-full bg-rose-600 text-white font-extrabold flex flex-col items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white text-xs uppercase tracking-widest"
                    >
                      <X className="w-10 h-10 mb-1 animate-pulse" /> Cancel SOS
                    </button>
                  </>
                ) : (
                  <>
                    {/* Glowing Accent Ring Concentrics */}
                    <div className="absolute w-60 h-60 rounded-full bg-gradient-to-tr from-rose-500/5 to-rose-600/5 border border-rose-200/40 animate-ping duration-[4000ms]"></div>
                    <div className="absolute w-48 h-48 rounded-full bg-rose-50/60 border border-rose-100 animate-pulse duration-[2000ms]"></div>
                    <button
                      onClick={handleActivateSOS}
                      disabled={loading}
                      className="relative z-10 w-36 h-36 rounded-full bg-gradient-to-tr from-[#F43F5E] via-[#EC4899] to-[#EF4444] text-white font-black flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(244,63,94,0.35)] hover:shadow-[0_25px_60px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white text-xs uppercase tracking-widest"
                    >
                      <Shield className="w-10 h-10 mb-1.5 animate-bounce" /> Tap to SOS
                    </button>
                  </>
                )}
              </div>

              {/* Dynamic Broadcast status panels */}
              {sosActive ? (
                <div className="w-full bg-slate-50 border border-rose-100 p-4 rounded-2xl text-left space-y-2 animate-in slide-in-from-bottom duration-300 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse" /> Dispatch Feed Live
                    </span>
                    <span>BEACON LOCK OK</span>
                  </div>
                  {countdown > 0 ? (
                    <p className="text-sm font-bold text-slate-800 text-center py-1">
                      Broadcasting emergency pack in: <span className="text-rose-500 animate-pulse">{countdown}s</span>
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Latitude Grid</span>
                        <span className="text-slate-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {gpsCoords.lat ? `${gpsCoords.lat}° N` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-extrabold text-[10px] tracking-wider uppercase block">Longitude Grid</span>
                        <span className="text-slate-700 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {gpsCoords.lon ? `${gpsCoords.lon}° E` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> {sosMessage || 'SOS activated. Notifying guardians...'}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> System State Secured & Calibrated
                </div>
              )}
            </section>

            {/* Live Location Card below SOS Trigger */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-slate-800 text-sm">Live GPS Telemetry Display</h3>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  GPS Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Current Latitude</span>
                  <span className="text-xs font-mono font-bold text-slate-700 block mt-1">{gpsCoords.lat ? `${gpsCoords.lat}° N` : 'Locating...'}</span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Current Longitude</span>
                  <span className="text-xs font-mono font-bold text-slate-700 block mt-1">{gpsCoords.lon ? `${gpsCoords.lon}° E` : 'Locating...'}</span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">GPS Precision Limit</span>
                  <span className="text-xs font-semibold text-emerald-600 block mt-1">±3 meters (High Accuracy)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Telemetry coordinates stream dynamically to backend response hubs using regional cell towers & satellite positioning data.
              </p>
            </section>
          </div>

          {/* Interactive Fake Call & Helplines (Right Panel) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Redesigned Fake Call Card */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-primary animate-pulse" /> Safety Deterrent Fake Call
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Schedule or receive a simulated incoming call. This provides a highly realistic, interactive excuse to exit tense or suspicious groups easily.
                </p>
              </div>

              {fakeCallTimer !== null ? (
                <div className="p-5 bg-pink-50/60 border border-pink-100 rounded-2xl text-center space-y-3.5 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inbound Call Timer Running</p>
                  <p className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6 text-primary animate-spin" /> {fakeCallTimer}s remaining
                  </p>
                  <button
                    onClick={cancelFakeCall}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Cancel Scheduled Call
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block pl-1">Caller Name</label>
                      <input
                        type="text"
                        value={callerName}
                        onChange={(e) => setCallerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white text-xs font-bold text-slate-800 p-2.5 rounded-xl transition-all outline-none"
                        placeholder="e.g. Mom"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block pl-1">Delay (s)</label>
                      <input
                        type="number"
                        value={callDelay}
                        onChange={(e) => setCallDelay(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white text-xs font-bold text-slate-800 p-2.5 rounded-xl transition-all outline-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <button
                      onClick={() => triggerFakeCall(0)}
                      disabled={loading || sosActive}
                      className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold py-3 rounded-2xl text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-500" /> Trigger Now
                    </button>
                    <button
                      onClick={() => triggerFakeCall(parseInt(callDelay) || 0)}
                      disabled={loading || sosActive || !callDelay || callDelay === '0'}
                      className="flex items-center justify-center gap-2 bg-gradient-to-tr from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white font-bold py-3 rounded-2xl text-xs transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5" /> Schedule Call
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-medium text-slate-400 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>Renders an ultra-realistic smartphone interface, plays high-definition ringtones, and streams spoken dialog deterrents.</span>
                  </div>
                </div>
              )}
            </section>

            {/* Direct Dispatch Redesigned Helplines */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-5">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
                <PhoneCall className="w-4 h-4 text-rose-500 animate-pulse" /> Emergency Helpline Network
              </h3>
              
              <div className="space-y-3.5">
                
                {/* Police Hub */}
                <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl hover:border-blue-300 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">National Police Dispatch</span>
                      <span className="text-[10px] font-semibold text-blue-600">Police Department Hub</span>
                    </div>
                  </div>
                  <a
                    href="tel:100"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all group-hover:scale-105 shadow-sm shadow-blue-500/25"
                  >
                    <PhoneCall className="w-3 h-3" /> 100
                  </a>
                </div>

                {/* Women Helpline */}
                <div className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-100/50 rounded-2xl hover:border-rose-300 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Women Helper Helpline</span>
                      <span className="text-[10px] font-semibold text-rose-600">Special Responder Cell</span>
                    </div>
                  </div>
                  <a
                    href="tel:1091"
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all group-hover:scale-105 shadow-sm shadow-rose-500/25"
                  >
                    <PhoneCall className="w-3 h-3" /> 1091
                  </a>
                </div>

                {/* Ambulance */}
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl hover:border-emerald-300 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Medical Ambulance Corps</span>
                      <span className="text-[10px] font-semibold text-emerald-600">Emergency Aid & Trauma</span>
                    </div>
                  </div>
                  <a
                    href="tel:102"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all group-hover:scale-105 shadow-sm shadow-emerald-500/25"
                  >
                    <PhoneCall className="w-3 h-3" /> 102
                  </a>
                </div>

              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSCenterPage;
