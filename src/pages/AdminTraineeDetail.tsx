import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";

export default function AdminTraineeDetail() {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/trainees/${empId}`)
      .then(res => {
        if (!res.ok) throw new Error("Trainee not found");
        return res.json();
      })
      .then(data => {
        setTrainee(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setTrainee(null);
      })
      .finally(() => setLoading(false));
  }, [empId]);

  if (loading) return <div className="text-center text-lg text-gray-400 py-10">Loading trainee details...</div>;
  if (error) return <div className="text-center text-lg text-red-500 py-10">{error}</div>;
  if (!trainee) return null;

  return (
    <div className="container mx-auto px-6 py-10 flex justify-center">
      <Card className="max-w-2xl w-full p-8 rounded-3xl shadow-2xl relative flex flex-col min-h-[500px]">
        <div className="flex items-center gap-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-100 hover:bg-orange-200 rounded-full p-2 mr-2 focus:outline-none"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6 text-orange-500" />
          </button>
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500">
            {trainee.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold mb-1">{trainee.name}</h2>
            <div className="text-gray-500 font-semibold">User ID: {trainee.empId}</div>
            <div className="text-gray-500">Email: {trainee.email}</div>
          </div>
        </div>
        <div className="mb-6">
          <div className="font-bold text-orange-500 mb-2">Overall Progress</div>
          <Progress value={trainee.progress || 0} className="w-full" />
          <div className="text-right text-sm text-orange-500 font-semibold mt-1">{trainee.progress || 0}% complete</div>
        </div>
        <div className="mb-6">
          <div className="font-bold text-orange-500 mb-2">Tasks Overview</div>
          <div className="space-y-2">
            {/* Placeholder for tasks, you can expand this if you have tasks data */}
            <div className="rounded-xl bg-orange-50/60 p-4 text-gray-700">No tasks to display.</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8 mb-4">
          <div>
            <div className="text-gray-500 font-semibold">Phase</div>
            <Badge variant={trainee.phase === 2 ? "default" : "secondary"}>Phase {trainee.phase}</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-4">
          <div>
            <div className="text-gray-500 font-semibold">Specialization</div>
            <Badge variant="outline">{trainee.specialization}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-gray-500 font-semibold">Status</div>
              <Badge variant={trainee.status === 'active' ? 'default' : 'destructive'}>{trainee.status}</Badge>
            </div>
            <button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full shadow transition-colors text-base"
              aria-label="Delete Trainee"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </button>
          </div>
        </div>
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="rounded-2xl p-8 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600 font-bold">Delete Trainee?</DialogTitle>
            </DialogHeader>
            <div className="text-gray-700 mb-4">Are you sure you want to permanently delete this trainee and all their data? This action cannot be undone.</div>
            {deleteError && <div className="text-red-500 mb-2">{deleteError}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Cancel</Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    const res = await fetch(`http://localhost:8000/trainees/${trainee.empId}`, {
                      method: 'DELETE',
                      credentials: 'include',
                    });
                    if (!res.ok) throw new Error('Failed to delete trainee.');
                    setShowDeleteDialog(false);
                    navigate(-1);
                  } catch (err: unknown) {
                    let message = 'Failed to delete trainee.';
                    if (err instanceof Error) message = err.message;
                    setDeleteError(message);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
} 