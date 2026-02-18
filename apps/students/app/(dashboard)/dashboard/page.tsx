'use client';

import { Suspense } from 'react';
import DashboardOverview from '@/components/dashboard/overview';
import CoursesSection from '@/components/courses/courses-section';
import ResultsSection from '@/components/results/results-section';
import StudentNavbar from '@/components/navbar';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
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
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/profile"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Update Profile
                  </a>
                </li>
                <li>
                  <a
                    href="/payments"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View Payment History
                  </a>
                </li>
                <li>
                  <a
                    href="/transcript"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Download Transcript
                  </a>
                </li>
                <li>
                  <a
                    href="/curriculum"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View Curriculum
                  </a>
                </li>
              </ul>
            </div>

            {/* Notifications Widget */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                  Results for 2024/2025 Semester 1 are now available
                </div>
                <div className="text-sm text-gray-600 p-2 bg-green-50 rounded border-l-4 border-green-500">
                  Payment successful for result checking
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
