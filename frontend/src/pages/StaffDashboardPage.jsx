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
  Building2,
  MapPin,
  Compass,
  PhoneCall,
  Mail,
  RefreshCw,
  PlusCircle,
  Zap,
  Sparkles,
  Ban,
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'CHATS' | 'EARNINGS'
  const [theatre, setTheatre] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState(user?.assignedTheatreId || null);
  const [noTheatreAssigned, setNoTheatreAssigned] = useState(false);

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
  const [theatreLoading, setTheatreLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Associate Theatre Modal State (for staff with no theatre)
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [assocForm, setAssocForm] = useState({
    theatreName: '',
    theatreLocation: '',
    theatreAddress: '',
    city: '',
    theatrePhone: '',
    theatreEmail: '',
  });
  const [assocLoading, setAssocLoading] = useState(false);
  const [assocError, setAssocError] = useState(null);

  // Chat State
  const [chatState, setChatState] = useState({
    isOpen: false,
    theatreId: null,
    userId: null,
    customerName: '',
    bookingId: null,
  });

  // Fetch authorized theatre details
  const fetchTheatreInfo = async () => {
    try {
      setTheatreLoading(true);
      setError(null);

      const res = await api.theatres.getStaffCurrent(selectedTheatreId || undefined);

      if (res.success && res.theatre) {
        setTheatre(res.theatre);
        setTheatres(res.theatres || [res.theatre]);
        setSelectedTheatreId(res.theatre.id);
        setNoTheatreAssigned(false);
        return res.theatre.id;
      } else {
        setTheatre(null);
        setTheatres([]);
        setNoTheatreAssigned(true);
        return null;
      }
    } catch (err) {
      console.error('Failed to load theatre info:', err);
      setError(err.message || 'Unable to load theatre details. Please refresh or verify permissions.');
      setTheatre(null);
      setNoTheatreAssigned(true);
      return null;
    } finally {
      setTheatreLoading(false);
    }
  };

  // Fetch queue, earnings, and chat data for active theatre
  const fetchStaffData = async (activeTId) => {
    const tId = activeTId || selectedTheatreId || theatre?.id;
    if (!tId) {
      setBookings([]);
      setCards({
        pendingRequests: 0,
        todayAcceptedBookings: 0,
        upcomingIntervalBookings: 0,
        completedBookings: 0,
        totalRequests: 0,
      });
      setEarnings({ summary: { total_earnings: 0, completed_count: 0, refunded_count: 0 }, transactions: [] });
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [queueRes, earnRes, convRes] = await Promise.all([
        api.bookings.getStaffBookings(tId, statusFilter === 'ALL' ? undefined : statusFilter),
        api.transactions.getTheatreEarnings(tId).catch(() => ({
          summary: { total_earnings: 0, completed_count: 0, refunded_count: 0 },
          transactions: [],
        })),
        api.chat.getConversations(tId).catch(() => ({ conversations: [] })),
      ]);

      setBookings(queueRes.bookings || []);
      setCards(queueRes.cards || {});
      setEarnings(earnRes);
      setConversations(convRes.conversations || []);
    } catch (err) {
      console.error('Failed to load staff portal data:', err);
      setError(err.message || 'Failed to fetch operational data for this theatre.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    (async () => {
      const activeTId = await fetchTheatreInfo();
      if (activeTId) {
        await fetchStaffData(activeTId);
      } else {
        setLoading(false);
      }
    })();
  }, [selectedTheatreId]);

  // When status filter changes
  useEffect(() => {
    if (theatre?.id) {
      fetchStaffData(theatre.id);
    }
  }, [statusFilter]);

  const handleSwitchTheatre = (newId) => {
    setSelectedTheatreId(newId);
  };

  const handleConfirmAccept = async () => {
    if (!acceptingBooking) return;
    try {
      setActionLoading(true);
      const res = await api.bookings.accept(acceptingBooking.id);
      setAcceptingBooking(null);
      setActionSuccessNotice(
        `Request #${res.result.bookingId} ACCEPTED! ${res.result.expiredCount} competing request(s) were atomically EXPIRED and refunded.`
      );
      await fetchStaffData(theatre?.id);
    } catch (err) {
      alert(err.message || 'Failed to accept booking.');
    } finally {
      setActionLoading(false);
    }
  };


  const handleAutoAllotFirstPerson = async () => {
    try {
      setActionLoading(true);
      const res = await api.bookings.allotFirst({ theatreId: theatre?.id });
      setActionSuccessNotice(
        res.message || `Successfully allotted to first applicant! Competing requests marked as Occupied with full refunds.`
      );
      await fetchStaffData(theatre?.id);
    } catch (err) {
      alert(err.message || 'Failed to auto-allot first applicant.');
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
      await fetchStaffData(theatre?.id);
    } catch (err) {
      alert(err.message || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssociateSubmit = async (e) => {
    e.preventDefault();
    if (!assocForm.theatreName.trim() || !assocForm.theatreAddress.trim() || !assocForm.city.trim()) {
      setAssocError('Theatre Name, Address, and City are required.');
      return;
    }
    try {
      setAssocLoading(true);
      setAssocError(null);
      await api.theatres.associateStaffTheatre(assocForm);
      await refreshUser?.();
      setShowAssociateModal(false);
      const newTId = await fetchTheatreInfo();
      if (newTId) await fetchStaffData(newTId);
    } catch (err) {
      setAssocError(err.message || 'Failed to link theatre.');
    } finally {
      setAssocLoading(false);
    }
  };

  const openCustomerChat = (theatreId, userId, customerName, bookingId) => {
    setChatState({
      isOpen: true,
      theatreId: theatreId || theatre?.id || null,
      userId,
      customerName,
      bookingId,
    });
  };

  // Helper to identify the earliest (first) applicant among pending requests for each show
  const earliestPendingShowMap = {};
  for (const b of bookings) {
    if (b.status === 'PENDING' || b.status === 'UNDER_REVIEW') {
      const sid = b.show_id;
      if (!earliestPendingShowMap[sid]) {
        earliestPendingShowMap[sid] = b;
      } else {
        const curTime = new Date(earliestPendingShowMap[sid].created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        if (bTime < curTime) {
          earliestPendingShowMap[sid] = b;
        }
      }
    }
  }

  const pendingCount = bookings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length;

  const filteredBookings = bookings.filter(
    (b) =>
      b.movie_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-[#CBC3E3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
            PROJECTION BOOTH OPERATIONS
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934] mt-1">
            Theatre Staff Dashboard
          </h1>
          <p className="text-sm text-[#483248] mt-1 font-medium">
            Review interval submissions, chat with patrons, and verify 4K cinema projection playouts.
          </p>
        </div>

        {theatre && (
          <div className="px-5 py-3 rounded-2xl bg-white border border-[#CBC3E3] flex items-center gap-4 shadow-sm shrink-0">
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
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFF0F4] border border-[#800020]/30 text-[#800020] text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchTheatreInfo()}
            className="px-3 py-1 bg-white border border-[#800020]/30 rounded-xl text-xs font-bold hover:bg-[#FFF0F4] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Indicator for Theatre Info */}
      {theatreLoading ? (
        <div className="p-8 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-[#E6E6FA] rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="h-16 bg-[#F8F6FC] rounded-2xl" />
            <div className="h-16 bg-[#F8F6FC] rounded-2xl" />
            <div className="h-16 bg-[#F8F6FC] rounded-2xl" />
            <div className="h-16 bg-[#F8F6FC] rounded-2xl" />
          </div>
        </div>
      ) : noTheatreAssigned ? (
        /* Empty State: No Theatre Associated With Staff Account */
        <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-8 h-8 text-[#9F2B68]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-cinema text-2xl font-bold text-[#301934]">
              No Theatre Associated With Your Staff Account
            </h3>
            <p className="text-xs text-[#483248] leading-relaxed">
              Your account is registered as <strong>Theatre Staff</strong>, but has not yet been linked to a specific cinema facility. To begin managing interval intermission playouts, please connect or register your theatre details below.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowAssociateModal(true)}
              className="btn-cinema-shimmer px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Connect / Register Theatre Facility
            </button>
          </div>
        </div>
      ) : (
        /* SECTION 4: Prominent Theatre Information Section */
        <div className="p-6 rounded-3xl bg-gradient-to-r from-white via-[#FAF8FF] to-white border-2 border-[#CBC3E3] shadow-lg shadow-[#9F2B68]/5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E6FA]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] flex items-center justify-center text-[#9F2B68] shadow-sm shrink-0">
                <Building2 className="w-6 h-6 text-[#9F2B68]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#9F2B68] uppercase bg-[#FFF0F7] px-2 py-0.5 rounded-md border border-[#9F2B68]/20">
                    Active Managed Cinema
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#5D3FD3] bg-[#F8F5FF] px-2 py-0.5 rounded-md border border-[#5D3FD3]/20">
                    {theatre.status || 'ACTIVE'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#301934] font-cinema mt-0.5">
                  {theatre.name}
                </h2>
              </div>
            </div>

            {/* Multi-theatre selector if user manages multiple theatres */}
            {theatres.length > 1 && (
              <div className="flex items-center gap-2 bg-[#F8F6FC] px-3.5 py-2 rounded-2xl border border-[#CBC3E3]">
                <label className="text-xs font-mono font-bold text-[#483248] whitespace-nowrap">
                  Switch Theatre:
                </label>
                <select
                  value={theatre.id}
                  onChange={(e) => handleSwitchTheatre(e.target.value)}
                  className="bg-white border border-[#CBC3E3] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#301934] focus:outline-none focus:border-[#9F2B68] cursor-pointer"
                >
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Theatre Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]/70 space-y-1">
              <div className="flex items-center gap-1.5 text-[#AA98A9] font-mono font-bold uppercase text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-[#9F2B68]" /> Location / Area
              </div>
              <p className="font-bold text-[#301934] text-sm truncate">{theatre.location || '—'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]/70 space-y-1">
              <div className="flex items-center gap-1.5 text-[#AA98A9] font-mono font-bold uppercase text-[10px]">
                <Compass className="w-3.5 h-3.5 text-[#5D3FD3]" /> City & Address
              </div>
              <p className="font-bold text-[#301934] text-sm truncate" title={theatre.address}>
                {theatre.city} — {theatre.address}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]/70 space-y-1">
              <div className="flex items-center gap-1.5 text-[#AA98A9] font-mono font-bold uppercase text-[10px]">
                <PhoneCall className="w-3.5 h-3.5 text-[#9F2B68]" /> Theatre Contact Phone
              </div>
              <p className="font-bold text-[#301934] font-mono text-sm truncate">
                {theatre.contact_phone || theatre.phone || 'Not configured'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]/70 space-y-1">
              <div className="flex items-center gap-1.5 text-[#AA98A9] font-mono font-bold uppercase text-[10px]">
                <Mail className="w-3.5 h-3.5 text-[#5D3FD3]" /> Official Theatre Email
              </div>
              <p className="font-bold text-[#301934] text-sm truncate" title={theatre.contact_email || theatre.email}>
                {theatre.contact_email || theatre.email || 'Not configured'}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Only show operational tabs & cards when theatre is active */}
      {theatre && (
        <>
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
              {/* Default First Person Allotment Banner */}
              {pendingCount > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF0F7] via-[#F8F5FF] to-[#FFF0F4] border-2 border-[#9F2B68]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9F2B68] to-[#BF40BF] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#301934] font-cinema flex items-center gap-2">
                        Default Selection: Allot to First Person
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#9F2B68] text-white font-bold">
                          {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''}
                        </span>
                      </h4>
                      <p className="text-xs text-[#5E435E] mt-0.5">
                        Select defaultly the earliest applicant for each interval and allot the "Slot Occupied" message with 100% refund to all competing applicants for <strong>{theatre.name}</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAllotFirstPerson}
                    disabled={actionLoading}
                    className="btn-cinema-shimmer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#9F2B68]/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50 shrink-0 transition-all active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{actionLoading ? 'Allotting...' : 'Allot First Person (Default)'}</span>
                  </button>
                </div>
              )}
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
                    No interval requests match the selected filter for <strong>{theatre.name}</strong>. Try selecting "ALL" or check back when patrons submit intermissions.
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
                            {earliestPendingShowMap[booking.show_id]?.id === booking.id ? (
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs animate-in zoom-in-95">
                                ⭐ 1st Applicant (Default Selection)
                              </span>
                            ) : (booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW') && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFF0F4] text-[#800020] border border-[#800020]/20 flex items-center gap-1">
                                ⚠️ Competing Request
                              </span>
                            )}
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

                          {(booking.rejection_reason || booking.status === 'EXPIRED') && (
                            <div className="p-2.5 rounded-xl bg-[#FFF0F4] border border-[#800020]/20 text-[#800020] text-xs font-mono space-y-0.5">
                              <span className="font-bold block text-[10px] uppercase">Allotted Status Notice:</span>
                              <p className="text-xs text-[#483248]">
                                {booking.rejection_reason || `Slot Occupied: This interval slot for ${theatre.name} has already been occupied.`}
                              </p>
                              <span className="text-[10px] text-[#5D3FD3] font-semibold block">
                                100% refund processed to customer wallet.
                              </span>
                            </div>
                          )}
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
                              className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                                earliestPendingShowMap[booking.show_id]?.id === booking.id
                                  ? 'bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] shadow-[#9F2B68]/30 font-black'
                                  : 'bg-gradient-to-r from-[#483248] to-[#301934] shadow-black/20'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {earliestPendingShowMap[booking.show_id]?.id === booking.id
                                  ? 'Allot (1st Person)'
                                  : 'Allot This Request'}
                              </span>
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
                  Direct Customer Conversations — {theatre.name}
                </h3>
                <p className="text-xs text-[#483248]">
                  Patrons submitting interval bookings or inquiring about projection requirements for {theatre.name}.
                </p>

                {conversations.length === 0 ? (
                  <div className="py-16 text-center text-[#AA98A9] text-sm">
                    No active conversations for this theatre yet.
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
                  80% Theatre Revenue Breakdown — {theatre.name}
                </h3>
                <p className="text-xs text-[#483248]">
                  For every interval screening booked and completed at {theatre.name}, 80% is credited directly to your cinema revenue balance. 20% is deducted as platform super-admin commission.
                </p>

                {earnings.transactions?.length === 0 ? (
                  <div className="py-16 text-center text-[#AA98A9] text-sm">
                    No revenue transactions recorded for {theatre.name} yet.
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
        </>
      )}

      {/* Associate Theatre Modal (for existing or unassigned staff) */}
      {showAssociateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="relative w-full max-w-lg bg-white border-2 border-[#CBC3E3] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-6 h-6 text-[#9F2B68]" />
                  <h3 className="text-lg font-bold text-[#301934] font-cinema">
                    Link Your Cinema Facility
                  </h3>
                </div>
                <button
                  onClick={() => setShowAssociateModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#E6E6FA] text-[#483248]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {assocError && (
                <div className="p-3 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-[#800020] text-xs">
                  {assocError}
                </div>
              )}

              <form onSubmit={handleAssociateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                    Theatre Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assocForm.theatreName}
                    onChange={(e) => setAssocForm({ ...assocForm, theatreName: e.target.value })}
                    placeholder="e.g. Chennai Royal Cinemas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                      Location / Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={assocForm.theatreLocation}
                      onChange={(e) => setAssocForm({ ...assocForm, theatreLocation: e.target.value })}
                      placeholder="e.g. T. Nagar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={assocForm.city}
                      onChange={(e) => setAssocForm({ ...assocForm, city: e.target.value })}
                      placeholder="e.g. Chennai"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                    Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={assocForm.theatreAddress}
                    onChange={(e) => setAssocForm({ ...assocForm, theatreAddress: e.target.value })}
                    placeholder="e.g. 12 Usman Road, Panagal Park"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={assocForm.theatrePhone}
                      onChange={(e) => setAssocForm({ ...assocForm, theatrePhone: e.target.value })}
                      placeholder="+91 44 2434 5678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-[#301934] mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={assocForm.theatreEmail}
                      onChange={(e) => setAssocForm({ ...assocForm, theatreEmail: e.target.value })}
                      placeholder="manager@theatre.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#301934]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#CBC3E3]">
                  <button
                    type="button"
                    onClick={() => setShowAssociateModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#F8F6FC] text-[#483248] text-xs font-semibold hover:bg-[#E6E6FA] border border-[#CBC3E3]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assocLoading}
                    className="btn-cinema-shimmer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-xs font-mono font-bold uppercase shadow-md disabled:opacity-50"
                  >
                    {assocLoading ? 'Connecting...' : 'Save & Open Dashboard'}
                  </button>
                </div>
              </form>
            </div>
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
