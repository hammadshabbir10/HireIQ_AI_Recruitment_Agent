import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Candidate } from '@/types';
import { Mail, CheckCircle2, FileText, User, Send, X, Loader2, Trash2, ClipboardList, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CandidateCardProps {
  candidate: Candidate;
  onStatusChange: (id: string, status: Candidate['status']) => void;
  onDelete: (id: string) => void;
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{score}/100 Strong</Badge>;
  if (score >= 60) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{score}/100 Maybe</Badge>;
  if (score >= 40) return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{score}/100 Weak</Badge>;
  return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">{score}/100 No</Badge>;
}

function StatusBadge({ status }: { status: Candidate['status'] }) {
  const map = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    shortlisted: 'bg-blue-50 text-blue-700 border-blue-200',
    contacted: 'bg-purple-50 text-purple-700 border-purple-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <Badge variant="outline" className={`${map[status]} capitalize shadow-sm`}>{status}</Badge>
  );
}

export default function CandidateCard({ candidate, onStatusChange, onDelete }: CandidateCardProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showRawNotes, setShowRawNotes] = useState(false);

  const handleSendEmail = async () => {
    if (!candidate.outreach_emails?.[0]) return;
    
    setIsSending(true);
    setEmailError('');
    
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          to: candidate.email,
          subject: candidate.outreach_emails[0].subject_line,
          text: candidate.outreach_emails[0].email_body,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setEmailSuccess(true);
        onStatusChange(candidate.id, 'contacted');
        setTimeout(() => setIsEmailModalOpen(false), 2000);
      } else {
        setEmailError(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
    <Card className="text-sm border border-border/60 shadow-sm overflow-hidden transition-all hover:shadow-md relative group">
      <button 
        onClick={() => onDelete(candidate.id)}
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 z-10"
        title="Delete Candidate"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="bg-muted/30 px-4 py-3 border-b border-border/40 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{candidate.name || 'Unknown Candidate'}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3" /> {candidate.email || 'No email provided'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ScoreBadge score={candidate.score} />
          <StatusBadge status={candidate.status} />
        </div>
      </div>

      <CardContent className="p-4 flex flex-col gap-4">
        {candidate.score_reasoning && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> AI Evaluation
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {candidate.score_reasoning}
            </p>
          </div>
        )}

        {candidate.outreach_emails && candidate.outreach_emails.length > 0 && (
          <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Drafted Outreach
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
                onClick={() => {
                  setEmailSuccess(false);
                  setEmailError('');
                  setIsEmailModalOpen(true);
                }}
                disabled={!candidate.email || candidate.status === 'contacted'}
              >
                {candidate.status === 'contacted' ? 'Sent' : 'Review & Send'}
              </Button>
            </div>
            <p className="text-sm font-medium text-foreground">
              <span className="text-muted-foreground font-normal">Subject:</span> {candidate.outreach_emails[0].subject_line}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3 relative">
              {candidate.outreach_emails[0].email_body}
            </p>
          </div>
        )}
        
        {candidate.interview_summaries && candidate.interview_summaries.length > 0 && (
          <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
             <div className="flex justify-between items-center mb-2">
               <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Interview Summary
              </p>
              {candidate.interview_summaries[0].raw_notes && (
                <button
                  onClick={() => setShowRawNotes(!showRawNotes)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  {showRawNotes ? 'Hide Raw Notes' : 'View Raw Notes'}
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {candidate.interview_summaries[0].summary || candidate.interview_summaries[0].recommendation}
            </p>
            {showRawNotes && candidate.interview_summaries[0].raw_notes && (
              <div className="mt-3 p-3 bg-white border border-slate-200 rounded-md">
                <p className="text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Original Notes</p>
                <div className="text-xs text-slate-500 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                  {candidate.interview_summaries[0].raw_notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questionnaire Badge */}
        {candidate.questionnaires && candidate.questionnaires.length > 0 && (() => {
          const q = candidate.questionnaires[0];
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const formUrl = `${baseUrl}/pre-screen/${q.form_token}`;
          return (
            <div className={`space-y-1.5 p-3 rounded-lg border ${
              q.status === 'submitted'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex justify-between items-center">
                <p className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  q.status === 'submitted' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <ClipboardList className="h-3.5 w-3.5" />
                  Pre-Screen {q.status === 'submitted' ? 'Completed' : 'Pending'}
                </p>
                <a href={formUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Form Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {q.status === 'submitted' && q.pre_screen_score !== null && (
                <p className="text-sm font-bold text-emerald-700">Score: {q.pre_screen_score}/100</p>
              )}
              {q.status === 'pending' && (
                <p className="text-xs text-amber-600">Waiting for candidate to complete the form</p>
              )}
            </div>
          );
        })()}

        <div className="pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-2">Update Pipeline Status:</p>
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'shortlisted', 'contacted', 'rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(candidate.id, s)}
                disabled={candidate.status === s}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize font-medium
                  ${candidate.status === s
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Email Preview Modal */}
    {isEmailModalOpen && candidate.outreach_emails && candidate.outreach_emails.length > 0 && (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Send Outreach Email</h2>
              <p className="text-sm text-slate-500">Review before sending to {candidate.name}</p>
            </div>
            <button 
              onClick={() => setIsEmailModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-slate-500 font-medium">To:</span>
                <span className="text-slate-900">{candidate.email}</span>
                
                <span className="text-slate-500 font-medium">Subject:</span>
                <span className="text-slate-900 font-medium">{candidate.outreach_emails[0].subject_line}</span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap text-sm text-slate-700 font-serif leading-relaxed">
                  {candidate.outreach_emails[0].email_body}
                </div>
              </div>

              {emailError && (
                <div className="mt-4 p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm">
                  {emailError}
                </div>
              )}
              {emailSuccess && (
                <div className="mt-4 p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Email sent successfully!
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending || emailSuccess}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : emailSuccess ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Sent</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Email</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
