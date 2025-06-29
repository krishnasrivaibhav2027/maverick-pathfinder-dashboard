import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Send, ArrowLeft } from "lucide-react";

interface OverflowBatch {
  _id: string;
  trainees: { name: string; email: string; skill: string }[];
}

const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

export default function NextBatchOverflow() {
  const navigate = useNavigate();
  const [overflowBatch, setOverflowBatch] = useState<OverflowBatch | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin-only protection
  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin');
    if (isAdmin !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:8000/batches")
      .then(res => res.json())
      .then((batches) => {
        if (Array.isArray(batches)) {
          const overflow = batches.find((b) => (b as { is_next_batch?: boolean }).is_next_batch);
          setOverflowBatch(overflow as OverflowBatch || null);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      <div className="w-full max-w-4xl mb-8 flex items-center gap-4">
        <Button variant="outline" className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80" style={font} onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent" style={font}>Next Batch (Overflow)</h1>
      </div>
      <div className={`rounded-3xl ${glass} p-8 w-full max-w-4xl shadow-xl`} style={{ boxShadow: `0 8px 32px 0 #ff512f22` }}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-7 w-7 text-orange-400" />
          <span className="text-xl font-bold text-orange-500">Overflow Trainees</span>
        </div>
        {loading ? (
          <div className="text-orange-400 font-semibold">Loading...</div>
        ) : overflowBatch ? (
          <>
            <span className="text-base text-gray-500 mb-2 block">Trainees: {overflowBatch.trainees.length}</span>
            <div className="w-full max-h-96 overflow-y-auto rounded-xl border border-orange-50 bg-orange-50/30 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50 text-orange-500">
                    <th className="py-2 px-3 text-left font-bold">Name</th>
                    <th className="py-2 px-3 text-left font-bold">Email</th>
                    <th className="py-2 px-3 text-left font-bold">Skill</th>
                  </tr>
                </thead>
                <tbody>
                  {overflowBatch.trainees.map((t, idx) => (
                    <tr key={t.email + idx} className="border-b border-orange-50">
                      <td className="py-1 px-3 text-orange-900 font-semibold">{t.name}</td>
                      <td className="py-1 px-3 text-gray-700">{t.email}</td>
                      <td className="py-1 px-3 text-orange-500 font-bold">{t.skill}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="rounded-full px-8 py-3 text-base font-bold shadow-md bg-gradient-to-r from-orange-500 to-orange-400 text-white flex items-center gap-2 mt-2">
              <Send className="h-5 w-5 mr-2" /> Create Accounts
            </Button>
          </>
        ) : (
          <div className="text-orange-400 font-semibold">No Overflow Batch</div>
        )}
      </div>
    </div>
  );
} 