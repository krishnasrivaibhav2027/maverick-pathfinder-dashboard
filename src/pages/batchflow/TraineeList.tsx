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
      <div className="w-full bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8">
        <div className="space-y-4">
          {trainees.map((trainee) => (
            <div key={trainee.empId} className="p-4 rounded-2xl bg-white/80 shadow-md border border-orange-100 hover:bg-orange-50/80 transition-colors duration-300">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="col-span-2">
                  <div className="font-bold text-lg text-orange-600">{trainee.name}</div>
                  <div className="text-sm text-gray-500">{trainee.email}</div>
                  <div className="text-sm text-gray-500">{trainee.empId}</div>
                </div>
                <div className="col-span-2">
                  <Progress value={trainee.progress || 0} className="w-full h-3" />
                </div>
                <div>
                  {/* Placeholder for status */}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/trainee/${trainee.empId}`)}
                    className="rounded-full font-semibold border-orange-200 text-orange-500 hover:bg-orange-100 hover:text-orange-600"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraineeList; 