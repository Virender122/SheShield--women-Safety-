import React, { useState, useEffect } from 'react';
import { routeService } from '../services/routeService';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Search,
  Clock,
  Compass,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Activity,
  Lightbulb,
  Shield,
  Heart,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const sourceIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg shadow-emerald-500/50"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}) : null;

const destIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}) : null;

const policeIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div class="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center border-2 border-white shadow-xl shadow-blue-600/50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
}) : null;

const hospitalIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center border-2 border-rose-600 shadow-xl shadow-rose-500/50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
}) : null;

function MapController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

const SafeRoutesPage = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const [routeData, setRouteData] = useState(null);
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [polylinePositions, setPolylinePositions] = useState([]);
  const [mapBounds, setMapBounds] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const [steps, setSteps] = useState([]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
            {
              headers: {
                'User-Agent': 'WomenSafetyApp/1.0'
              }
            }
          );
          const data = await response.json();
          if (data && data.display_name) {
            setSource(data.display_name);
          } else {
            setSource(`${latitude}, ${longitude}`);
          }
        } catch (err) {
          console.error(err);
          setSource(`${latitude}, ${longitude}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Failed to detect your current location. Please ensure location permissions are granted.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Debounced search for Source Point Suggestions
  useEffect(() => {
    if (source.trim().length < 3) {
      setSourceSuggestions([]);
      setShowSourceSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(source)}&accept-language=en&limit=5`,
          {
            headers: {
              'User-Agent': 'WomenSafetyApp/1.0'
            }
          }
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSourceSuggestions(data);
          setShowSourceSuggestions(true);
        }
      } catch (err) {
        console.error('Error fetching source suggestions:', err);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [source]);

  // Debounced search for Destination Point Suggestions
  useEffect(() => {
    if (destination.trim().length < 3) {
      setDestSuggestions([]);
      setShowDestSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&accept-language=en&limit=5`,
          {
            headers: {
              'User-Agent': 'WomenSafetyApp/1.0'
            }
          }
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setDestSuggestions(data);
          setShowDestSuggestions(true);
        }
      } catch (err) {
        console.error('Error fetching destination suggestions:', err);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  // Click outside suggestions dropdown to close
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSourceSuggestions(false);
      setShowDestSuggestions(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSelectSource = (displayName) => {
    setSource(displayName);
    setShowSourceSuggestions(false);
  };

  const handleSelectDest = (displayName) => {
    setDestination(displayName);
    setShowDestSuggestions(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !destination) {
      setError('Please provide both source and destination.');
      return;
    }

    setLoading(true);
    setError('');
    setRouteData(null);
    setPolylinePositions([]);
    setMapBounds([]);
    setPoliceStations([]);
    setHospitals([]);
    setDangerZones([]);
    setSafetyAnalysis(null);
    setSteps([]);

    try {
      const start = await routeService.getCoordinates(source);
      const end = await routeService.getCoordinates(destination);

      setSourceCoords([start.lat, start.lon]);
      setDestCoords([end.lat, end.lon]);

      let incidents = [];
      try {
        incidents = await api.get('/incidents/all');
        setDangerZones(incidents);
      } catch (e) {
        console.error("Could not fetch danger zones", e);
      }

      const routeFeature = await routeService.getRoute(start, end, incidents);
      setRouteData(routeFeature);

      const coords = routeFeature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setPolylinePositions(coords);
      setMapBounds(coords);

      const routeSteps = routeFeature.properties.segments[0].steps.map(step => ({
        instruction: step.instruction,
        distance: (step.distance / 1000).toFixed(2),
        duration: Math.round(step.duration / 60)
      }));
      setSteps(routeSteps);

      const midpoint = coords[Math.floor(coords.length / 2)];

      const police = await routeService.getNearbyAmenities(midpoint[0], midpoint[1], 'police', 5000);
      const medical = await routeService.getNearbyAmenities(midpoint[0], midpoint[1], 'hospital', 5000);

      setPoliceStations(police);
      setHospitals(medical);

      const analysis = routeService.calculateSafetyScore(routeFeature, police, medical);
      setSafetyAnalysis(analysis);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to calculate safe route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-primary-dark" /> Intelligence Safe Routing
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Real-time navigation optimized for women's safety using live geospatial data.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary-dark" /> Plan Safe Journey
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-1">
                  <label className="input-label flex items-center gap-1.5 text-slate-600 font-bold mb-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Start Point
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="text-[10px] font-bold text-primary-dark hover:text-accent flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {locating ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-primary-dark" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5 text-primary-dark animate-pulse" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Enter city or address"
                  className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                />
                {showSourceSuggestions && sourceSuggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs text-slate-700">
                    {sourceSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSource(item.display_name);
                        }}
                        className="px-4 py-2.5 hover:bg-pink-500/5 hover:text-primary-dark cursor-pointer font-medium transition-colors"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="input-label flex items-center gap-1.5 text-slate-600 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> End Point
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter city or address"
                  className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                />
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs text-slate-700">
                    {destSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDest(item.display_name);
                        }}
                        className="px-4 py-2.5 hover:bg-pink-500/5 hover:text-primary-dark cursor-pointer font-medium transition-colors"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.3)] hover:shadow-[0_6px_20px_rgba(255,141,161,0.4)] flex justify-center items-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Synthesizing Route...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Calculate Safe Route
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 p-3.5 bg-gradient-to-r from-pink-500/5 to-accent/5 border border-pink-100/40 rounded-xl">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-warning-dark" /> Safety Core Technology
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                This module analyzes real-time street networks, live police infrastructure, and emergency services via OpenStreetMap and OpenRouteService.
              </p>
            </div>
          </div>

          {steps.length > 0 && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5 max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-primary-dark" /> Navigation Steps
              </h3>
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-primary/30">
                        {idx + 1}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="w-[1.5px] bg-gradient-to-b from-primary/50 to-pink-100/20 h-10 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">{step.instruction}</p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {step.distance} km • approx {step.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-3 overflow-hidden h-[500px] relative">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', borderRadius: '0.85rem' }}
              className="z-10"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapController bounds={mapBounds} />

              {polylinePositions.length > 0 && (
                <Polyline positions={polylinePositions} color="#FF8DA1" weight={5} opacity={0.8} />
              )}

              {sourceCoords && (
                <Marker position={sourceCoords} icon={sourceIcon}>
                  <Popup><div className="text-xs font-bold text-slate-800">Start: {source}</div></Popup>
                </Marker>
              )}

              {destCoords && (
                <Marker position={destCoords} icon={destIcon}>
                  <Popup><div className="text-xs font-bold text-slate-800">End: {destination}</div></Popup>
                </Marker>
              )}

              {policeStations.map((node) => (
                <Marker key={node.id} position={[node.lat, node.lon]} icon={policeIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-500" /> Police Station
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{node.tags?.name || 'Local Police Post'}</div>
                  </Popup>
                </Marker>
              ))}

              {hospitals.map((node) => (
                <Marker key={node.id} position={[node.lat, node.lon]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" /> Hospital / Medical
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{node.tags?.name || 'Medical Center'}</div>
                  </Popup>
                </Marker>
              ))}

              {dangerZones.map((inc, i) => {
                if (!inc.lat || !inc.lon) return null;
                return (
                  <Circle 
                    key={`danger-${i}`} 
                    center={[parseFloat(inc.lat), parseFloat(inc.lon)]} 
                    radius={111} 
                    pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.3, weight: 1 }}
                  >
                    <Popup>
                      <div className="text-xs font-bold text-rose-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Danger Zone (Avoided)
                      </div>
                      <div className="text-[10px] text-slate-700"><strong>Type:</strong> {inc.type}</div>
                      <div className="text-[10px] text-slate-700"><strong>Severity:</strong> {inc.severity}</div>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>

            <div className="absolute top-6 right-6 z-[1000] bg-white/85 border border-pink-100/60 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Eye className="w-3.5 h-3.5 text-primary-dark" /> Live Safety Layer Active
            </div>

            <div className="absolute bottom-6 left-6 z-[1000] bg-white/85 border border-pink-100/60 p-3.5 rounded-2xl shadow-md backdrop-blur-md space-y-2 text-xs">
              <span className="font-bold text-slate-800 text-[11px] block mb-1">Route Legend</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-700 text-[10px] font-semibold">Start Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-slate-700 text-[10px] font-semibold">End Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm shadow-blue-500/30">P</div>
                <span className="text-slate-700 text-[10px] font-semibold">Police Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm shadow-rose-500/30">+</div>
                <span className="text-slate-700 text-[10px] font-semibold">Hospital</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 rounded-full bg-rose-500/30 border border-rose-500"></div>
                <span className="text-slate-700 text-[10px] font-semibold">Danger Zone (Avoided)</span>
              </div>
            </div>
          </div>

          {routeData && safetyAnalysis && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5 bg-gradient-to-r from-[#FFF5F6]/40 via-white/50 to-[#EEF2FF]/30 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Distance</span>
                  <p className="text-xl md:text-2xl font-black text-slate-800 mt-1">
                    {(routeData.properties.summary.distance / 1000).toFixed(1)} km
                  </p>
                </div>
                <div className="border-x border-pink-100/50">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Est. Duration</span>
                  <p className="text-xl md:text-2xl font-black text-slate-800 mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-4.5 h-4.5 text-primary-dark" />
                    {Math.round(routeData.properties.summary.duration / 60)} min
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Safety Index</span>
                  <div className="flex flex-col items-center mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold border ${getSafetyScoreColor(safetyAnalysis.score)}`}>
                      {safetyAnalysis.score}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500">Risk Assessment</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${getSafetyScoreColor(safetyAnalysis.score).split(' ')[0]}`}>
                    {safetyAnalysis.riskLevel === 'Highly Safe' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {safetyAnalysis.riskLevel}
                  </span>
                </div>
                <div className="w-full bg-slate-100/70 border border-slate-200/40 h-3 rounded-full overflow-hidden p-[2px]">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      safetyAnalysis.score >= 85 ? 'bg-emerald-500' : safetyAnalysis.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${safetyAnalysis.score}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Status: <span className="text-slate-800 font-semibold">{safetyAnalysis.corridorStatus}</span>. Based on {policeStations.length} police posts and {hospitals.length} medical facilities within 5km.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/55 border border-pink-100/30 rounded-2xl shadow-sm hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-500" /> Police Protection
                    </h4>
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-200/30">
                      {policeStations.length} Found
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-normal max-h-[100px] overflow-y-auto space-y-1 scrollbar-thin">
                    {policeStations.length > 0 ? (
                      policeStations.slice(0, 3).map((node, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="truncate max-w-[150px] font-medium">{node.tags?.name || 'Police Post'}</span>
                          <span className="text-[10px] text-slate-500">Within 5km</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No active police posts found in search radius.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white/55 border border-pink-100/30 rounded-2xl shadow-sm hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500" /> Medical Centers
                    </h4>
                    <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded font-bold border border-rose-200/30">
                      {hospitals.length} Found
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-normal max-h-[100px] overflow-y-auto space-y-1 scrollbar-thin">
                    {hospitals.length > 0 ? (
                      hospitals.slice(0, 3).map((node, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="truncate max-w-[150px] font-medium">{node.tags?.name || 'Hospital'}</span>
                          <span className="text-[10px] text-slate-500">Within 5km</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No active medical centers found in search radius.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!routeData && !loading && (
            <div className="bg-white/50 backdrop-blur-md border border-dashed border-pink-200/60 shadow-sm p-12 flex flex-col items-center justify-center text-center h-[500px] rounded-[20px] hover:border-primary/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#EEF2FF] border border-pink-100/60 flex items-center justify-center mb-5 shadow-sm">
                <Navigation className="w-7 h-7 text-primary-dark" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Compute Safe Coordinates</h3>
              <p className="text-slate-600 text-xs sm:text-sm max-w-sm mt-2 leading-relaxed">
                Provide your source and target destinations in the panel to instantly map and compare safe walking routes.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SafeRoutesPage;

