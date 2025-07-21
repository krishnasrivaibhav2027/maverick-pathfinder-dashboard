import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface Trainee {
  name: string;
  email: string;
  empId: string;
  progress?: number;
  skill?: string;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
      <div className="rounded-2xl bg-white/80 shadow p-6 w-full max-w-4xl">
        <div className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-orange-400" /> Trainees ({trainees.length})</div>
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
            {trainees.map((trainee, idx) => {
              const progressValue = typeof trainee.progress === 'number' ? trainee.progress : 0;
              return (
                <tr key={trainee.email} className={idx % 2 === 0 ? "bg-white/90" : "bg-orange-50/60"}>
                  <td className="py-3 px-4 text-center align-middle" style={{width: '80px'}}>
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-500 text-lg shadow mx-auto">
                      {getInitials(trainee.name)}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle font-semibold text-orange-700 text-base text-left" style={{minWidth: '180px', maxWidth: '260px'}}>
                    {trainee.name}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-center align-middle" style={{width: '90px'}}>{trainee.empId}</td>
                  <td className="py-3 px-4 text-gray-500 text-left align-middle" style={{minWidth: '220px', maxWidth: '320px'}}>{trainee.email}</td>
                  <td className="py-3 px-4 align-middle text-center" style={{width: '160px'}}>
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={progressValue} className="w-28 h-2 bg-orange-100" style={{ accentColor: '#FF7C2B' }} />
                      <span className="text-xs text-orange-400 font-bold">{progressValue}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center" style={{width: '110px'}}>
                    <Button variant="outline" size="sm" onClick={() => navigate(`trainee/${trainee.empId}`)}>View Details</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TraineeList; 