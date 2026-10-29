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
      <div className="pb-6 border-b border-[#CBC3E3] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#9F2B68]" />
            EXECUTIVE COMMAND CONSOLE
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934] mt-1">
            Global Cinema Network Control
          </h1>
          <p className="text-sm text-[#483248] mt-1 font-medium">
            Monitor real-time auditorium intervals, 80/20 revenue distributions, and encrypted media logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#CBC3E3] overflow-x-auto pb-1">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#9F2B68] text-white shadow-md shadow-[#9F2B68]/20 font-bold'
                  : 'text-[#483248] bg-white border border-[#CBC3E3] hover:text-[#9F2B68] hover:bg-[#E6E6FA]'
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
            <div key={i} className="h-32 rounded-2xl bg-white border border-[#CBC3E3] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: Platform Stats */}
          {activeTab === 'STATS' && stats && (
            <div className="space-y-8">
              {/* Financial Revenue Share Summary */}
              <div className="p-6 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#301934] font-cinema flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#9F2B68]" />
                  Financial Performance & Revenue Split (80% / 20%)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]">
                    <span className="text-xs text-[#483248] block font-medium">Total Platform Volume</span>
                    <span className="text-3xl font-black text-[#301934] mt-1 block font-mono">
                      ₹{Number(stats.totalVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-[#AA98A9] mt-1 block font-mono">Gross booked intervals</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FFF0F7] border border-[#9F2B68]/30">
                    <span className="text-xs text-[#9F2B68] block font-semibold">
                      Theatre Payouts (80%)
                    </span>
                    <span className="text-3xl font-black text-[#9F2B68] mt-1 block font-mono">
                      ₹{Number(stats.totalTheatrePayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-[#9F2B68]/70 mt-1 block font-mono">Credited to cinema operators</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F8F5FF] border border-[#5D3FD3]/30">
                    <span className="text-xs text-[#5D3FD3] block font-semibold flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Super Admin Commission (20%)
                    </span>
                    <span className="text-3xl font-black text-[#5D3FD3] mt-1 block font-mono">
                      ₹{Number(stats.totalAdminCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-[#5D3FD3]/70 mt-1 block font-mono">Platform service fee</span>
                  </div>
                </div>
              </div>

              {/* Entities Count Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-1">
                  <span className="text-xs text-[#483248] font-medium">Total Users</span>
                  <span className="block text-3xl font-black text-[#301934] font-mono">{stats.usersCount}</span>
                </div>
                <Link to="/theatres" className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-1 hover:border-[#9F2B68]/60 transition-all block group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#483248] group-hover:text-[#9F2B68] font-medium">Theatres</span>
                    <span className="text-[10px] text-[#9F2B68] font-semibold group-hover:underline">Browse →</span>
                  </div>
                  <span className="block text-3xl font-black text-[#9F2B68] font-mono">{stats.theatresCount}</span>
                </Link>
                <div className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-1">
                  <span className="text-xs text-[#483248] font-medium">Screens</span>
                  <span className="block text-3xl font-black text-[#301934] font-mono">{stats.screensCount}</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-1">
                  <span className="text-xs text-[#483248] font-medium">Movies Catalog</span>
                  <span className="block text-3xl font-black text-[#301934] font-mono">{stats.moviesCount}</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-xs text-[#483248] font-medium">Active Shows</span>
                  <span className="block text-3xl font-black text-[#301934] font-mono">{stats.showsCount}</span>
                </div>
              </div>

              {/* Bookings State Metrics */}
              <div className="p-6 rounded-3xl bg-white border border-[#CBC3E3] shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#301934] font-cinema">Booking State Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3]">
                    <span className="text-xs text-[#483248]">Total Requests</span>
                    <span className="block text-2xl font-bold text-[#301934] mt-1 font-mono">{stats.totalBookings}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8F5FF] border border-[#5D3FD3]/30">
                    <span className="text-xs text-[#5D3FD3] font-semibold">Accepted Bookings</span>
                    <span className="block text-2xl font-bold text-[#5D3FD3] mt-1 font-mono">
                      {stats.acceptedBookings}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FFF0F7] border border-[#9F2B68]/30">
                    <span className="text-xs text-[#9F2B68] font-semibold">Pending Review</span>
                    <span className="block text-2xl font-bold text-[#9F2B68] mt-1 font-mono">
                      {stats.pendingBookings}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FFF0F4] border border-[#800020]/30">
                    <span className="text-xs text-[#800020] font-semibold">Expired Competing</span>
                    <span className="block text-2xl font-bold text-[#800020] mt-1 font-mono">
                      {stats.expiredBookings}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Revenue & 20% Commissions */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="rounded-2xl bg-white border border-[#CBC3E3] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#CBC3E3] flex justify-between items-center bg-[#F8F6FC]">
                <h3 className="text-sm font-bold text-[#301934] font-cinema">Platform Financial Ledger</h3>
                <span className="text-xs text-[#AA98A9] font-mono">{allTransactions.length} Transactions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6FC] text-[#483248] uppercase font-semibold border-b border-[#CBC3E3]">
                    <tr>
                      <th className="px-4 py-3">Tx ID</th>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Theatre</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3 text-[#9F2B68]">Theatre Share (80%)</th>
                      <th className="px-4 py-3 text-[#5D3FD3]">Admin Commission (20%)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBC3E3]/50 text-[#301934]">
                    {allTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FDF5FF]">
                        <td className="px-4 py-3 font-mono text-[#5D3FD3]">#{tx.id}</td>
                        <td className="px-4 py-3 font-semibold text-[#301934]">#{tx.booking_id}</td>
                        <td className="px-4 py-3">{tx.customer_name || 'Customer'}</td>
                        <td className="px-4 py-3 text-[#483248]">{tx.theatre_name || 'Cinema'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-[#301934]">₹{Number(tx.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-[#9F2B68]">
                          ₹{Number(tx.theatre_share).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#5D3FD3]">
                          ₹{Number(tx.admin_share).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded bg-[#FFF0F7] text-[#9F2B68] border border-[#9F2B68]/30 text-[10px] font-bold">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#F8F5FF] text-[#5D3FD3] border border-[#5D3FD3]/30 text-[10px] font-bold">
                              REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#AA98A9]">
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
            <div className="rounded-2xl bg-white border border-[#CBC3E3] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#CBC3E3] flex justify-between items-center bg-[#F8F6FC]">
                <h3 className="text-sm font-bold text-[#301934] font-cinema">Registered Platform Accounts</h3>
                <span className="text-xs text-[#AA98A9] font-mono">{users.length} Users</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6FC] text-[#483248] uppercase font-semibold border-b border-[#CBC3E3]">
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
                  <tbody className="divide-y divide-[#CBC3E3]/50 text-[#301934]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FDF5FF]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#AA98A9]">{u.id}</td>
                        <td className="px-4 py-3 font-bold text-[#301934]">{u.name}</td>
                        <td className="px-4 py-3 text-[#483248]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-[#FDF5FF] text-[#BF40BF] border border-[#BF40BF]/30'
                                : u.role === 'STAFF'
                                ? 'bg-[#FFF0F7] text-[#9F2B68] border border-[#9F2B68]/30'
                                : 'bg-[#E6E6FA] text-[#702963] border border-[#CBC3E3]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#9F2B68] font-bold">
                          ₹{Number(u.wallet_balance || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.status === 'ACTIVE'
                                ? 'bg-[#E6F9F0] text-emerald-700 border border-emerald-300'
                                : 'bg-[#FFF0F4] text-[#800020] border border-[#800020]/30'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#CBC3E3] hover:bg-[#E6E6FA] text-[#301934] font-medium cursor-pointer"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleToggleUserRole(u)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#CBC3E3] hover:bg-[#E6E6FA] text-[#301934] font-medium cursor-pointer"
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
            <div className="rounded-2xl bg-white border border-[#CBC3E3] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#CBC3E3] flex justify-between items-center bg-[#F8F6FC]">
                <h3 className="text-sm font-bold text-[#301934] font-cinema">All Platform Interval Bookings</h3>
                <span className="text-xs text-[#AA98A9] font-mono">{bookings.length} Bookings</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6FC] text-[#483248] uppercase font-semibold border-b border-[#CBC3E3]">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Movie</th>
                      <th className="px-4 py-3">Theatre & Screen</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBC3E3]/50 text-[#301934]">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FDF5FF]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#AA98A9]">#{b.id}</td>
                        <td className="px-4 py-3 font-bold text-[#301934]">{b.movie_title}</td>
                        <td className="px-4 py-3 text-[#483248]">
                          {b.theatre_name} • {b.screen_name}
                        </td>
                        <td className="px-4 py-3">{b.customer_name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-[#AA98A9]">
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
            <div className="rounded-2xl bg-white border border-[#CBC3E3] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#CBC3E3] flex justify-between items-center bg-[#F8F6FC]">
                <h3 className="text-sm font-bold text-[#301934] font-cinema">Immutable Security Audit Trails</h3>
                <span className="text-xs text-[#AA98A9] font-mono">Recent {auditLogs.length} events</span>
              </div>

              <div className="divide-y divide-[#CBC3E3]/50">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#FDF5FF]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#E6E6FA] text-[#702963] border border-[#CBC3E3]">
                          {log.action}
                        </span>
                        <span className="text-[#301934]">by {log.user_name || 'System / Guest'}</span>
                      </div>
                      <p className="text-[11px] text-[#AA98A9] font-mono">
                        Target: {log.entity_type} #{log.entity_id || 'N/A'} • IP: {log.ip_address || '127.0.0.1'}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#AA98A9] font-mono">
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
