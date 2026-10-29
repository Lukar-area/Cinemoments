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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-white border-l-2 border-[#CBC3E3] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#CBC3E3] bg-[#F8F6FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] flex items-center justify-center text-[#9F2B68] shadow-sm">
              {user?.role === 'CUSTOMER' ? (
                <Building2 className="w-5 h-5 text-[#9F2B68]" />
              ) : (
                <UserIcon className="w-5 h-5 text-[#9F2B68]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#301934] leading-tight font-cinema">
                  {headerTitle}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-[#9F2B68] font-mono font-semibold">
                {bookingId ? `Regarding Booking #${bookingId}` : 'Direct Theatre Projection Line'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMessages(false)}
              className="p-2 rounded-lg text-[#483248] hover:text-[#9F2B68] hover:bg-[#E6E6FA] transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#483248] hover:text-[#9F2B68] hover:bg-[#E6E6FA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAFAFE]">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#AA98A9] text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#9F2B68]" />
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <MessageSquare className="w-12 h-12 text-[#CBC3E3] mb-2" />
              <h4 className="text-sm font-semibold text-[#301934]">Start the Conversation</h4>
              <p className="text-xs text-[#483248] max-w-xs font-medium">
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
                  <span className="text-[10px] text-[#AA98A9] mb-1 px-1 font-mono">
                    {isMe ? 'You' : msg.sender_name || 'Staff'} •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white font-medium rounded-br-none shadow-md shadow-[#9F2B68]/15'
                        : 'bg-white text-[#301934] border border-[#CBC3E3] rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.has_media && (
                      <div className="mb-2">
                        <div className="mb-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E6E6FA] text-[10px] font-mono text-[#702963] border border-[#CBC3E3]">
                            <Lock className="w-2.5 h-2.5 text-[#9F2B68]" />
                            AES-256-GCM {msg.media_type === 'VIDEO' ? 'Encrypted Video' : 'Encrypted Media'}
                          </span>
                        </div>
                        {msg.media_type === 'VIDEO' ? (
                          <div className="rounded-xl overflow-hidden bg-black border border-[#CBC3E3] shadow-md">
                            <video
                              controls
                              preload="metadata"
                              src={api.chat.getMediaUrl(msg.id)}
                              className="w-full max-h-56 object-contain bg-black"
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-[#CBC3E3] shadow-md">
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
          <div className="px-4 py-2 border-t border-[#CBC3E3] bg-[#FFF0F7] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#9F2B68] truncate">
              <FileVideo className="w-4 h-4 shrink-0 text-[#9F2B68]" />
              <span className="truncate font-medium">{selectedMedia.name}</span>
              <span className="text-[10px] text-[#AA98A9] font-mono">
                ({(selectedMedia.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#F8F5FF] text-[#5D3FD3] text-[10px] font-semibold border border-[#5D3FD3]/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Encrypted Video
              </span>
            </div>
            <button
              type="button"
              onClick={clearSelectedMedia}
              className="p-1 rounded text-[#AA98A9] hover:text-[#800020] transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-[#CBC3E3] bg-[#F8F6FC] flex items-center gap-2"
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
            className={`p-2.5 rounded-xl border border-[#CBC3E3] bg-white hover:bg-[#E6E6FA] text-[#9F2B68] transition-colors cursor-pointer ${
              selectedMedia ? 'border-[#9F2B68] bg-[#FFF0F7]' : ''
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
            className="flex-1 bg-white border border-[#CBC3E3] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68]"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedMedia) || sending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#9F2B68]/20 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
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
