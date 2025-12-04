import { useState, useRef } from 'react';
import { X, Loader2, Upload, FileText } from 'lucide-react';
import { CreateCandidateInput } from '../types/candidate';
import { parseResume } from '../services/openaiService';
import { extractTextFromFile } from '../services/fileParserService';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (candidate: CreateCandidateInput, file?: File) => Promise<void>;
}

export default function AddCandidateModal({ isOpen, onClose, onSubmit }: AddCandidateModalProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CreateCandidateInput>({
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, Word document (DOC/DOCX), image (JPG/PNG), or text file.');
      return;
    }

    if (file.size > 10000000) {
      setError('File is too large. Please upload a file smaller than 10MB.');
      return;
    }

    setError('');
    setParsing(true);
    setUploadedFileName(file.name);

    try {
      let text = await extractTextFromFile(file);

      if (text.length > 10000) {
        text = text.substring(0, 10000);
      }

      if (!text.trim()) {
        throw new Error('No text could be extracted from the file. Please check the file content.');
      }

      const parsedData = await parseResume(text);

      setFormData({
        ...formData,
        ...parsedData
      });

      setUploadedFile(file);
      setError('');
    } catch (err) {
      console.error('Resume parsing error:', err);
      let errorMessage = 'Failed to parse resume';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Add more helpful context for common errors
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to OpenAI API. Please check your internet connection and API key.';
        } else if (err.message.includes('API key')) {
          errorMessage = 'OpenAI API key is invalid or not configured. Please check your .env file.';
        } else if (err.message.includes('401')) {
          errorMessage = 'OpenAI API key is invalid or expired. Please update your API key in the .env file.';
        } else if (err.message.includes('429')) {
          errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
        }
      }

      setError(errorMessage);
      setUploadedFileName('');
      setUploadedFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData, uploadedFile || undefined);
      setFormData({
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
      setUploadedFileName('');
      setUploadedFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add New Candidate</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Parsing Resume...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Resume/CV to Auto-Fill
                </>
              )}
            </button>
            {uploadedFileName && !parsing && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <FileText className="w-4 h-4" />
                {uploadedFileName} - Fields auto-filled and file will be saved
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 text-center">
              Supported formats: PDF, Word (DOC/DOCX), Images (JPG/PNG), or Text (TXT)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label htmlFor="position_applied" className="block text-sm font-medium text-gray-700 mb-1">
                Position Applied *
              </label>
              <input
                id="position_applied"
                type="text"
                required
                value={formData.position_applied}
                onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience *
              </label>
              <input
                id="years_experience"
                type="number"
                min="0"
                required
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
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
              <label htmlFor="business_unit" className="block text-sm font-medium text-gray-700 mb-1">
                Business Unit
              </label>
              <select
                id="business_unit"
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
              <label htmlFor="job_category" className="block text-sm font-medium text-gray-700 mb-1">
                Job Category
              </label>
              <select
                id="job_category"
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Additional information about the candidate..."
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
                  Adding...
                </>
              ) : (
                'Add Candidate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
