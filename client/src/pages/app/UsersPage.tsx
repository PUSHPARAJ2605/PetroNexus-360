import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2, ShieldCheck, Mail, UserCheck, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New user form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERATOR');

  const loadUsers = () => {
    api.get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', { name, email, password, role });
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">User & Role Management</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Role-Based Access Control: Admin, Operator, Engineer, Maintenance, Safety Officer, Viewer
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="petro-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-4">Operator / Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-mono text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      u.role === 'OPERATOR' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      u.role === 'ENGINEER' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      u.role === 'MAINTENANCE_ENGINEER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {currentUser?.id !== u.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md petro-card p-6 border-cyan-500/40 bg-[#09223D] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-white text-sm">Provision New Field User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="r.sharma@petronexus360.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="OPERATOR">OPERATOR (Steam Injection & Well Monitoring)</option>
                  <option value="ENGINEER">ENGINEER (Reservoir Analysis & Simulations)</option>
                  <option value="MAINTENANCE_ENGINEER">MAINTENANCE_ENGINEER (Equipment & Pumps)</option>
                  <option value="SAFETY_OFFICER">SAFETY_OFFICER (HSE & Fracture Containment)</option>
                  <option value="VIEWER">VIEWER (Read-Only Observer)</option>
                  <option value="ADMIN">ADMIN (Full Supervisory Provisioning)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
