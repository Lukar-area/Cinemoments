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
      <div className="pb-6 border-b border-[#CBC3E3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
            PROJECTION BOOTH OPERATIONS
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934] mt-1">
            Auditorium Playout & Intermission Dispatch
          </h1>
          <p className="text-sm text-[#483248] mt-1 font-medium">
            Review interval submissions, chat with patrons, and verify 4K cinema projection playouts.
          </p>
        </div>

        {/* 80% Earnings Header Card */}
        <div className="px-5 py-3 rounded-2xl bg-white border border-[#CBC3E3] flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#E6E6FA] text-[#9F2B68] flex items-center justify-center font-bold border border-[#CBC3E3]">
            <TrendingUp className="w-5 h-5 text-[#9F2B68]" />
          </div>
          <div>
            <span className="text-[10px] text-[#AA98A9] font-mono uppercase font-bold tracking-wider block">
              80% Theatre Revenue Share
            </span>
            <span className="text-xl font-black text-[#9F2B68] font-mono">
              ₹{Number(earnings.summary?.total_earnings || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessNotice && (
        <div className="p-4 rounded-2xl bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] text-sm flex items-center justify-between animate-in fade-in shadow-sm font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#9F2B68] shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-[#CBC3E3] text-[#9F2B68] cursor-pointer"
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
              ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
              : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
          }`}
        >
          <span className="text-xs text-[#9F2B68] font-semibold flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5" /> Pending Requests
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#9F2B68] mt-1 font-mono">
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
              ? 'bg-[#F8F5FF] border-2 border-[#5D3FD3] shadow-md shadow-[#5D3FD3]/10'
              : 'bg-white border-[#CBC3E3] hover:border-[#5D3FD3]/50 shadow-sm'
          }`}
        >
          <span className="text-xs text-[#5D3FD3] font-semibold flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted Bookings
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#5D3FD3] mt-1 font-mono">
            {cards.todayAcceptedBookings + cards.upcomingIntervalBookings}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('CHATS')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'CHATS'
              ? 'bg-[#FDF5FF] border-2 border-[#BF40BF] shadow-md shadow-[#BF40BF]/10'
              : 'bg-white border-[#CBC3E3] hover:border-[#BF40BF]/50 shadow-sm'
          }`}
        >
          <span className="text-xs text-[#BF40BF] font-semibold flex items-center gap-1 font-mono">
            <MessageSquare className="w-3.5 h-3.5" /> Customer Inquiries
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#BF40BF] mt-1 font-mono">
            {conversations.length}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('EARNINGS')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            activeTab === 'EARNINGS'
              ? 'bg-[#FFF0F4] border-2 border-[#800020] shadow-md shadow-[#800020]/10'
              : 'bg-white border-[#CBC3E3] hover:border-[#800020]/50 shadow-sm'
          }`}
        >
          <span className="text-xs text-[#800020] font-semibold flex items-center gap-1 font-mono">
            <DollarSign className="w-3.5 h-3.5" /> Paid Interval Slots
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#800020] mt-1 font-mono">
            {earnings.summary?.completed_count || 0}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#CBC3E3] pb-2">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'QUEUE'
              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20'
              : 'bg-white text-[#483248] border border-[#CBC3E3] hover:text-[#9F2B68]'
          }`}
        >
          Review Queue ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('CHATS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'CHATS'
              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20'
              : 'bg-white text-[#483248] border border-[#CBC3E3] hover:text-[#9F2B68]'
          }`}
        >
          Customer Chats ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab('EARNINGS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'EARNINGS'
              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20'
              : 'bg-white text-[#483248] border border-[#CBC3E3] hover:text-[#9F2B68]'
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
              <Search className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, movie, or message..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'ALL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[#9F2B68] text-white font-bold'
                      : 'bg-white text-[#483248] hover:text-[#9F2B68] border border-[#CBC3E3]'
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
                <div key={i} className="h-32 rounded-2xl bg-white border border-[#CBC3E3] animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-3">
              <Film className="w-12 h-12 text-[#AA98A9] mx-auto" />
              <h3 className="text-base font-bold text-[#301934]">No requests in this category</h3>
              <p className="text-xs text-[#483248] max-w-sm mx-auto">
                No interval requests match the selected filter. Try selecting "ALL" or check back
                when customers submit proposals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-2xl bg-white border border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Proposal Content */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        booking.movie_poster ||
                        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'
                      }
                      alt={booking.movie_title}
                      className="w-16 h-24 object-cover rounded-xl shrink-0 shadow-md border border-[#CBC3E3]"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#9F2B68] bg-[#E6E6FA] px-2 py-0.5 rounded border border-[#CBC3E3]">
                          #{booking.id.toString().padStart(4, '0')}
                        </span>
                        <StatusBadge status={booking.status} size="sm" />
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#FDF5FF] text-[#702963] font-semibold uppercase border border-[#CBC3E3]">
                          {booking.booking_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#301934] font-cinema">{booking.movie_title}</h3>

                      <p className="text-xs text-[#483248]">
                        Requested by:{' '}
                        <strong className="text-[#301934]">{booking.customer_name}</strong> (
                        {booking.customer_email}
                        {booking.contact_phone ? ` • ${booking.contact_phone}` : ''})
                      </p>

                      <p className="text-xs text-[#702963] italic line-clamp-2 max-w-xl font-serif bg-[#FDF5FF] p-2 rounded-lg border border-[#CBC3E3]/40">
                        "{booking.message}"
                      </p>
                    </div>
                  </div>

                  {/* Center: Timing Details */}
                  <div className="p-3.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934] space-y-1 min-w-[200px] font-mono">
                    <div>
                      Screen: <strong className="text-[#301934]">{booking.screen_name}</strong>
                    </div>
                    <div>
                      Show Date: <strong className="text-[#301934]">{booking.show_date}</strong> •{' '}
                      {booking.start_time}
                    </div>
                    <div className="text-[#9F2B68] font-bold">
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
                      className="px-3 py-2 rounded-xl bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                        className="p-2 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#5D3FD3] border border-[#CBC3E3] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white text-xs font-bold shadow-md shadow-[#9F2B68]/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => setRejectingBooking(booking)}
                          className="px-3.5 py-2 rounded-xl bg-[#FFF0F4] hover:bg-[#FFE0E9] text-[#800020] border border-[#800020]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
          <div className="p-6 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
            <h3 className="font-cinema text-lg font-bold text-[#301934] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#9F2B68]" />
              Direct Customer Conversations
            </h3>
            <p className="text-xs text-[#483248]">
              Patrons submitting interval bookings or inquiring about projection requirements.
            </p>

            {conversations.length === 0 ? (
              <div className="py-16 text-center text-[#AA98A9] text-sm">
                No active conversations yet.
              </div>
            ) : (
              <div className="divide-y divide-[#CBC3E3]/50">
                {conversations.map((conv) => (
                  <div
                    key={conv.user_id}
                    onClick={() =>
                      openCustomerChat(conv.theatre_id, conv.user_id, conv.user_name)
                    }
                    className="p-4 hover:bg-[#FDF5FF] transition-colors cursor-pointer flex items-center justify-between rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E6E6FA] text-[#9F2B68] flex items-center justify-center font-bold border border-[#CBC3E3]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#301934]">{conv.user_name}</h4>
                        <p className="text-xs text-[#483248] line-clamp-1">
                          {conv.last_message || 'Start chatting with this patron...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#9F2B68] text-white font-bold text-[10px]">
                          {conv.unread_count} new
                        </span>
                      )}
                      <button className="px-3.5 py-1.5 rounded-lg bg-white border border-[#CBC3E3] text-[#301934] font-semibold text-xs hover:bg-[#E6E6FA]">
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
          <div className="p-6 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
            <h3 className="font-cinema text-lg font-bold text-[#301934] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#9F2B68]" />
              80% Theatre Revenue Breakdown
            </h3>
            <p className="text-xs text-[#483248]">
              For every ₹500 interval screening booked and completed at your theatre, 80% (₹400.00)
              is credited to your cinema revenue balance. 20% (₹100.00) is deducted as platform super-admin commission.
            </p>

            {earnings.transactions?.length === 0 ? (
              <div className="py-16 text-center text-[#AA98A9] text-sm">
                No revenue transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6FC] text-[#483248] uppercase tracking-wider border-b border-[#CBC3E3]">
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
                  <tbody className="divide-y divide-[#CBC3E3]/50">
                    {earnings.transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FDF5FF] transition-colors">
                        <td className="p-3 font-mono text-[#5D3FD3]">#{tx.id}</td>
                        <td className="p-3 font-semibold text-[#301934]">#{tx.booking_id}</td>
                        <td className="p-3 text-[#483248]">{tx.customer_name || 'Customer'}</td>
                        <td className="p-3 font-mono text-[#483248]">₹{Number(tx.total_amount).toFixed(2)}</td>
                        <td className="p-3 font-bold font-mono text-[#9F2B68]">
                          ₹{Number(tx.theatre_share).toFixed(2)}
                        </td>
                        <td className="p-3 text-[#AA98A9]">₹{Number(tx.admin_share).toFixed(2)}</td>
                        <td className="p-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded bg-[#FFF0F7] text-[#9F2B68] border border-[#9F2B68]/30 text-[11px] font-bold">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#FFF0F4] text-[#800020] border border-[#800020]/30 text-[11px] font-bold">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[#AA98A9]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border-2 border-[#CBC3E3] shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#301934] font-cinema">Reject Request #{rejectingBooking.id}</h3>
            <p className="text-xs text-[#483248]">
              Please specify the reason for rejection. The customer will receive this message and
              100% of their ₹500 fee will be refunded to their wallet.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Interval intermission already reserved for private theatre trailer."
              className="w-full p-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68]"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl bg-[#F8F6FC] text-[#483248] text-xs font-semibold hover:bg-[#E6E6FA] border border-[#CBC3E3] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-[#800020] hover:bg-[#990026] text-white text-xs font-bold cursor-pointer"
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
