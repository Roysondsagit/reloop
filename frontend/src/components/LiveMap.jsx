import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Maximize2, Minimize2, WifiOff, Zap } from 'lucide-react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// --- ASSETS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- HELPERS ---
const MapResizer = ({ isExpanded }) => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
            if(!isExpanded) map.setView([19.0760, 72.8777], 11);
        }, 300); 
    }, [isExpanded, map]);
    return null;
};

const createPulseIcon = (color) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 1.5px solid white; animation: pulse 2s infinite;"></div>`,
    iconSize: [8, 8], iconAnchor: [4, 4]
});

export const LiveMap = ({ isExpanded, onToggle }) => {
    const [mapData, setMapData] = useState({ pings: [], factories: [], stats: { active_users: 0 } });
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (!isExpanded) return; 
        const controller = new AbortController();
        const fetchMapData = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/live-activity', { signal: controller.signal });
                if (!res.ok) throw new Error("Offline");
                setMapData(await res.json());
                setIsOffline(false);
            } catch (e) { if (e.name !== 'AbortError') setIsOffline(true); }
        };
        fetchMapData();
        const interval = setInterval(fetchMapData, 3000);
        return () => { clearInterval(interval); controller.abort(); };
    }, [isExpanded]);

    return (
        <div className="w-full h-full relative group bg-slate-900/50 backdrop-blur-xl overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            
            {/* MINI RADAR OVERLAY (Clean, No Text) */}
            {!isExpanded && (
                <div className="absolute inset-0 z-[500] pointer-events-none">
                    <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                    <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-green-400/80 to-transparent shadow-[0_0_15px_#4ade80] top-0 animate-[scan_2.5s_linear_infinite]" />
                    {/* Tiny Status Dot */}
                    <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
            )}

            <MapContainer 
                center={[19.0760, 72.8777]} zoom={isExpanded ? 13 : 10} 
                zoomControl={false} attributionControl={false}
                className="w-full h-full mix-blend-screen"
                style={{ background: '#050b14' }} 
            >
                <MapResizer isExpanded={isExpanded} />
                <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

                {isExpanded && mapData.pings?.map((ping) => (
                    <Marker key={ping.id} position={[ping.lat, ping.lon]} icon={createPulseIcon(ping.material === 'Plastic' ? '#4ade80' : '#f97316')} />
                ))}
                {isExpanded && mapData.factories?.map((fac) => (
                    <CircleMarker key={fac.id} center={[fac.lat, fac.lon]} radius={8} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 }} />
                ))}
            </MapContainer>

            {/* EXPANDED UI (Only visible when open) */}
            <AnimatePresence>
                {isExpanded && (
                    <>
                        {/* Stats Pill */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute top-6 left-6 z-[400]">
                            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 shadow-2xl">
                                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                                <span className="text-xs font-mono text-green-400 font-bold tracking-widest">{mapData.stats?.active_users || 0} NODES ONLINE</span>
                            </div>
                        </motion.div>

                        {/* Legend */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-6 z-[400] bg-black/90 backdrop-blur p-4 rounded-2xl border border-white/10 shadow-2xl">
                            <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Signal Key</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" /><span className="text-[10px] font-bold text-slate-300">Supply (Plastic)</span></div>
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /><span className="text-[10px] font-bold text-slate-300">Supply (MLP)</span></div>
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 border border-blue-400" /><span className="text-[10px] font-bold text-slate-300">Factory Demand</span></div>
                            </div>
                        </motion.div>

                        {/* Close Button */}
                        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="absolute top-6 right-6 z-[400] p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl">
                            <Minimize2 className="w-5 h-5" />
                        </button>
                    </>
                )}
            </AnimatePresence>

            {!isExpanded && (
                <button onClick={onToggle} className="absolute inset-0 z-[500] w-full h-full cursor-pointer" aria-label="Expand Map" />
            )}
        </div>
    );
};