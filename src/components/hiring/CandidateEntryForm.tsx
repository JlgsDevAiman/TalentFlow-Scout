import { useState } from 'react';
import { UserPlus, Mail, Briefcase, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CandidateEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CandidateEntryForm({ onSuccess, onCancel }: CandidateEntryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    recruiter: '',
    recruiter_email: '',
    hiring_manager1_email: '',
    hiring_manager2_email: '',
    approver1_email: '',
    approver2_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.position || !formData.recruiter ||
          !formData.recruiter_email || !formData.hiring_manager1_email || !formData.approver1_email) {
        throw new Error('Please fill in all required fields');
      }

      const { error: insertError } = await supabase
        .from('candidate_hiring_flow')
        .insert([
          {
            name: formData.name,
            position: formData.position,
            recruiter: formData.recruiter,
            recruiter_email: formData.recruiter_email,
            hiring_manager1_email: formData.hiring_manager1_email,
            hiring_manager2_email: formData.hiring_manager2_email || null,
            approver1_email: formData.approver1_email,
            approver2_email: formData.approver2_email || null,
            current_step: 'Selected for Hiring',
            assessment_status: 'Pending',
            background_check_status: 'Pending',
          },
        ]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add Candidate for Hiring</h2>
              <p className="text-sm text-slate-500">Selected for Hiring - Start approval workflow</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-600" />
              Candidate Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Candidate Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Job title"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-600" />
              Recruiter Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recruiter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recruiter"
                  value={formData.recruiter}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Recruiter name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recruiter Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="recruiter_email"
                  value={formData.recruiter_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="recruiter@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-4">
              Hiring Managers (Recommenders)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hiring Manager 1 Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="hiring_manager1_email"
                  value={formData.hiring_manager1_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="hm1@example.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Mandatory recommender</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hiring Manager 2 Email
                </label>
                <input
                  type="email"
                  name="hiring_manager2_email"
                  value={formData.hiring_manager2_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="hm2@example.com (optional)"
                />
                <p className="text-xs text-slate-500 mt-1">Optional recommender</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-4">
              Approvers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Approver 1 Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="approver1_email"
                  value={formData.approver1_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="approver1@example.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Mandatory approver</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Approver 2 Email
                </label>
                <input
                  type="email"
                  name="approver2_email"
                  value={formData.approver2_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="approver2@example.com (optional)"
                />
                <p className="text-xs text-slate-500 mt-1">Optional approver</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Start Hiring Process
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
