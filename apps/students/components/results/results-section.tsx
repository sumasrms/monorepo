'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';

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
  const studentId = session?.user?.studentProfile?.id;
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['studentResults', studentId],
    queryFn: () =>
      graphqlClient.request(AVAILABLE_RESULTS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['resultAccess', studentId],
    queryFn: () => graphqlClient.request(RESULT_ACCESS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: (variables: any) =>
      graphqlClient.request(INITIATE_PAYMENT_MUTATION, { input: variables }),
    onSuccess: (data: any) => {
      if (data.initiatePayment.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.initiatePayment.authorizationUrl;
      }
    },
  });

  const handleInitiatePayment = (semester: string) => {
    const [semesterValue, session] = semester.split('|');
    initiatePaymentMutation.mutate({
      studentId,
      amount: 5000, // This should come from settings
      semester: semesterValue,
      session,
      paymentType: "RESULT_ACCESS",
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

  // Group results by semester and session
  const resultsBySemester = results.reduce((acc: any, result: any) => {
    const key = `${result.semester}|${result.session}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {} as Record<string, any[]>);

  const accessedSemesters = new Set(
    accessedResults.map((a: any) => `${a.semester}|${a.session}`)
  );

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Examination Results</h2>
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
          {Object.entries(resultsBySemester).map(([semesterKey, courses]: any) => {
            const isAccessed = accessedSemesters.has(semesterKey);
            const [semester, session] = semesterKey.split('|');

            return (
              <div
                key={semesterKey}
                className="rounded-lg border p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {semester} Semester, {session}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {courses.length} course(s) result{courses.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {isAccessed ? (
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ✓ Accessed
                        </span>
                        <Link
                          href={`/results/${semesterKey}`}
                          className="block mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View Results →
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInitiatePayment(semesterKey)}
                        disabled={initiatePaymentMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        {initiatePaymentMutation.isPending
                          ? 'Processing...'
                          : 'Pay ₦5,000'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Show course breakdown if accessed */}
                {isAccessed && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-2">
                    {courses.map((course: any) => (
                      <div
                        key={course.id}
                        className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded"
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
          href="/results"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          View Full Results Page →
        </Link>
      </div>
    </div>
  );
}
