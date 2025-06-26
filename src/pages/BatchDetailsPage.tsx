import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const BatchDetailsPage = () => {
  const { batchName: batchId } = useParams<{ batchName: string }>();
  const [batch, setBatch] = useState<any>(null);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [allTrainees, setAllTrainees] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, traineesRes] = await Promise.all([
          fetch(`http://localhost:8000/batches/${batchId}`),
          fetch("http://localhost:8000/trainees")
        ]);
        const batchData = await batchRes.json();
        const traineesData = await traineesRes.json();
        setBatch(batchData);
        setAllTrainees(traineesData);
        setTrainees(traineesData.filter((t: any) => t.batch === batchId));
      } catch (error) {
        console.error("Failed to fetch batch/trainees:", error);
      }
    };
    fetchData();
  }, [batchId]);

  const avgProgress = trainees.length ? Math.round(trainees.reduce((sum, t) => sum + (t.progress || 0), 0) / trainees.length) : 0;
  const unassignedTrainees = allTrainees.filter((t: any) => !t.batch);

  // Assign trainee to batch
  const handleAddTrainee = async () => {
    if (!selectedTrainee) return;
    try {
      await fetch(`http://localhost:8000/trainees/${selectedTrainee}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: batchId })
      });
      setTrainees(prev => [...prev, allTrainees.find(t => t.empId === selectedTrainee)]);
      setShowAdd(false);
      setSelectedTrainee("");
    } catch (error) {
      console.error("Failed to assign trainee:", error);
    }
  };

  // Remove trainee from batch
  const handleRemoveTrainee = async (empId: string) => {
    try {
      await fetch(`http://localhost:8000/trainees/${empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: null })
      });
      setTrainees(prev => prev.filter(t => t.empId !== empId));
    } catch (error) {
      console.error("Failed to remove trainee:", error);
    }
  };

  if (!batch) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{batch.name}</h1>
          <p className="text-gray-600">Instructor: {batch.instructor}</p>
          <p className="text-gray-500">{batch.description}</p>
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>Start: {batch.start_date || '-'}</span>
            <span>End: {batch.end_date || '-'}</span>
            <span>Modules: {batch.modules?.length || 0}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/manage-batches')}>Back to Batches</Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Overall Batch Progress</h2>
        <Progress value={avgProgress} className="mb-2" />
        <span className="text-gray-500 text-sm">{avgProgress}% complete</span>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Mavericks in this Batch ({trainees.length})</h2>
          <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowAdd(true)}>+ Add Maverick</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4">Photo</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">User ID</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Progress</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainees.map((trainee) => (
                <tr key={trainee.empId} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainee.name}`} />
                      <AvatarFallback>{trainee.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="py-2 px-4 font-medium">{trainee.name}</td>
                  <td className="py-2 px-4">{trainee.empId}</td>
                  <td className="py-2 px-4">{trainee.email}</td>
                  <td className="py-2 px-4">
                    <Progress value={trainee.progress} className="w-32" />
                    <span className="text-xs text-gray-500 ml-2">{trainee.progress}%</span>
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/trainee-dashboard/${trainee.empId}`)}>View Details</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveTrainee(trainee.empId)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Add Maverick to Batch</h2>
              <select className="border rounded px-3 py-2 w-full mb-4" value={selectedTrainee} onChange={e => setSelectedTrainee(e.target.value)}>
                <option value="">Select Maverick</option>
                {unassignedTrainees.map(t => (
                  <option key={t.empId} value={t.empId}>{t.name} ({t.empId})</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button className="bg-green-500 hover:bg-green-600" onClick={handleAddTrainee} disabled={!selectedTrainee}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetailsPage; 