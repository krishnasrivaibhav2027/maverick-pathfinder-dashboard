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
  account_created?: boolean;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const TraineeList: React.FC = () => {
  const { batchId, skill } = useParams();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCreateAccount = (empId: string) => {
    fetch(`http://localhost:8000/trainees/${empId}/create-account`, {
      method: 'POST',
    })
      .then(res => res.json())
      .then(() => {
        // Refresh the trainee list to show the updated status
        fetch(`http://localhost:8000/batches/${batchId}/skill-groups/${skill}/trainees`)
          .then(res => res.json())
          .then((data: Trainee[]) => setTrainees(data));
      });
  };

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
          <Users className="h-6 w-6" />
          Trainees in {skill}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trainees.map((trainee) => (
          <Card key={trainee.empId} className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-orange-100 text-orange-500 font-bold text-2xl">
                    {getInitials(trainee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{trainee.name}</h3>
                  <p className="text-sm text-gray-500">{trainee.email}</p>
                  <p className="text-sm text-gray-500">{trainee.empId}</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={trainee.progress || 0} className="w-full" />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  {trainee.account_created ? (
                    <span className="text-green-500">Account Created</span>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCreateAccount(trainee.empId)}
                    >
                      Create Account
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/trainee/${trainee.empId}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TraineeList; 