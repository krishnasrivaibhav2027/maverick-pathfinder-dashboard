import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Send, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Types
interface CreatedTrainee {
  name: string;
  email: string;
  empId: string;
  password: string;
  emailData: Record<string, unknown>;
}
interface FailedTrainee {
  name: string;
  email: string;
  error: string;
}
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

// Dummy admin context (replace with real context or prop)
const isAdmin = true;

const BatchManagement = () => {
  const [grouped, setGrouped] = useState<GroupedBatches>({});
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [results, setResults] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Fetch grouped batches
  useEffect(() => {
    fetch("http://localhost:8000/batches/grouped")
      .then(res => res.json())
      .then((data: GroupedBatches) => {
        setGrouped(data);
        const phases = Object.keys(data);
        if (phases.length > 0) setSelectedPhase(phases[0]);
      });
  }, []);

  // Handle phase change
  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    setSelectedBatch("");
  };

  // Handle batch number change
  const handleBatchChange = (batchNum: string) => {
    setSelectedBatch(batchNum);
  };

  // Move batch to next phase (placeholder)
  const moveToNextPhase = async (batch: Batch) => {
    // TODO: Implement backend endpoint to update phase
    toast({ title: "Move to Next Phase", description: `Batch ${batch.batch_number} (${batch.skill}) moved to next phase.` });
  };

  // Set next batch date (placeholder)
  const setNextBatchDate = async (batch: Batch, date: string) => {
    // TODO: Implement backend endpoint to set next batch date
    toast({ title: "Next Batch Date Set", description: `Next batch date set to ${date}` });
  };

  // Create accounts for a batch
  const handleCreateAccounts = async (batch: Batch) => {
    try {
      const response = await fetch(`http://localhost:8000/onboarding/create-accounts-for-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batch._id })
      });
      const data = await response.json();
      if (response.ok && data.created_trainees) {
        setResults((prev) => ({ ...prev, [batch._id]: data }));
        toast({ title: "Accounts created", description: `${data.created_trainees.length} trainees processed.` });
        // Optionally: trigger EmailJS here
      } else {
        toast({ variant: "destructive", title: "Account creation failed", description: data.detail || "Failed to create accounts." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to backend." });
    }
  };

  // Filtered phases and batches
  const phases = Object.keys(grouped).sort();
  const batchesForPhase = selectedPhase ? Object.keys(grouped[selectedPhase] || {}).sort() : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Batch Management
          </CardTitle>
          <CardDescription>
            Manage all batches by phase, batch number, and skill. Move batches to next phase, set next batch dates, and create accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Phase Tabs */}
          <Tabs value={selectedPhase} onValueChange={handlePhaseChange} className="mb-6">
            <TabsList>
              {phases.map((phase) => (
                <TabsTrigger key={phase} value={phase}>{`Phase ${phase}`}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Batch Number Tabs */}
          {selectedPhase && (
            <Tabs value={selectedBatch} onValueChange={handleBatchChange} className="mb-6">
              <TabsList>
                {batchesForPhase.map((batchNum) => (
                  <TabsTrigger key={batchNum} value={batchNum}>{`Batch ${batchNum}`}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Skill Batches Display */}
          {selectedPhase && selectedBatch && (
            <div className="grid md:grid-cols-3 gap-6">
              {['python', 'java', '.net', 'mixed'].map((skill) => {
                const batch = grouped[selectedPhase]?.[selectedBatch]?.[skill];
                if (!batch) return null;
                if (batch.is_next_batch && !isAdmin) return null; // Admin-only next batch
                return (
                  <Card key={skill} className="border-2">
                    <CardHeader>
                      <CardTitle>
                        {batch.is_next_batch ? 'Next Batch (Overflow)' : `${skill.toUpperCase()} Batch ${batch.batch_number}`}
                      </CardTitle>
                      <CardDescription>
                        Phase: {batch.phase} | Trainees: {batch.trainees.length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-40 overflow-y-auto border rounded-lg mb-4">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Email</th>
                              <th className="px-2 py-1 text-left">Skill</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.trainees.map((t, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{t.name}</td>
                                <td className="px-2 py-1">{t.email}</td>
                                <td className="px-2 py-1">{t.skill}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Button size="sm" onClick={() => handleCreateAccounts(batch)} disabled={batch.accounts_created}>
                          <Send className="h-4 w-4 mr-1" />
                          {batch.accounts_created ? "Accounts Created" : "Create Accounts"}
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => moveToNextPhase(batch)}>
                            <ChevronRight className="h-4 w-4 mr-1" />
                            Move to Next Phase
                          </Button>
                        )}
                      </div>
                      {isAdmin && batch.is_next_batch && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4" />
                          <Input
                            type="date"
                            className="w-auto"
                            onChange={e => setNextBatchDate(batch, e.target.value)}
                          />
                        </div>
                      )}
                      {/* Results for this batch */}
                      {results[batch._id] && (
                        <div className="mt-4">
                          <div className="font-semibold mb-2">Results:</div>
                          <div className="text-green-700 mb-1">Created: {results[batch._id].created_trainees.length}</div>
                          <div className="text-red-700 mb-1">Failed: {results[batch._id].failed_trainees.length}</div>
                          {/* List created trainees with credentials */}
                          {results[batch._id].created_trainees.length > 0 && (
                            <div className="max-h-24 overflow-y-auto border rounded-lg mt-2">
                              <table className="w-full text-xs">
                                <thead className="bg-green-50 sticky top-0">
                                  <tr>
                                    <th className="px-2 py-1 text-left">Name</th>
                                    <th className="px-2 py-1 text-left">Email</th>
                                    <th className="px-2 py-1 text-left">Employee ID</th>
                                    <th className="px-2 py-1 text-left">Password</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results[batch._id].created_trainees.map((trainee: CreatedTrainee, idx: number) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-2 py-1">{trainee.name}</td>
                                      <td className="px-2 py-1">{trainee.email}</td>
                                      <td className="px-2 py-1">{trainee.empId}</td>
                                      <td className="px-2 py-1 font-mono text-xs">{trainee.password}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {/* List failed trainees */}
                          {results[batch._id].failed_trainees.length > 0 && (
                            <div className="max-h-24 overflow-y-auto border rounded-lg mt-2">
                              <table className="w-full text-xs">
                                <thead className="bg-red-50 sticky top-0">
                                  <tr>
                                    <th className="px-2 py-1 text-left">Name</th>
                                    <th className="px-2 py-1 text-left">Email</th>
                                    <th className="px-2 py-1 text-left">Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results[batch._id].failed_trainees.map((trainee: FailedTrainee, idx: number) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-2 py-1">{trainee.name}</td>
                                      <td className="px-2 py-1">{trainee.email}</td>
                                      <td className="px-2 py-1 text-red-600">{trainee.error}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchManagement; 