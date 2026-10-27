import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { MediaViewerModal } from '../components/MediaViewerModal.jsx';
import { ConfirmationModal } from '../components/ConfirmationModal.jsx';
import { ChatDrawerModal } from '../components/ChatDrawerModal.jsx';
import { ReceiptModal } from '../components/ReceiptModal.jsx';
import { WalletTopupModal } from '../components/WalletTopupModal.jsx';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Film,
  Building2,
  Calendar,
  Eye,
  Ban,
  Sparkles,
  CheckCheck,
  MessageSquare,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Plus,
} from 'lucide-react';

export const CustomerDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BOOKINGS'); // 'BOOKINGS' | 'TRANSACTIONS'

  // Modals & Chat
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [chatState, setChatState] = useState({
    isOpen: false,
    theatreId: null,
    theatreName: '',
    bookingId: null,
  });

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const openReceiptForBooking = (b) => {
    setActiveReceipt({
      receiptNumber: `REC-${new Date(b.created_at || Date.now()).getFullYear()}-${b.id.slice(-6).toUpperCase()}`,
      date: b.created_at,
      customer: {
        name: user?.name || 'Customer',
        email: user?.email,
        phone: b.contact_phone || user?.phone,
      },
      theatre: {
        name: b.theatre_name || 'Grand Palace Cinema',
        city: b.city || 'Auditorium Complex',
      },
      booking: {
        id: b.id,
        type: b.booking_type,
        status: b.status,
        message: b.message,
        movieTitle: b.movie_title || 'Feature Presentation',
        showDate: b.show_date,
        intervalSlot: `${b.interval_start} - ${b.interval_end}`,
      },
      payment: {
        totalAmount: 500,
        paymentMethod: 'WALLET / ESCROW',
        paymentId: `TXN-${b.id}`,
        status: b.status === 'REJECTED' || b.status === 'EXPIRED' || b.status === 'CANCELLED' ? 'REFUNDED' : 'COMPLETED',
      },
    });
  };

  // Success notice
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, txRes] = await Promise.all([
        api.bookings.getMyBookings(),
        api.transactions.getMy().catch(() => ({ transactions: [] })),
      ]);
      setBookings(bookingsRes.bookings || []);
      setStats(bookingsRes.stats || {});
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (searchParams.get('success') === '1') {
      setShowSuccessBanner(true);
    }
  }, [searchParams]);

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    try {
      setActionLoading(true);
      await api.bookings.cancel(cancellingBookingId);
      setCancellingBookingId(null);
      await refreshUser?.();
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const openChat = (theatreId, theatreName, bookingId) => {
    setChatState({
      isOpen: true,
      theatreId,
      theatreName,
      bookingId,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cinema-700/60">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Customer Dashboard
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-bold text-white mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your interval submissions, wallet balance, and communicate directly with cinemas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet card widget */}
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cinema-850 to-cinema-800 border border-amber-500/30 flex items-center gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Wallet Balance</span>
              <span className="text-base font-black text-white">
                ₹{Number(user?.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="ml-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Add Funds"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 text-cinema-950 font-bold text-sm shadow-md shadow-cinema-gold/20 hover:from-amber-400 hover:to-cinema-gold transition-all"
          >
            <Sparkles className="w-4 h-4 text-black" />
            Book an Interval
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Success!</strong> Your interval booking request has been submitted and is
              pending theatre review. ₹500 has been debited from your wallet.
            </span>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Requests</span>
          <span className="block text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-amber-300">
            {stats.pending}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-emerald-300">
            {stats.accepted}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500/60" /> Expired / Refunded
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-slate-300">
            {stats.expired}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" /> Completed
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-blue-300">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-cinema-700/80 pb-2">
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'BOOKINGS'
              ? 'bg-cinema-800 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          My Interval Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-cinema-800 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Wallet Transactions ({transactions.length})
        </button>
      </div>

      {/* TAB 1: Bookings List */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-cinema-850 animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
              <Film className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">No interval bookings yet</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                You haven't requested any cinema intervals yet. Create your first unforgettable moment!
              </p>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cinema-gold text-cinema-950 font-bold text-sm shadow-md"
              >
                Book an Interval Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left: Movie & Status */}
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
                        <span className="text-xs font-semibold text-slate-400">
                          #{booking.id.toString().padStart(4, '0')}
                        </span>
                        <StatusBadge status={booking.status} size="sm" />
                        <span className="text-[11px] px-2 py-0.5 rounded bg-cinema-800 text-amber-300 font-semibold uppercase">
                          {booking.booking_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{booking.movie_title}</h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        {booking.theatre_name} • {booking.screen_name}
                      </p>

                      <p className="text-xs text-amber-200 italic line-clamp-1 max-w-md">
                        "{booking.message}"
                      </p>
                    </div>
                  </div>

                  {/* Center: Timing Details */}
                  <div className="text-xs text-slate-300 space-y-1 bg-cinema-900/60 p-3 rounded-xl border border-cinema-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Show: {booking.show_date} • {booking.start_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Interval: {booking.interval_start} - {booking.interval_end}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Submitted: {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-cinema-800 flex-wrap">
                    {/* Live Chat with Theatre Button */}
                    <button
                      onClick={() => openChat(booking.theatre_id, booking.theatre_name, booking.id)}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Chat with Theatre"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message Theatre
                    </button>

                    {booking.has_media && booking.media_id && (
                      <button
                        onClick={() =>
                          setPreviewMedia({
                            id: booking.media_id,
                            type: booking.media_type || 'IMAGE',
                          })
                        }
                        className="p-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Preview Media"
                      >
                        <Eye className="w-4 h-4" />
                        Media
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3.5 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => openReceiptForBooking(booking)}
                      className="px-3 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-cinema-750"
                      title="View Digital Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      Receipt
                    </button>

                    {(booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => setCancellingBookingId(booking.id)}
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel (Refund)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Wallet Transactions List */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
            <h3 className="font-cinema text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              Wallet & Escrow Activity
            </h3>
            <p className="text-xs text-slate-400">
              When you submit a booking, ₹500 is debited into theatre escrow. If cancelled,
              rejected, or expired, 100% of the funds are immediately refunded to your wallet.
            </p>

            {transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No wallet transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cinema-900/60 text-slate-400 uppercase tracking-wider border-b border-cinema-750">
                    <tr>
                      <th className="p-3">Tx ID</th>
                      <th className="p-3">Booking</th>
                      <th className="p-3">Theatre</th>
                      <th className="p-3">Movie & Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-750/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cinema-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">#{tx.id}</td>
                        <td className="p-3 font-semibold text-white">Booking #{tx.booking_id}</td>
                        <td className="p-3 text-slate-300">{tx.theatre_name || 'Cinema'}</td>
                        <td className="p-3 text-slate-300">
                          {tx.movie_title} {tx.show_date ? `(${tx.show_date})` : ''}
                        </td>
                        <td className="p-3 font-bold text-amber-300">
                          ₹{Number(tx.total_amount).toFixed(2)}
                        </td>
                        <td className="p-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                              <ArrowUpRight className="w-3 h-3" /> Debited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                              <ArrowDownLeft className="w-3 h-3" /> 100% Refunded
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-cinema-850 border border-cinema-700 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-cinema-700">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase">
                  Booking Reference #{selectedBooking.id.toString().padStart(4, '0')}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedBooking.movie_title}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={selectedBooking.status} size="md" />
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-cinema-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-800">
                <span className="text-slate-400 block">Theatre & Screen</span>
                <span className="font-bold text-white mt-1 block">
                  {selectedBooking.theatre_name} • {selectedBooking.screen_name}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-800">
                <span className="text-slate-400 block">Interval Intermission</span>
                <span className="font-bold text-amber-400 mt-1 block">
                  {selectedBooking.interval_start} – {selectedBooking.interval_end}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800 space-y-2">
              <span className="text-xs text-slate-400 block font-semibold">Your Screen Message:</span>
              <p className="text-sm text-amber-200 italic font-medium">"{selectedBooking.message}"</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-cinema-700">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  openChat(
                    selectedBooking.theatre_id,
                    selectedBooking.theatre_name,
                    selectedBooking.id
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Message Cinema Staff
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-cinema-800 text-white text-xs font-semibold hover:bg-cinema-750"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Booking Cancellation */}
      <ConfirmationModal
        isOpen={Boolean(cancellingBookingId)}
        title="Cancel Interval Booking?"
        message="Are you sure you want to cancel this booking request? Since the request has not yet been accepted, ₹500 will be instantly refunded to your wallet."
        confirmText="Confirm Cancellation"
        type="danger"
        loading={actionLoading}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancellingBookingId(null)}
      />

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
        theatreName={chatState.theatreName}
        bookingId={chatState.bookingId}
      />

      {/* Digital Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Wallet Top-up Modal */}
      <WalletTopupModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};

export default CustomerDashboardPage;
