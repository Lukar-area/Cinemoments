import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { MediaViewerModal } from '../components/MediaViewerModal.jsx';
import { ConfirmationModal } from '../components/ConfirmationModal.jsx';
import { ChatDrawerModal } from '../components/ChatDrawerModal.jsx';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Film,
  Calendar,
  Eye,
  Check,
  X,
  Search,
  MessageSquare,
  DollarSign,
  TrendingUp,
  User,
  ArrowDownLeft,
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'CHATS' | 'EARNINGS'
  const [bookings, setBookings] = useState([]);
  const [cards, setCards] = useState({
    pendingRequests: 0,
    todayAcceptedBookings: 0,
    upcomingIntervalBookings: 0,
    completedBookings: 0,
    totalRequests: 0,
  });
  const [earnings, setEarnings] = useState({
    summary: { total_earnings: 0, completed_count: 0, refunded_count: 0 },
    transactions: [],
  });
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Actions
  const [previewMedia, setPreviewMedia] = useState(null);
  const [acceptingBooking, setAcceptingBooking] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState(null);

  // Chat State
  const [chatState, setChatState] = useState({
    isOpen: false,
    theatreId: null,
    userId: null,
    customerName: '',
    bookingId: null,
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [queueRes, earnRes, convRes] = await Promise.all([
        api.bookings.getStaffBookings(
          user?.assignedTheatreId || undefined,
          statusFilter === 'ALL' ? undefined : statusFilter
        ),
        api.transactions.getTheatreEarnings(user?.assignedTheatreId).catch(() => ({
          summary: { total_earnings: 0, completed_count: 0, refunded_count: 0 },
          transactions: [],
        })),
        api.chat.getConversations(user?.assignedTheatreId).catch(() => ({ conversations: [] })),
      ]);

      setBookings(queueRes.bookings || []);
      setCards(queueRes.cards || {});
      setEarnings(earnRes);
      setConversations(convRes.conversations || []);
    } catch (err) {
      console.error('Failed to load staff portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [statusFilter]);

  const handleConfirmAccept = async () => {
    if (!acceptingBooking) return;
    try {
      setActionLoading(true);
      const res = await api.bookings.accept(acceptingBooking.id);
      setAcceptingBooking(null);
      setActionSuccessNotice(
        `Request #${res.result.bookingId} ACCEPTED! ${res.result.expiredCount} competing request(s) were atomically EXPIRED and refunded.`
      );
      await fetchStaffData();
    } catch (err) {
      alert(err.message || 'Failed to accept booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    try {
      setActionLoading(true);
      await api.bookings.reject(rejectingBooking.id, rejectionReason);
      setRejectingBooking(null);
      setRejectionReason('');
      setActionSuccessNotice(
        `Request #${rejectingBooking.id} has been marked REJECTED and customer wallet was refunded.`
      );
      await fetchStaffData();
    } catch (err) {
      alert(err.message || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCustomerChat = (theatreId, userId, customerName, bookingId) => {
    setChatState({
      isOpen: true,
      theatreId: theatreId || user?.assignedTheatreId || null,
      userId,
      customerName,
      bookingId,
    });
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.movie_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-cinema-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Theatre Operations Portal
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-bold text-white mt-1">
            Interval Operations & Revenue Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review interval requests, chat with patrons, and track your cinema's 80% revenue share.
          </p>
        </div>

        {/* 80% Earnings Header Card */}
        <div className="px-5 py-3 rounded-2xl bg-cinema-850 border border-amber-500/30 flex items-center gap-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              80% Theatre Revenue Earned
            </span>
            <span className="text-xl font-black text-amber-300">
              ₹{Number(earnings.summary?.total_earnings || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Staff Dashboard Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setActiveTab('QUEUE');
            setStatusFilter('PENDING');
          }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'PENDING' && activeTab === 'QUEUE'
              ? 'bg-amber-500/15 border-amber-400 shadow-glow-gold'
              : 'bg-cinema-850 border-cinema-700/80 hover:border-slate-600'
          }`}
        >
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Requests
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-amber-300 mt-1">
            {cards.pendingRequests}
          </span>
        </div>

        <div
          onClick={() => {
            setActiveTab('QUEUE');
            setStatusFilter('ACCEPTED');
          }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === 'ACCEPTED' && activeTab === 'QUEUE'
              ? 'bg-emerald-500/15 border-emerald-400 shadow-sm'
              : 'bg-cinema-850 border-cinema-700/80 hover:border-slate-600'
          }`}
        >
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Bookings
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
            {cards.todayAcceptedBookings + cards.upcomingIntervalBookings}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('CHATS')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'CHATS'
              ? 'bg-blue-500/15 border-blue-400 shadow-sm'
              : 'bg-cinema-850 border-cinema-700/80 hover:border-slate-600'
          }`}
        >
          <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Customer Inquiries
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-blue-300 mt-1">
            {conversations.length}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('EARNINGS')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'EARNINGS'
              ? 'bg-amber-500/15 border-amber-400 shadow-sm'
              : 'bg-cinema-850 border-cinema-700/80 hover:border-slate-600'
          }`}
        >
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Paid Interval Slots
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-amber-300 mt-1">
            {earnings.summary?.completed_count || 0}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-cinema-700/80 pb-2">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'QUEUE'
              ? 'bg-cinema-800 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Review Queue ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('CHATS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'CHATS'
              ? 'bg-cinema-800 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Customer Chats ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('EARNINGS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'EARNINGS'
              ? 'bg-cinema-800 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          80% Revenue Share Payouts
        </button>
      </div>

      {/* TAB 1: Review Queue */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          {/* Controls: Search and Status Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, movie, or message..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'ALL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === s
                      ? 'bg-amber-400 text-cinema-950 font-bold'
                      : 'bg-cinema-850 text-slate-400 hover:text-white border border-cinema-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Queue */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-cinema-850 animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-3">
              <Film className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No requests in this category</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No interval requests match the selected filter. Try selecting "ALL" or check back
                when customers submit proposals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-2xl bg-cinema-850 border border-cinema-700/80 hover:border-amber-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Proposal Content */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        booking.movie_poster ||
                        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'
                      }
                      alt={booking.movie_title}
                      className="w-16 h-24 object-cover rounded-xl shrink-0 shadow-md"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">
                          #{booking.id.toString().padStart(4, '0')}
                        </span>
                        <StatusBadge status={booking.status} size="sm" />
                        <span className="text-[11px] px-2 py-0.5 rounded bg-cinema-800 text-slate-300 font-semibold uppercase">
                          {booking.booking_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{booking.movie_title}</h3>

                      <p className="text-xs text-slate-400">
                        Requested by:{' '}
                        <strong className="text-white">{booking.customer_name}</strong> (
                        {booking.customer_email}
                        {booking.contact_phone ? ` • ${booking.contact_phone}` : ''})
                      </p>

                      <p className="text-xs text-amber-200 italic line-clamp-2 max-w-xl">
                        "{booking.message}"
                      </p>
                    </div>
                  </div>

                  {/* Center: Timing Details */}
                  <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-800 text-xs text-slate-300 space-y-1 min-w-[200px]">
                    <div>
                      Screen: <strong className="text-white">{booking.screen_name}</strong>
                    </div>
                    <div>
                      Show Date: <strong className="text-white">{booking.show_date}</strong> •{' '}
                      {booking.start_time}
                    </div>
                    <div className="text-amber-400 font-semibold">
                      Interval: {booking.interval_start} - {booking.interval_end}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() =>
                        openCustomerChat(
                          booking.theatre_id,
                          booking.user_id,
                          booking.customer_name,
                          booking.id
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat with Customer
                    </button>

                    {booking.has_media && booking.media_id && (
                      <button
                        onClick={() =>
                          setPreviewMedia({
                            id: booking.media_id,
                            type: booking.media_type || 'IMAGE',
                          })
                        }
                        className="p-2 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-amber-400 text-xs font-semibold flex items-center gap-1.5"
                        title="Preview Media"
                      >
                        <Eye className="w-4 h-4" />
                        Media
                      </button>
                    )}

                    {(booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW') && (
                      <>
                        <button
                          onClick={() => setAcceptingBooking(booking)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => setRejectingBooking(booking)}
                          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Customer Inquiries & Chats */}
      {activeTab === 'CHATS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
            <h3 className="font-cinema text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Direct Customer Conversations
            </h3>
            <p className="text-xs text-slate-400">
              Patrons submitting interval bookings or inquiring about projection requirements.
            </p>

            {conversations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No active conversations yet.
              </div>
            ) : (
              <div className="divide-y divide-cinema-750">
                {conversations.map((conv) => (
                  <div
                    key={conv.user_id}
                    onClick={() =>
                      openCustomerChat(conv.theatre_id, conv.user_id, conv.user_name)
                    }
                    className="p-4 hover:bg-cinema-800/40 transition-colors cursor-pointer flex items-center justify-between rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{conv.user_name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {conv.last_message || 'Start chatting with this patron...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px]">
                          {conv.unread_count} new
                        </span>
                      )}
                      <button className="px-3.5 py-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-750 text-slate-300 font-semibold text-xs">
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: 80% Revenue Share Payouts */}
      {activeTab === 'EARNINGS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
            <h3 className="font-cinema text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              80% Theatre Revenue Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              For every ₹500 interval screening booked and completed at your theatre, 80% (₹400.00)
              is credited to your cinema revenue balance. 20% (₹100.00) is deducted as platform super-admin commission.
            </p>

            {earnings.transactions?.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No revenue transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cinema-900/60 text-slate-400 uppercase tracking-wider border-b border-cinema-750">
                    <tr>
                      <th className="p-3">Tx ID</th>
                      <th className="p-3">Booking ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Theatre Share (80%)</th>
                      <th className="p-3">Admin Fee (20%)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-750/50">
                    {earnings.transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cinema-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">#{tx.id}</td>
                        <td className="p-3 font-semibold text-white">#{tx.booking_id}</td>
                        <td className="p-3 text-slate-300">{tx.customer_name || 'Customer'}</td>
                        <td className="p-3 font-mono text-slate-400">₹{Number(tx.total_amount).toFixed(2)}</td>
                        <td className="p-3 font-bold text-amber-400">
                          ₹{Number(tx.theatre_share).toFixed(2)}
                        </td>
                        <td className="p-3 text-slate-500">₹{Number(tx.admin_share).toFixed(2)}</td>
                        <td className="p-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[11px] font-bold">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(acceptingBooking)}
        title="Accept Interval Booking?"
        message={`Confirm acceptance of Request #${acceptingBooking?.id} for "${acceptingBooking?.movie_title}". This will atomically EXPIRE and refund any competing requests for this interval intermission.`}
        confirmText="Confirm & Accept Slot"
        type="warning"
        loading={actionLoading}
        onConfirm={handleConfirmAccept}
        onClose={() => setAcceptingBooking(null)}
      />

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-cinema-850 border border-cinema-700 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Request #{rejectingBooking.id}</h3>
            <p className="text-xs text-slate-400">
              Please specify the reason for rejection. The customer will receive this message and
              100% of their ₹500 fee will be refunded to their wallet.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Interval intermission already reserved for private theatre trailer."
              className="w-full p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 text-xs font-semibold hover:bg-cinema-750"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
              >
                {actionLoading ? 'Rejecting...' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {previewMedia && (
        <MediaViewerModal
          isOpen={Boolean(previewMedia)}
          mediaId={previewMedia.id}
          fileType={previewMedia.type}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {/* Chat Drawer */}
      <ChatDrawerModal
        isOpen={chatState.isOpen}
        onClose={() => setChatState((prev) => ({ ...prev, isOpen: false }))}
        theatreId={chatState.theatreId}
        userId={chatState.userId}
        customerName={chatState.customerName}
        bookingId={chatState.bookingId}
      />
    </div>
  );
};

export default StaffDashboardPage;
