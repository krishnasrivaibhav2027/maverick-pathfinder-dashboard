import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

const phaseTrainingsData = {
  1: [
    { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
    { id: 2, title: "Version Control (Git)", status: "in-progress", progress: 60 },
    { id: 3, title: "Database Fundamentals", status: "pending", progress: 0 },
  ],
  2: [
    { id: 1, title: "Python Development", status: "pending", progress: 0 },
    { id: 2, title: "Java Enterprise", status: "pending", progress: 0 },
    { id: 3, title: ".NET Framework", status: "pending", progress: 0 },
  ],
};

export default function PhaseTrainings() {
  const { phaseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const phase = Number(phaseId);
  const trainings = phaseTrainingsData[phase] || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Phase {phase} Trainings</CardTitle>
            <CardDescription>
              {phase === 1 ? "Foundation Training: Core programming and development fundamentals" : "Domain Specialization: Choose your track and master advanced skills"}
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="space-y-6">
          {trainings.map((training) => (
            <Card key={training.id} className="shadow-md border-slate-200">
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {training.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-lg font-semibold">{training.title}</span>
                      <Badge variant={training.status === "completed" ? "success" : training.status === "in-progress" ? "default" : "secondary"} className="ml-2">
                        {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                      </Badge>
                    </div>
                    <Progress value={training.progress} className="w-48 md:w-64" />
                  </div>
                  <div>
                    {training.status === "completed" ? (
                      <Button variant="outline">Review</Button>
                    ) : training.status === "in-progress" ? (
                      <Button>Continue</Button>
                    ) : (
                      <Button>Start</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 