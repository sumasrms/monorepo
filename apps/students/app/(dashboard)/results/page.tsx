'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import StudentNavbar from '@/components/navbar';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';

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
  const { data: session } = useAuth();
  const studentId = session?.user?.studentProfile?.id;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // Check if coming back from payment
  const reference = searchParams.get('reference');

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['results', studentId],
    queryFn: () => graphqlClient.request(RESULTS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['myResultAccess', studentId],
    queryFn: () => graphqlClient.request(RESULT_ACCESS_QUERY, { studentId }),
    enabled: !!studentId,
  });

  // Auto-verify payment if returning from Paystack
  const verifyMutation = useMutation({
    mutationFn: (ref: string) =>
      graphqlClient.request(VERIFY_PAYMENT_MUTATION, { reference: ref }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResultAccess', studentId] });
    },
  });

  const initiateMutation = useMutation({
    mutationFn: (variables: any) =>
      graphqlClient.request(INITIATE_PAYMENT_MUTATION, { input: variables }),
    onSuccess: (data: any) => {
      if (data.initiatePayment.authorizationUrl) {
        window.location.href = data.initiatePayment.authorizationUrl;
      }
    },
  });

  // Verify payment on mount if reference exists
  useState(() => {
    if (reference) {
      verifyMutation.mutate(reference);
    }
  });

  const handlePayment = (semester: string, session: string) => {
    initiateMutation.mutate({
      studentId,
      amount: 5000,
      semester,
      session,
      paymentType: "RESULT_ACCESS",
      description: `Result checking fee for ${semester} semester, ${session}`,
    });
  };

  if (session && !studentId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StudentNavbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Student profile not found for this account.
          </div>
        </main>
      </div>
    );
  }

  if (resultsLoading || accessLoading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  const results = resultsData?.studentResults || [];
  const accessedResults = accessData?.studentResultAccess || [];

  // Group results by semester
  const resultsByKey = results.reduce((acc: any, result: any) => {
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
  }, {} as Record<string, any>);

  const accessedKeys = new Set(
    accessedResults.map((a: any) => `${a.semester}|${a.session}`)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Examination Results</h1>
          <p className="text-gray-600 mt-2">
            View and pay for your semester examination results
          </p>
        </div>

        {/* Payment Success Message */}
        {reference && verifyMutation.isSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <p className="font-semibold">✓ Payment Verified Successfully!</p>
            <p className="text-sm mt-1">
              Your payment has been processed. You can now view your results.
            </p>
          </div>
        )}

        {/* Results by Semester */}
        <div className="space-y-8">
          {Object.values(resultsByKey).map((semData: any) => {
            const key = `${semData.semester}|${semData.session}`;
            const isAccessed = accessedKeys.has(key);
            const accessInfo = accessedResults.find(
              (a: any) => `${a.semester}|${a.session}` === key
            );

            return (
              <div key={key} className="rounded-lg border bg-white shadow-sm">
                <div className="border-b px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {semData.semester} Semester, {semData.session}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {semData.courses.length} course(s)
                    </p>
                  </div>
                  {isAccessed ? (
                    <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                      ✓ Accessed on{' '}
                      {new Date(accessInfo.payment.paystackPaidAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        handlePayment(semData.semester, semData.session)
                      }
                      disabled={initiateMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      {initiateMutation.isPending ? 'Processing...' : 'Pay ₦5,000'}
                    </button>
                  )}
                </div>

                {isAccessed ? (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Course Code
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">
                              Course Title
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Credits
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              CA
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Exam
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Total
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Grade
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">
                              Grade Point
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {semData.courses.map((course: any) => (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {course.course.code}
                              </td>
                              <td className="py-3 px-4 text-gray-700">
                                {course.course.title}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-700">
                                {course.course.credits}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-700">
                                {course.ca || '-'}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-700">
                                {course.exam || '-'}
                              </td>
                              <td className="py-3 px-4 text-center font-semibold text-gray-900">
                                {course.score.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                                  {course.grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-900 font-medium">
                                {course.gradePoint.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-6 border-t flex justify-between items-center">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        Print
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center py-12 text-gray-500">
                    <p>Results are available. Pay ₦5,000 to unlock and view them.</p>
                    <p className="text-sm mt-2">
                      Access will be valid for 90 days from payment date.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(resultsByKey).length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              No results available yet. Check back after results are published.
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
