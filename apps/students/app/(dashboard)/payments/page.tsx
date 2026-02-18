'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import StudentNavbar from '@/components/navbar';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';

const PAYMENT_HISTORY_QUERY = gql`
  query GetPaymentHistory($studentId: ID!) {
    paymentHistory(studentId: $studentId) {
      id
      amount
      currency
      status
      paymentType
      semester
      session
      paystackPaidAt
      paystackChannel
      createdAt
      metadata {
        description
      }
      resultAccess {
        id
        accessCount
        expiresAt
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
        semester
        session
      }
    }
  }
`;

function PaymentHistoryContent() {
  const { data: session } = useAuth();
  const studentId = session?.user?.studentProfile?.id;

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['paymentHistory', studentId],
    queryFn: () =>
      graphqlClient.request(PAYMENT_HISTORY_QUERY, { studentId }),
    enabled: !!studentId,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['paymentSummary', studentId],
    queryFn: () =>
      graphqlClient.request(PAYMENT_SUMMARY_QUERY, { studentId }),
    enabled: !!studentId,
  });

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

  if (paymentsLoading || summaryLoading) {
    return <div className="text-center py-8">Loading payment history...</div>;
  }

  const payments = paymentsData?.paymentHistory || [];
  const summary = summaryData?.paymentSummary || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
      case 'ABANDONED':
        return 'bg-red-100 text-red-700';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '✓';
      case 'PENDING':
        return '⏳';
      case 'FAILED':
      case 'ABANDONED':
        return '✗';
      case 'REFUNDED':
        return '↩';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-2">
            Track all your result checking payments and transactions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
          {/* Total Spent */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ₦{(summary.totalSpent || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summary.totalTransactions || 0}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>

          {/* Accessed Results */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Results Accessed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summary.accessedResults?.length || 0}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>

        {/* Payment Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No payments yet. Start by paying for your results.</p>
              <Link
                href="/results"
                className="text-blue-600 hover:text-blue-700 inline-block mt-4"
              >
                View Results →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-t bg-gray-50">
                  <tr>
                    <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                      Semester
                    </th>
                    <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                      Method
                    </th>
                    <th className="border-b px-6 py-3 text-center font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="border-b px-6 py-3 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {payment.semester} Sem, {payment.session}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₦{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {payment.paystackChannel || 'Card'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {getStatusIcon(payment.status)} {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {payment.status === 'SUCCESS' && (
                          <div className="flex items-center justify-center gap-2">
                            <button className="text-blue-600 hover:text-blue-700 hover:underline text-sm">
                              Receipt
                            </button>
                            <span className="text-gray-300">|</span>
                            <button className="text-blue-600 hover:text-blue-700 hover:underline text-sm">
                              Invoice
                            </button>
                          </div>
                        )}
                        {payment.status === 'PENDING' && (
                          <span className="text-gray-500 text-sm">Awaiting Payment</span>
                        )}
                        {(payment.status === 'FAILED' ||
                          payment.status === 'ABANDONED') && (
                          <button className="text-orange-600 hover:text-orange-700 hover:underline text-sm">
                            Retry Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Need Help?</h3>
          <p className="text-sm text-blue-700 mt-2">
            If you have questions about your payments or need assistance, please contact
            the Student Services office or email support@university.edu
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <PaymentHistoryContent />
    </Suspense>
  );
}
