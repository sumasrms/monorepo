'use client';

import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';
import { StatCard } from '@workspace/ui/components/stat-card';
import { GraduationCap, Wallet, BadgeCheck, CircleGauge } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Skeleton } from '@workspace/ui/components/skeleton';

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
  const userWithProfile = session?.user as
    | {
        name?: string;
        image?: string | null;
        studentProfile?: { id?: string };
      }
    | undefined;
  const studentId = userWithProfile?.studentProfile?.id;

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

  if (session && !studentId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Student profile not found for this account.
      </div>
    );
  }

  if (studentId && (studentLoading || paymentLoading)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const student = studentData?.student;
  const payment = paymentData?.paymentSummary;
  const studentName = student?.user?.name || userWithProfile?.name || 'Student';
  const avatarFallback = studentName
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline">Dashboard Overview</Badge>
            <div>
              <CardTitle className="text-2xl md:text-3xl">Welcome, {studentName}</CardTitle>
              <CardDescription className="mt-2">
                {student?.matricNumber || 'No matric number'} • Level {student?.level || '-'}
              </CardDescription>
            </div>
            <CardDescription>{student?.department?.name || 'No department assigned'}</CardDescription>
          </div>

          <Avatar size="lg" className="size-16 md:size-20">
            <AvatarImage src={student?.user?.image || undefined} alt={studentName} />
            <AvatarFallback>{avatarFallback || 'ST'}</AvatarFallback>
          </Avatar>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 border-t pt-6 md:grid-cols-3">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Matric Number</p>
            <p className="text-sm font-medium">{student?.matricNumber || 'Unavailable'}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Department</p>
            <p className="text-sm font-medium">{student?.department?.code || '-'}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Current Level</p>
            <p className="text-sm font-medium">{student?.level || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          title="CGPA"
          value={(student?.cgpa || 0).toFixed(2)}
          footerLabel="Current performance"
          footerIcon={CircleGauge}
        />

        <StatCard
          title="Current Level"
          value={student?.level || '-'}
          footerLabel="Academic progression"
          footerIcon={GraduationCap}
        />

        <StatCard
          title="Accessed Results"
          value={payment?.accessedResults?.length || 0}
          footerLabel="Unlocked semesters"
          footerIcon={BadgeCheck}
        />

        <StatCard
          title="Total Spent"
          value={`₦${(payment?.totalSpent || 0).toLocaleString()}`}
          footerLabel="All-time payments"
          footerIcon={Wallet}
        />
      </div>

      {/* Call-to-Action Banners */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/results"
          className="block rounded-xl border p-6 transition-colors hover:bg-muted/40"
        >
          <h3 className="text-lg font-semibold">View Your Results</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Check your semester exam results and academic performance
          </p>
        </Link>

        <Link
          href="/dashboard/payments"
          className="block rounded-xl border p-6 transition-colors hover:bg-muted/40"
        >
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Review all your payments and transaction history
          </p>
        </Link>
      </div>
    </div>
  );
}
