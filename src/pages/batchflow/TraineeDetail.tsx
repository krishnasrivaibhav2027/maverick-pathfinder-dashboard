import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface Trainee {
  name: string;
  email: string;
  empId: string;
  progress?: number;
  skill?: string;
  status?: string;
  phase?: number;
  specialization?: string;
}

const TraineeDetail: React.FC = () => {
  const { empId } = useParams();
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!empId) return;
    fetch(`http://localhost:8000/trainees/${empId}`)
      .then(res => {
        if (!res.ok) throw new Error("Trainee not found");
        return res.json();
      })
      .then((data: Trainee) => {
        setTrainee(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setTrainee(null);
      })
      .finally(() => setLoading(false));
  }, [empId]);

  if (loading) return <div className="p-8 text-gray-400">Loading trainee details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!trainee) return null;

  return (
    <div className="w-full flex flex-col items-start justify-start pt-2 pb-8 max-w-2xl">
      <Button onClick={() => navigate(-1)} variant="outline" className="mb-6">Back</Button>
      <h2 className="text-2xl font-bold mb-6" style={font}>Trainee Detail</h2>
      <div className="bg-white/80 shadow rounded-xl px-8 py-6 w-full">
        <div className="font-semibold text-lg text-orange-700 mb-2">{trainee.name}</div>
        <div className="text-gray-500 text-sm mb-1">EmpID: {trainee.empId}</div>
        <div className="text-gray-500 text-sm mb-1">Email: {trainee.email}</div>
        <div className="text-gray-500 text-sm mb-1">Phase: {trainee.phase}</div>
        <div className="text-gray-500 text-sm mb-1">Status: {trainee.status}</div>
        <div className="text-gray-500 text-sm mb-1">Specialization: {trainee.specialization}</div>
        <div className="text-gray-500 text-sm mb-1">Progress: {trainee.progress ?? 0}%</div>
      </div>
    </div>
  );
};

export default TraineeDetail; 