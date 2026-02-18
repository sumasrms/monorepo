"use client";

import {
  usePendingEditRequestsByDepartment,
  useApproveEditRequest,
  useRejectEditRequest,
} from "@/features/hod/hooks/useHodEditRequests";
import {
  FileEdit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HodEditRequestsPage() {
  const { data: requests, isLoading } = usePendingEditRequestsByDepartment();
  const approveMutation = useApproveEditRequest();
  const rejectMutation = useRejectEditRequest();

  const [remarks, setRemarks] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Edit request approved. Result status reset to PENDING.");
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    if (!remarks) {
      toast.error("Please provide remarks for rejection");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, remarks });
      setActiveRequestId(null);
      setRemarks("");
      toast.success("Edit request rejected");
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Requests</h1>
        <p className="text-muted-foreground">
          Manage result modification requests from lecturers
        </p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border bg-card p-6 shadow-sm flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full">
                      {request.result.course.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Requested{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                    PENDING HOD
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold">
                    {request.result.student.user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {request.result.course.title} • Current Score:{" "}
                    <span className="font-bold text-foreground">
                      {request.result.score}
                    </span>{" "}
                    ({request.result.grade})
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg flex gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Reason for Edit
                    </p>
                    <p className="text-sm italic">"{request.reason}"</p>
                  </div>
                </div>

                <div className="text-sm">
                  Uploaded by:{" "}
                  <span className="font-semibold">
                    {request.result.uploadedBy?.user.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:w-64 gap-3 justify-center">
                {activeRequestId === request.id ? (
                  <div className="space-y-3 p-4 bg-muted rounded-lg animate-in fade-in duration-300">
                    <textarea
                      placeholder="Enter rejection reason..."
                      className="w-full p-2 text-xs rounded border bg-background"
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 py-1.5 bg-destructive text-destructive-foreground rounded text-xs font-bold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setActiveRequestId(null);
                          setRemarks("");
                        }}
                        className="flex-1 py-1.5 border rounded text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={approveMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:shadow-lg transition-all"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => setActiveRequestId(request.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border text-destructive border-destructive/20 rounded-lg text-sm font-bold hover:bg-destructive/5 transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Request
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed p-16 text-center bg-muted/20">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileEdit className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No edit requests</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            All result modification requests have been handled.
          </p>
        </div>
      )}
    </div>
  );
}
