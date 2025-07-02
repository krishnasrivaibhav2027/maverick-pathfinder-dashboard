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

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

export default function PhaseTrainings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline"
          className="mb-6 flex items-center gap-2 rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80"
          style={font}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="space-y-6">
          {trainings.map((training) => (
            <div 
              key={training.id}
              className={`rounded-3xl ${glass} p-8 shadow-xl cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => {/* Handle navigation to sub-levels */}}
              style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {training.status === "completed" ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Clock className="h-6 w-6 text-orange-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold" style={font}>{training.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          training.status === "completed" 
                            ? "default" 
                            : training.status === "in-progress" 
                              ? "default" 
                              : "secondary"
                        }
                        className="rounded-full px-3 py-1 text-base font-semibold"
                      >
                        {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">{training.progress}% Complete</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-orange-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 