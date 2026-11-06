import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../services/api';

const POLL_MS = 5000;

const Messages = () => {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobParam = searchParams.get('job');
  const toParam = searchParams.get('to');
  const activeChat = jobParam && toParam ? { jobId: jobParam, userId: toParam } : null;

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = useCallback(() => {
    apiFetch('/messages/conversations', token).then(setConversations).catch(() => {});
  }, [token]);

  const loadChat = useCallback(async () => {
    if (!jobParam || !toParam) return;
    try {
      const data = await apiFetch(`/messages/${jobParam}/${toParam}`, token);
      setMessages(data.messages || []);
      setChatMeta(data);
    } catch (err) {
      setError(err.message);
    }
  }, [jobParam, toParam, token]);

  // Initial load + light polling so new messages appear without refreshing.
  useEffect(() => {
    loadConversations();
    loadChat();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadConversations();
        loadChat();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadConversations, loadChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const openChat = (chat) => {
    setError('');
    setMessages([]);
    setChatMeta(null);
    setSearchParams({ job: chat.jobId, to: chat.userId });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeChat) return;
    setSending(true);
    setError('');
    try {
      await apiFetch('/messages/send', token, {
        method: 'POST',
        body: { jobId: activeChat.jobId, receiverId: activeChat.userId, content },
      });
      setContent('');
      await Promise.all([loadChat(), loadConversations()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const isActive = (chat) => activeChat?.jobId === chat.jobId && activeChat?.userId === chat.userId;

  return (
    <DashboardLayout title="Messages" subtitle="Chat with clients or freelancers about a specific job">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100svh-15rem)] min-h-[420px]">
        {/* Conversation list — hidden on mobile while a chat is open */}
        <div className={`card overflow-hidden flex-col ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border text-sm font-medium">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">No messages yet. Start a chat from a job listing or applicant.</p>
            ) : (
              conversations.map((chat) => (
                <button
                  key={`${chat.jobId}-${chat.userId}`}
                  type="button"
                  onClick={() => openChat(chat)}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted text-sm ${isActive(chat) ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      {chat.userName} <span className="text-xs text-muted-foreground font-normal">({chat.userRole})</span>
                    </p>
                    {chat.unread > 0 && !isActive(chat) && (
                      <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{chat.unread}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.jobTitle}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessage}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`lg:col-span-2 card flex-col overflow-hidden ${activeChat ? 'flex' : 'hidden lg:flex'}`}>
          {activeChat ? (
            <>
              <div className="p-3 border-b border-border flex items-center gap-2">
                <button type="button" onClick={() => setSearchParams({})} className="lg:hidden p-1 -ml-1 rounded hover:bg-muted" aria-label="Back to conversations">
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{chatMeta?.otherUser?.name || 'Chat'}</p>
                  <p className="text-xs text-muted-foreground truncate">{chatMeta?.jobTitle} · {chatMeta?.otherUser?.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user.id;
                    return (
                      <div key={m.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {m.content}
                          <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              {error && <Alert type="error" className="mx-3 mb-2" onClose={() => setError('')}>{error}</Alert>}
              <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
                <input className="input-field flex-1" placeholder="Type a message..." maxLength={2000} value={content} onChange={(e) => setContent(e.target.value)} />
                <button type="submit" disabled={sending || !content.trim()} className="btn-primary px-4" aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
              Select a conversation, or start one from a job listing
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
