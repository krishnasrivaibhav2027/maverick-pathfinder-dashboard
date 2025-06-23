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

interface TraineeData {
  name: string;
  email: string;
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

const TraineeOnboarding = () => {
  const [file, setFile] = useState<File | null>(null);
  const [traineesData, setTraineesData] = useState<TraineeData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [createdTrainees, setCreatedTrainees] = useState<CreatedTrainee[]>([]);
  const [failedTrainees, setFailedTrainees] = useState<FailedTrainee[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/json") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JSON file."
      });
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error("JSON must contain an array of trainee objects");
        }

        // Validate each trainee object
        const validTrainees: TraineeData[] = [];
        const invalidTrainees: string[] = [];

        data.forEach((trainee, index) => {
          if (trainee.name && trainee.email) {
            validTrainees.push({
              name: trainee.name.trim(),
              email: trainee.email.trim().toLowerCase()
            });
          } else {
            invalidTrainees.push(`Row ${index + 1}: Missing name or email`);
          }
        });

        if (invalidTrainees.length > 0) {
          toast({
            variant: "destructive",
            title: "Invalid data found",
            description: `${invalidTrainees.length} entries have invalid data. Please check your JSON file.`
          });
        }

        setTraineesData(validTrainees);
        toast({
          title: "File uploaded successfully",
          description: `${validTrainees.length} valid trainee entries found.`
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid JSON file",
          description: "Please check your JSON file format."
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleBulkCreate = async () => {
    if (traineesData.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to process",
        description: "Please upload a file with trainee data first."
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log("🚀 Starting bulk trainee creation...");
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch("http://localhost:8000/api/admin/bulk-create-trainees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(traineesData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log("📡 Backend response received");
      const result = await response.json();

      if (response.ok) {
        console.log("✅ Backend creation successful:", result);
        setCreatedTrainees(result.created_trainees || []);
        setFailedTrainees(result.failed_trainees || []);
        setShowResults(true);
        
        toast({
          title: "Bulk creation completed",
          description: result.message,
        });

        // Send emails for created trainees
        if (result.created_trainees && result.created_trainees.length > 0) {
          console.log("📧 Starting email sending process...");
          await sendWelcomeEmails(result.created_trainees);
        }
      } else {
        console.error("❌ Backend creation failed:", result);
        toast({
          variant: "destructive",
          title: "Creation failed",
          description: result.detail || "Failed to create trainee accounts.",
        });
      }
    } catch (error) {
      console.error("❌ Bulk creation error:", error);
      
      let errorMessage = "Could not connect to the server.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage),
      });
    } finally {
      setIsCreating(false);
      setShowConfirmDialog(false);
    }
  };

  const sendWelcomeEmails = async (trainees: CreatedTrainee[]) => {
    console.log(`📧 Attempting to send ${trainees.length} welcome emails...`);
    
    // Check if EmailJS is available
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
    setTraineesData([]);
    setCreatedTrainees([]);
    setFailedTrainees([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Trainee Onboarding
          </CardTitle>
          <CardDescription>
            Upload a JSON file with trainee names and emails to create multiple trainee accounts at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Processing..." : "Upload JSON File"}
              </Button>
              <Button
                variant="outline"
                onClick={downloadSampleTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {file && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {file.name} ({traineesData.length} trainees)
                </span>
              </div>
            )}
          </div>

          {/* Data Preview */}
          {traineesData.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Data Preview</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traineesData.slice(0, 10).map((trainee, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{trainee.name}</td>
                        <td className="px-4 py-2">{trainee.email}</td>
                      </tr>
                    ))}
                    {traineesData.length > 10 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-center text-gray-500">
                          ... and {traineesData.length - 10} more trainees
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isCreating ? "Creating Accounts..." : `Create ${traineesData.length} Trainee Accounts`}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>JSON Format:</strong> Upload a JSON file with an array of objects containing "name" and "email" fields.
              <br />
              <strong>Email Delivery:</strong> Welcome emails with credentials will be automatically sent to each trainee.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Creation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{createdTrainees.length}</div>
                <div className="text-sm text-green-800">Successfully Created</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{failedTrainees.length}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{traineesData.length}</div>
                <div className="text-sm text-blue-800">Total Processed</div>
              </div>
            </div>

            {/* Created Trainees */}
            {createdTrainees.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-green-700">Successfully Created Trainees</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Employee ID</th>
                        <th className="px-4 py-2 text-left">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdTrainees.map((trainee, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{trainee.name}</td>
                          <td className="px-4 py-2">{trainee.email}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{trainee.empId}</Badge>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{trainee.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Failed Trainees */}
            {failedTrainees.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-red-700">Failed Creations</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedTrainees.map((trainee, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{trainee.name}</td>
                          <td className="px-4 py-2">{trainee.email}</td>
                          <td className="px-4 py-2 text-red-600">{trainee.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button onClick={resetForm} variant="outline">
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Creating Trainee Accounts</h3>
              <p className="text-gray-600">Please wait while we create {traineesData.length} trainee accounts...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments.</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Creation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create {traineesData.length} trainee accounts. This action will:
              <br />
              • Generate unique Employee IDs and passwords for each trainee
              <br />
              • Send welcome emails with credentials to all trainees
              <br />
              • Create accounts in the training system
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCreate}>
              Create Accounts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TraineeOnboarding; 