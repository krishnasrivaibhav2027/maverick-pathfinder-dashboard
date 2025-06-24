import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, ChevronRight } from "lucide-react";

const trainings = [
  { id: 1, title: "Programming Fundamentals", status: "completed", progress: 100 },
  { id: 2, title: "Version Control (Git)", status: "in-progress", progress: 60 },
  { id: 3, title: "Database Fundamentals", status: "pending", progress: 0 },
];

export default function PhaseTrainings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="space-y-4">
          {trainings.map((training) => (
            <Card 
              key={training.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {/* Handle navigation to sub-levels */}}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {training.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{training.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            training.status === "completed" 
                              ? "default" 
                              : training.status === "in-progress" 
                                ? "default" 
                                : "secondary"
                          }
                        >
                          {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">{training.progress}% Complete</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 