import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      <div className="flex flex-row items-center mb-8 mt-2 pl-0">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80 flex items-center gap-2"
          style={font}
        >
          <ArrowLeft className="h-5 w-5 text-orange-500" />
          Back
        </Button>
        <h2
          className="text-2xl font-bold flex items-center gap-2 text-orange-500 ml-4"
          style={font}
        >
          Trainees in {skill}
        </h2>
      </div>
      <div className="flex flex-row flex-wrap gap-8">
        {trainees.map((trainee) => {
          const progressValue = typeof trainee.progress === 'number' ? trainee.progress : 0;
          return (
            <div
              key={trainee.email}
              role="button"
              tabIndex={0}
              className="rounded-3xl bg-white p-8 flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105 border border-orange-100 min-w-[220px] max-w-[260px] min-h-[220px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{ boxShadow: '0 8px 32px 0 #ff7c2b22', ...font }}
              onClick={() => navigate(`trainee/${trainee.empId}`)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`trainee/${trainee.empId}`); }}
            >
              <Avatar className="h-14 w-14 mb-3 shadow">
                <AvatarFallback className="bg-orange-100 text-orange-500 font-bold text-2xl">
                  {getInitials(trainee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xl font-extrabold text-orange-500 mb-1 tracking-tight text-center" style={{ letterSpacing: '-0.03em' }}>
                {trainee.name}
              </span>
              <span className="text-base text-gray-500 font-semibold mb-1">{trainee.empId}</span>
              <span className="text-base text-gray-400 font-medium mb-2">{trainee.email}</span>
              <div className="flex flex-col items-center w-full mt-2">
                <span className="text-sm text-gray-400 font-medium mb-1">Avg Progress:</span>
                <div className="flex items-center gap-2 w-full justify-center">
                  <Progress value={progressValue} className="w-24 h-2 bg-orange-100" style={{ accentColor: '#FF7C2B' }} />
                  <span className="text-sm text-orange-500 font-bold">{progressValue}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TraineeList; 