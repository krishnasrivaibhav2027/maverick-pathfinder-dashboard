import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface Trainee {
  name: string;
  email: string;
  empId: string;
  progress?: number;
  skill?: string;
}

const TraineeList: React.FC = () => {
  const { batchId, skill } = useParams();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!batchId || !skill) return;
    fetch(`http://localhost:8000/batches/${batchId}/skill-groups/${skill}/trainees`)
      .then(res => res.json())
      .then((data: Trainee[]) => setTrainees(data))
      .finally(() => setLoading(false));
  }, [batchId, skill]);

  if (loading) return <div className="p-8 text-gray-400">Loading trainees...</div>;
  if (!trainees.length) return <div className="p-8 text-gray-400">No trainees available for this skill group.</div>;

  return (
    <div className="w-full flex flex-col items-start justify-start pt-2 pb-8">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-6">Back</Button>
      <h2 className="text-2xl font-bold mb-6" style={font}>Trainees in {skill}</h2>
      <div className="flex flex-col gap-4 w-full max-w-2xl">
        {trainees.map(trainee => (
          <div key={trainee.empId} className="flex items-center justify-between bg-white/80 shadow rounded-xl px-6 py-4">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-orange-400" />
              <div>
                <div className="font-semibold text-lg text-orange-700">{trainee.name}</div>
                <div className="text-gray-500 text-sm">{trainee.empId}</div>
                <div className="text-gray-500 text-sm">{trainee.email}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`trainee/${trainee.empId}`)}>View Details</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraineeList; 