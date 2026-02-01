
import React, { useState, useEffect, useCallback } from 'react';
import { explainCommand, ExplanationResult } from './services/geminiService';

const QUICK_COMMANDS = [
  { cmd: 'ssh-keygen -t ed25519 -C "your_email@example.com"', label: 'SSH Setup' },
  { cmd: 'sudo lsof -i :8080', label: 'Port Check' },
  { cmd: 'tail -f /var/log/syslog | grep "error"', label: 'Error Watch' },
  { cmd: 'docker system prune -a', label: 'Docker Cleanup' },
  { cmd: 'rsync -avz local/dir user@remote:/path', label: 'Remote Sync' }
];

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      setHasApiKey(!!process.env.API_KEY);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError('');
      setIsQuotaError(false);
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const finalQuery = targetQuery || query;
    if (!finalQuery.trim()) return;
    if (targetQuery) setQuery(targetQuery);

    setIsLoading(true);
    setError('');
    setIsQuotaError(false);
    
    try {
      const data = await explainCommand(finalQuery);
      setResult(data);
    } catch (err: any) {
      if (err.message === "KEY_AUTH_REQUIRED") {
        setHasApiKey(false);
        setError('Authentication required. Please authorize your API key.');
      } else if (err.message === "QUOTA_EXCEEDED") {
        setIsQuotaError(true);
        setError('Your API Key has exceeded its free-tier quota. Please wait a moment or try a different key/project.');
      } else {
        setError(err.message || 'The system encountered an error during decoding.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-slate-300 font-mono selection:bg-emerald-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-20 w-full border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-2 flex justify-between items-center text-[10px] tracking-widest uppercase font-bold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? (isQuotaError ? 'bg-orange-500' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]') : 'bg-red-500'} animate-pulse`}></span>
            {hasApiKey ? (isQuotaError ? 'Quota Exceeded' : 'System Online') : 'Key Required'}
          </div>
          <div className="text-slate-600 hidden md:block">Node: Gemini-Flash-3.0</div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenKeySelector}
            className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
            {hasApiKey ? 'Switch Project/Key' : 'Authorize Now'}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 italic">
            DECODE<span className="text-emerald-500">.</span>IO
          </h1>
          <p className="text-slate-500 text-sm tracking-[0.2em] uppercase font-bold">
            Junior Engineer's Bridge to Senior Linux Expertise
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-10">
            <section>
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                  <textarea
                    rows={4}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter command or paste an error message..."
                    className="relative w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-emerald-400 focus:border-emerald-500/50 outline-none transition-all resize-none shadow-2xl placeholder:text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !hasApiKey}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <>ANALYZE COMMAND <span className="text-xl">↵</span></>
                  )}
                </button>
              </form>
            </section>

            <section className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Common Shortcuts</h3>
              <div className="space-y-3">
                {QUICK_COMMANDS.map((qc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(qc.cmd)}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-xs transition-all text-slate-400 hover:text-white"
                  >
                    <span>{qc.label}</span>
                    <span className="text-[10px] opacity-30 font-mono">{qc.cmd.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            {error ? (
              <div className={`p-10 rounded-3xl border ${isQuotaError ? 'border-orange-500/20 bg-orange-500/5' : 'border-red-500/20 bg-red-500/5'} text-center space-y-6 animate-in slide-in-from-top-4 duration-500`}>
                <div className={`w-16 h-16 ${isQuotaError ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'} rounded-full flex items-center justify-center mx-auto`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-black text-xl">{isQuotaError ? 'Quota Exceeded' : 'System Error'}</h4>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {isQuotaError 
                      ? "You've hit the limit for the free tier. Try switching to a different Google Cloud project with billing enabled for higher limits." 
                      : error}
                  </p>
                </div>
                {(!hasApiKey || isQuotaError) && (
                  <button 
                    onClick={handleOpenKeySelector}
                    className={`font-black px-8 py-3 rounded-xl transition-colors ${isQuotaError ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-white text-black hover:bg-emerald-500'}`}
                  >
                    {isQuotaError ? 'CHANGE PROJECT/KEY' : 'SELECT API KEY'}
                  </button>
                )}
              </div>
            ) : result ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
                <div className="p-10 rounded-3xl border border-white/10 bg-black/60 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div className="h-px flex-grow bg-white/10 ml-4"></div>
                  </div>
                  
                  <h2 className="text-4xl font-black text-white mb-6">
                    <span className="text-emerald-500">$</span> {result.issue}
                  </h2>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">What it's doing:</h4>
                      <p className="text-slate-300 font-sans leading-relaxed">{result.cause}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3">Senior Tip:</h4>
                      <p className="text-slate-300 font-sans leading-relaxed italic border-l-2 border-cyan-500/30 pl-4">{result.solution}</p>
                    </div>
                  </div>
                </div>

                <div className="p-10 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                  <h4 className="text-white text-sm font-black mb-8 flex items-center gap-3 uppercase">
                    <span className="w-8 h-px bg-emerald-500"></span> Pro Examples
                  </h4>
                  <div className="space-y-6">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="group relative">
                        <div className="absolute -inset-2 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          <div className="flex justify-between mb-2">
                            <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Variation {i+1}</span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(ex.split('#')[0].trim())}
                              className="text-[9px] text-emerald-500/50 hover:text-emerald-400 font-black uppercase"
                            >
                              [ Copy ]
                            </button>
                          </div>
                          <div className="bg-black/60 border border-white/5 rounded-xl p-4">
                            <code className="block text-emerald-400 text-sm break-all">
                              {ex.includes('#') ? ex.split('#')[0] : ex}
                            </code>
                            {ex.includes('#') && (
                              <p className="mt-2 text-xs text-slate-500 font-sans leading-relaxed border-t border-white/5 pt-2 italic">
                                # {ex.split('#')[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-20 text-center rounded-[40px] border-2 border-white/5 border-dashed bg-white/[0.01]">
                <div className="w-24 h-24 text-slate-800 mb-8 opacity-20">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-slate-500 font-black text-xl uppercase tracking-widest">Awaiting Command</h3>
                <p className="text-slate-700 text-xs max-w-xs mx-auto mt-4 leading-relaxed uppercase tracking-widest font-bold">
                  Terminal is ready. Input instructions for immediate neural translation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-20 text-center opacity-30">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="h-px w-12 bg-white"></div>
          <div className="text-[10px] font-black tracking-[0.8em] uppercase">End of Log</div>
          <div className="h-px w-12 bg-white"></div>
        </div>
        <p className="text-[9px] text-slate-500">Infrastructure Layer V2.1 • Flash Cluster • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
