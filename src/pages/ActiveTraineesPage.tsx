import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ActiveTraineesPage = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null);
  const [specFilter, setSpecFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const response = await fetch("http://localhost:8000/trainees");
        const data = await response.json();
        setTrainees(data.filter((t: any) => t.status === 'active'));
      } catch (error) {
        console.error("Failed to fetch trainees:", error);
      }
    };
    fetchTrainees();
  }, []);

  // Get unique phases and specializations for filters
  const phases = Array.from(new Set(trainees.map(t => t.phase))).sort();
  const specializations = Array.from(new Set(trainees.map(t => t.specialization)));

  // Filter and sort trainees
  let filtered = trainees.filter(t => {
    if (phaseFilter && String(t.phase) !== String(phaseFilter)) return false;
    if (specFilter && t.specialization !== specFilter) return false;
    if (search && !(
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.empId.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });
  filtered = filtered.sort((a, b) => b.progress - a.progress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Active Trainees</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Search by name, empId, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select value={phaseFilter || ''} onChange={e => setPhaseFilter(e.target.value || null)} className="border rounded px-2 py-1">
          <option value="">All Phases</option>
          {phases.map(phase => (
            <option key={phase} value={phase}>Phase {phase}</option>
          ))}
        </select>
        <select value={specFilter || ''} onChange={e => setSpecFilter(e.target.value || null)} className="border rounded px-2 py-1">
          <option value="">All Specializations</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
        {(phaseFilter || specFilter || search) && (
          <button className="ml-2 text-blue-600 underline" onClick={() => { setPhaseFilter(null); setSpecFilter(null); setSearch(""); }}>Clear Filters</button>
        )}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((trainee) => {
          const isNotActive = trainee.progress === 0;
          return (
            <div key={trainee.empId} className="border rounded-lg p-4 bg-white shadow hover:bg-gray-50 transition-colors h-full flex flex-col">
              <CardContent className="p-0 flex-grow">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainee.name}`} />
                      <AvatarFallback>{trainee.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{trainee.name}</h3>
                      <p className="text-sm text-gray-600">{trainee.empId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-semibold">{trainee.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      {isNotActive ? (
                        <Badge className="bg-red-600 text-white">Inactive</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={trainee.progress} className={`w-full${isNotActive ? ' bg-red-200' : ''}`} style={isNotActive ? { backgroundColor: '#fee2e2' } : {}} />
                        <p className={`font-semibold${isNotActive ? ' text-red-600' : ''}`}>{trainee.progress}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Score</p>
                      <p className="font-semibold text-green-600">{trainee.score}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phase</p>
                      <Badge variant={trainee.phase === 2 ? "default" : "secondary"}>Phase {trainee.phase}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Specialization</p>
                      <Badge variant="outline">{trainee.specialization}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Created At</p>
                      <p className="font-semibold">{trainee.created_at ? new Date(trainee.created_at).toLocaleString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Login</p>
                      <p className="font-semibold">{trainee.last_login ? new Date(trainee.last_login).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-gray-500 mt-12">No trainees found for the selected filters.</div>
      )}
    </div>
  );
};

export default ActiveTraineesPage; 