import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import apiClient from '../api/axios.config';
import baseeraIcon from '../assets/baseera-icon.svg';
import './AIChatbot.css';

const MAX_INPUT_HEIGHT = 120;

const SUGGESTED_PROMPTS = [
  'Show critical vulnerabilities',
  'How to fix SQL Injection?',
  'What is XSS?',
  'List all vulnerabilities',
];

const generateId = () => Math.random().toString(36).slice(2, 10);

const formatTime = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const relativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days}d ago`;
  if (h >= 1) return `${h}h ago`;
  return 'Just now';
};

const loadConversations = () => {
  try {
    return JSON.parse(localStorage.getItem('baseera_conversations') || '[]');
  } catch {
    return [];
  }
};

const saveConversations = (convs) => {
  localStorage.setItem('baseera_conversations', JSON.stringify(convs));
};

const buildTitle = (msg) => {
  const text = msg.slice(0, 40);
  return text.length < msg.length ? text + '…' : text;
};

export default function AIChatbot() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConv ? activeConv.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const updateConversations = (updated) => {
    setConversations(updated);
    saveConversations(updated);
  };

  const newConversation = () => {
    const conv = {
      id: generateId(),
      title: 'New Conversation',
      preview: '',
      timestamp: new Date().toISOString(),
      messages: [],
    };
    const updated = [conv, ...conversations];
    updateConversations(updated);
    setActiveId(conv.id);
  };

  const clearConversations = () => {
    if (window.confirm('Clear all conversations?')) {
      updateConversations([]);
      setActiveId(null);
    }
  };

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== convId);
    updateConversations(updated);
    if (activeId === convId) setActiveId(null);
  };

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (convId) => {
    if (!editTitle.trim()) return;
    const updated = conversations.map((c) =>
      c.id === convId ? { ...c, title: editTitle.trim() } : c
    );
    updateConversations(updated);
    setEditingId(null);
  };

  const exportChatAsHTML = () => {
    if (!activeConv || messages.length === 0) return;

    const msgHTML = messages.map((msg) => {
      const role = msg.role === 'user' ? 'You' : 'Baseera Assistant';
      const roleIcon = msg.role === 'user' ? '👤' : '🔮';
      const bgColor = msg.role === 'user' ? '#6366f1' : '#1e293b';
      const textColor = '#e2e8f0';
      const align = msg.role === 'user' ? 'flex-end' : 'flex-start';
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const escapedContent = msg.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
      return `
      <div style="display:flex;justify-content:${align};margin-bottom:16px;">
        <div style="max-width:70%;background:${bgColor};color:${textColor};padding:12px 16px;border-radius:12px;">
          <div style="font-weight:600;margin-bottom:4px;font-size:0.8rem;color:#94a3b8;">${roleIcon} ${role} · ${time}</div>
          <div style="white-space:pre-wrap;">${escapedContent}</div>
        </div>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${activeConv.title} - Baseera Chat Export</title>
<style>body{background:#0f1724;font-family:'Inter','Segoe UI',sans-serif;padding:40px;max-width:800px;margin:0 auto;}
h1{color:#f1f5f9;font-size:1.4rem;}h2{color:#64748b;font-size:0.85rem;font-weight:400;margin-bottom:30px;}</style>
</head><body><h1><span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#111827;border:2px solid #22c55e;vertical-align:middle;margin-right:8px;font-size:16px;">👁️</span> ${activeConv.title}</h1><h2>Exported on ${new Date().toLocaleString()}</h2>${msgHTML}</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConv.title.replace(/[^a-z0-9]/gi, '_')}_chat.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async (text) => {
    if (isTyping) return; // Don't allow sending while bot is responding
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMsg = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    let convId = activeId;
    let updatedConvs = [...conversations];

    if (!convId) {
      const conv = {
        id: generateId(),
        title: buildTitle(trimmed),
        preview: trimmed,
        timestamp: new Date().toISOString(),
        messages: [userMsg],
      };
      updatedConvs = [conv, ...conversations];
      convId = conv.id;
    } else {
      updatedConvs = updatedConvs.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              preview: trimmed,
              timestamp: new Date().toISOString(),
              title: c.messages.length === 0 ? buildTitle(trimmed) : c.title,
            }
          : c
      );
    }

    setActiveId(convId);
    updateConversations(updatedConvs);
    setIsTyping(true);

    try {
      const data = await apiClient.post('/chat', {
        message: trimmed,
        conversationId: convId,
      });

      const payload = data?.data || data;
      const botContent = buildBotMessage(payload);

      const botMsg = {
        id: generateId(),
        role: 'bot',
        content: botContent,
        rawData: payload,
        timestamp: new Date().toISOString(),
      };

      const withBot = updatedConvs.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, botMsg] } : c
      );
      updateConversations(withBot);
    } catch {
      const errorMsg = {
        id: generateId(),
        role: 'bot',
        content: 'Sorry, I could not reach the AI service right now. Please try again later.',
        timestamp: new Date().toISOString(),
      };
      const withError = updatedConvs.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, errorMsg] } : c
      );
      updateConversations(withError);
    } finally {
      setIsTyping(false);
    }
  };

  const buildBotMessage = (payload) => {
    if (!payload) return 'No response received.';
    const { vulnerability, explanation, severity, fix } = payload;
    let msg = '';
    if (vulnerability) {
      msg += `**${vulnerability}** (Severity: ${severity})\n\n`;
    }
    if (explanation) msg += explanation + '\n\n';
    if (fix) msg += `**Fix:** ${fix}`;
    return msg.trim() || 'No analysis available.';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping) sendMessage();
    }
  };

  const filteredConvs = searchQuery
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.messages.some((m) =>
            m.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : conversations;

  const renderMessage = (msg) => {
    return msg.content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className="chat-line">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="ai-chatbot-wrapper">
      <LandingNavbar />
      <div className="ai-chatbot-layout">
        {/* ── Sidebar ── */}
        <aside className="chatbot-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">
              <span className="bot-name">Baseera Assistant</span>
              <span className="online-dot" />
              <span className="online-label">Online</span>
            </div>
            <div className="sidebar-actions">
              <button className="sidebar-btn" onClick={newConversation}>
                New
              </button>
              <button className="sidebar-btn danger" onClick={clearConversations}>
                Clear
              </button>
            </div>
          </div>

          <div className="recent-conversations">
            <h4 className="section-label">Recent Conversations</h4>
            {filteredConvs.length === 0 ? (
              <p className="empty-hint">No conversations yet.</p>
            ) : (
              filteredConvs.map((c) => (
                <div
                  key={c.id}
                  className={`conv-item ${c.id === activeId ? 'active' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div className="conv-item-header">
                    {editingId === c.id ? (
                      <input
                        className="conv-rename-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveRename(c.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveRename(c.id); } if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="conv-title">{c.title}</div>
                    )}
                    <div className="conv-item-actions">
                      <button className="conv-action-btn" onClick={(e) => startRename(c, e)} title="Rename">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button className="conv-delete-btn" onClick={(e) => deleteConversation(c.id, e)} title="Delete">
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  </div>
                  <div className="conv-meta">
                    <span className="conv-preview">{c.preview}</span>
                    <span className="conv-time">{relativeTime(c.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="suggested-prompts">
            <h4 className="section-label">Suggested Prompts</h4>
            <div className="prompt-chips">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="prompt-chip"
                  onClick={() => sendMessage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Chat Area ── */}
        <main className="chatbot-main">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-conv-title">
                {activeConv ? activeConv.title : 'Baseera Assistant'}
              </span>
              {activeConv && (
                <span className="chat-synced">
                  Last synced {relativeTime(activeConv.timestamp)}
                </span>
              )}
            </div>
            <div className="chat-header-right">
              <i className="fa-solid fa-download chat-icon-btn" title="Export as HTML" onClick={exportChatAsHTML} style={{ cursor: messages.length ? 'pointer' : 'not-allowed', opacity: messages.length ? 1 : 0.4 }} />
            </div>
          </div>

          {/* Search bar */}
          <div className="chat-search-bar">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && !isTyping && (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <img src={baseeraIcon} alt="Baseera" />
                </div>
                <p>Ask Baseera about web vulnerabilities, fixes, and security best practices.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <i className="fa-solid fa-user" />
                  ) : (
                    <img src={baseeraIcon} alt="Baseera" className="bot-icon-img" />
                  )}
                </div>
                <div className="message-body">
                  <div className="message-bubble">{renderMessage(msg)}</div>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot">
                <div className="message-avatar">
                  <img src={baseeraIcon} alt="Baseera" className="bot-icon-img" />
                </div>
                <div className="message-body">
                  <div className="message-bubble typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Ask Baseera..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, MAX_INPUT_HEIGHT) + 'px';
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isTyping}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
              >
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
            <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </main>
      </div>
    </div>
  );
}
