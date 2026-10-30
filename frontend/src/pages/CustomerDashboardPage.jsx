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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#CBC3E3]">
        <div>
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
            DIRECTOR CONSOLE
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934] mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-[#5E435E] mt-1 font-medium">
            Track your auditorium interval reservations, digital ticket passes, and direct communication with projection booths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet card widget */}
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#CBC3E3] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#E6E6FA] text-[#9F2B68] flex items-center justify-center border border-[#CBC3E3]">
              <Wallet className="w-5 h-5 text-[#9F2B68]" />
            </div>
            <div>
              <span className="text-[10px] text-[#AA98A9] block font-mono font-bold uppercase tracking-wider">Escrow Balance</span>
              <span className="text-base font-mono font-black text-[#9F2B68]">
                ₹{Number(user?.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="ml-1 px-3 py-1.5 rounded-xl bg-[#9F2B68] hover:bg-[#BA3E7F] text-white text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
              title="Add Funds"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <Link
            to="/book"
            className="btn-cinema-shimmer inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-white" />
            Book Interval
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-[#E6E6FA] border border-[#9F2B68]/40 flex items-center justify-between text-[#9F2B68] text-sm animate-in fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#9F2B68] shrink-0" />
            <span>
              <strong>Success!</strong> Your interval booking request has been submitted and is
              pending theatre review. ₹500 has been debited from your wallet.
            </span>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-[#CBC3E3] text-[#9F2B68]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl cinema-card-ambient space-y-1">
          <span className="text-[11px] font-mono text-[#5E435E] uppercase tracking-wider font-bold">Total Bookings</span>
          <span className="block text-2xl sm:text-3xl font-black text-[#301934] font-mono">{stats.total}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFF0F7] border border-[#AA336A]/30 space-y-1 shadow-sm">
          <span className="text-[11px] font-mono text-[#9F2B68] uppercase tracking-wider flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-[#9F2B68]" /> Under Review
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#9F2B68] font-mono">
            {stats.pending}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8F5FF] border border-[#5D3FD3]/30 space-y-1 shadow-sm">
          <span className="text-[11px] font-mono text-[#5D3FD3] uppercase tracking-wider flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5D3FD3]" /> Confirmed
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#5D3FD3] font-mono">
            {stats.accepted}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFF0F4] border border-[#800020]/30 space-y-1 shadow-sm">
          <span className="text-[11px] font-mono text-[#800020] uppercase tracking-wider flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-[#800020]" /> Expired / Refunded
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#800020] font-mono">
            {stats.expired}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FDF5FF] border border-[#BF40BF]/30 space-y-1 col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-[11px] font-mono text-[#BF40BF] uppercase tracking-wider flex items-center gap-1 font-bold">
            <CheckCheck className="w-3.5 h-3.5 text-[#BF40BF]" /> Projected
          </span>
          <span className="block text-2xl sm:text-3xl font-black text-[#BF40BF] font-mono">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-[#CBC3E3] pb-2">
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'BOOKINGS'
              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20'
              : 'bg-white text-[#483248] hover:text-[#9F2B68] hover:bg-[#E6E6FA]/40 border border-[#CBC3E3]'
          }`}
        >
          <Film className="w-4 h-4" />
          My Interval Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20'
              : 'bg-white text-[#483248] hover:text-[#9F2B68] hover:bg-[#E6E6FA]/40 border border-[#CBC3E3]'
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
                <div key={i} className="h-28 rounded-2xl bg-white border border-[#CBC3E3] animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
              <Film className="w-12 h-12 text-[#AA98A9] mx-auto" />
              <h3 className="text-lg font-bold text-[#301934]">No interval bookings yet</h3>
              <p className="text-sm text-[#483248] max-w-sm mx-auto">
                You haven't requested any cinema intervals yet. Create your first unforgettable moment!
              </p>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white font-bold text-sm shadow-md"
              >
                Book an Interval Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-3xl bg-white border border-[#CBC3E3] hover:border-[#9F2B68]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  {/* Left: Movie & Status */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        booking.movie_poster ||
                        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'
                      }
                      alt={booking.movie_title}
                      className="w-16 h-24 object-cover rounded-2xl shrink-0 shadow-md border border-[#CBC3E3]"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#9F2B68] bg-[#E6E6FA] px-2 py-0.5 rounded-md border border-[#CBC3E3]">
                          PASS #{booking.id.toString().padStart(4, '0')}
                        </span>
                        <StatusBadge status={booking.status} size="sm" />
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FDF5FF] text-[#702963] border border-[#CBC3E3] uppercase">
                          {booking.booking_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#301934] font-cinema">{booking.movie_title}</h3>

                      <p className="text-xs text-[#483248] flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#9F2B68]" />
                        {booking.theatre_name} • {booking.screen_name}
                      </p>

                      <p className="text-xs text-[#702963] italic line-clamp-1 max-w-md font-serif bg-[#FDF5FF] px-2.5 py-1 rounded-lg border border-[#CBC3E3]/40">
                        "{booking.message}"
                      </p>

                      {(booking.rejection_reason || booking.status === 'EXPIRED') && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#FFF0F4] border border-[#800020]/25 text-[#800020] text-xs space-y-1 shadow-xs">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[11px] text-[#800020]">
                            <Ban className="w-3.5 h-3.5 text-[#800020]" />
                            <span>Slot Occupied for this Theatre</span>
                          </div>
                          <p className="text-xs text-[#483248] leading-relaxed">
                            {booking.rejection_reason || `This interval slot for ${booking.theatre_name} has already been occupied.`}
                          </p>
                          <p className="text-[11px] text-[#5D3FD3] font-semibold pt-0.5">
                            ✓ 100% refund has been credited to your wallet balance.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center: Timing Details */}
                  <div className="text-xs text-[#301934] space-y-1.5 bg-[#F8F6FC] p-3.5 rounded-2xl border border-[#CBC3E3] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#9F2B68]" />
                      <span>
                        Show: {booking.show_date} • {booking.start_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#9F2B68] font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#9F2B68]" />
                      <span>
                        Interval: {booking.interval_start} - {booking.interval_end}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#AA98A9] pt-0.5">
                      Directed: {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#CBC3E3] flex-wrap">
                    {/* Live Chat with Theatre Button */}
                    <button
                      onClick={() => openChat(booking.theatre_id, booking.theatre_name, booking.id)}
                      className="px-3 py-2 rounded-xl bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="p-2 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#5D3FD3] border border-[#CBC3E3] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Preview Media"
                      >
                        <Eye className="w-4 h-4" />
                        Media
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#301934] border border-[#CBC3E3] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => openReceiptForBooking(booking)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="View Digital Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#9F2B68]" />
                      Receipt
                    </button>

                    {(booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => setCancellingBookingId(booking.id)}
                        className="px-3 py-2 rounded-xl bg-[#FFF0F4] hover:bg-[#FFE0E9] text-[#800020] border border-[#800020]/30 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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
          <div className="p-6 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
            <h3 className="font-cinema text-lg font-bold text-[#301934] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#9F2B68]" />
              Wallet & Escrow Activity
            </h3>
            <p className="text-xs text-[#483248]">
              When you submit a booking, ₹500 is debited into theatre escrow. If cancelled,
              rejected, or expired, 100% of the funds are immediately refunded to your wallet.
            </p>

            {transactions.length === 0 ? (
              <div className="py-12 text-center text-[#AA98A9] text-sm">
                No wallet transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6FC] text-[#483248] uppercase tracking-wider border-b border-[#CBC3E3]">
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
                  <tbody className="divide-y divide-[#CBC3E3]/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FDF5FF] transition-colors">
                        <td className="p-3 font-mono text-[#5D3FD3]">#{tx.id}</td>
                        <td className="p-3 font-semibold text-[#301934]">Booking #{tx.booking_id}</td>
                        <td className="p-3 text-[#483248]">{tx.theatre_name || 'Cinema'}</td>
                        <td className="p-3 text-[#483248]">
                          {tx.movie_title} {tx.show_date ? `(${tx.show_date})` : ''}
                        </td>
                        <td className="p-3 font-bold font-mono text-[#9F2B68]">
                          ₹{Number(tx.total_amount).toFixed(2)}
                        </td>
                        <td className="p-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF0F7] text-[#9F2B68] border border-[#9F2B68]/30 text-[11px] font-semibold">
                              <ArrowUpRight className="w-3 h-3" /> Debited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F8F5FF] text-[#5D3FD3] border border-[#5D3FD3]/30 text-[11px] font-semibold">
                              <ArrowDownLeft className="w-3 h-3" /> 100% Refunded
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[#AA98A9]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-[#CBC3E3]">
              <div>
                <span className="text-xs text-[#9F2B68] font-bold uppercase font-mono">
                  Booking Reference #{selectedBooking.id.toString().padStart(4, '0')}
                </span>
                <h2 className="text-2xl font-bold text-[#301934] font-cinema mt-1">
                  {selectedBooking.movie_title}
                </h2>
                <div className="mt-2">
                  <StatusBadge status={selectedBooking.status} size="md" />
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-[#483248] hover:text-[#9F2B68] bg-[#E6E6FA] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3]">
                <span className="text-[#AA98A9] block font-mono">Theatre & Screen</span>
                <span className="font-bold text-[#301934] mt-1 block">
                  {selectedBooking.theatre_name} • {selectedBooking.screen_name}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3]">
                <span className="text-[#AA98A9] block font-mono">Interval Intermission</span>
                <span className="font-bold text-[#9F2B68] mt-1 block font-mono">
                  {selectedBooking.interval_start} – {selectedBooking.interval_end}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF0F7] border border-[#AA336A]/20 space-y-2">
              <span className="text-xs text-[#AA336A] block font-semibold">Your Screen Message:</span>
              <p className="text-sm text-[#702963] italic font-serif">"{selectedBooking.message}"</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#CBC3E3]">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  openChat(
                    selectedBooking.theatre_id,
                    selectedBooking.theatre_name,
                    selectedBooking.id
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Message Cinema Staff
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-[#301934] text-white text-xs font-semibold hover:bg-[#483248] cursor-pointer"
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
