import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Loader2, Mail, Briefcase, Award, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Approver {
  id: string;
  user_id: string;
  role: string;
  designation: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export default function ApproversManagement() {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    role: '',
    designation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [approversRes, usersRes] = await Promise.all([
        supabase
          .from('approvers')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, email, full_name')
          .order('email', { ascending: true }),
      ]);

      if (approversRes.error) throw approversRes.error;
      if (usersRes.error) throw usersRes.error;

      const approversWithUserInfo = (approversRes.data || []).map((approver) => {
        const user = usersRes.data?.find((u) => u.id === approver.user_id);
        return {
          ...approver,
          email: user?.email,
          full_name: user?.full_name,
        };
      });

      setApprovers(approversWithUserInfo);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('approvers')
        .insert([formData]);

      if (error) throw error;

      await loadData();
      setIsAddModalOpen(false);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to add approver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApprover) return;

    setError('');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('approvers')
        .update({
          user_id: formData.user_id,
          role: formData.role,
          designation: formData.designation,
        })
        .eq('id', selectedApprover.id);

      if (error) throw error;

      await loadData();
      setIsEditModalOpen(false);
      setSelectedApprover(null);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to update approver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApprover = async (id: string, role: string) => {
    if (!confirm(`Are you sure you want to delete the approver with role "${role}"?`)) return;

    try {
      const { error } = await supabase
        .from('approvers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete approver');
    }
  };

  const openEditModal = (approver: Approver) => {
    setSelectedApprover(approver);
    setFormData({
      user_id: approver.user_id,
      role: approver.role,
      designation: approver.designation,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      role: '',
      designation: '',
    });
    setError('');
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedApprover(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Approvers Management</h2>
          <p className="text-slate-600 mt-1">Configure approval workflow roles and designations</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          Add Approver
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {approvers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No approvers configured yet. Add your first approver to get started.
                </td>
              </tr>
            ) : (
              approvers.map((approver) => (
                <tr key={approver.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {approver.full_name || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">{approver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm text-slate-800">{approver.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-800">{approver.designation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(approver.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(approver)}
                        className="text-cyan-600 hover:text-cyan-700 transition-colors"
                        title="Edit approver"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApprover(approver.id, approver.role)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Delete approver"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {isEditModalOpen ? 'Edit Approver' : 'Add New Approver'}
              </h3>
              <button
                onClick={closeModals}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditApprover : handleAddApprover} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  User
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} {user.full_name ? `(${user.full_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    placeholder="e.g., Prepared by, Recommended by"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Designation
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    placeholder="e.g., Manager, Group Human Resources"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditModalOpen ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>{isEditModalOpen ? 'Update Approver' : 'Add Approver'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
