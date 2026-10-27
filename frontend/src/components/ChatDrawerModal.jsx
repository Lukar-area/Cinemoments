import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Send,
  MessageSquare,
  Building2,
  User as UserIcon,
  RefreshCw,
  Lock,
  Paperclip,
  Trash2,
  FileVideo,
} from 'lucide-react';

export const ChatDrawerModal = ({
  isOpen,
  onClose,
  theatreId,
  theatreName,
  userId,
  customerName,
  bookingId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('Selected file exceeds the 25 MB size limit.');
      return;
    }
    setSelectedMedia(file);
  };

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadMessages = async (silent = false) => {
    if (!theatreId) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.chat.getMessages(theatreId, userId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && theatreId) {
      loadMessages();
      // Poll every 3.5 seconds while chat window is active
      const interval = setInterval(() => {
        loadMessages(true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen, theatreId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const hasText = Boolean(newMessage.trim());
    if ((!hasText && !selectedMedia) || sending) return;

    try {
      setSending(true);
      let res;
      if (selectedMedia) {
        const formData = new FormData();
        formData.append('theatreId', theatreId);
        if (userId) formData.append('userId', userId);
        if (bookingId) formData.append('bookingId', bookingId);
        if (hasText) formData.append('message', newMessage.trim());
        formData.append('media', selectedMedia);
        res = await api.chat.sendMessage(formData);
      } else {
        res = await api.chat.sendMessage({
          theatreId,
          userId,
          bookingId: bookingId || undefined,
          message: newMessage.trim(),
        });
      }

      setNewMessage('');
      clearSelectedMedia();

      if (res.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage]);
      } else {
        await loadMessages(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const headerTitle =
    user?.role === 'CUSTOMER'
      ? theatreName || 'Cinema Intermission Desk'
      : customerName || 'Customer Support';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-cinema-900 border-l border-cinema-700/80 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cinema-700/80 bg-cinema-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {user?.role === 'CUSTOMER' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {headerTitle}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                {bookingId ? `Regarding Booking #${bookingId}` : 'Direct Theatre Line'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMessages(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-750 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-750 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-white">Start the Conversation</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Inquire about laser screen calibration, projection requirements, custom music, or
                interval timing.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-1 px-1">
                    {isMe ? 'You' : msg.sender_name || 'Staff'} •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-cinema-gold to-amber-500 text-cinema-950 font-medium rounded-br-none'
                        : 'bg-cinema-800 text-slate-200 border border-cinema-700/80 rounded-bl-none'
                    }`}
                  >
                    {msg.has_media && (
                      <div className="mb-2">
                        <div className="mb-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 text-[10px] font-mono text-amber-300 border border-amber-500/25">
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                            AES-256-GCM {msg.media_type === 'VIDEO' ? 'Encrypted Video' : 'Encrypted Media'}
                          </span>
                        </div>
                        {msg.media_type === 'VIDEO' ? (
                          <div className="rounded-xl overflow-hidden bg-black border border-amber-500/20 shadow-md">
                            <video
                              controls
                              preload="metadata"
                              src={api.chat.getMediaUrl(msg.id)}
                              className="w-full max-h-56 object-contain bg-black"
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-amber-500/20 shadow-md">
                            <img
                              src={api.chat.getMediaUrl(msg.id)}
                              alt={msg.original_filename || 'Encrypted Media'}
                              className="w-full max-h-56 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {msg.message && <div className="leading-relaxed">{msg.message}</div>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Media Preview Chip */}
        {selectedMedia && (
          <div className="px-4 py-2 border-t border-cinema-700/80 bg-cinema-900/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 truncate">
              <FileVideo className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate font-medium">{selectedMedia.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({(selectedMedia.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Encrypted Video
              </span>
            </div>
            <button
              type="button"
              onClick={clearSelectedMedia}
              className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Remove attachment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-cinema-700/80 bg-cinema-850 flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".mp4,.webm,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl border border-cinema-700 bg-cinema-900 hover:bg-cinema-800 text-amber-400 hover:text-amber-300 transition-colors ${
              selectedMedia ? 'border-amber-400 bg-amber-500/10' : ''
            }`}
            title="Attach encrypted video or photo (MP4, WebM, JPG, PNG)"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedMedia ? 'Add a caption for this encrypted video...' : 'Type your message...'}
            className="flex-1 bg-cinema-900 border border-cinema-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedMedia) || sending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 hover:from-amber-400 hover:to-cinema-gold text-cinema-950 font-bold text-xs shadow-md shadow-cinema-gold/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDrawerModal;
