'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ArrowRight } from 'lucide-react';

type StudentResult = {
  id: string;
  semester: string;
  session: string;
  grade?: string | null;
  course: {
    code: string;
    title: string;
  };
};

type ResultAccess = {
  id: string;
  semester: string;
  session: string;
};

type InitiatePaymentVariables = {
  studentId: string;
  amount: number;
  semester: string;
  session: string;
  paymentType: 'RESULT_ACCESS';
  description: string;
};

type InitiatePaymentResponse = {
  initiatePayment: {
    authorizationUrl?: string | null;
  };
};

const AVAILABLE_RESULTS_QUERY = gql`
  query GetAvailableResults($studentId: ID!) {
    studentResults(studentId: $studentId) {
      id
      course {
        code
        title
      }
      semester
      session
      score
      grade
      gradePoint
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
        createdAt
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

export default function ResultsSection() {
  const { data: session } = useAuth();
  const userWithProfile = session?.user as
    | {
        studentProfile?: { id?: string };
      }
    | undefined;
  const studentId = userWithProfile?.studentProfile?.id;

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['studentResults', studentId],
    queryFn: () => graphqlClient.request<{ studentResults: StudentResult[] }>(AVAILABLE_RESULTS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['resultAccess', studentId],
    queryFn: () => graphqlClient.request<{ studentResultAccess: ResultAccess[] }>(RESULT_ACCESS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const initiatePaymentMutation = useMutation<InitiatePaymentResponse, Error, InitiatePaymentVariables>({
    mutationFn: (variables) =>
      graphqlClient.request<InitiatePaymentResponse>(INITIATE_PAYMENT_MUTATION, { input: variables }),
    onSuccess: (data) => {
      if (data.initiatePayment.authorizationUrl) {
        window.open(
          data.initiatePayment.authorizationUrl,
          '_blank',
          'noopener,noreferrer'
        );
      }
    },
  });

  const handleInitiatePayment = (semester: string) => {
    const [semesterValue, session] = semester.split('|');

    if (!studentId || !semesterValue || !session) {
      return;
    }

    initiatePaymentMutation.mutate({
      studentId,
      amount: 5000, // This should come from settings
      semester: semesterValue,
      session,
      paymentType: 'RESULT_ACCESS',
      description: `Result checking fee for ${semesterValue} semester, ${session}`,
    });
  };

  if (session && !studentId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Student profile not found for this account.
      </div>
    );
  }

  if (resultsLoading || accessLoading) {
    return <div className="animate-pulse">Loading results data...</div>;
  }

  const results = resultsData?.studentResults || [];
  const accessedResults = accessData?.studentResultAccess || [];

  const resultsBySemester = results.reduce((acc: Record<string, StudentResult[]>, result: StudentResult) => {
    const key = `${result.semester}|${result.session}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {});

  const accessedSemesters = new Set(
    accessedResults.map((access) => `${access.semester}|${access.session}`)
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Examination Results</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and pay for your semester examination results
        </p>
      </div>

      {Object.entries(resultsBySemester).length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No results available yet. Check back after results are published.</p>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {Object.entries(resultsBySemester).map(([semesterKey, courses]) => {
            const isAccessed = accessedSemesters.has(semesterKey);
            const [semester, session] = semesterKey.split('|');

            return (
              <div
                key={semesterKey}
                className="rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {semester} Semester, {session}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {courses.length} course(s) result{courses.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {isAccessed ? (
                      <div className="text-right">
                        <Badge variant="outline" className="font-medium">
                          Accessed
                        </Badge>
                        <Link
                          href="/dashboard/results"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                        >
                          View Results <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleInitiatePayment(semesterKey)}
                        disabled={initiatePaymentMutation.isPending}
                        variant="outline"
                        className="font-medium"
                      >
                        {initiatePaymentMutation.isPending
                          ? 'Processing...'
                          : 'Pay ₦5,000'}
                      </Button>
                    )}
                  </div>
                </div>

                {isAccessed && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="text-sm flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2"
                      >
                        <span className="text-gray-700">{course.course.code}</span>
                        <span className="font-semibold text-gray-900">
                          {course.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t px-6 py-4">
        <Link
          href="/dashboard/results"
          className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
        >
          View Full Results Page <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
