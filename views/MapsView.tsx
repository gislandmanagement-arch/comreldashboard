
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Info, ChevronDown, Check, MapPin, X as CloseIcon, Calendar, User, FileText, ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react';

const L = (window as any).L;

interface SheetData {
  mapId: string;
  subject: string;
  issues: string;
  level: string;
  followUpBy: string;
  dueDate: string;
  week: string;
  periode: string;
  note: string;
  mitigasi: string;
  x: number; 
  y: number;
  regionOrigin: string;
}

const REGIONS = ['Kawasi', 'Soligi', 'GTS-Flluk', 'BJM-CKS', 'JMP-OAM'];
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwsSCds9tFzTxZFYmBSUFPd4Pf0y1-X24pOnyKhC25fufaVs5janobtUW0QpAFGlnue/exec'; 

export const MapsView: React.FC = () => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['All Region']);
  const [data, setData] = useState<Record<string, SheetData[]>>({});
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SheetData | null>(null);
  const [uniqueClickedId, setUniqueClickedId] = useState<string | null>(null);
  
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Ref untuk mendeteksi apakah penutupan popup dipicu oleh pemilihan marker baru
  const isSelectingMarker = useRef(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const allData: Record<string, SheetData[]> = {};
      try {
        const response = await fetch(APPS_SCRIPT_URL);
        const json = await response.json();
        
        Object.keys(json).forEach(reg => {
          allData[reg] = json[reg].map((item: any) => ({
            mapId: item.mapid?.toString() || '-',
            subject: item.subject || '-',
            issues: item.issues || '-',
            level: item.level || '-',
            followUpBy: item.followupby || '-',
            dueDate: item.duedate || '-',
            week: item.week || '-',
            periode: item.periode || '-',
            note: item.note || '-',
            mitigasi: item.mitigasi || '-',
            x: parseFloat(item.x),
            y: parseFloat(item.y),
            regionOrigin: reg
          })).filter((i: any) => !isNaN(i.x) && !isNaN(i.y));
        });
        setData(allData);
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const resetSelection = () => {
    setUniqueClickedId(null);
    setSelectedItem(null);
    if (mapRef.current) {
        mapRef.current.closePopup();
    }
  };

  useEffect(() => {
    if (!loading && !mapRef.current && L) {
      const map = L.map('map', { 
        zoomControl: false,
        closePopupOnClick: true // Klik di luar popup akan menutup popup (dan nanti mereset panel)
      }).setView([-1.45, 127.48], 12);
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      
      L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }).addTo(map);
      
      // Sinkronisasi: Saat popup ditutup (baik lewat X atau klik luar), reset panel kanan
      map.on('popupclose', () => {
        // Hanya reset jika kita TIDAK sedang sengaja memilih marker lain
        if (!isSelectingMarker.current) {
          setUniqueClickedId(null);
          setSelectedItem(null);
        }
      });

      mapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    if (mapRef.current && markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      
      let filtered: SheetData[] = [];
      if (selectedRegions.includes('All Region')) {
        filtered = Object.values(data).flat();
      } else {
        selectedRegions.forEach(reg => { if (data[reg]) filtered = [...filtered, ...data[reg]]; });
      }

      // Pastikan filter ID unik (Region + ID)
      const displayMarkers = uniqueClickedId 
        ? filtered.filter(item => `${item.regionOrigin}-${item.mapId}` === uniqueClickedId)
        : filtered;

      if (displayMarkers.length > 0) {
        const bounds: [number, number][] = [];
        displayMarkers.forEach(item => {
          const color = getPriorityColor(item.level);
          const uId = `${item.regionOrigin}-${item.mapId}`;
          
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s;">${item.mapId}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker([item.y, item.x], { icon })
            .bindPopup(`
              <div style="font-family: 'Inter', sans-serif; padding: 10px; min-width: 200px;">
                <div style="font-size: 9px; font-weight: 900; color: ${color}; text-transform: uppercase; margin-bottom: 2px;">${formatLevel(item.level)}</div>
                <h4 style="margin:0; color:#111827; font-weight:800; font-size: 13px;">${item.subject}</h4>
                <p style="margin:4px 0 0; color:#6b7280; font-size:11px;">Region: ${item.regionOrigin}</p>
              </div>
            `, { className: 'custom-leaflet-popup', autoPan: false }) // autoPan false agar tidak narik paksa saat popup buka
            .addTo(markersLayerRef.current);
          
          marker.on('click', (e: any) => {
            L.DomEvent.stopPropagation(e); // Cegah event klik lari ke map background
            isSelectingMarker.current = true;
            setUniqueClickedId(uId);
            setSelectedItem(item);
            
            // Pan peta ke titik tanpa merubah level zoom pengguna
            mapRef.current.panTo([item.y, item.x]);
            
            // Beri sedikit delay agar event 'popupclose' tidak tabrakan dengan pemilihan baru
            setTimeout(() => {
              isSelectingMarker.current = false;
            }, 300);
          });

          // Otomatis buka popup jika terpilih dari tabel
          if (uId === uniqueClickedId) {
            marker.openPopup();
          }

          bounds.push([item.y, item.x]);
        });
        
        // Fit bounds hanya saat awal atau saat tidak ada filter aktif
        if (!uniqueClickedId && bounds.length > 0) {
            mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [80, 80], maxZoom: 15 });
        }
      }
    }
  }, [loading, selectedRegions, data, uniqueClickedId]);

  const toggleRegion = (reg: string) => {
    resetSelection();
    if (reg === 'All Region') setSelectedRegions(['All Region']);
    else {
      let next = selectedRegions.filter(r => r !== 'All Region');
      if (next.includes(reg)) {
        next = next.filter(r => r !== reg);
        if (next.length === 0) next = ['All Region'];
      } else next.push(reg);
      setSelectedRegions(next);
    }
  };

  const getPriorityColor = (level: string) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('high')) return '#ef4444';
    if (l.includes('medium')) return '#f59e0b';
    return '#0ea5e9';
  };

  const formatLevel = (level: string) => {
    const l = level?.toUpperCase() || '';
    if (l.includes('HIGH')) return 'HIGH PRIORITY';
    if (l.includes('MEDIUM')) return 'MEDIUM PRIORITY';
    if (l.includes('LOW')) return 'LOW PRIORITY';
    return l + ' PRIORITY';
  };

  if (loading) return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Real-time Database...</p>
      </div>
    </div>
  );

  let displayData = selectedRegions.includes('All Region') 
    ? Object.values(data).flat() 
    : Object.entries(data).filter(([k]) => selectedRegions.includes(k)).flatMap(([_, v]) => v);

  if (uniqueClickedId) {
    displayData = displayData.filter(item => `${item.regionOrigin}-${item.mapId}` === uniqueClickedId);
  }

  const groupedData = displayData.reduce((acc, curr) => {
    if (!acc[curr.regionOrigin]) acc[curr.regionOrigin] = [];
    acc[curr.regionOrigin].push(curr);
    return acc;
  }, {} as Record<string, SheetData[]>);

  const stats = {
    total: displayData.length,
    high: displayData.filter(d => d.level.toLowerCase().includes('high')).length,
    medium: displayData.filter(d => d.level.toLowerCase().includes('medium')).length,
    low: displayData.filter(d => d.level.toLowerCase().includes('low')).length
  };

  const currentTitle = selectedRegions.includes('All Region') ? 'ALL REGIONS' : selectedRegions.join(', ').toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-white">
      {/* LEFT: MAP */}
      <div className="lg:w-1/2 h-[45vh] lg:h-full relative border-r border-slate-100">
        <div id="map" className="h-full w-full"></div>
        
        {uniqueClickedId && (
            <button 
                onClick={resetSelection}
                className="absolute bottom-10 left-10 z-[1000] flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl shadow-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
            >
                <RefreshCw size={14} className="text-teal-600" /> SHOW ALL MARKERS
            </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-10 right-20 z-[1000] bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/50 space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">LEGEND</h4>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <span className="text-[10px] font-bold text-slate-600">HIGH PRIORITY</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                <span className="text-[10px] font-bold text-slate-600">MEDIUM PRIORITY</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                <span className="text-[10px] font-bold text-slate-600">LOW PRIORITY</span>
            </div>
        </div>
        
        {/* Region Selector */}
        <div className="absolute top-6 left-6 z-[1000]" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-4 bg-white/90 backdrop-blur px-6 py-3.5 rounded-2xl shadow-2xl border border-white/50 min-w-[240px] hover:bg-white transition-all group"
          >
            <MapPin size={18} className="text-teal-600 group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-left text-sm font-black text-slate-700 truncate">
              {currentTitle}
            </span>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {['All Region', ...REGIONS].map(reg => (
                <button
                  key={reg}
                  onClick={() => toggleRegion(reg)}
                  className="w-full flex items-center justify-between px-6 py-3 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  {reg}
                  {selectedRegions.includes(reg) && <Check size={18} className="text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: DATA PANEL / DETAIL PANEL */}
      <div className="lg:w-1/2 h-[55vh] lg:h-full flex flex-col min-w-0">
        {!selectedItem ? (
          <>
            <div className="p-8 bg-[#134e4a] text-white shadow-xl z-10 transition-all">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{currentTitle}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black bg-white/10 px-4 py-1.5 rounded-full uppercase border border-white/10">
                    {displayData.length} Logs Active
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-teal-400 uppercase mb-1">Total Issue</p>
                  <p className="text-2xl font-black tracking-tighter">{stats.total}</p>
                </div>
                <div className="bg-red-500/20 p-4 rounded-2xl border border-red-500/20">
                  <p className="text-[9px] font-black text-red-400 uppercase mb-1">High Priority</p>
                  <p className="text-2xl font-black text-red-100 tracking-tighter">{stats.high}</p>
                </div>
                <div className="bg-orange-500/20 p-4 rounded-2xl border border-orange-500/20">
                  <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Medium Priority</p>
                  <p className="text-2xl font-black text-orange-100 tracking-tighter">{stats.medium}</p>
                </div>
                <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/20">
                  <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Low Priority</p>
                  <p className="text-2xl font-black text-blue-100 tracking-tighter">{stats.low}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-20">
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-5">MAPID</th>
                      <th className="px-6 py-5">Subject</th>
                      <th className="px-6 py-5">Issues</th>
                      <th className="px-6 py-5">Level</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(groupedData).map(([region, items]) => (
                      <React.Fragment key={region}>
                        <tr className="bg-slate-100 border-y border-slate-200">
                          <td colSpan={4} className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {region} <span className="ml-2 text-teal-500">({items.length})</span>
                          </td>
                        </tr>
                        {items.map((item, idx) => (
                          <tr 
                            key={`${region}-${idx}`} 
                            onClick={() => {
                                isSelectingMarker.current = true;
                                setSelectedItem(item);
                                setUniqueClickedId(`${item.regionOrigin}-${item.mapId}`);
                                if (mapRef.current) mapRef.current.panTo([item.y, item.x]);
                                setTimeout(() => { isSelectingMarker.current = false; }, 300);
                            }}
                            className="hover:bg-teal-50/50 transition-colors cursor-pointer border-b border-slate-50"
                          >
                            <td className="px-6 py-5 text-[12px] font-black text-black">{item.mapId}</td>
                            <td className="px-6 py-5 text-[12px] font-bold text-black leading-tight">
                              {item.subject}
                            </td>
                            <td className="px-6 py-5 text-[12px] text-black/70 max-w-[200px] truncate">
                              {item.issues}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded text-[10px] font-black uppercase text-white shadow-sm ${
                                 item.level.toLowerCase().includes('high') ? 'bg-red-500' : 
                                 item.level.toLowerCase().includes('medium') ? 'bg-orange-500' : 'bg-blue-500'
                              }`}>
                                {formatLevel(item.level)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* PANEL DETAIL (RIGHT SIDE) */
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header Detail */}
            <div className={`p-10 text-white relative shadow-lg`} style={{ backgroundColor: getPriorityColor(selectedItem.level) }}>
              <div className="flex justify-between items-start mb-6">
                <button 
                  onClick={resetSelection}
                  className="flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-black/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <ChevronLeft size={16} /> Back to List
                </button>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 pt-2">LOG DETAILS • MAPID {selectedItem.mapId}</div>
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-tight drop-shadow-md">{selectedItem.subject}</h2>
              <button 
                onClick={resetSelection}
                className="absolute top-10 right-10 p-2 hover:bg-black/10 rounded-full transition-colors"
              >
                <CloseIcon size={28} />
              </button>
            </div>
            
            {/* Content Detail */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1 space-y-10">
                  <div className="group">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-teal-600" /> CURRENT ISSUES
                    </h4>
                    <div className="text-base text-slate-800 leading-relaxed font-medium bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      {selectedItem.issues}
                    </div>
                  </div>
                  
                  <div className="group">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" /> MITIGATION STRATEGY
                    </h4>
                    <div className="text-base text-emerald-900 leading-relaxed font-bold bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 shadow-sm italic">
                      "{selectedItem.mitigasi}"
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5 shadow-sm">
                          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                              <User size={24} />
                          </div>
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-0.5">PIC</h4>
                              <p className="text-sm font-black text-slate-900">{selectedItem.followUpBy}</p>
                          </div>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-5 shadow-sm">
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                              <Calendar size={24} />
                          </div>
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Due Date</h4>
                              <p className="text-sm font-black text-slate-900">{selectedItem.dueDate}</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">FIELD NOTES</h4>
                    <p className="text-sm text-slate-600 italic leading-loose font-medium">
                      {selectedItem.note || "No specific field notes recorded for this log entry."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between bg-slate-200/50 px-6 py-4 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-500 uppercase">Region</p>
                          <p className="text-xs font-black text-slate-800">{selectedItem.regionOrigin}</p>
                      </div>
                      <div className="flex items-center justify-between bg-slate-200/50 px-6 py-4 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-500 uppercase">Priority</p>
                          <p className="text-xs font-black text-slate-800">{formatLevel(selectedItem.level)}</p>
                      </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-white border-t border-slate-100 flex justify-end">
              <button 
                onClick={resetSelection}
                className="px-16 py-4 bg-[#1e293b] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] hover:bg-slate-700 transition-all shadow-2xl shadow-slate-300 active:scale-95"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .custom-leaflet-popup .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.05); }
        .custom-leaflet-popup .leaflet-popup-content { margin: 0; }
        .custom-marker { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .custom-marker:hover { transform: scale(1.3); z-index: 1000 !important; }
        .leaflet-container { cursor: crosshair !important; }
      `}</style>
    </div>
  );
};
