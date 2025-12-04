import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { Candidate, UpdateCandidateInput } from '../types/candidate';
import { getCandidateFileUrl } from '../services/candidateService';

interface EditCandidateModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateCandidateInput, file?: File | null, removeFile?: boolean) => Promise<void>;
}

export default function EditCandidateModal({ isOpen, candidate, onClose, onSubmit }: EditCandidateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UpdateCandidateInput>({
    full_name: '',
    email: '',
    phone: '',
    position_applied: '',
    years_experience: 0,
    status: 'New',
    notes: '',
    business_unit: '',
    job_category: ''
  });

  useEffect(() => {
    if (candidate) {
      setFormData({
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        position_applied: candidate.position_applied,
        years_experience: candidate.years_experience,
        status: candidate.status,
        notes: candidate.notes,
        business_unit: candidate.business_unit || '',
        job_category: candidate.job_category || ''
      });
      setNewFile(null);
      setRemoveFile(false);
      setDownloadUrl(null);

      if (candidate.jd_file_path) {
        getCandidateFileUrl(candidate).then(url => {
          if (url) setDownloadUrl(url);
        }).catch(() => {});
      }
    }
  }, [candidate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      setRemoveFile(false);
    }
  };

  const handleRemoveFile = () => {
    setRemoveFile(true);
    setNewFile(null);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    setError('');
    setLoading(true);

    try {
      await onSubmit(candidate.id, formData, newFile, removeFile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update candidate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Candidate</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {candidate.jd_file_path && !removeFile && !newFile ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Current Job Description</p>
                    <p className="text-xs text-blue-700">{candidate.jd_file_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {downloadUrl && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : newFile ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">New File Selected</p>
                    <p className="text-xs text-green-700">{newFile.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewFile(null)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : removeFile ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-orange-900">File will be removed</p>
                <button
                  type="button"
                  onClick={() => setRemoveFile(false)}
                  className="px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  Undo
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <Upload className="w-5 h-5" />
                Add Job Description File
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="edit_full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="edit_email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                id="edit_phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit_position_applied" className="block text-sm font-medium text-gray-700 mb-1">
                Position Applied *
              </label>
              <input
                id="edit_position_applied"
                type="text"
                required
                value={formData.position_applied}
                onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience *
              </label>
              <input
                id="edit_years_experience"
                type="number"
                min="0"
                required
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="edit_status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="New">New</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Assessment">Assessment</option>
                <option value="Background Check">Background Check</option>
                <option value="Rejected">Rejected</option>
                <option value="Hired">Hired</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit_business_unit" className="block text-sm font-medium text-gray-700 mb-1">
                Business Unit
              </label>
              <select
                id="edit_business_unit"
                value={formData.business_unit}
                onChange={(e) => setFormData({ ...formData, business_unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Business Unit</option>
                <option value="Holding Company">Holding Company</option>
                <option value="Outsourcing Services">Outsourcing Services</option>
                <option value="Property Development">Property Development</option>
                <option value="Property Investment">Property Investment</option>
                <option value="Integrated Community Solutions">Integrated Community Solutions</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit_job_category" className="block text-sm font-medium text-gray-700 mb-1">
                Job Category
              </label>
              <select
                id="edit_job_category"
                value={formData.job_category}
                onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select Job Category</option>
                <option value="Management">Management</option>
                <option value="Support Services">Support Services</option>
                <option value="Technical">Technical</option>
                <option value="Non-technical">Non-technical</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit_notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="edit_notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
