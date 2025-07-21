import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const PhaseSelection: React.FC = () => {
  const [phases, setPhases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/batches/grouped")
      .then(res => res.json())
      .then((data: Record<string, unknown>) => {
        const foundPhases = Object.keys(data).map(Number);
        const maxPhase = foundPhases.length > 0 ? Math.max(...foundPhases) : 1;
        const phaseArr = [];
        for (let i = 1; i <= Math.max(maxPhase, 2); i++) {
          phaseArr.push(i.toString());
        }
        setPhases(phaseArr);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading phases...</div>;

  return (
    <div className="w-full flex flex-col items-start justify-start pt-2 pb-8">
      <div className="flex flex-row items-center mb-6 mt-2 pl-0">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80 flex items-center gap-2"
          style={font}
        >
          <ArrowLeft className="h-5 w-5 text-orange-500" />
          Back
        </Button>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500 ml-4" style={font}>
          Select a Phase
        </h2>
      </div>
      <div className="flex flex-row gap-6">
        {phases.map(phase => (
          <Button
            key={phase}
            className="relative flex items-center gap-3 px-8 py-6 rounded-2xl bg-white/70 shadow hover:shadow-lg border-none active:shadow-inner active:translate-y-0 transition-all duration-150"
            style={{ minWidth: 180, maxWidth: 220, minHeight: 80, ...font, fontWeight: 700, fontSize: '1.35rem', color: '#FF7C2B', background: 'rgba(255,255,255,0.85)', border: 'none' }}
            onClick={() => navigate(`phase/${phase}`)}
          >
            <Layers className="h-7 w-7 text-orange-400" />
            <span>Phase {phase}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PhaseSelection; 