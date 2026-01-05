import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- RPC Client ---
const getRpcUrl = () => {
    // 1. Allow override via URL parameter ?rpc=...
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has('rpc')) return params.get('rpc')!;
    }
    // 2. Check process.env (for bundlers)
    if (typeof process !== 'undefined' && process.env && process.env.RPC_URL) {
        return process.env.RPC_URL;
    }
    // 3. Default to local server
    return "http://127.0.0.1:3456/rpc";
};

const RPC_URL = getRpcUrl();

interface RpcResponse<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

async function rpc<T = any>(method: string, params: any = {}): Promise<T> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params }),
    });
    const data: RpcResponse<T> = await response.json();
    if (!data.ok) throw new Error(data.error || 'Unknown RPC error');
    return data.result as T;
  } catch (err) {
    console.error(`RPC Error [${method}]:`, err);
    throw err;
  }
}

// --- Types ---
interface WindowInfo {
  id: number;
  wcId: number;
  url: string; // Enriched in frontend
}
type WindowMap = Record<string, Record<string, { id: number; wcId: number }>>;

// --- Components ---

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const IconCamera = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);

const App = () => {
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedWindow, setSelectedWindow] = useState<{id: number, url: string} | null>(null);

  // Dashboard State
  const [windows, setWindows] = useState<WindowMap>({});
  
  // Create Window State
  const [newUrl, setNewUrl] = useState('https://google.com');
  const [newAccountIdx, setNewAccountIdx] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const fetchWindows = useCallback(async () => {
    try {
      const data = await rpc<WindowMap>('getWindows');
      setWindows(data || {});
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchWindows();
    const interval = setInterval(fetchWindows, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [fetchWindows]);

  const handleOpenWindow = async () => {
    setIsCreating(true);
    try {
      await rpc('openWindow', {
        account_index: newAccountIdx,
        url: newUrl,
        options: {}, 
        others: { userAgent: '' } // default
      });
      await fetchWindows();
    } catch (e) {
      alert('Failed to open window: ' + e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectWindow = (id: number, url: string) => {
    setSelectedWindow({ id, url });
    setView('detail');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4" style={{borderBottom: '1px solid var(--border)', background: 'var(--bg-card)'}}>
        <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg">Electron RPC Pilot</h1>
            <span className="badge text-secondary">v1.0</span>
        </div>
        <div>
            {/* Global Actions can go here */}
        </div>
      </header>

      {view === 'dashboard' ? (
        <div className="main-content scroll-y p-4">
            
            {/* Create Bar */}
            <div className="card p-4 mb-6 flex items-end gap-4">
                <div className="flex-1">
                    <label className="block text-xs text-secondary mb-1">Target URL</label>
                    <input 
                        className="input w-full" 
                        value={newUrl} 
                        onChange={e => setNewUrl(e.target.value)} 
                        placeholder="https://..."
                    />
                </div>
                <div style={{width: '120px'}}>
                    <label className="block text-xs text-secondary mb-1">Account Index</label>
                    <input 
                        type="number"
                        className="input w-full" 
                        value={newAccountIdx} 
                        onChange={e => setNewAccountIdx(Number(e.target.value))} 
                    />
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={handleOpenWindow}
                    disabled={isCreating}
                >
                    {isCreating ? 'Launching...' : 'Open Window'}
                </button>
            </div>

            {/* Window Grid */}
            <h2 className="text-lg font-bold mb-4">Active Sessions</h2>
            {Object.keys(windows).length === 0 ? (
                <div className="text-secondary text-center p-8">No active windows found. Launch one above!</div>
            ) : (
                <div className="grid-accounts">
                    {Object.entries(windows).map(([accIdx, sites]) => (
                        <div key={accIdx} className="card flex flex-col">
                            <div className="p-3 border-b border-border bg-hover flex justify-between items-center" style={{background: 'var(--bg-hover)'}}>
                                <span className="font-mono font-bold text-sm">Account #{accIdx}</span>
                                <span className="badge">{Object.keys(sites).length} Tabs</span>
                            </div>
                            <div className="p-2 flex flex-col gap-2">
                                {Object.entries(sites).map(([url, info]) => (
                                    <div 
                                        key={info.id} 
                                        onClick={() => handleSelectWindow(info.id, url)}
                                        className="btn flex justify-between items-center text-left"
                                        style={{justifyContent: 'space-between'}}
                                    >
                                        <div className="flex flex-col overflow-hidden" style={{maxWidth: '80%'}}>
                                            <span className="text-sm font-bold truncate">{new URL(url).hostname}</span>
                                            <span className="text-xs text-secondary truncate">{url}</span>
                                        </div>
                                        <span className="badge font-mono">ID:{info.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      ) : (
        selectedWindow && (
            <WindowDetail 
                windowId={selectedWindow.id} 
                initialUrl={selectedWindow.url} 
                onBack={() => setView('dashboard')} 
            />
        )
      )}
    </div>
  );
};

// --- Window Detail View ---

const WindowDetail = ({ windowId, initialUrl, onBack }: { windowId: number, initialUrl: string, onBack: () => void }) => {
    const [currentUrl, setCurrentUrl] = useState(initialUrl);
    const [navUrl, setNavUrl] = useState(initialUrl);
    const [screenshotTs, setScreenshotTs] = useState(Date.now());
    const [jsCode, setJsCode] = useState(`return document.title;`);
    const [evalResult, setEvalResult] = useState<string>('');
    const [isAutoRefresh, setIsAutoRefresh] = useState(false);

    const refreshScreenshot = () => setScreenshotTs(Date.now());

    useEffect(() => {
        let interval: any;
        if(isAutoRefresh) {
            interval = setInterval(refreshScreenshot, 1000);
        }
        return () => clearInterval(interval);
    }, [isAutoRefresh]);

    const handleReload = async () => {
        await rpc('reload', { win_id: windowId });
        setTimeout(refreshScreenshot, 500); // Delay for render
    };

    const handleNavigate = async () => {
        await rpc('loadURL', { win_id: windowId, url: navUrl });
        setCurrentUrl(navUrl);
        setTimeout(refreshScreenshot, 1000);
    };

    const handleEval = async () => {
        try {
            const res = await rpc('executeJavaScript', { win_id: windowId, code: jsCode });
            setEvalResult(JSON.stringify(res, null, 2));
            refreshScreenshot();
        } catch (e: any) {
            setEvalResult('Error: ' + e.message);
        }
    };

    // Construct screenshot URL relative to the RPC server origin
    const screenshotUrl = (RPC_URL.startsWith('http') ? new URL('/screenshot', RPC_URL).origin + '/screenshot' : '/screenshot') + `?id=${windowId}&t=${screenshotTs}`;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-2 border-b border-border flex gap-2 items-center bg-card">
                <button className="btn btn-icon" onClick={onBack} title="Back">
                    <IconArrowLeft />
                </button>
                <div className="flex-1 flex gap-2">
                    <input 
                        className="input flex-1 font-mono text-sm" 
                        value={navUrl} 
                        onChange={e => setNavUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNavigate()}
                    />
                    <button className="btn" onClick={handleNavigate}>Go</button>
                </div>
                <div className="w-px h-6 bg-border mx-2"></div>
                <button className="btn btn-icon" onClick={handleReload} title="Reload Page">
                    <IconRefresh />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Visual */}
                <div className="flex-1 p-4 bg-root flex flex-col gap-4 scroll-y" style={{borderRight: '1px solid var(--border)'}}>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-secondary text-sm uppercase tracking-wide">Live Preview</h3>
                        <div className="flex gap-2 items-center">
                            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                                <input type="checkbox" checked={isAutoRefresh} onChange={e => setIsAutoRefresh(e.target.checked)} />
                                Auto-Refresh
                            </label>
                            <button className="btn btn-sm btn-icon" onClick={refreshScreenshot}>
                                <IconCamera />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-black rounded border border-border overflow-hidden">
                        <img src={screenshotUrl} alt="Window Screenshot" className="preview-img" style={{maxHeight: '100%', objectFit: 'contain'}} />
                    </div>
                </div>

                {/* Right: Tools */}
                <div className="w-96 p-4 bg-card flex flex-col gap-4 scroll-y">
                    
                    {/* Console Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-sm">Execute JavaScript</h3>
                            <button className="btn btn-primary btn-sm flex items-center gap-1" style={{padding:'2px 8px', fontSize:'0.75rem'}} onClick={handleEval}>
                                <IconPlay /> Run
                            </button>
                        </div>
                        <textarea 
                            className="code-editor" 
                            value={jsCode} 
                            onChange={e => setJsCode(e.target.value)}
                            spellCheck={false}
                        />
                    </div>

                    {/* Result Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="font-bold text-sm mb-2">Output</h3>
                        <div className="flex-1 bg-code-bg border border-border p-2 rounded overflow-auto font-mono text-xs text-success whitespace-pre-wrap">
                            {evalResult || <span className="text-secondary opacity-50">// Execution results will appear here...</span>}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 border border-border rounded bg-root text-xs text-secondary">
                        <div className="flex justify-between mb-1">
                            <span>Window ID:</span>
                            <span className="font-mono text-primary">{windowId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span className="font-mono">{new Date(screenshotTs).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);