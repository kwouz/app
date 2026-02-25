import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Send, Bot, AlertCircle } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';


interface ChatMessage {
    id: number | string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AutostartState {
    autostart?: boolean;
    stateKey?: string;
    stateLabelRu?: string;
    lastActionId?: string;
    lastActionTitle?: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const autostartDone = useRef(false);

    const t = useT();
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize chat_id synchronously
    function getOrCreateChatId(): string {
        let id = localStorage.getItem('dc_chat_id');
        if (!id) {
            id = uuidv4();
            localStorage.setItem('dc_chat_id', id);
        }
        return id;
    }
    const chatId = useRef<string>(getOrCreateChatId());

    // Capture autostart state from navigation before it gets cleared
    const pendingAutostart = useRef<AutostartState | null>(null);

    useEffect(() => {
        // Capture autostart state before anything else
        const navState = location.state as AutostartState | null;
        if (navState?.autostart && !autostartDone.current) {
            pendingAutostart.current = { ...navState };
            // Clear location state to prevent re-send on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }

        loadHistory().then(() => {
            // After history loaded, fire auto-send if pending
            if (pendingAutostart.current && !autostartDone.current) {
                autostartDone.current = true;
                const st = pendingAutostart.current;
                pendingAutostart.current = null;
                const starterText = `Мне сейчас ${st.stateLabelRu || 'непросто'}. Хочу поддержки.`;
                sendAutoMessage(starterText, {
                    stateKey: st.stateKey,
                    stateLabelRu: st.stateLabelRu,
                    lastActionId: st.lastActionId,
                    lastActionTitle: st.lastActionTitle,
                });
            }
        });
    }, []);

    const scrollToBottom = (force = false) => {
        const container = chatContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        // ~150px tolerance to count as being near the bottom
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        if (force || isNearBottom) {
            container.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom(false);
    }, [messages, isLoading]);

    const loadHistory = async () => {
        try {
            const res = await fetch(`/api/chat/${chatId.current}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setTimeout(() => scrollToBottom(true), 50);
            }
        } catch (e) {
            console.error('Failed to load history', e);
        }
    };

    const sendAutoMessage = async (text: string, context?: Record<string, any>) => {
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
        setTimeout(() => scrollToBottom(true), 50);
        setIsLoading(true);
        setError(null);

        try {
            console.log("Sending to /api/chat")
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId.current,
                    user_message: text,
                    context,
                }),
            });

            const raw = await res.text();
            let data: any;
            try { data = JSON.parse(raw); } catch { throw new Error(raw); }
            if (!res.ok) throw new Error(data?.error || raw);

            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.text }]);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg }]);
        setTimeout(() => scrollToBottom(true), 50);
        setIsLoading(true);
        setError(null);

        try {
            console.log("Sending to /api/chat")
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId.current, user_message: userMsg })
            });

            const raw = await res.text();

            let data: any;
            try {
                data = JSON.parse(raw);
            } catch {
                throw new Error(raw);
            }

            if (!res.ok) {
                throw new Error(data?.error || raw);
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.text }]);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page fade-in chat-container">
            <h1 className="page-title">{t('chat_title') || 'Reflection Chat'}</h1>

            {/* Error Message */}
            {error && (
                <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '12px', background: 'var(--danger-muted)', borderRadius: 'var(--radius-sm)' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Messages Area */}
            <div className="chat-messages" ref={chatContainerRef}>
                {messages.length === 0 && !isLoading && (
                    <div className="empty-state" style={{ margin: 'auto' }}>
                        {t('chat_empty') || 'Hello. I am here to help you reflect. How are you feeling today?'}
                    </div>
                )}
                {messages.map((m) => {
                    if (m.role === 'system') return null;
                    const isUser = m.role === 'user';
                    return (
                        <div key={m.id} className={`chat-row ${isUser ? 'user' : 'assistant'}`}>
                            <div className={`chat-avatar ${isUser ? 'user' : 'assistant'}`}>
                                {isUser ? 'U' : <Bot size={18} />}
                            </div>
                            <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
                                {m.content}
                            </div>
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="chat-row assistant">
                        <div className="chat-avatar assistant">
                            <Bot size={18} />
                        </div>
                        <div className="chat-bubble assistant" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                            <div className="chat-loading-dots"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="chat-input-wrapper">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t('chat_placeholder') || 'Type a message...'}
                    className="chat-input"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`chat-send-btn ${input.trim() && !isLoading ? 'active' : ''}`}
                >
                    <Send size={18} />
                </button>
            </div>


        </div>
    );
}
