"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DashboardOverview from "@/components/dashboard/overview";
import CoursesSection from "@/components/courses/courses-section";
import ResultsSection from "@/components/results/results-section";
import { useRequireAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { isPending } = useRequireAuth();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Dashboard Overview Section */}
      <Suspense fallback={<div>Loading overview...</div>}>
        <DashboardOverview />
      </Suspense>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Courses Section */}
          <Suspense fallback={<div>Loading courses...</div>}>
            <CoursesSection />
          </Suspense>

          {/* Results Section */}
          <Suspense fallback={<div>Loading results...</div>}>
            <ResultsSection />
          </Suspense>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Access common student tasks quickly.
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  Update Profile
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  href="/payments"
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  View Payment History
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  href="/transcript"
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  Download Transcript
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/courses"
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  View Curriculum
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Notifications Widget */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
            <div className="space-y-3">
              <div className="rounded border-l-4 border-gray-400 bg-gray-50 p-2 text-sm text-gray-700">
                Results for 2024/2025 Semester 1 are now available
              </div>
              <div className="rounded border-l-4 border-gray-400 bg-gray-50 p-2 text-sm text-gray-700">
                Payment successful for result checking
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
