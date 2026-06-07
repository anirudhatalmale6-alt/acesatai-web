'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { getUserProfile } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  math_theta: number;
  verbal_theta: number;
  daily_streak: number;
  xp_total: number;
  preferred_language: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = 'web_user_demo';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Use mock data for demo
        setProfile({
          id: userId,
          email: 'student@acesat.ai',
          math_theta: 3.2,
          verbal_theta: 2.8,
          daily_streak: 7,
          xp_total: 450,
          preferred_language: 'English',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getThetaColor = (theta: number) => {
    if (theta >= 4.0) return 'text-emerald-400';
    if (theta >= 3.0) return 'text-blue-400';
    if (theta >= 2.0) return 'text-amber-400';
    return 'text-red-400';
  };

  const getThetaLabel = (theta: number) => {
    if (theta >= 4.5) return 'Expert';
    if (theta >= 4.0) return 'Advanced';
    if (theta >= 3.0) return 'Proficient';
    if (theta >= 2.0) return 'Developing';
    return 'Beginner';
  };

  const getThetaPercentage = (theta: number) => {
    return ((theta - 1) / 4) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">Your adaptive learning progress at a glance</p>
        </div>

        {/* Top Stats Row */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          {/* Streak */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <div className="mb-2 text-sm text-gray-400">Daily Streak</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-400">
                {profile?.daily_streak || 0}
              </span>
              <span className="text-lg text-gray-500">days</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-full rounded-full ${
                    i < (profile?.daily_streak || 0) % 7
                      ? 'bg-orange-400'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* XP */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <div className="mb-2 text-sm text-gray-400">Total XP</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-400">
                {profile?.xp_total || 0}
              </span>
              <span className="text-lg text-gray-500">pts</span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              +10 XP per correct answer
            </div>
          </div>

          {/* Math Theta */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <div className="mb-2 text-sm text-gray-400">Math Theta</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getThetaColor(profile?.math_theta || 2.5)}`}>
                {profile?.math_theta?.toFixed(1) || '2.5'}
              </span>
              <span className="text-sm text-gray-500">/5.0</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${getThetaPercentage(profile?.math_theta || 2.5)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {getThetaLabel(profile?.math_theta || 2.5)}
              </div>
            </div>
          </div>

          {/* Verbal Theta */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <div className="mb-2 text-sm text-gray-400">Verbal Theta</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getThetaColor(profile?.verbal_theta || 2.5)}`}>
                {profile?.verbal_theta?.toFixed(1) || '2.5'}
              </span>
              <span className="text-sm text-gray-500">/5.0</span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${getThetaPercentage(profile?.verbal_theta || 2.5)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {getThetaLabel(profile?.verbal_theta || 2.5)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Theta Analysis */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Math Card */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8">
            <h3 className="mb-6 text-lg font-semibold text-white">Mathematics Performance</h3>
            <div className="flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${getThetaPercentage(profile?.math_theta || 2.5)}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-400">
                    {profile?.math_theta?.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">of 5.0</span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Level</div>
                <div className="font-medium text-gray-200">
                  {getThetaLabel(profile?.math_theta || 2.5)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">SAT Estimate</div>
                <div className="font-medium text-gray-200">
                  {Math.round(((profile?.math_theta || 2.5) / 5) * 400 + 400)}
                </div>
              </div>
            </div>
          </div>

          {/* Verbal Card */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8">
            <h3 className="mb-6 text-lg font-semibold text-white">Reading & Writing Performance</h3>
            <div className="flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${getThetaPercentage(profile?.verbal_theta || 2.5)}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    {profile?.verbal_theta?.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">of 5.0</span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Level</div>
                <div className="font-medium text-gray-200">
                  {getThetaLabel(profile?.verbal_theta || 2.5)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">SAT Estimate</div>
                <div className="font-medium text-gray-200">
                  {Math.round(((profile?.verbal_theta || 2.5) / 5) * 400 + 400)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8">
          <h3 className="mb-6 text-lg font-semibold text-white">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/quiz"
              className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-600/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-200">Practice Quiz</div>
                <div className="text-xs text-gray-500">Start adaptive session</div>
              </div>
            </a>

            <a
              href="/snap-solve"
              className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-600/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-200">Snap & Solve</div>
                <div className="text-xs text-gray-500">Upload a problem photo</div>
              </div>
            </a>

            <a
              href="/quiz"
              className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-purple-500/50 hover:bg-purple-600/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-200">Focus Mode</div>
                <div className="text-xs text-gray-500">Timed practice session</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
