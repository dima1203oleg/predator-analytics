import React, { useState, useEffect } from 'react';

// --- INLINE SVG ICONS (NO IMPORTS NEEDED) ---
const IconShield = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconActivity = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const IconPlus = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const IconPlay = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>;
const IconTrash = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;

// Simple fetch utility
const api = {
  get: async (url: string) => {
    try {
        const res = await fetch(url);
        return res.json();
    } catch (e) {
        console.error("Fetch error", e);
        return [];
    }
  },
  post: async (url: string, data: any) => {
    try {
        const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
        });
        return res.json();
    } catch (e) {
        console.error("Post error", e);
        return { error: true };
    }
  }
};

const AppMinimal = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Channels
  const loadData = async () => {
    // Use the endpoint we mocked in vite.config.ts
    const data = await api.get('/api/v1/sources/connectors');
    if (Array.isArray(data)) setChannels(data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add Channel
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setLoading(true);

    await api.post('/api/v1/ingest/telegram', { url: newUrl, name: newUrl.split('/').pop() || 'Channel' });
    setNewUrl('');
    await loadData();
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>

      {/* HEADER */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #334155', paddingBottom:20, marginBottom:30}}>
        <div style={{display:'flex', alignItems:'center', gap: 15}}>
          <div style={{color:'#10b981'}}><IconShield /></div>
          <div>
            <h1 style={{margin:0, fontSize:24, fontWeight:'bold', background: 'linear-gradient(to right, #34d399, #22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>PREDATOR TELEGRAM INTEL</h1>
            <p style={{margin:0, color:'#64748b', fontSize:14}}>Real-time Customs Data Ingestion & Analysis</p>
          </div>
        </div>
        <div style={{display:'flex', gap:10}}>
            <button onClick={loadData} style={{background:'#1e293b', border:'1px solid #334155', color:'white', padding:'8px 16px', borderRadius:6, cursor:'pointer'}}>
                Refresh
            </button>
            <div style={{padding:'5px 10px', background:'rgba(16, 185, 129, 0.1)', border:'1px solid rgba(16, 185, 129, 0.3)', color:'#34d399', borderRadius:20, fontSize:12, display:'flex', alignItems:'center', gap:5}}>
                <div style={{width:8, height:8, background:'#10b981', borderRadius:'50%'}}></div>
                SYSTEM ACTIVE
            </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: '300px 1fr', gap: 30}}>

        {/* LEFT COLUMN: CONTROLS */}
        <div style={{display:'flex', flexDirection:'column', gap: 20}}>

            {/* ADD SOURCE PANEL */}
            <div style={{background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:20}}>
                <h2 style={{margin:'0 0 15px 0', fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:8}}>
                    <span style={{color:'#10b981'}}><IconPlus /></span>
                    Add Target Source
                </h2>
                <form onSubmit={handleAdd} style={{display:'flex', flexDirection:'column', gap:10}}>
                    <div>
                        <label style={{display:'block', fontSize:12, color:'#94a3b8', marginBottom:5, fontFamily:'monospace'}}>TELEGRAM CHANNEL URL</label>
                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://t.me/customs_of_ukraine"
                            style={{width:'100%', background:'#020617', border:'1px solid #475569', borderRadius:6, padding:10, color:'white', outline:'none', boxSizing: 'border-box'}}
                        />
                    </div>
                    <button
                        disabled={loading}
                        style={{width:'100%', padding:12, background: loading ? '#334155' : 'linear-gradient(to right, #059669, #0d9488)', border:'none', borderRadius:6, color:'white', fontWeight:'bold', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:8}}
                    >
                        {loading ? 'Initializing...' : <> <IconPlay /> START MONITOR </>}
                    </button>
                </form>
            </div>

            {/* STATS PANEL */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
                <div style={{background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:15}}>
                    <div style={{fontSize:10, color:'#94a3b8', fontFamily:'monospace', marginBottom:5}}>ACTIVE CHANNELS</div>
                    <div style={{fontSize:24, fontWeight:'bold'}}>{channels.length}</div>
                </div>
                <div style={{background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:15}}>
                    <div style={{fontSize:10, color:'#94a3b8', fontFamily:'monospace', marginBottom:5}}>PARSED</div>
                    <div style={{fontSize:24, fontWeight:'bold', color:'#34d399'}}>--</div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div style={{background:'#1e293b', border:'1px solid #334155', borderRadius:12, overflow:'hidden', minHeight:400}}>
            <div style={{padding:20, borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{margin:0, fontSize:18, fontWeight:600, display:'flex', alignItems:'center', gap:8}}>
                    Monitoring Targets
                </h2>
                <span style={{fontSize:12, background:'#334155', padding:'2px 8px', borderRadius:4}}>Live</span>
            </div>

            <div>
                {channels.length === 0 ? (
                    <div style={{padding:50, textAlign:'center', color:'#64748b'}}>
                        <div style={{opacity:0.3, marginBottom:10}}><IconActivity /></div>
                        <p>No active targets found.</p>
                        <p style={{fontSize:14}}>Add a Telegram channel to begin ingestion.</p>
                    </div>
                ) : (
                    <div>
                        {channels.map((channel: any, i: number) => (
                            <div key={i} style={{padding:15, borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={{display:'flex', alignItems:'center', gap:15}}>
                                    <div style={{width:40, height:40, background:'rgba(59, 130, 246, 0.1)', color:'#60a5fa', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        <IconPlay />
                                    </div>
                                    <div>
                                        <h3 style={{margin:0, fontSize:16, fontWeight:500}}>{channel.name}</h3>
                                        <p style={{margin:'4px 0 0 0', fontSize:12, color:'#94a3b8', fontFamily:'monospace'}}>{channel.description}</p>
                                    </div>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:20}}>
                                    <div style={{textAlign:'right'}}>
                                        <div style={{fontSize:10, color:'#64748b'}}>LAST SYNC</div>
                                        <div style={{fontSize:12, color:'#34d399', fontFamily:'monospace'}}>JUST NOW</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AppMinimal;
