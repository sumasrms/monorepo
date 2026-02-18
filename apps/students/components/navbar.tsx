'use client';

import { useAuth } from '@/lib/auth-client';
import { signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { useState } from 'react';
import { LifeBuoy, MessageSquare } from 'lucide-react';
import { SupportFeedbackDialog } from '@/components/support-feedback-dialog';

export default function StudentNavbar() {
  const { data: session } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Student Portal</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/courses"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/results"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Results
            </Link>
            <Link
              href="/payments"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Payments
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="hidden sm:text-sm font-medium text-gray-700 sm:block">
                {session?.user?.name}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setSupportOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b flex items-center gap-2"
                >
                  <LifeBuoy className="h-4 w-4" />
                  Support
                </button>
                <button
                  onClick={() => {
                    setFeedbackOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SupportFeedbackDialog
        type="SUPPORT"
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
      <SupportFeedbackDialog
        type="FEEDBACK"
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </nav>
  );
}
