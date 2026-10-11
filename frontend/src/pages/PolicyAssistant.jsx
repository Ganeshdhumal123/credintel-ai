import { useState, useRef, useEffect, useCallback } from 'react';
import { queryAssistant, getRagStats, uploadPolicyDocument } from '../services/api';
import { useToast } from '../components/Toast';

const EXAMPLE_QUESTIONS = [
  'What is the maximum loan duration and age limit?',
  'What are the risk tiers and default probability thresholds?',
  'What are the installment rate and debt burden limits?',
  'What are the collateral and guarantor requirements?',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I am the **CredIntel Underwriting & Policy Assistant**, powered by document-grounded RAG (Retrieval-Augmented Generation) with FAISS vector search.\n\nI answer inquiries directly using evidence retrieved from our indexed credit policy documents. Ask me anything about eligibility criteria, risk bands, debt limits, or collateral rules.",
  sources: ['CredIntel Underwriting Standards (POL-2026-V1.0)'],
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 text-base shadow-sm"
          style={{ backgroundColor: '#0A192F', color: '#64FFDA', border: '1px solid rgba(100,255,218,0.2)' }}
        >
          🤖
        </div>
      )}
      <div
        className={`max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-white text-gray-800 dark:bg-slate-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-slate-800'
        }`}
        style={isUser ? { backgroundColor: '#0A192F' } : {}}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>📎</span> Grounded Document Sources:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {msg.sources.map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-100 dark:border-teal-800/60 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  {typeof src === 'string' ? src : src.source || JSON.stringify(src)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 text-sm bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold shadow-sm">
          👤
        </div>
      )}
    </div>
  );
};

const PolicyAssistant = () => {
  const { addToast, ToastContainer } = useToast();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ragStats, setRagStats] = useState(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch RAG stats on mount
  const fetchStats = useCallback(async () => {
    try {
      const res = await getRagStats();
      setRagStats(res.data);
    } catch {
      // Non-fatal if stats fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await uploadPolicyDocument(formData);
      addToast(res.data.message || 'Document indexed into FAISS vector store!', 'success');
      await fetchStats();
      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: `📄 **Document Ingested**: \`${file.name}\` has been processed, chunked, and embedded into the FAISS vector database. You can now query rules contained in this document!`,
          sources: [file.name],
        },
      ]);
    } catch (err) {
      addToast(err.friendlyMessage || 'Failed to upload document.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = useCallback(
    async (question) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      const userMsg = { id: Date.now(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setError(null);
      setLoading(true);

      try {
        const res = await queryAssistant(trimmed);
        const data = res.data;
        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.answer || 'No relevant policy documentation was located.',
          sources: data.sources || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(err.friendlyMessage || 'Failed to process policy query.');
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <ToastContainer />

      {/* Header with RAG Vector Store Status & Document Ingestion */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl text-xl border border-teal-100 dark:border-teal-800">
                🤖
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Policy Assistant
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                  Document-grounded RAG · Vector similarity search across underwriting standards
                </p>
              </div>
            </div>
          </div>

          {/* RAG Vector Store Badges & PDF Upload */}
          <div className="flex items-center gap-3 flex-wrap">
            {ragStats && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">{ragStats.vector_backend}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">{ragStats.total_chunks} Chunks</span>
              </div>
            )}

            {/* Document Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.md,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-900 transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2 shadow-sm cursor-pointer"
              style={{ backgroundColor: '#64FFDA' }}
            >
              {uploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                  Indexing…
                </>
              ) : (
                <>
                  <span>📄</span> + Ingest Policy PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Indexed Documents Chips */}
        {ragStats && ragStats.documents && ragStats.documents.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-slate-800 overflow-x-auto text-xs">
            <span className="text-gray-400 dark:text-slate-500 font-medium text-[11px] flex-shrink-0">
              Active Documents:
            </span>
            {ragStats.documents.map((doc) => (
              <span
                key={doc}
                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] font-mono flex items-center gap-1 flex-shrink-0"
              >
                <span>📑</span> {doc}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 text-base shadow-sm"
                style={{ backgroundColor: '#0A192F', color: '#64FFDA' }}
              >
                🤖
              </div>
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-gray-400 dark:text-slate-400 ml-2">Searching FAISS vector index & synthesizing policy answer…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4 text-xs flex items-center gap-2">
              <span>ℹ️</span> {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested Inquiries */}
      {messages.length <= 2 && (
        <div className="flex-shrink-0 px-8 pb-3 bg-gray-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-4xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
              Suggested Policy Queries:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-teal-400 dark:hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all shadow-sm cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a policy question… (e.g. 'What are the collateral rules for Medium risk applicants?')"
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent shadow-sm"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-6 py-3.5 rounded-xl text-gray-900 font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md cursor-pointer"
              style={{ backgroundColor: '#64FFDA' }}
            >
              {loading ? '…' : 'Search →'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2 text-center">
            Powered by CredIntel Underwriting Policy Engine & FAISS Vector Grounded Retrieval.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyAssistant;
