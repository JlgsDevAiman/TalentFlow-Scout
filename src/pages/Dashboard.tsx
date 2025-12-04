import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, UserPlus, Loader2, Search, Filter } from 'lucide-react';
import { Candidate } from '../types/candidate';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate, scoreCandidate } from '../services/candidateService';
import CandidateList from '../components/CandidateList';
import AddCandidateModal from '../components/AddCandidateModal';
import EditCandidateModal from '../components/EditCandidateModal';
import AdminDashboard from '../components/AdminDashboard';

export default function Dashboard() {
  const { user, signOut, isAdmin, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (data: any, file?: File) => {
    await createCandidate(data, file);
    await loadCandidates();
  };

  const handleEditCandidate = async (id: string, data: any, file?: File | null, removeFile?: boolean) => {
    await updateCandidate(id, data, file, removeFile);
    await loadCandidates();
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      await deleteCandidate(id);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to delete candidate:', error);
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsEditModalOpen(true);
  };

  const handleScoreCandidate = async (candidate: Candidate) => {
    try {
      await scoreCandidate(candidate);
      await loadCandidates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to score candidate';
      alert(errorMessage);
      console.error('Failed to score candidate:', error);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position_applied.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: candidates.length,
    New: candidates.filter(c => c.status === 'New').length,
    Shortlisted: candidates.filter(c => c.status === 'Shortlisted').length,
    Interview: candidates.filter(c => c.status === 'Interview').length,
    Assessment: candidates.filter(c => c.status === 'Assessment').length,
    'Background Check': candidates.filter(c => c.status === 'Background Check').length,
    Rejected: candidates.filter(c => c.status === 'Rejected').length,
    Hired: candidates.filter(c => c.status === 'Hired').length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">TalentFlow Scout</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Candidates</h2>
            <p className="text-slate-600 mt-1">Manage your candidate pipeline ({filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'})</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Add Candidate
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="New">New ({statusCounts.New})</option>
                <option value="Shortlisted">Shortlisted ({statusCounts.Shortlisted})</option>
                <option value="Interview">Interview ({statusCounts.Interview})</option>
                <option value="Assessment">Assessment ({statusCounts.Assessment})</option>
                <option value="Background Check">Background Check ({statusCounts['Background Check']})</option>
                <option value="Rejected">Rejected ({statusCounts.Rejected})</option>
                <option value="Hired">Hired ({statusCounts.Hired})</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <CandidateList
            candidates={filteredCandidates}
            onEdit={handleEdit}
            onDelete={handleDeleteCandidate}
            onScore={handleScoreCandidate}
          />
        )}
      </main>

      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCandidate}
      />

      <EditCandidateModal
        isOpen={isEditModalOpen}
        candidate={selectedCandidate}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCandidate(null);
        }}
        onSubmit={handleEditCandidate}
      />
    </div>
  );
}
