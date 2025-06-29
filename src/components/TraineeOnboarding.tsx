import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Download,
  Send,
  AlertCircle,
  Info
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchSummary {
  batch_id: string;
  skill: string;
  batch_number: number;
  trainees: { name: string; email: string; pdf: string; skill: string }[];
  is_next_batch: boolean;
}

interface CreatedTrainee {
  name: string;
  email: string;
  empId: string;
  password: string;
  emailData: Record<string, unknown>;
}

interface FailedTrainee {
  name: string;
  email: string;
  error: string;
}

interface BatchResult {
  status: string;
  created_trainees: CreatedTrainee[];
  failed_trainees: FailedTrainee[];
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

const accent = "#FF512F";
const accent2 = "#F09819";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const TraineeOnboarding = () => {
  const [file, setFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, BatchResult>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if file is ZIP or DOCX
    const isZip = selectedFile.type === "application/zip" || selectedFile.name.endsWith(".zip");
    const isDocx = selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                   selectedFile.name.endsWith(".docx");
    
    if (!isZip && !isDocx) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a ZIP file containing PDF resumes or a DOCX resume file."
      });
      return;
    }
    
    setFile(selectedFile);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await fetch("http://localhost:8000/onboarding/upload-resumes", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (response.ok && data.batch_ids) {
        const batchDetails: BatchSummary[] = [];
        for (const batch_id of data.batch_ids) {
          const res = await fetch(`http://localhost:8000/batch/${batch_id}`);
          if (res.ok) {
            const batch = await res.json();
            batchDetails.push({
              batch_id,
              skill: batch.skill,
              batch_number: batch.batch_number,
              trainees: batch.trainees,
              is_next_batch: batch.is_next_batch
            });
          }
        }
        setBatches(batchDetails);
        toast({ title: "Batches created", description: `Found ${batchDetails.length} batches.` });
      } else {
        toast({ variant: "destructive", title: "Batching failed", description: data.detail || "Failed to process resumes." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not connect to backend." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAccounts = async (batch_id: string) => {
    setIsCreating(batch_id);
    try {
      const response = await fetch(`http://localhost:8000/onboarding/create-accounts-for-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id })
      });
      const data = await response.json();
      if (response.ok && data.created_trainees) {
        setResults((prev) => ({ ...prev, [batch_id]: data }));
        toast({ title: "Accounts created", description: `${data.created_trainees.length} trainees processed.` });
        await sendWelcomeEmails(data.created_trainees);
      } else {
        toast({ variant: "destructive", title: "Account creation failed", description: data.detail || "Failed to create accounts." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to backend." });
    } finally {
      setIsCreating(null);
    }
  };

  const sendWelcomeEmails = async (trainees: CreatedTrainee[]) => {
    console.log(`📧 Attempting to send ${trainees.length} welcome emails...`);
    
    if (!window.emailjs) {
      console.warn("⚠️ EmailJS not available, skipping email sending");
      toast({
        title: "EmailJS not available",
        description: "Welcome emails could not be sent. Please check EmailJS configuration.",
        variant: "destructive"
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const trainee of trainees) {
      try {
        console.log(`📧 Sending email to ${trainee.email}...`);
        
        if (trainee.emailData) {
          await window.emailjs.send(
            trainee.emailData.service_id as string,
            trainee.emailData.template_id as string,
            trainee.emailData.template_params as Record<string, unknown>,
            trainee.emailData.user_id as string
          );
          console.log(`✅ Welcome email sent to ${trainee.email}`);
          successCount++;
        } else {
          console.warn(`⚠️ No email data for ${trainee.email}`);
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to send email to ${trainee.email}:`, error);
        failureCount++;
      }
    }

    console.log(`📧 Email sending completed: ${successCount} successful, ${failureCount} failed`);
    
    if (successCount > 0) {
      toast({
        title: "Emails sent",
        description: `${successCount} welcome emails sent successfully.`,
      });
    }
    
    if (failureCount > 0) {
      toast({
        title: "Some emails failed",
        description: `${failureCount} emails could not be sent.`,
        variant: "destructive"
      });
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      { name: "John Doe", email: "john.doe@example.com" },
      { name: "Jane Smith", email: "jane.smith@example.com" },
      { name: "Mike Johnson", email: "mike.johnson@example.com" }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trainees-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setBatches([]);
    setResults({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <div className={`rounded-3xl ${glass} p-8 shadow-xl`} style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}>
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-7 w-7 text-orange-400" />
          <span className="text-2xl font-bold text-orange-500">Batch Trainee Onboarding</span>
        </div>
        <div className="mb-6 text-gray-600">Upload a ZIP file of PDF resumes or a DOCX resume file to auto-allocate trainees into skill batches.</div>
        {/* File Upload Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-2 font-semibold shadow-md"
            >
              <Upload className="h-5 w-5" />
              {isUploading ? "Processing..." : "Upload File"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          {file && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/80 rounded-xl shadow-sm">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-emerald-700 font-semibold">{file.name}</span>
            </div>
          )}
          {/* File Type Information */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-white border border-orange-100">
            <h4 className="font-medium text-orange-500 mb-2">Supported File Types:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• <strong>ZIP files:</strong> Containing multiple PDF resumes</li>
              <li>• <strong>DOCX files:</strong> Individual Microsoft Word resume documents</li>
            </ul>
            <p className="text-xs text-orange-600 mt-2">
              The system will automatically extract text and identify skills (Python, Java, .NET) from the resumes.
            </p>
          </div>
        </div>
        {/* Batch Display */}
        {batches.length > 0 && (
          <div className="space-y-8">
            {batches.map((batch) => (
              <div key={batch.batch_id} className={`rounded-3xl ${glass} p-8 shadow-xl border-2 border-orange-100`} style={{ boxShadow: `0 8px 32px 0 ${accent2}22` }}>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-orange-400" />
                  <span className="text-xl font-bold text-orange-500">
                    {batch.is_next_batch ? "Next Batch (Overflow)" : `${batch.skill.toUpperCase()} Batch ${batch.batch_number}`}
                  </span>
                </div>
                <div className="mb-2 text-sm text-gray-600">Trainees: {batch.trainees.length}</div>
                <div className="max-h-48 overflow-y-auto border rounded-2xl mb-4 bg-white/70">
                  <table className="w-full text-xs">
                    <thead className="bg-orange-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">Skill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.trainees.map((t, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{t.name}</td>
                          <td className="px-2 py-1">{t.email}</td>
                          <td className="px-2 py-1">{'skills' in t && Array.isArray((t as { skills?: string[] }).skills) ? (t as { skills: string[] }).skills[0] : t.skill || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  onClick={() => handleCreateAccounts(batch.batch_id)}
                  disabled={isCreating === batch.batch_id || results[batch.batch_id]?.status === "success"}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-2 font-semibold shadow-md"
                >
                  <Send className="h-5 w-5" />
                  {isCreating === batch.batch_id ? "Creating Accounts..." : "Create Accounts"}
                </Button>
                {/* Results for this batch */}
                {results[batch.batch_id] && (
                  <div className="mt-6">
                    <div className="font-semibold mb-2 text-orange-500">Results:</div>
                    <div className="text-emerald-700 mb-1">Created: {results[batch.batch_id].created_trainees.length}</div>
                    <div className="text-red-700 mb-1">Failed: {results[batch.batch_id].failed_trainees.length}</div>
                    {/* List created trainees with credentials */}
                    {results[batch.batch_id].created_trainees.length > 0 && (
                      <div className="max-h-32 overflow-y-auto border rounded-2xl mt-2 bg-white/70">
                        <table className="w-full text-xs">
                          <thead className="bg-emerald-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Email</th>
                              <th className="px-2 py-1 text-left">Employee ID</th>
                              <th className="px-2 py-1 text-left">Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results[batch.batch_id].created_trainees.map((trainee: CreatedTrainee, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{trainee.name}</td>
                                <td className="px-2 py-1">{trainee.email}</td>
                                <td className="px-2 py-1">{trainee.empId}</td>
                                <td className="px-2 py-1 font-mono text-xs">{trainee.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* List failed trainees */}
                    {results[batch.batch_id].failed_trainees.length > 0 && (
                      <div className="max-h-32 overflow-y-auto border rounded-2xl mt-2 bg-white/70">
                        <table className="w-full text-xs">
                          <thead className="bg-red-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Email</th>
                              <th className="px-2 py-1 text-left">Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results[batch.batch_id].failed_trainees.map((trainee: FailedTrainee, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{trainee.name}</td>
                                <td className="px-2 py-1">{trainee.email}</td>
                                <td className="px-2 py-1 text-red-600">{trainee.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineeOnboarding; 