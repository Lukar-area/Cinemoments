import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import {
  ShieldCheck,
  Users,
  Film,
  History,
  Activity,
  Lock,
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('STATS');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, bookingsRes, txRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getAuditLogs(50),
        api.admin.getBookings(),
        api.transactions.getAll().catch(() => ({ transactions: [] })),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setAuditLogs(logsRes.logs);
      setBookings(bookingsRes.bookings);
      setAllTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.admin.updateUser(user.id, { status: newStatus });
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleToggleUserRole = async (user) => {
    const newRole = user.role === 'CUSTOMER' ? 'STAFF' : user.role === 'STAFF' ? 'ADMIN' : 'CUSTOMER';
    try {
      await api.admin.updateUser(user.id, { role: newRole });
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-cinema-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Super Administration Hub
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-bold text-white mt-1">
            System Control & Security Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor platform performance, 80/20 revenue splits, user authorizations, and immutable audit trails.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cinema-700 overflow-x-auto pb-1">
        {[
          { id: 'STATS', label: 'Platform Stats', icon: Activity },
          { id: 'TRANSACTIONS', label: 'Revenue & 20% Commissions', icon: DollarSign },
          { id: 'USERS', label: 'User Directory', icon: Users },
          { id: 'BOOKINGS', label: 'Global Interval Bookings', icon: Film },
          { id: 'LOGS', label: 'Security Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-cinema-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-cinema-850 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: Platform Stats */}
          {activeTab === 'STATS' && stats && (
            <div className="space-y-8">
              {/* Financial Revenue Share Summary */}
              <div className="p-6 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Financial Performance & Revenue Split (80% / 20%)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-cinema-900 to-cinema-850 border border-cinema-750">
                    <span className="text-xs text-slate-400 block font-medium">Total Platform Volume</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      ₹{Number(stats.totalVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">Gross booked intervals</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-xs text-amber-400 block font-semibold">
                      Theatre Payouts (80%)
                    </span>
                    <span className="text-3xl font-black text-amber-300 mt-1 block">
                      ₹{Number(stats.totalTheatrePayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-amber-400/70 mt-1 block">Credited to cinema operators</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                    <span className="text-xs text-purple-400 block font-semibold flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Super Admin Commission (20%)
                    </span>
                    <span className="text-3xl font-black text-purple-300 mt-1 block">
                      ₹{Number(stats.totalAdminCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-purple-400/70 mt-1 block">Platform service fee</span>
                  </div>
                </div>
              </div>

              {/* Entities Count Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1">
                  <span className="text-xs text-slate-400">Total Users</span>
                  <span className="block text-3xl font-black text-white">{stats.usersCount}</span>
                </div>
                <Link to="/theatres" className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1 hover:border-amber-400/60 transition-all block group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 group-hover:text-amber-300">Theatres</span>
                    <span className="text-[10px] text-amber-400 font-semibold group-hover:underline">Browse →</span>
                  </div>
                  <span className="block text-3xl font-black text-amber-400">{stats.theatresCount}</span>
                </Link>
                <div className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1">
                  <span className="text-xs text-slate-400">Screens</span>
                  <span className="block text-3xl font-black text-white">{stats.screensCount}</span>
                </div>
                <div className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1">
                  <span className="text-xs text-slate-400">Movies Catalog</span>
                  <span className="block text-3xl font-black text-white">{stats.moviesCount}</span>
                </div>
                <div className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-400">Active Shows</span>
                  <span className="block text-3xl font-black text-white">{stats.showsCount}</span>
                </div>
              </div>

              {/* Bookings State Metrics */}
              <div className="p-6 rounded-3xl bg-cinema-850 border border-cinema-700/80 space-y-4">
                <h3 className="text-base font-bold text-white">Booking State Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-cinema-900 border border-cinema-800">
                    <span className="text-xs text-slate-400">Total Requests</span>
                    <span className="block text-2xl font-bold text-white mt-1">{stats.totalBookings}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-400">Accepted Bookings</span>
                    <span className="block text-2xl font-bold text-emerald-300 mt-1">
                      {stats.acceptedBookings}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs text-amber-400">Pending Review</span>
                    <span className="block text-2xl font-bold text-amber-300 mt-1">
                      {stats.pendingBookings}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="text-xs text-slate-400">Expired Competing</span>
                    <span className="block text-2xl font-bold text-slate-300 mt-1">
                      {stats.expiredBookings}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Revenue & 20% Commissions */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="rounded-2xl bg-cinema-850 border border-cinema-700/80 overflow-hidden">
              <div className="p-4 border-b border-cinema-700 flex justify-between items-center bg-cinema-900/60">
                <h3 className="text-sm font-bold text-white">Platform Financial Ledger</h3>
                <span className="text-xs text-slate-400">{allTransactions.length} Transactions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cinema-900 text-slate-400 uppercase font-semibold border-b border-cinema-700">
                    <tr>
                      <th className="px-4 py-3">Tx ID</th>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Theatre</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3 text-amber-400">Theatre Share (80%)</th>
                      <th className="px-4 py-3 text-purple-400">Admin Commission (20%)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-700/50 text-slate-200">
                    {allTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cinema-800/50">
                        <td className="px-4 py-3 font-mono text-slate-400">#{tx.id}</td>
                        <td className="px-4 py-3 font-semibold text-white">#{tx.booking_id}</td>
                        <td className="px-4 py-3">{tx.customer_name || 'Customer'}</td>
                        <td className="px-4 py-3">{tx.theatre_name || 'Cinema'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-white">₹{Number(tx.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-300">
                          ₹{Number(tx.theatre_share).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-purple-300">
                          ₹{Number(tx.admin_share).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: User Directory */}
          {activeTab === 'USERS' && (
            <div className="rounded-2xl bg-cinema-850 border border-cinema-700/80 overflow-hidden">
              <div className="p-4 border-b border-cinema-700 flex justify-between items-center bg-cinema-900/60">
                <h3 className="text-sm font-bold text-white">Registered Platform Accounts</h3>
                <span className="text-xs text-slate-400">{users.length} Users</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cinema-900 text-slate-400 uppercase font-semibold border-b border-cinema-700">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Wallet</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-700/50 text-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-cinema-800/50">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-400">{u.id}</td>
                        <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                        <td className="px-4 py-3 text-slate-300">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.role === 'STAFF'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-300 font-bold">
                          ₹{Number(u.wallet_balance || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="px-2.5 py-1 rounded bg-cinema-800 hover:bg-cinema-750 text-slate-300 hover:text-white font-medium"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            className="px-2.5 py-1 rounded bg-cinema-800 hover:bg-cinema-750 text-slate-300 hover:text-white font-medium"
                          >
                            Cycle Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Bookings Directory */}
          {activeTab === 'BOOKINGS' && (
            <div className="rounded-2xl bg-cinema-850 border border-cinema-700/80 overflow-hidden">
              <div className="p-4 border-b border-cinema-700 flex justify-between items-center bg-cinema-900/60">
                <h3 className="text-sm font-bold text-white">All Platform Interval Bookings</h3>
                <span className="text-xs text-slate-400">{bookings.length} Bookings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cinema-900 text-slate-400 uppercase font-semibold border-b border-cinema-700">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Movie</th>
                      <th className="px-4 py-3">Theatre & Screen</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-700/50 text-slate-200">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-cinema-800/50">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-400">#{b.id}</td>
                        <td className="px-4 py-3 font-bold text-white">{b.movie_title}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {b.theatre_name} • {b.screen_name}
                        </td>
                        <td className="px-4 py-3">{b.customer_name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Security Audit Logs */}
          {activeTab === 'LOGS' && (
            <div className="rounded-2xl bg-cinema-850 border border-cinema-700/80 overflow-hidden">
              <div className="p-4 border-b border-cinema-700 flex justify-between items-center bg-cinema-900/60">
                <h3 className="text-sm font-bold text-white">Immutable Security Audit Trails</h3>
                <span className="text-xs text-slate-400">Recent {auditLogs.length} events</span>
              </div>

              <div className="divide-y divide-cinema-700/50">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-cinema-800/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-cinema-800 text-purple-300 border border-purple-500/20">
                          {log.action}
                        </span>
                        <span className="text-slate-300">by {log.user_name || 'System / Guest'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Target: {log.entity_type} #{log.entity_id || 'N/A'} • IP: {log.ip_address || '127.0.0.1'}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
