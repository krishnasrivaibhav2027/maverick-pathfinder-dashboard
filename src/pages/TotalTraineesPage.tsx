import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Type for groupBy
const groupBy = <T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> => arr.reduce((acc, item) => {
  const group = String(item[key]) || 'Unknown';
  acc[group] = acc[group] || [];
  acc[group].push(item);
  return acc;
}, {} as Record<string, T[]>);

const TotalTraineesPage = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [batchFilter, setBatchFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const response = await fetch("http://localhost:8000/trainees");
        const data = await response.json();
        setTrainees(data);
      } catch (error) {
        console.error("Failed to fetch trainees:", error);
      }
    };
    fetchTrainees();
  }, []);

  // Get unique batches for filter
  const batches = Array.from(new Set(trainees.map(t => t.batch)));

  // Filter trainees by batch and search
  let filteredTrainees = trainees;
  if (batchFilter) filteredTrainees = filteredTrainees.filter(t => t.batch === batchFilter);
  if (search) filteredTrainees = filteredTrainees.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.empId.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  // Group by batch, then by phase, then by specialization
  const byBatch = groupBy(filteredTrainees, 'batch');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Total Trainees</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Search by name, empId, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select value={batchFilter || ''} onChange={e => setBatchFilter(e.target.value || null)} className="border rounded px-2 py-1">
          <option value="">All Batches</option>
          {batches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
        {(batchFilter || search) && (
          <button className="ml-2 text-blue-600 underline" onClick={() => { setBatchFilter(null); setSearch(""); }}>Clear Filters</button>
        )}
      </div>
      {Object.entries(byBatch).map(([batch, batchTrainees]) => {
        const byPhase = groupBy(batchTrainees, 'phase');
        return (
          <div key={batch} className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{batch}</h2>
            {Object.entries(byPhase).map(([phase, phaseTrainees]) => {
              const bySpec = groupBy(phaseTrainees, 'specialization');
              return (
                <div key={phase} className="mb-10">
                  <h3 className="text-xl font-semibold mb-2">Phase {phase}</h3>
                  {Object.entries(bySpec).map(([spec, specTrainees]) => (
                    <div key={spec} className="mb-6">
                      <h4 className="text-lg font-medium mb-2">Specialization: {spec}</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(specTrainees as any[]).map((trainee) => (
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
                                    <p className="text-gray-500">Batch</p>
                                    <Badge variant="outline">{trainee.batch}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Status</p>
                                    <Badge variant={trainee.status === 'active' ? 'default' : 'destructive'}>{trainee.status}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Progress</p>
                                    <div className="flex items-center gap-2">
                                      <Progress value={trainee.progress} className="w-full" />
                                      <p className="font-semibold">{trainee.progress}%</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Score</p>
                                    <p className="font-semibold text-green-600">{trainee.score}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Created At</p>
                                    <p className="font-semibold">{trainee.created_at ? new Date(trainee.created_at).toLocaleString() : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Last Login</p>
                                    <p className="font-semibold">{trainee.last_login ? new Date(trainee.last_login).toLocaleString() : '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-500">Specialization</p>
                                    <Badge variant="outline">{trainee.specialization}</Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default TotalTraineesPage; 