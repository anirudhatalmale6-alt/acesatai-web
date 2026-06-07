'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            Powered by Item Response Theory + GPT-4o
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl">
            Ace the SAT with{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Adaptive AI
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
            ACESATAI adapts to your exact skill level in real-time using IRT algorithms.
            Every question is calibrated to your proficiency -- pushing you into your
            optimal learning zone. Snap photos of problems, talk to a Socratic AI coach,
            and watch your scores climb.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/quiz"
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 hover:scale-105"
            >
              Start Practicing
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-4 text-lg font-semibold text-gray-200 transition-all hover:border-gray-600 hover:bg-gray-800"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white">
            Why ACESATAI Works
          </h2>
          <p className="mb-16 text-center text-gray-400">
            Science-backed adaptive learning meets cutting-edge AI
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-gray-800 bg-[#111827] p-8 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Adaptive IRT Engine</h3>
              <p className="text-gray-400 leading-relaxed">
                Questions dynamically calibrate to your theta score. Too easy? The engine pushes harder.
                Struggling? It scaffolds back. Every session is uniquely yours.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-gray-800 bg-[#111827] p-8 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Snap & Solve</h3>
              <p className="text-gray-400 leading-relaxed">
                Photograph any SAT problem from a textbook or worksheet. GPT-4o Vision analyzes
                the image and delivers a step-by-step solution instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-gray-800 bg-[#111827] p-8 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Socratic Voice Coach</h3>
              <p className="text-gray-400 leading-relaxed">
                Talk through problems with an AI tutor that never gives you the answer directly.
                It guides your thinking with Socratic questions until you find it yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-gray-800 px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">1,500+</div>
            <div className="mt-2 text-gray-400">SAT Questions</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400">IRT 3PL</div>
            <div className="mt-2 text-gray-400">Adaptive Algorithm</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">GPT-4o</div>
            <div className="mt-2 text-gray-400">Vision + Voice AI</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ACESATAI. All rights reserved. Built with adaptive intelligence.
        </div>
      </footer>
    </div>
  );
}
