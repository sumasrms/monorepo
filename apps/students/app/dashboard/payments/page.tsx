'use client';

import { Suspense } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';
import { StatCard } from '@workspace/ui/components/stat-card';
import { Badge } from '@workspace/ui/components/badge';
import {
  Wallet,
  ChartBar,
  BadgeCheck,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  ReceiptText,
  FileText,
  RefreshCcw,
  Circle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

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

type PaymentHistoryItem = {
  id: string;
  amount: number;
  status: string;
  semester: string;
  session: string;
  paystackChannel?: string | null;
  createdAt: string;
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

const INITIATE_PAYMENT_MUTATION = gql`
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      success
      message
      authorizationUrl
    }
  }
`;

function PaymentHistoryContent() {
  const { data: session } = useAuth();
  const userWithProfile = session?.user as
    | {
        studentProfile?: { id?: string };
      }
    | undefined;
  const studentId = userWithProfile?.studentProfile?.id;

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

  const retryPaymentMutation = useMutation<
    InitiatePaymentResponse,
    Error,
    InitiatePaymentVariables
  >({
    mutationFn: (variables) =>
      graphqlClient.request<InitiatePaymentResponse>(INITIATE_PAYMENT_MUTATION, {
        input: variables,
      }),
    onSuccess: (data) => {
      const url = data.initiatePayment.authorizationUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
  });

  if (session && !studentId) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Student profile not found for this account.
        </div>
      </main>
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
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PENDING':
        return <Clock3 className="h-4 w-4" />;
      case 'FAILED':
      case 'ABANDONED':
        return <XCircle className="h-4 w-4" />;
      case 'REFUNDED':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Circle className="h-3 w-3 fill-current" />;
    }
  };

  const handleRetryPayment = (payment: PaymentHistoryItem) => {
    if (!studentId) return;

    retryPaymentMutation.mutate({
      studentId,
      amount: payment.amount,
      semester: payment.semester,
      session: payment.session,
      paymentType: 'RESULT_ACCESS',
      description: `Result checking fee for ${payment.semester} semester, ${payment.session}`,
    });
  };

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold text-gray-900">
            <CreditCard className="h-7 w-7" />
            Payment History
          </h1>
          <p className="text-gray-600 mt-2">
            Track all your result checking payments and transactions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
          <StatCard
            title="Total Spent"
            value={`₦${(summary.totalSpent || 0).toLocaleString()}`}
            footerLabel="All transactions"
            footerIcon={Wallet}
          />

          <StatCard
            title="Total Transactions"
            value={summary.totalTransactions || 0}
            footerLabel="Successful + pending"
            footerIcon={ChartBar}
          />

          <StatCard
            title="Results Accessed"
            value={summary.accessedResults?.length || 0}
            footerLabel="Unlocked result sets"
            footerIcon={BadgeCheck}
          />
        </div>

        {/* Payment Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-gray-900">
              <ReceiptText className="h-5 w-5" />
              All Transactions
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No payments yet. Start by paying for your results.</p>
              <Link
                href="/dashboard/results"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                View Results <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-gray-700">Date</TableHead>
                    <TableHead className="px-6 py-3 text-gray-700">Semester</TableHead>
                    <TableHead className="px-6 py-3 text-gray-700">Amount</TableHead>
                    <TableHead className="px-6 py-3 text-gray-700">Method</TableHead>
                    <TableHead className="px-6 py-3 text-center text-gray-700">Status</TableHead>
                    <TableHead className="px-6 py-3 text-center text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: PaymentHistoryItem) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 text-gray-700">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-900">
                        {payment.semester} Sem, {payment.session}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-gray-900">
                        ₦{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-700">
                        {payment.paystackChannel || 'Card'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1.5 font-semibold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        {payment.status === 'SUCCESS' && (
                          <div className="flex items-center justify-center gap-3">
                            <button className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline">
                              <ReceiptText className="h-4 w-4" />
                              Receipt
                            </button>
                            <button className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline">
                              <FileText className="h-4 w-4" />
                              Invoice
                            </button>
                          </div>
                        )}
                        {payment.status === 'PENDING' && (
                          <button
                            onClick={() => handleRetryPayment(payment)}
                            disabled={retryPaymentMutation.isPending}
                            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline disabled:opacity-60"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            {retryPaymentMutation.isPending ? 'Retrying...' : 'Retry Payment'}
                          </button>
                        )}
                        {(payment.status === 'FAILED' || payment.status === 'ABANDONED') && (
                          <button
                            onClick={() => handleRetryPayment(payment)}
                            disabled={retryPaymentMutation.isPending}
                            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline disabled:opacity-60"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            {retryPaymentMutation.isPending ? 'Retrying...' : 'Retry Payment'}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-lg border bg-gray-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
          <p className="mt-2 text-sm text-gray-600">
            If you have questions about your payments or need assistance, please contact
            the Student Services office or email support@university.edu
          </p>
        </div>
      </main>
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
