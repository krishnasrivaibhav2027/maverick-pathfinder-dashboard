import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, ChevronRight, Send, UserCircle, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { sendEmailJs } from '@/lib/emailjs';
import { toast } from '@/components/ui/use-toast';

interface Batch {
  _id: string;
  batch_number: number;
  skill: string;
  phase: number;
  is_next_batch: boolean;
  trainees: { name: string; email: string; pdf: string; skill: string }[];
  created_at: string;
  accounts_created?: boolean;
  next_batch_date?: string;
}
interface GroupedBatches {
  [phase: number]: {
    [batch_number: number]: {
      [skill: string]: Batch;
    };
  };
}

interface SkillGroup {
  skill: string;
  trainee_count: number;
  average_progress: number;
}

interface Trainee {
  name: string;
  email: string;
  progress?: number;
  skill?: string;
  empId?: string;
  photo?: string;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const accent = "#FF7C2B"; // orange gradient start
const accent2 = "#FF512F"; // orange gradient end
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const BatchHeader = ({ title, onBack, showBack }: { title: string; onBack?: () => void; showBack?: boolean }) => (
  <div className="flex flex-col items-center w-full max-w-5xl mx-auto mb-10 mt-10 relative">
    {showBack && (
      <button onClick={onBack} className="absolute left-0 top-0 bg-white/80 shadow-lg rounded-full p-3 hover:scale-110 transition border border-purple-200 z-10">
        <ArrowLeft className="h-7 w-7 text-purple-400" />
      </button>
    )}
    <div className="flex items-center gap-3 mx-auto">
      <Users className="h-10 w-10" style={{ color: accent, filter: 'drop-shadow(0 2px 8px #a259ff44)' }} />
      <h1 className="text-4xl font-extrabold tracking-tight text-center" style={{ color: accent, fontFamily: 'Inter, ui-rounded, system-ui, sans-serif', letterSpacing: '-0.04em' }}>{title}</h1>
    </div>
  </div>
);

const BatchManagement = () => {
  const [allPhases, setAllPhases] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillGroup | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedBatchGroup, setSelectedBatchGroup] = useState<Batch[] | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [batchActionStatus, setBatchActionStatus] = useState<{ [batchId: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

  // Fetch phases on mount
  useEffect(() => {
    fetch("http://localhost:8000/batches/grouped")
      .then(res => res.json())
      .then((data: Record<string, unknown>) => {
        const foundPhases = Object.keys(data).map(Number);
        const maxPhase = foundPhases.length > 0 ? Math.max(...foundPhases) : 1;
        const phases = [];
        for (let i = 1; i <= Math.max(maxPhase, 2); i++) {
          phases.push(i.toString());
        }
        setAllPhases(phases);
      });
  }, []);

  // Fetch batches for selected phase
  useEffect(() => {
    if (selectedPhase) {
      fetch(`http://localhost:8000/batches/phase/${selectedPhase}`)
        .then(res => res.json())
        .then((data: Batch[]) => setBatches(data));
    } else {
      setBatches([]);
      setSelectedBatch(null);
      setSkillGroups([]);
      setSelectedSkill(null);
      setTrainees([]);
    }
  }, [selectedPhase]);

  // Fetch skill groups for selected batch
  useEffect(() => {
    if (selectedBatch) {
      fetch(`http://localhost:8000/batches/${selectedBatch._id}/skill-groups`)
        .then(res => res.json())
        .then((data: SkillGroup[]) => setSkillGroups(data));
    } else {
      setSkillGroups([]);
      setSelectedSkill(null);
      setTrainees([]);
    }
  }, [selectedBatch]);

  // Fetch trainees for selected skill group
  useEffect(() => {
    if (selectedBatch && selectedSkill) {
      fetch(`http://localhost:8000/batches/${selectedBatch._id}/skill-groups/${selectedSkill.skill}/trainees`)
        .then(res => res.json())
        .then((data: Trainee[]) => setTrainees(data));
    } else {
      setTrainees([]);
    }
  }, [selectedBatch, selectedSkill]);

  // 1. Phase selection
  if (!selectedPhase) {
    return (
      <div className="w-full h-full flex flex-col items-start justify-start p-8">
        <div className="flex flex-row gap-6">
          {allPhases.map(phase => (
            <button
              key={phase}
              className="relative flex items-center gap-3 px-8 py-6 rounded-2xl bg-white/70 shadow-lg border-l-4 border-orange-400 hover:shadow-xl hover:-translate-y-1 hover:border-orange-500 active:shadow-inner active:translate-y-0 transition-all duration-150"
              style={{ minWidth: 180, maxWidth: 220, minHeight: 80, ...font, fontWeight: 700, fontSize: '1.35rem', color: '#FF7C2B', boxShadow: '0 2px 16px 0 #ff7c2b11', background: 'rgba(255,255,255,0.85)' }}
              onClick={() => setSelectedPhase(phase)}
            >
              <Layers className="h-7 w-7 text-orange-400" />
              <span>Phase {phase}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. Batch list for phase
  if (selectedPhase && !selectedBatch && !selectedBatchGroup) {
    // Group batches by batch_number (ignore batch_number 0)
    const batchMap: Record<number, Batch[]> = {};
    (batches as Batch[]).forEach((batch: Batch) => {
      if (batch.batch_number === 0) return; // skip overflow
      if (!batchMap[batch.batch_number]) batchMap[batch.batch_number] = [];
      batchMap[batch.batch_number].push(batch);
    });
    const batchNumbers: number[] = Object.keys(batchMap).map((k: string) => Number(k)).sort((a, b) => a - b);
    return (
      <div className="w-full h-full flex flex-col items-start justify-start p-8">
        <button onClick={() => setSelectedPhase(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/70 shadow-md hover:shadow-lg active:shadow-inner transition-all border border-orange-100 mb-6" style={{ boxShadow: '0 2px 8px 0 #ff7c2b22', backdropFilter: 'blur(4px)' }} aria-label="Back">
          <ArrowLeft className="h-7 w-7 text-orange-400" />
        </button>
        <div className="flex flex-row gap-6 flex-wrap">
          {batchNumbers.map((batchNum: number) => (
            <button
              key={batchNum}
              className="flex flex-col items-center gap-2 px-8 py-8 rounded-2xl bg-white/80 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:shadow-inner active:translate-y-0 transition-all duration-150 border-0"
              style={{ minWidth: 180, maxWidth: 240, minHeight: 100, ...font, fontWeight: 800, fontSize: '1.5rem', color: '#FF7C2B', boxShadow: '0 2px 16px 0 #ff7c2b22', background: 'rgba(255,255,255,0.92)' }}
              onClick={() => setSelectedBatchGroup(batchMap[batchNum])}
            >
              <Users className="h-8 w-8 text-orange-400 mb-1" />
              <span>Batch {batchNum}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. Skill group list for batch
  if (selectedBatchGroup && !selectedSkill) {
    // Show all skill groups for the selected batch group
    return (
      <div className="w-full h-full flex flex-col items-start justify-start p-8">
        <div className="flex flex-row items-center gap-4 mb-8">
          <button onClick={() => setSelectedBatchGroup(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/70 shadow-md hover:shadow-lg active:shadow-inner transition-all border border-orange-100" style={{ boxShadow: '0 2px 8px 0 #ff7c2b22', backdropFilter: 'blur(4px)' }} aria-label="Back">
            <ArrowLeft className="h-7 w-7 text-orange-400" />
          </button>
          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg bg-gradient-to-r from-orange-400 to-orange-300 text-white font-extrabold text-xl" style={{ ...font, letterSpacing: '-0.01em', minWidth: 220, boxShadow: '0 2px 16px 0 #ff7c2b22' }}>
            <Users className="h-7 w-7 text-white" />
            <span>Batch {selectedBatchGroup[0].batch_number} - Phase {selectedBatchGroup[0].phase}</span>
          </div>
        </div>
        <div className="flex flex-row gap-8 flex-wrap mt-2">
          {selectedBatchGroup.map(batch => {
            const avgProgress = (batch.trainees as Trainee[]).length > 0 ? (batch.trainees as Trainee[]).reduce((acc, t) => acc + (t.progress || 0), 0) / (batch.trainees as Trainee[]).length : 0;
            return (
              <div
                key={batch.skill}
                className="relative flex flex-col items-start gap-4 px-8 py-7 rounded-2xl bg-white/80 shadow-xl min-w-[320px] max-w-[340px] min-h-[210px]"
                style={{ ...font, color: '#FF7C2B', boxShadow: '0 2px 16px 0 #ff7c2b22', background: 'rgba(255,255,255,0.96)' }}
              >
                <button
                  className="w-full h-full flex flex-col items-start gap-4 bg-transparent border-0 p-0 m-0 text-left"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedBatchGroup(null); setSelectedBatch(batch); setSelectedSkill(null); }}
                >
                  <div className="flex flex-col items-start gap-1 w-full">
                    <span className="text-xl font-extrabold text-orange-500 mb-1">{batch.skill.charAt(0).toUpperCase() + batch.skill.slice(1)} - Batch {batch.batch_number}</span>
                    <span className="text-sm font-semibold text-orange-400 mb-1">Skill group</span>
                    <span className="text-base text-gray-500 mb-2">Skill group for {batch.skill.charAt(0).toUpperCase() + batch.skill.slice(1)} specialization.</span>
                  </div>
                  <div className="w-full flex flex-col gap-1">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 relative">
                        <Progress value={avgProgress} className="h-4 bg-orange-100 rounded-full" style={{ accentColor: '#FF7C2B' }} />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold" style={{ textShadow: '0 1px 4px #ff7c2b88' }}>{Math.round(avgProgress)}%</span>
                      </div>
                      <span className="text-sm text-orange-400 font-bold ml-2">{Math.round(avgProgress)}% complete</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Users className="h-5 w-5 text-orange-400 mr-1" />
                      <span className="text-base font-semibold text-gray-600">{batch.trainees.length} trainees</span>
                    </div>
                  </div>
                </button>
                <button
                  className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold shadow hover:scale-105 transition-all text-sm disabled:opacity-60 w-full"
                  disabled={batch.accounts_created || batchActionStatus?.[batch._id] === 'loading'}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setBatchActionStatus(s => ({ ...s, [batch._id]: 'loading' }));
                    try {
                      const res = await fetch('http://localhost:8000/onboarding/create-accounts-for-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ batch_id: batch._id })
                      });
                      const data = await res.json();
                      if (data.status === 'success' || data.status === 'already_created') {
                        setBatchActionStatus(s => ({ ...s, [batch._id]: 'success' }));
                        if (data.created_trainees && Array.isArray(data.created_trainees)) {
                          for (const trainee of data.created_trainees) {
                            if (trainee.emailData) {
                              sendEmailJs(trainee.emailData).then(result => {
                                console.log(`Email sent to ${trainee.email}:`, result);
                                if (result.success) {
                                  toast({ title: 'Email Sent', description: `Email sent to ${trainee.email}`, });
                                } else {
                                  toast({ title: 'Email Failed', description: `Email failed for ${trainee.email}: ${result.message}`, });
                                }
                              }).catch(err => {
                                console.error(`Email failed for ${trainee.email}:`, err);
                                toast({ title: 'Email Failed', description: `Email failed for ${trainee.email}: ${err?.message || err}`, });
                              });
                            }
                          }
                        }
                      } else {
                        setBatchActionStatus(s => ({ ...s, [batch._id]: 'error' }));
                      }
                    } catch {
                      setBatchActionStatus(s => ({ ...s, [batch._id]: 'error' }));
                    }
                  }}
                >
                  {batch.accounts_created ? 'Accounts Created' : batchActionStatus?.[batch._id] === 'loading' ? 'Creating...' : 'Create Accounts'}
                </button>
                {batchActionStatus?.[batch._id] === 'success' && <div className="text-green-600 font-semibold mt-2">Accounts created!</div>}
                {batchActionStatus?.[batch._id] === 'error' && <div className="text-red-600 font-semibold mt-2">Error creating accounts.</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Trainee list for skill group (batch detail view)
  if (selectedBatch && !selectedSkill && !selectedTrainee) {
    const avgProgress = (selectedBatch.trainees as Trainee[]).length > 0 ? (selectedBatch.trainees as Trainee[]).reduce((acc, t) => acc + (t.progress || 0), 0) / (selectedBatch.trainees as Trainee[]).length : 0;
    return (
      <div className="w-full h-full flex flex-col items-start justify-start p-8">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-8">
          <button onClick={() => { setSelectedBatch(null); setSelectedBatchGroup(null); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/70 shadow-md hover:shadow-lg active:shadow-inner transition-all border border-orange-100" style={{ boxShadow: '0 2px 8px 0 #ff7c2b22', backdropFilter: 'blur(4px)' }} aria-label="Back">
            <ArrowLeft className="h-7 w-7 text-orange-400" />
          </button>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-extrabold text-orange-500" style={font}>{selectedBatch.skill.charAt(0).toUpperCase() + selectedBatch.skill.slice(1)} - Batch {selectedBatch.batch_number}</span>
            <span className="text-base text-orange-400 font-semibold">Skill group for {selectedBatch.skill} specialization</span>
          </div>
        </div>
        {/* Overall Progress Bar */}
        <div className="rounded-2xl bg-white/80 shadow p-6 mb-8 w-full max-w-4xl">
          <div className="text-lg font-bold text-orange-500 mb-2">Overall Batch Progress</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 relative">
              <Progress value={avgProgress} className="h-4 bg-orange-100 rounded-full" style={{ accentColor: '#FF7C2B' }} />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold" style={{ textShadow: '0 1px 4px #ff7c2b88' }}>{Math.round(avgProgress)}%</span>
            </div>
            <span className="text-sm text-orange-400 font-bold ml-2">{Math.round(avgProgress)}% complete</span>
          </div>
          <div className="text-base text-gray-500 mt-2">Skill group for {selectedBatch.skill.charAt(0).toUpperCase() + selectedBatch.skill.slice(1)} specialization.</div>
        </div>
        {/* Trainee Table */}
        <div className="rounded-2xl bg-white/80 shadow p-6 w-full max-w-6xl">
          <div className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-orange-400" /> Trainees in this Batch ({selectedBatch.trainees.length})</div>
          <table className="w-full rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-orange-100 text-orange-500">
                <th className="py-3 px-4 font-bold text-center" style={{width: '80px'}}>Photo</th>
                <th className="py-3 px-4 font-bold text-left" style={{minWidth: '180px', maxWidth: '260px'}}>Name</th>
                <th className="py-3 px-4 font-bold text-center" style={{width: '90px'}}>User ID</th>
                <th className="py-3 px-4 font-bold text-left" style={{minWidth: '220px', maxWidth: '320px'}}>Email</th>
                <th className="py-3 px-4 font-bold text-center" style={{width: '160px'}}>Progress</th>
                <th className="py-3 px-4 font-bold text-center" style={{width: '110px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(selectedBatch.trainees as Trainee[]).map((trainee, idx) => (
                <tr key={trainee.email} className={idx % 2 === 0 ? "bg-white/90" : "bg-orange-50/60"}>
                  <td className="py-3 px-4 text-center align-middle" style={{width: '80px'}}>
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-500 text-lg shadow mx-auto">
                      {getInitials(trainee.name)}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle font-semibold text-orange-700 text-base text-left" style={{minWidth: '180px', maxWidth: '260px'}}>
                    {trainee.name}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-center align-middle" style={{width: '90px'}}>{trainee.empId || '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-left align-middle" style={{minWidth: '220px', maxWidth: '320px'}}>{trainee.email}</td>
                  <td className="py-3 px-4 align-middle text-center" style={{width: '160px'}}>
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={trainee.progress || 0} className="w-28 h-2 bg-orange-100" style={{ accentColor: '#FF7C2B' }} />
                      <span className="text-xs text-orange-400 font-bold">{trainee.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center" style={{width: '110px'}}>
                    <button className="text-orange-500 font-bold hover:underline" onClick={() => setSelectedTrainee(trainee)}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. Trainee profile detail view
  if (selectedTrainee) {
    // Mock tasks for demo
    const tasks = [
      { title: "Install IDE and SDK", status: "completed", marks: 90, feedback: "Well done on the setup!" },
      { title: "Hello World Program", status: "completed", marks: 100, feedback: "Perfect execution." },
      { title: "Variables and Data Types Exercise", status: "in-progress", marks: null, feedback: null },
    ];
    // Info grid icons (SVG inline for accent)
    const infoIcon = (icon: string) => {
      switch (icon) {
        case 'mail': return <svg className="inline mr-1" width="18" height="18" fill="none" stroke="#FF7C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="12" rx="2"/><polyline points="2,4 10,12 18,4"/></svg>;
        case 'batch': return <svg className="inline mr-1" width="18" height="18" fill="none" stroke="#FF7C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="14" height="7" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/></svg>;
        case 'user': return <svg className="inline mr-1" width="18" height="18" fill="none" stroke="#FF7C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 17v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/></svg>;
        case 'module': return <svg className="inline mr-1" width="18" height="18" fill="none" stroke="#FF7C2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="12" height="12" rx="2"/><path d="M7 7h4v4H7z"/></svg>;
        default: return null;
      }
    };
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-start p-6" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)' }}>
        {/* Remove centered pill back button, add circular back button to left of card header */}
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white/60 backdrop-blur-md shadow-2xl p-0 mt-10 border border-white/30 relative" style={{ boxShadow: '0 8px 32px 0 #ff7c2b22' }}>
          {/* Header with back button */}
          <div className="flex items-center gap-5 px-8 pt-8 pb-2">
            <button
              className="flex items-center justify-center h-12 w-12 rounded-full border border-orange-200 bg-white/80 shadow text-orange-500 hover:bg-orange-50 hover:shadow-lg transition-all duration-150 mr-4"
              style={{ boxShadow: '0 2px 12px 0 #ff7c2b22' }}
              onClick={() => setSelectedTrainee(null)}
              aria-label="Back"
            >
              <svg width="28" height="28" fill="none" stroke="#FF7C2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21l-7-7 7-7"/></svg>
            </button>
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-500 text-2xl shadow" style={{ backgroundImage: selectedTrainee.photo ? `url(${selectedTrainee.photo})` : undefined, backgroundSize: 'cover' }}>
              {!selectedTrainee.photo && getInitials(selectedTrainee.name)}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-orange-500 tracking-tight" style={{ letterSpacing: '-0.04em' }}>{selectedTrainee.name}</h2>
              <div className="text-orange-400 font-semibold text-sm">Maverick Profile & Progress</div>
            </div>
          </div>
          {/* Info grid: two columns, left: email, batch; right: user id, module */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-8 pt-2 pb-2">
            <div className="flex items-center gap-2 text-gray-700 text-sm">{infoIcon('mail')}<span>Email: {selectedTrainee.email}</span></div>
            <div className="flex items-center gap-2 text-gray-700 text-sm">{infoIcon('user')}<span>User ID: {selectedTrainee.empId || '-'}</span></div>
            <div className="flex items-center gap-2 text-gray-700 text-sm">{infoIcon('batch')}<span>Batch: {selectedBatch?.skill ? `batch_${selectedBatch.skill}_${selectedBatch.batch_number}` : '-'}</span></div>
            <div className="flex items-center gap-2 text-gray-700 text-sm">{infoIcon('module')}<span>Current Module: module_phase1_lang_basics</span></div>
          </div>
          {/* Progress bar */}
          <div className="px-8 pb-2">
            <div className="font-bold text-base mb-1 text-gray-700">Overall Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="w-full h-5 rounded-full bg-orange-100 relative overflow-hidden">
                  <div className="h-5 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center" style={{ width: `${selectedTrainee.progress || 0}%`, transition: 'width 0.5s' }}>
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold" style={{ textShadow: '0 1px 4px #ff7c2b88' }}>{selectedTrainee.progress || 0}%</span>
                  </div>
                </div>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-500 text-xs font-bold">{selectedTrainee.progress || 0}% complete</span>
              </div>
            </div>
          </div>
          <hr className="my-2 border-orange-100" />
          {/* Tasks Overview */}
          <div className="px-8 pb-8">
            <div className="text-lg font-bold text-orange-500 mb-3">Tasks Overview</div>
            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div key={idx} className={`rounded-xl border p-4 flex flex-col gap-1 ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-100'}`}> 
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold ${task.status === 'completed' ? 'text-green-700' : 'text-orange-700'}`}>{task.title}</span>
                    <span className="text-orange-500 text-sm cursor-pointer hover:underline">Review</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">Status: {task.status}{task.marks !== null ? ` (Marks: ${task.marks})` : ''}</div>
                  {task.feedback && <div className="text-xs text-purple-700 italic">Your Feedback: "{task.feedback}"</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BatchManagement; 