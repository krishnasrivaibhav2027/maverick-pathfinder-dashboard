import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const ManageBatchesPage = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    instructor: '',
    description: '',
    start_date: '',
    end_date: '',
    modules: '', // comma-separated
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesRes, traineesRes] = await Promise.all([
          fetch("http://localhost:8000/batches"),
          fetch("http://localhost:8000/trainees")
        ]);
        const batchesData = await batchesRes.json();
        const traineesData = await traineesRes.json();
        setBatches(batchesData);
        setTrainees(traineesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Calculate average progress for each batch
  const getAvgProgress = (batchId: string) => {
    const batchTrainees = trainees.filter((t: any) => t.batch === batchId);
    if (!batchTrainees.length) return 0;
    return Math.round(batchTrainees.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / batchTrainees.length);
  };

  // Handle batch creation
  const handleCreateBatch = async (e: any) => {
    e.preventDefault();
    const modulesArr = form.modules.split(',').map(m => ({ title: m.trim(), active: false })).filter(m => m.title);
    const payload = { ...form, modules: modulesArr };
    try {
      const res = await fetch("http://localhost:8000/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', instructor: '', description: '', start_date: '', end_date: '', modules: '' });
        const newBatch = await res.json();
        setBatches(prev => [...prev, newBatch]);
      }
    } catch (error) {
      console.error("Failed to create batch:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Manage Training Batches</h1>
        <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowModal(true)}>+ Create New Batch</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map(batch => {
          const avgProgress = getAvgProgress(batch.id);
          const batchTrainees = trainees.filter((t: any) => t.batch === batch.id);
          return (
            <div key={batch.id} className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition" onClick={() => navigate(`/batches/${batch.id}`)}>
              <h2 className="text-lg font-bold text-blue-700 mb-1">{batch.name}</h2>
              <p className="text-gray-600 mb-1">Instructor: {batch.instructor}</p>
              <p className="text-gray-500 mb-2">{batch.description}</p>
              <Progress value={avgProgress} className="mb-2" />
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{avgProgress}% complete</span>
                <span>{batchTrainees.length} Mavericks</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Modules: {batch.modules?.length || 0}</span>
                <span>Start: {batch.start_date || '-'}</span>
                <span>End: {batch.end_date || '-'}</span>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md" onSubmit={handleCreateBatch}>
            <h2 className="text-xl font-bold mb-4">Create New Batch</h2>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Batch Name</label>
              <input className="border rounded px-3 py-2 w-full" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Instructor</label>
              <input className="border rounded px-3 py-2 w-full" required value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Description</label>
              <textarea className="border rounded px-3 py-2 w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Start Date</label>
              <input type="date" className="border rounded px-3 py-2 w-full" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">End Date</label>
              <input type="date" className="border rounded px-3 py-2 w-full" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Modules (comma separated)</label>
              <input className="border rounded px-3 py-2 w-full" value={form.modules} onChange={e => setForm(f => ({ ...f, modules: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">Create</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageBatchesPage; 