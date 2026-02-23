"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useRequireAuth } from "@/lib/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { graphqlClient } from "@/lib/graphql-client";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

type StudentResultItem = {
  id: string;
  semester: string;
  session: string;
  ca?: number | null;
  exam?: number | null;
  score: number;
  grade: string;
  gradePoint: number;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
  };
};

type ResultAccessItem = {
  id: string;
  semester: string;
  session: string;
  payment: {
    id: string;
    status: string;
    amount: number;
    paystackPaidAt?: string | null;
  };
};

type ResultsQueryResponse = {
  studentResults: StudentResultItem[];
};

type ResultAccessQueryResponse = {
  studentResultAccess: ResultAccessItem[];
};

type VerifyPaymentResponse = {
  verifyPayment: {
    success: boolean;
    message: string;
  };
};

type InitiatePaymentVariables = {
  studentId: string;
  amount: number;
  semester: string;
  session: string;
  paymentType: "RESULT_ACCESS";
  description: string;
};

type InitiatePaymentResponse = {
  initiatePayment: {
    authorizationUrl?: string | null;
  };
};

type SemesterGroup = {
  semester: string;
  session: string;
  courses: StudentResultItem[];
};

const RESULTS_QUERY = gql`
  query GetResults($studentId: ID!) {
    studentResults(studentId: $studentId) {
      id
      course {
        id
        code
        title
        credits
      }
      semester
      session
      ca
      exam
      score
      grade
      gradePoint
      status
    }
  }
`;

const RESULT_ACCESS_QUERY = gql`
  query GetResultAccess($studentId: ID!) {
    studentResultAccess(studentId: $studentId) {
      id
      semester
      session
      expiresAt
      accessCount
      payment {
        id
        status
        amount
        paystackPaidAt
      }
    }
  }
`;

const VERIFY_PAYMENT_MUTATION = gql`
  mutation VerifyPayment($reference: String!) {
    verifyPayment(reference: $reference) {
      success
      message
      payment {
        id
        status
      }
      resultAccess {
        id
        semester
        session
      }
    }
  }
`;

const INITIATE_PAYMENT_MUTATION = gql`
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      success
      message
      payment {
        id
        paystackReference
        amount
        status
      }
      authorizationUrl
      accessCode
      reference
    }
  }
`;

function ResultsContent() {
  const { session, isPending } = useRequireAuth();
  const userWithProfile = session?.user as
    | {
        studentProfile?: { id?: string };
      }
    | undefined;
  const studentId = userWithProfile?.studentProfile?.id;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const reference = searchParams.get("reference");

  const { data: resultsData, isLoading: resultsLoading } =
    useQuery<ResultsQueryResponse>({
      queryKey: ["results", studentId],
      queryFn: () =>
        graphqlClient.request<ResultsQueryResponse>(RESULTS_QUERY, {
          studentId,
        }),
      enabled: !!studentId,
    });

  const { data: accessData, isLoading: accessLoading } =
    useQuery<ResultAccessQueryResponse>({
      queryKey: ["myResultAccess", studentId],
      queryFn: () =>
        graphqlClient.request<ResultAccessQueryResponse>(RESULT_ACCESS_QUERY, {
          studentId,
        }),
      enabled: !!studentId,
    });

  const verifyMutation = useMutation<VerifyPaymentResponse, Error, string>({
    mutationFn: (ref: string) =>
      graphqlClient.request<VerifyPaymentResponse>(VERIFY_PAYMENT_MUTATION, {
        reference: ref,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myResultAccess", studentId],
      });
    },
  });

  const initiateMutation = useMutation<
    InitiatePaymentResponse,
    Error,
    InitiatePaymentVariables
  >({
    mutationFn: (variables) =>
      graphqlClient.request<InitiatePaymentResponse>(
        INITIATE_PAYMENT_MUTATION,
        { input: variables },
      ),
    onSuccess: (data) => {
      if (data.initiatePayment.authorizationUrl) {
        window.open(
          data.initiatePayment.authorizationUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    },
  });

  useEffect(() => {
    if (reference && !verifyMutation.isPending && !verifyMutation.isSuccess) {
      verifyMutation.mutate(reference);
    }
  }, [reference, verifyMutation]);

  const handlePayment = (semester: string, session: string) => {
    if (!studentId) return;

    initiateMutation.mutate({
      studentId,
      amount: 5000,
      semester,
      session,
      paymentType: "RESULT_ACCESS",
      description: `Result checking fee for ${semester} semester, ${session}`,
    });
  };

  const results = useMemo(
    () => resultsData?.studentResults ?? [],
    [resultsData?.studentResults],
  );
  const accessedResults = useMemo(
    () => accessData?.studentResultAccess ?? [],
    [accessData?.studentResultAccess],
  );

  const resultsByKey = useMemo(() => {
    return results.reduce(
      (acc: Record<string, SemesterGroup>, result: StudentResultItem) => {
        const key = `${result.semester}|${result.session}`;
        if (!acc[key]) {
          acc[key] = {
            semester: result.semester,
            session: result.session,
            courses: [],
          };
        }
        acc[key].courses.push(result);
        return acc;
      },
      {},
    );
  }, [results]);

  const accessedKeys = new Set(
    accessedResults.map((access) => `${access.semester}|${access.session}`),
  );

  if (isPending || resultsLoading || accessLoading) {
    return (
      <div className="py-8 text-center flex h-screen items-center justify-center">
        Loading results...
      </div>
    );
  }

  if (session && !studentId) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Student profile not found for this account.
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Examination Results
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and unlock your semester examination results.
        </p>
      </div>

      {reference && verifyMutation.isSuccess && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Payment Verified Successfully
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Your payment has been processed. You can now view your results.
          </p>
        </div>
      )}

      {Object.keys(resultsByKey).length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <p className="text-muted-foreground">
            No results available yet. Check back after results are published.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(resultsByKey).map((semData) => {
            const key = `${semData.semester}|${semData.session}`;
            const isAccessed = accessedKeys.has(key);
            const accessInfo = accessedResults.find(
              (access) => `${access.semester}|${access.session}` === key,
            );

            return (
              <section
                key={key}
                className="rounded-lg border bg-card shadow-sm"
              >
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-xl font-semibold text-card-foreground">
                      {semData.semester} Semester, {semData.session}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {semData.courses.length} course(s)
                    </p>
                  </div>

                  {isAccessed ? (
                    <Badge variant="outline" className="font-medium">
                      Accessed
                      {accessInfo?.payment?.paystackPaidAt
                        ? ` • ${new Date(accessInfo.payment.paystackPaidAt).toLocaleDateString()}`
                        : ""}
                    </Badge>
                  ) : (
                    <Button
                      onClick={() =>
                        handlePayment(semData.semester, semData.session)
                      }
                      disabled={initiateMutation.isPending}
                      variant="outline"
                      className="font-medium"
                    >
                      {initiateMutation.isPending
                        ? "Processing..."
                        : "Pay ₦5,000"}
                    </Button>
                  )}
                </div>

                {isAccessed ? (
                  <div className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3 text-muted-foreground">
                            Course Code
                          </TableHead>
                          <TableHead className="px-4 py-3 text-muted-foreground">
                            Course Title
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            Credits
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            CA
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            Exam
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            Total
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            Grade
                          </TableHead>
                          <TableHead className="px-4 py-3 text-center text-muted-foreground">
                            Grade Point
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semData.courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="px-4 py-3 font-medium text-foreground">
                              {course.course.code}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">
                              {course.course.title}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center text-muted-foreground">
                              {course.course.credits}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center text-muted-foreground">
                              {course.ca ?? "-"}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center text-muted-foreground">
                              {course.exam ?? "-"}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center font-semibold text-foreground">
                              {course.score.toFixed(2)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <Badge variant="outline" className="font-medium">
                                {course.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center font-medium text-foreground">
                              {course.gradePoint.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t pt-6">
                      <Button variant="outline" size="sm">
                        Print
                      </Button>
                      <Button variant="outline" size="sm">
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-muted-foreground">
                    <p>
                      Results are available. Pay ₦5,000 to unlock and view them.
                    </p>
                    <p className="mt-2 text-sm">
                      Once you pay for this semester, all results in this
                      semester are accessible for life.
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
