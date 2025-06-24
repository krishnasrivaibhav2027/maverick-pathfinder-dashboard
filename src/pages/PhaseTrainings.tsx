import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, Lock } from "lucide-react";

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

const PHASE_UNLOCK_THRESHOLD = 80;

export default function PhaseTrainings() {
  const navigate = useNavigate();
  const [selectedPhase, setSelectedPhase] = useState(1);

  // Calculate overall progress for each phase
  const phaseProgress = useMemo(() => {
    const calc = (phase) => {
      const trainings = phaseTrainingsData[phase];
      if (!trainings || trainings.length === 0) return 0;
      const total = trainings.reduce((sum, t) => sum + t.progress, 0);
      return Math.round(total / trainings.length);
    };
    return {
      1: calc(1),
      2: calc(2),
    };
  }, []);

  const isPhase2Locked = phaseProgress[1] < PHASE_UNLOCK_THRESHOLD;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        {/* Phase Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedPhase === 1 ? "default" : "outline"}
            onClick={() => setSelectedPhase(1)}
            className="w-40"
          >
            Phase 1
          </Button>
          <Button
            variant={selectedPhase === 2 ? "default" : "outline"}
            onClick={() => !isPhase2Locked && setSelectedPhase(2)}
            className="w-40"
            disabled={isPhase2Locked}
          >
            Phase 2
          </Button>
        </div>
        {/* Sliding Cards Container */}
        <div
          className="relative overflow-hidden"
          style={{ height: 320 }}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${(selectedPhase - 1) * 52}%)` }}
          >
            {/* Phase 1 Card */}
            <div className="w-[48%] min-w-[350px] max-w-lg mr-8">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle>Phase 1: Foundation Training</CardTitle>
                  </div>
                  <CardDescription>Core programming and development fundamentals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 font-semibold">Overall Progress <span className="float-right text-green-600">{phaseProgress[1]}%</span></div>
                  <Progress value={phaseProgress[1]} className="mb-6" />
                  <div className="space-y-4">
                    {phaseTrainingsData[1].map((training) => (
                      <div key={training.id} className="flex items-center gap-3">
                        {training.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="font-medium">{training.title}</span>
                        <Badge variant={training.status === "completed" ? "default" : training.status === "in-progress" ? "default" : "secondary"} className="ml-2">
                          {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                        </Badge>
                        <span className="ml-auto text-xs text-gray-500">{training.progress}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Phase 2 Card */}
            <div className="w-[48%] min-w-[350px] max-w-lg">
              <Card className="h-full opacity-100">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-gray-700">Phase 2: Domain Specialization</CardTitle>
                  </div>
                  <CardDescription className="text-gray-500">
                    Locked - Complete Phase 1 with 80%+ score (Current: {phaseProgress[1]}%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-32">
                    <Lock className="h-10 w-10 text-gray-300 mb-2" />
                    <div className="text-gray-400 mb-2 text-center">Complete Phase 1 to unlock specialization tracks</div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Badge variant="secondary">Python Development</Badge>
                      <Badge variant="secondary">Java Enterprise</Badge>
                      <Badge variant="secondary">.NET Framework</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* Trainings for Phase 2 (if unlocked and selected) */}
        {selectedPhase === 2 && !isPhase2Locked && (
          <div className="mt-8 max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Phase 2 Trainings</CardTitle>
                <CardDescription>Choose your track and master advanced skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2 font-semibold">Overall Progress <span className="float-right text-green-600">{phaseProgress[2]}%</span></div>
                <Progress value={phaseProgress[2]} className="mb-6" />
                <div className="space-y-4">
                  {phaseTrainingsData[2].map((training) => (
                    <div key={training.id} className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{training.title}</span>
                      <Badge variant="secondary" className="ml-2">Pending</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Custom styles for sliding effect */}
      <style>{`
        @media (max-width: 900px) {
          .w-[48%] { min-width: 90vw !important; max-width: 100vw !important; }
        }
      `}</style>
    </div>
  );
} 