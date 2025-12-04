import { useState, useEffect } from 'react';
import { UserPlus, Loader2, Filter } from 'lucide-react';
import { Candidate } from '../../types/candidate';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate, scoreCandidate } from '../../services/candidateService';
import CandidateList from '../CandidateList';
import AddCandidateModal from '../AddCandidateModal';
import EditCandidateModal from '../EditCandidateModal';

export default function CandidatesView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filterOptions = ['All', 'New', 'Shortlisted', 'Interview', 'Hiring Approval', 'Assessment', 'Background Check'];

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const data = await getCandidates();
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFilter === 'All') {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate => candidate.status === selectedFilter);
      setFilteredCandidates(filtered);
    }
  }, [selectedFilter, candidates]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidates</h2>
          <p className="text-slate-600 mt-1">Manage your candidate pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Filter className="w-5 h-5" />
              {selectedFilter}
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedFilter(option);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedFilter === option
                          ? 'bg-cyan-50 text-cyan-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Add Candidate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        </div>
      ) : (
        <>
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-slate-600">No candidates found with status: {selectedFilter}</p>
              <button
                onClick={() => setSelectedFilter('All')}
                className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <CandidateList
              candidates={filteredCandidates}
              onEdit={handleEdit}
              onDelete={handleDeleteCandidate}
              onScore={handleScoreCandidate}
            />
          )}
        </>
      )}

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
