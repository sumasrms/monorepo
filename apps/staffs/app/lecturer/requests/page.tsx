"use client";

import { useSession } from "@/lib/auth-client";
import { useEditRequests } from "@/features/results/hooks/useResults";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { StatCard } from "@workspace/ui/components/stat-card";
import { EditRequest } from "@/features/results/types";

export default function EditRequestsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  const staffId = (session?.user as any)?.staffProfile?.id;

  const { data: requests, isLoading } = useEditRequests();

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Please log in to view edit requests</p>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>No staff profile found for your account</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5 animate-spin" />
          <p>Loading edit requests...</p>
        </div>
      </div>
    );
  }

  const filteredRequests =
    filter === "ALL"
      ? requests
      : requests?.filter((req: EditRequest) => req.status === filter);

  const statusCounts = {
    PENDING:
      requests?.filter((r: EditRequest) => r.status === "PENDING").length || 0,
    APPROVED:
      requests?.filter((r: EditRequest) => r.status === "APPROVED").length || 0,
    REJECTED:
      requests?.filter((r: EditRequest) => r.status === "REJECTED").length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Requests</h1>
        <p className="text-muted-foreground">
          Manage your result edit requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pending"
          value={statusCounts.PENDING}
          trend={{ label: "Active", direction: "up" }}
          footerLabel="Waiting for approval"
          footerIcon={Clock}
        />
        <StatCard
          title="Approved"
          value={statusCounts.APPROVED}
          trend={{ label: "Completed", direction: "up" }}
          footerLabel="Requests accepted"
          footerIcon={CheckCircle}
        />
        <StatCard
          title="Rejected"
          value={statusCounts.REJECTED}
          trend={{ label: "Action needed", direction: "down" }}
          footerLabel="Requests declined"
          footerIcon={XCircle}
        />
      </div>

      {/* Filter Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                filter === status
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
              {status !== "ALL" && (
                <span className="ml-2 text-xs">
                  ({statusCounts[status as keyof typeof statusCounts]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests && filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request: any) => (
            <div
              key={request.id}
              className="rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">
                      {request.result?.course?.code} -{" "}
                      {request.result?.course?.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {request.status === "APPROVED" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {request.status === "PENDING" && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {request.status === "REJECTED" && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {request.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Student: {request.result?.student?.user?.name} (
                      {request.result?.student?.matricNumber})
                    </p>
                    <p>
                      Current Score: CA {request.result?.caScore} + Exam{" "}
                      {request.result?.examScore} = Total{" "}
                      {request.result?.totalScore} (
                      {request.result?.letterGrade})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested on{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Reason for Edit</p>
                    <p className="text-sm text-muted-foreground">
                      {request.reason}
                    </p>
                  </div>
                </div>
              </div>

              {request.status === "APPROVED" && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    ✓ Your edit request has been approved. You can now update
                    the result.
                  </p>
                </div>
              )}

              {request.status === "REJECTED" && (
                <div className="mt-4 rounded-lg bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    ✗ Your edit request was rejected. Please contact the HOD for
                    more information.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            No {filter.toLowerCase()} edit requests
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter === "ALL"
              ? "You haven't submitted any edit requests yet"
              : `You don't have any ${filter.toLowerCase()} edit requests`}
          </p>
        </div>
      )}
    </div>
  );
}
