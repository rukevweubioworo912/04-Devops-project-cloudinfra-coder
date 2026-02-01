
import React, { useState, useEffect, useCallback } from 'react';
import { generateInfra, InfraResult } from './services/geminiService';

const QUICK_TEMPLATES = [
  { prompt: 'AWS VPC with 2 public subnets, an EKS cluster, and a load balancer', label: 'AWS: EKS Cluster' },
  { prompt: 'Azure Resource Group with a Linux VM, VNet, and SQL Database', label: 'Azure: VM Stack' },
  { prompt: 'GCP Cloud Run service with a custom domain and Cloud SQL instance', label: 'GCP: Serverless App' },
  { prompt: 'Kubernetes deployment for a Node.js app with Horizontal Pod Autoscaler and Service', label: 'K8s: Scalable App' }
];

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<InfraResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    // Check runtime config first (Docker/K8s), then AI Studio context, then process.env
    const runtimeKey = (window as any).APP_CONFIG?.API_KEY;
    const aiStudioKey = window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : false;
    const processKey = !!process.env.API_KEY;
    
    setHasApiKey(!!runtimeKey || aiStudioKey || processKey);
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleSearch = async (targetPrompt?: string) => {
    const finalPrompt = targetPrompt || query;
    if (!finalPrompt.trim()) return;
    if (targetPrompt) setQuery(targetPrompt);

    setIsLoading(true);
    setError('');
    
    try {
      const data = await generateInfra(finalPrompt);
      setResult(data);
    } catch (err: any) {
      if (err.message === "KEY_AUTH_REQUIRED") {
        setHasApiKey(false);
        setError('API Authentication required. Provide an API_KEY environment variable.');
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError('Quota exceeded. Try again in a minute.');
      } else {
        setError(err.message || 'Error generating infrastructure.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-slate-300 font-mono selection:bg-blue-500/30 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Header Bar */}
      <nav className="relative z-20 w-full border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-3 flex justify-between items-center text-[10px] tracking-[0.2em] uppercase font-bold">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
            {hasApiKey ? 'Architect Online' : 'Auth Required'}
          </div>
          <span className="text-slate-600 hidden md:block">Engine: Terraform-Flash-Gen</span>
        </div>
        <button onClick={handleOpenKeySelector} className="hover:text-blue-400 transition-colors">
          [ Configure Workspace ]
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
            INFRA<span className="text-blue-500">_</span>GEN
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase font-bold">
            Terraform & Kubernetes Blueprint Engine
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Left Column: Input & Templates */}
          <div className="xl:col-span-4 space-y-8">
            <div className="p-1 border border-white/5 bg-white/[0.02] rounded-3xl">
              <div className="p-6 space-y-4">
                <textarea
                  rows={6}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your infrastructure (e.g., 'Deploy a highly available AWS web app with RDS')..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-blue-400 focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner text-sm leading-relaxed"
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading || !hasApiKey}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? 'GENERATING SCRIPTS...' : 'ARCHITECT INFRASTRUCTURE'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Rapid Deployment Blueprints</h3>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(t.prompt)}
                    className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-blue-500/10 hover:border-blue-500/20 transition-all group"
                  >
                    <div className="text-[10px] text-blue-500 mb-1 font-bold">{t.label}</div>
                    <div className="text-xs text-slate-400 group-hover:text-slate-200 line-clamp-1">{t.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Generated Code */}
          <div className="xl:col-span-8">
            {error ? (
              <div className="p-12 border border-red-500/20 bg-red-500/5 rounded-3xl text-center space-y-4">
                <div className="text-red-500 font-bold uppercase tracking-widest">Architectural Error</div>
                <p className="text-sm text-slate-400">{error}</p>
              </div>
            ) : result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {/* Intro Section */}
                <div className="p-8 rounded-3xl border border-white/10 bg-black/40">
                  <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{result.title}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{result.explanation}</p>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Best Practices & Security</h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">{result.bestPractices}</p>
                  </div>
                </div>

                {/* Code Tabs Style Blocks */}
                <div className="space-y-8">
                  {/* Terraform Block */}
                  <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/80">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">main.tf (Terraform)</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(result.terraform)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 uppercase font-bold"
                      >
                        [ Copy HCL ]
                      </button>
                    </div>
                    <pre className="p-8 overflow-x-auto text-xs text-blue-400/90 leading-relaxed max-h-[500px]">
                      <code>{result.terraform}</code>
                    </pre>
                  </div>

                  {/* K8s Block */}
                  <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/80">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">manifest.yaml (Kubernetes)</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(result.kubernetes)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 uppercase font-bold"
                      >
                        [ Copy YAML ]
                      </button>
                    </div>
                    <pre className="p-8 overflow-x-auto text-xs text-emerald-400/90 leading-relaxed max-h-[500px]">
                      <code>{result.kubernetes}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-20 opacity-40">
                <div className="w-20 h-20 mb-8 text-slate-800">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Workspace Empty</h3>
                <p className="text-xs max-w-sm leading-relaxed font-bold uppercase tracking-tighter">
                  Define your cloud architecture in the input field to generate production-ready IaC scripts.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-20 text-center opacity-20 py-10">
        <p className="text-[9px] font-black uppercase tracking-[1em]">InfraGen Protocol • Secure IaC Logic • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
