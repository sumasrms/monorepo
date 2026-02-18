'use client';

import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';

const STUDENT_OVERVIEW_QUERY = gql`
  query GetStudentOverview($id: ID!) {
    student(id: $id) {
      id
      matricNumber
      admissionDate
      level
      cgpa
      department {
        id
        name
        code
      }
      user {
        id
        name
        email
        image
      }
    }
  }
`;

const PAYMENT_SUMMARY_QUERY = gql`
  query GetPaymentSummary($studentId: ID!) {
    paymentSummary(studentId: $studentId) {
      totalSpent
      totalTransactions
      accessedResults {
        id
        semester
        session
      }
    }
  }
`;

export default function DashboardOverview() {
  const { data: session } = useAuth();
  const studentId = session?.user?.studentProfile?.id;

  if (session && !studentId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Student profile not found for this account.
      </div>
    );
  }

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () =>
      graphqlClient.request(STUDENT_OVERVIEW_QUERY, { id: studentId }),
    enabled: !!studentId,
  });

  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ['paymentSummary', studentId],
    queryFn: () =>
      graphqlClient.request(PAYMENT_SUMMARY_QUERY, { studentId }),
    enabled: !!studentId,
  });

  if (studentLoading || paymentLoading) {
    return <div className="animate-pulse">Loading overview...</div>;
  }

  const student = studentData?.student;
  const payment = paymentData?.paymentSummary;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome,  {student?.user?.name}</h1>
            <p className="mt-1 text-blue-100">
              {student?.matricNumber} • Level {student?.level}
            </p>
            <p className="mt-2 text-blue-100">{student?.department?.name}</p>
          </div>
          {student?.user?.image && (
            <img
              src={student.user.image}
              alt={student.user.name}
              className="h-20 w-20 rounded-full border-4 border-white"
            />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* CGPA Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CGPA</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(student?.cgpa || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* Current Semester Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {student?.level}
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        {/* Payment Status Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accessed Results</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {payment?.accessedResults?.length || 0}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₦{(payment?.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Banners */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* View Results Banner */}
        <Link
          href="/results"
          className="block rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-6 hover:bg-blue-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-blue-900">View Your Results</h3>
          <p className="text-sm text-blue-700 mt-1">
            Check your semester exam results and academic performance
          </p>
        </Link>

        {/* Payment History Banner */}
        <Link
          href="/payments"
          className="block rounded-lg border-2 border-dashed border-green-400 bg-green-50 p-6 hover:bg-green-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-green-900">Payment History</h3>
          <p className="text-sm text-green-700 mt-1">
            Review all your payments and transaction history
          </p>
        </Link>
      </div>
    </div>
  );
}
