import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Send,
  Sparkles,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Gauge,
  Activity,
  Droplets,
  Layers,
  Settings,
  HelpCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  category?: string;
  contextData?: any;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export const CopilotPage: React.FC = () => {
  const { liveState } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('petronexus_gemini_api_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState('');

  // Sidebar / Chat Session State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('petronexus_copilot_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved sessions', e);
      }
    }
    return [
      {
        id: 'session-default',
        title: 'Baghewala Field Telemetry',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [
          {
            id: 'msg-initial',
            sender: 'copilot',
            text: `### Hello Operator. I am the PetroNexus 360 AI Operations Copilot.
I am continuously coupled to the **Baghewala Heavy Oil Basin** real-time Digital Twin telemetry stream, cyclic steam simulation records, active alarms, and meteorological variables.

I possess PhD-level petroleum engineering expertise spanning:
- **Upstream & Drilling**: Well hydraulics, casing design, mud logging, BOP well control
- **Reservoir & Thermodynamics**: Cyclic Steam Stimulation (CSS), SAGD, steam quality, PVT phase behavior
- **Artificial Lift**: API-11E Sucker Rod Pumping units, dyno card diagnosis, ESPs, Gas Lift
- **Surface & Pipelines**: Multiphase flow, bypass leakage, heat loss, emulsion treating
- **Refining**: True boiling point distillation, API gravity calculations, crude assay

How can I assist your operations today? You can select any standard operational query below or ask any general petroleum question.`,
            category: 'GENERAL',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('petronexus_copilot_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Verify API Key on mount if present
  useEffect(() => {
    if (apiKey) {
      verifyKey(apiKey, false);
    }
  }, []);

  const verifyKey = async (keyToTest: string, showNotification = true) => {
    if (!keyToTest.trim()) {
      setKeyStatus('invalid');
      setKeyStatusMessage('Please enter a valid Gemini API key.');
      return;
    }

    setKeyStatus('testing');
    try {
      const res = await api.post('/copilot/verify-key', { apiKey: keyToTest });
      if (res.data.valid) {
        setKeyStatus('valid');
        setKeyStatusMessage(res.data.message || `Connected to ${res.data.model || 'Gemini 2.5 Flash'}`);
        localStorage.setItem('petronexus_gemini_api_key', keyToTest);
        setApiKey(keyToTest);
      } else {
        setKeyStatus('invalid');
        setKeyStatusMessage(res.data.message || 'Verification failed. Please check the key.');
      }
    } catch (err: any) {
      setKeyStatus('invalid');
      setKeyStatusMessage(err?.response?.data?.message || err?.message || 'Error validating key.');
    }
  };

  const handleCreateNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'copilot',
          text: `### PetroNexus 360 AI Operations Copilot Ready
What petroleum engineering topic or digital twin field telemetry challenge would you like to explore?

You can ask me to:
- Inspect real-time Baghewala field production and health metrics
- Explain advanced thermal recovery concepts (**CSS vs. SAGD**)
- Calculate API gravity, reservoir viscosity, or steam quality enthalpy
- Review artificial lift mechanics or blowout preventer (BOP) well control standards`,
          category: 'GENERAL',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewChat();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update session title on first user query if still default
    const isFirstUserMsg = !messages.some((m) => m.sender === 'user');
    const updatedTitle = isFirstUserMsg
      ? queryText.slice(0, 32) + (queryText.length > 32 ? '...' : '')
      : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );

    setInputQuery('');
    setLoading(true);

    // Prepare history for multi-turn conversational context
    const conversationHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await api.post('/copilot/query', {
        query: queryText,
        conversationHistory,
        apiKey: apiKey || undefined,
      });

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: response.data.response,
        category: response.data.category,
        contextData: response.data.contextData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, copilotMsg],
              }
            : s
        )
      );
    } catch (err) {
      console.error('Copilot query error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: 'Apologies, I encountered an error communicating with the telemetry analysis engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, errorMsg],
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const starterCategories = [
    {
      icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      title: 'Field Production',
      prompt: 'Summarize current oil production and drawdown stability across Baghewala producer wells',
      tag: 'PROD',
    },
    {
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      title: 'Artificial Lift Status',
      prompt: 'Assess sucker rod pump mechanical performance and vibration across SRP-01, SRP-02, and SRP-03',
      tag: 'SRP',
    },
    {
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      title: 'Thermal & Steam Grid',
      prompt: 'Review OTSG steam generator output and pipeline thermal retention efficiency',
      tag: 'STEAM',
    },
    {
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      title: 'Reservoir Mechanics',
      prompt: 'Explain SAGD vs CSS for heavy oil (API < 14°)',
      tag: 'EOR',
    },
    {
      icon: <Gauge className="w-4 h-4 text-emerald-400" />,
      title: 'Petroleum Chemistry',
      prompt: 'How is API gravity calculated and how does steam reduce viscosity?',
      tag: 'PVT',
    },
    {
      icon: <Cpu className="w-4 h-4 text-blue-400" />,
      title: 'Digital Twin Simulation',
      prompt: 'What happens if steam pressure is increased to 92 bar on IW-01?',
      tag: 'SIM',
    },
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-2xl overflow-hidden border border-slate-800 bg-[#060B13] shadow-2xl relative">
      {/* ------------------------------------------------------------------- */}
      {/* LEFT CHAT SESSIONS SIDEBAR (Like ChatGPT & Gemini) */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800/80 bg-slate-950/70 flex flex-col overflow-hidden relative`}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800/80 shrink-0">
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono text-slate-500 font-bold tracking-wider uppercase">
            Conversations
          </div>
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => setActiveSessionId(sess.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono cursor-pointer transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sess.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer / API Key Quick Status */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-slate-950/90 text-xs">
          <button
            onClick={() => setShowKeyModal(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors font-mono text-[11px]"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini API Key</span>
            </div>
            {keyStatus === 'valid' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Offline / Unverified" />
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN CHAT AREA */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-radial-gradient">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>AI Operations Copilot</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h1>

                {keyStatus === 'valid' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>GEMINI 2.5 FLASH ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                    PETROLEUM NEURAL CORE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE TELEMETRY SYNCED</span>
            </div>

            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Config Key</span>
            </button>
          </div>
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-cyan-500/20 border border-cyan-400/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative rounded-2xl text-xs leading-relaxed transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium p-4 max-w-xl rounded-tr-none shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 p-5 max-w-2xl sm:max-w-3xl rounded-tl-none shadow-xl'
                  }`}
                >
                  {/* Message Meta Header */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800/60 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isUser ? 'text-white' : 'text-cyan-400'}`}>
                        {isUser ? 'Operator' : 'PetroNexus Copilot AI'}
                      </span>
                      {msg.contextData?.model && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {msg.contextData.model}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-300 transition-opacity"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Markdown Content (Supports Tables, Code Blocks, Bold, Bullets) */}
                  <div className="prose prose-invert prose-xs max-w-none text-slate-200 space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
                            <table className="w-full text-left border-collapse text-[11px] font-mono" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-800/80 text-cyan-300 font-bold border-b border-slate-700" {...props} />
                        ),
                        th: ({ node, ...props }) => <th className="p-2 border-r border-slate-800 last:border-0" {...props} />,
                        td: ({ node, ...props }) => <td className="p-2 border-t border-slate-800 border-r last:border-0" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px] border border-slate-800" {...props} />
                        ),
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-3 mb-1" {...props} />,
                        h4: ({ node, ...props }) => <h4 className="text-xs font-bold text-cyan-300 mt-2 mb-1" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Action Recommendations Box */}
                  {msg.contextData?.recommendations && msg.contextData.recommendations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 font-mono uppercase mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Recommended Operational Actions:</span>
                      </div>
                      <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
                        {msg.contextData.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">›</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3.5 max-w-4xl mx-auto justify-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-950/20">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Analyzing reservoir physics & live field telemetry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* BOTTOM INPUT & STARTER CARDS */}
        {/* ----------------------------------------------------------------- */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 shrink-0 max-w-4xl w-full mx-auto space-y-3">
          {/* Quick Query Starter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0">Topics:</span>
            {starterCategories.map((cat, i) => (
              <button
                key={i}
                onClick={() => handleSendQuery(cat.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-xs font-mono whitespace-nowrap transition-all shadow-sm active:scale-95"
              >
                {cat.icon}
                <span>{cat.title}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(inputQuery);
            }}
            className="flex items-end gap-2 bg-slate-900/90 border border-slate-700/80 focus-within:border-cyan-500/80 rounded-2xl p-2.5 transition-all shadow-xl shadow-black/50"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask Copilot about production diagnostics, steam loss, sucker rod pumps, or any petroleum query..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuery(inputQuery);
                }
              }}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans resize-none max-h-32 leading-relaxed"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-30 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 shadow-md shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Pro tip: Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.</span>
            <span>PetroNexus 360 AI Engine v2.5</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* GEMINI API KEY CONFIGURATION MODAL */}
      {/* ------------------------------------------------------------------- */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Gemini API Key</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Power your Petroleum Copilot with LLM reasoning</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Connect your free <strong>Google Gemini API Key</strong> to give PetroNexus 360 open-ended reasoning capabilities like ChatGPT and Gemini across the entire body of petroleum literature.
              </p>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                  Gemini API Key (AI Studio):
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setKeyStatus('idle');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              {keyStatusMessage && (
                <div
                  className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-mono ${
                    keyStatus === 'valid'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      : keyStatus === 'invalid'
                      ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                      : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {keyStatus === 'valid' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                  {keyStatus === 'invalid' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  {keyStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-cyan-400" />}
                  <span>{keyStatusMessage}</span>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
                <span>Don't have a key?</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono font-semibold"
                >
                  <span>Get free Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setKeyInput('');
                  setApiKey('');
                  localStorage.removeItem('petronexus_gemini_api_key');
                  setKeyStatus('idle');
                  setKeyStatusMessage('');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={() => verifyKey(keyInput)}
                disabled={keyStatus === 'testing' || !keyInput.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all"
              >
                {keyStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
