import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

const TotalTraineesPage = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [traineesRes, batchesRes] = await Promise.all([
        fetch("http://localhost:8000/trainees"),
        fetch("http://localhost:8000/batches")
      ]);
      setTrainees(await traineesRes.json());
      setBatches(await batchesRes.json());
    };
    fetchData();
  }, []);

  const filtered = trainees.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase())) &&
    (!batchFilter || t.batch === batchFilter) &&
    (!progressFilter || String(t.progress) === progressFilter)
  );

  // Group by batch
  const grouped = batches.map(batch => ({
    ...batch,
    trainees: filtered.filter(t => t.batch === batch.id)
  }));
  const unbatched = filtered.filter(t => !t.batch);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <h1 className="text-2xl font-bold mb-6">All Mavericks</h1>
      <div className="flex gap-4 mb-6">
        <input placeholder="Search by name" className="border rounded px-3 py-2" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border rounded px-3 py-2" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="border rounded px-3 py-2" value={progressFilter} onChange={e => setProgressFilter(e.target.value)}>
          <option value="">All Progress</option>
          <option value="0">0%</option>
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
        </select>
      </div>
      {grouped.map(batch => batch.trainees.length > 0 && (
        <div key={batch.id} className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Batch: {batch.name}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left mb-4">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">User ID</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {batch.trainees.map(t => (
                  <tr key={t.empId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{t.name}</td>
                    <td className="py-2 px-4">{t.empId}</td>
                    <td className="py-2 px-4">{t.email}</td>
                    <td className="py-2 px-4">
                      <Progress value={t.progress} className="w-32" />
                      <span className="text-xs text-gray-500 ml-2">{t.progress}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {unbatched.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Unassigned Mavericks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left mb-4">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">User ID</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {unbatched.map(t => (
                  <tr key={t.empId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{t.name}</td>
                    <td className="py-2 px-4">{t.empId}</td>
                    <td className="py-2 px-4">{t.email}</td>
                    <td className="py-2 px-4">
                      <Progress value={t.progress} className="w-32" />
                      <span className="text-xs text-gray-500 ml-2">{t.progress}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalTraineesPage; 