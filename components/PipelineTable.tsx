'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Candidate } from '@/types';
import CandidateCard from './CandidateCard';
import { LayoutGrid, List } from 'lucide-react';

interface PipelineTableProps {
  candidates: Candidate[];
  onStatusChange: (id: string, status: Candidate['status']) => void;
  onDelete: (id: string) => void;
}

const statusFilters = ['all', 'shortlisted', 'contacted', 'pending', 'rejected'];

export default function PipelineTable({ candidates, onStatusChange, onDelete }: PipelineTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = filter === 'all'
    ? candidates
    : candidates.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col gap-5 h-full py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all capitalize font-medium
                ${filter === f 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {f} {f === 'all' 
                ? <span className="opacity-70 ml-1">({candidates.length})</span> 
                : <span className="opacity-70 ml-1">({candidates.filter(c => c.status === f).length})</span>}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 border border-dashed border-border/60 rounded-xl py-16">
            <p className="font-semibold text-foreground/80 mb-1">No candidates found</p>
            <p className="text-sm max-w-[250px]">
              {filter === 'all' 
                ? "Your pipeline is empty. Screen a candidate to get started." 
                : `No candidates currently have the '${filter}' status.`}
            </p>
          </div>
        ) : (
          <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
            {filtered.map((candidate) => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                onStatusChange={onStatusChange} 
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
