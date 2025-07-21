import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface Trainee {
  name: string;
  email: string;
  empId: string;
  progress?: number;
  skill?: string;
}

interface Batch {
  _id: string;
  batch_number: number;
  skill: string;
  phase: number;
  is_next_batch: boolean;
  trainees: Trainee[];
}

const BatchList: React.FC = () => {
  const { phaseId } = useParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!phaseId) return;
    fetch(`http://localhost:8000/batches/phase/${phaseId}`)
      .then(res => res.json())
      .then((data: Batch[]) => setBatches(data))
      .finally(() => setLoading(false));
  }, [phaseId]);

  if (loading) return <div className="p-8 text-gray-400">Loading batches...</div>;
  if (!batches.length) return <div className="p-8 text-gray-400">No batches available for this phase.</div>;

  // Group by batch_number
  const batchMap: Record<number, Batch[]> = {};
  batches.forEach(batch => {
    if (batch.batch_number === 0) return; // skip overflow
    if (!batchMap[batch.batch_number]) batchMap[batch.batch_number] = [];
    batchMap[batch.batch_number].push(batch);
  });
  const batchNumbers = Object.keys(batchMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full flex flex-col items-start justify-start pt-2 pb-8">
      <div className="flex flex-row items-center mb-6 mt-2 pl-0">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80 flex items-center gap-2"
          style={font}
        >
          <ArrowLeft className="h-5 w-5 text-orange-500" />
          Back
        </Button>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500 ml-4" style={font}>
          Select a Batch
        </h2>
      </div>
      <div className="flex flex-row gap-6 flex-wrap">
        {batchNumbers.map(batchNum => {
          const batchesForNum = batchMap[batchNum];
          return batchesForNum.map(batch => {
            const traineesCount = Array.isArray(batch.trainees) ? batch.trainees.length : 0;
            return (
              <Button
                key={batch._id}
                className="flex flex-col items-center gap-2 px-8 py-8 rounded-2xl bg-white/80 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:shadow-inner active:translate-y-0 transition-all duration-150 border-0"
                style={{ minWidth: 180, maxWidth: 240, minHeight: 100, ...font, fontWeight: 800, fontSize: '1.5rem', color: '#FF7C2B', boxShadow: '0 2px 16px 0 #ff7c2b22', background: 'rgba(255,255,255,0.92)' }}
                onClick={() => navigate(`batch/${batch._id}`)}
              >
                <Users className="h-8 w-8 text-orange-400 mb-1" />
                <span>Batch {batchNum}</span>
                <span className="text-xs text-gray-500 mt-1">{traineesCount === 0 ? 'No trainees in this batch' : `${traineesCount} trainee${traineesCount > 1 ? 's' : ''}`}</span>
              </Button>
            );
          });
        })}
      </div>
    </div>
  );
};

export default BatchList; 