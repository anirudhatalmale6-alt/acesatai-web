'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getUserProfile, snapSolve } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  math_theta: number;
  verbal_theta: number;
  daily_streak: number;
  xp_total: number;
  preferred_language: string;
}

const MATH_DOMAINS = [
  { key: 'algebra', label: 'Algebra', desc: 'Linear equations, systems of inequalities', color: 'blue' },
  { key: 'advanced', label: 'Advanced Math', desc: 'Quadratic functions, radical equations', color: 'purple' },
  { key: 'problem', label: 'Problem-Solving & Data', desc: 'Ratios, percentages, probability', color: 'amber' },
  { key: 'geometry', label: 'Geometry & Trigonometry', desc: 'Circles, triangles, coordinate geometry', color: 'emerald' },
];

const VERBAL_DOMAINS = [
  { key: 'reading', label: 'Reading Comprehension', desc: 'Main idea, inference, evidence', color: 'blue' },
  { key: 'craft', label: 'Craft & Structure', desc: 'Words in context, cross-text evaluation', color: 'purple' },
  { key: 'conventions', label: 'Standard English Conventions', desc: 'Punctuation, modifier structures', color: 'amber' },
  { key: 'expression', label: 'Expression of Ideas', desc: 'Transitions, synthesis, rhetoric', color: 'emerald' },
];

const colorMap: Record<string, { bg: string; bar: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-600/10', bar: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-600/30' },
  purple: { bg: 'bg-purple-600/10', bar: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-600/30' },
  amber: { bg: 'bg-amber-600/10', bar: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-600/30' },
  emerald: { bg: 'bg-emerald-600/10', bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-600/30' },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState(false);
  const [snapFile, setSnapFile] = useState<File | null>(null);
  const [snapPreview, setSnapPreview] = useState<string | null>(null);
  const [snapSolution, setSnapSolution] = useState<string | null>(null);
  const [snapLoading, setSnapLoading] = useState(false);

  const userId = 'web_user_demo';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch {
        setProfile({
          id: userId, email: 'student@acesat.ai',
          math_theta: 3.2, verbal_theta: 2.8, daily_streak: 7, xp_total: 450, preferred_language: 'English',
        });
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const mathTheta = profile?.math_theta || 2.5;
  const verbalTheta = profile?.verbal_theta || 2.5;
  const mathSAT = Math.round((mathTheta / 5) * 400 + 400);
  const verbalSAT = Math.round((verbalTheta / 5) * 400 + 400);
  const totalSAT = mathSAT + verbalSAT;
  const totalPct = ((totalSAT - 400) / 1200) * 100;

  const getThetaPercentage = (t: number) => ((t - 1) / 4) * 100;
  const getThetaLabel = (t: number) => t >= 4.5 ? 'Expert' : t >= 4.0 ? 'Advanced' : t >= 3.0 ? 'Proficient' : t >= 2.0 ? 'Developing' : 'Beginner';

  const getDomainProficiency = (theta: number, idx: number) => {
    const offsets = [0, 0.3, -0.2, 0.1];
    const val = Math.max(0, Math.min(100, getThetaPercentage(theta + (offsets[idx] || 0))));
    return val;
  };

  const getModuleStatus = (theta: number) => {
    if (theta >= 3.5) return { module: 2, difficulty: 'Hard', unlocked: true };
    if (theta >= 2.5) return { module: 1, difficulty: 'Medium', unlocked: true };
    return { module: 1, difficulty: 'Easy', unlocked: false };
  };

  const handleSnapFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSnapFile(file);
    setSnapPreview(URL.createObjectURL(file));
    setSnapSolution(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleSnapFile(e.dataTransfer.files[0]);
  }, []);

  const handleSnapSolve = async () => {
    if (!snapFile) return;
    setSnapLoading(true);
    try {
      const result = await snapSolve(snapFile);
      setSnapSolution(result.solution || result.response || JSON.stringify(result));
    } catch { setSnapSolution('Failed to process. Please try again.'); }
    finally { setSnapLoading(false); }
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

  const mathMod = getModuleStatus(mathTheta);
  const verbalMod = getModuleStatus(verbalTheta);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
          <p className="mt-1 text-gray-400">Your SAT prep command center</p>
        </div>

        {/* ===== ROW 1: Predictive Gauge + Stats ===== */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* 1600 Predictive Gauge */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-8 text-center">
            <h3 className="mb-1 text-sm font-medium text-gray-400">Predicted SAT Score</h3>
            <div className="relative mx-auto mt-4 flex h-48 w-48 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" fill="none" stroke="#1f2937" strokeWidth="2.5" />
                <path d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" fill="none" stroke="url(#gaugeGrad)" strokeWidth="2.5" strokeDasharray={`${totalPct}, 100`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white">{totalSAT}</span>
                <span className="text-xs text-gray-500">of 1600</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div>
                <div className="text-xs text-gray-500">R&W</div>
                <div className="text-lg font-bold text-blue-400">{verbalSAT}</div>
              </div>
              <div className="h-8 w-px bg-gray-700" />
              <div>
                <div className="text-xs text-gray-500">Math</div>
                <div className="text-lg font-bold text-emerald-400">{mathSAT}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-1 text-xs text-gray-500">Daily Streak</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-orange-400">{profile?.daily_streak || 0}</span>
                <span className="text-sm text-gray-500">days</span>
              </div>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-full rounded-full ${i < (profile?.daily_streak || 0) % 7 ? 'bg-orange-400' : 'bg-gray-700'}`} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-1 text-xs text-gray-500">Total XP</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-purple-400">{profile?.xp_total || 0}</span>
                <span className="text-sm text-gray-500">pts</span>
              </div>
              <div className="mt-3 text-xs text-gray-600">+10 XP per correct answer</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-1 text-xs text-gray-500">Math Theta</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-blue-400">{mathTheta.toFixed(1)}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-700">
                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${getThetaPercentage(mathTheta)}%` }} />
              </div>
              <div className="mt-1 text-xs text-gray-600">{getThetaLabel(mathTheta)}</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-5">
              <div className="mb-1 text-xs text-gray-500">Verbal Theta</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">{verbalTheta.toFixed(1)}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-700">
                <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${getThetaPercentage(verbalTheta)}%` }} />
              </div>
              <div className="mt-1 text-xs text-gray-600">{getThetaLabel(verbalTheta)}</div>
            </div>
          </div>
        </div>

        {/* ===== ROW 2: Module Milestones ===== */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Math Module Progression</h3>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${mathMod.module >= 1 ? 'bg-blue-600/20' : 'bg-gray-800'}`}>
                <span className={`text-lg font-bold ${mathMod.module >= 1 ? 'text-blue-400' : 'text-gray-600'}`}>M1</span>
              </div>
              <div className="flex-1">
                <div className="h-1 rounded-full bg-gray-700">
                  <div className={`h-1 rounded-full transition-all ${mathMod.unlocked ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gray-600'}`} style={{ width: mathMod.unlocked ? '100%' : '50%' }} />
                </div>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${mathMod.module >= 2 ? 'bg-emerald-600/20' : 'bg-gray-800 border border-dashed border-gray-700'}`}>
                <span className={`text-lg font-bold ${mathMod.module >= 2 ? 'text-emerald-400' : 'text-gray-600'}`}>M2</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {mathMod.module >= 2
                ? 'Based on your performance in Math Module 1, you successfully unlocked the Hard Difficulty track for Module 2!'
                : 'Complete Module 1 to unlock the Hard Difficulty track for Module 2.'}
            </p>
            <div className="mt-2 inline-block rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-300">
              Current: {mathMod.difficulty} Difficulty
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">R&W Module Progression</h3>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${verbalMod.module >= 1 ? 'bg-emerald-600/20' : 'bg-gray-800'}`}>
                <span className={`text-lg font-bold ${verbalMod.module >= 1 ? 'text-emerald-400' : 'text-gray-600'}`}>M1</span>
              </div>
              <div className="flex-1">
                <div className="h-1 rounded-full bg-gray-700">
                  <div className={`h-1 rounded-full transition-all ${verbalMod.unlocked ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-gray-600'}`} style={{ width: verbalMod.unlocked ? '100%' : '50%' }} />
                </div>
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${verbalMod.module >= 2 ? 'bg-blue-600/20' : 'bg-gray-800 border border-dashed border-gray-700'}`}>
                <span className={`text-lg font-bold ${verbalMod.module >= 2 ? 'text-blue-400' : 'text-gray-600'}`}>M2</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {verbalMod.module >= 2
                ? 'Based on your performance in R&W Module 1, you successfully unlocked the Hard Difficulty track for Module 2!'
                : 'Complete Module 1 to unlock the Hard Difficulty track for Module 2.'}
            </p>
            <div className="mt-2 inline-block rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Current: {verbalMod.difficulty} Difficulty
            </div>
          </div>
        </div>

        {/* ===== ROW 3: Domain Mastery Matrix ===== */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-5 text-sm font-semibold text-white">Math Domain Mastery</h3>
            <div className="space-y-4">
              {MATH_DOMAINS.map((d, i) => {
                const pct = getDomainProficiency(mathTheta, i);
                const c = colorMap[d.color];
                return (
                  <div key={d.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-300">{d.label}</span>
                      <span className={`text-xs font-bold ${c.text}`}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-700/50">
                      <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-600">{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-5 text-sm font-semibold text-white">R&W Domain Mastery</h3>
            <div className="space-y-4">
              {VERBAL_DOMAINS.map((d, i) => {
                const pct = getDomainProficiency(verbalTheta, i);
                const c = colorMap[d.color];
                return (
                  <div key={d.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-300">{d.label}</span>
                      <span className={`text-xs font-bold ${c.text}`}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-700/50">
                      <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-600">{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== ROW 4: Snap & Solve Drop Zone + Voice Vault ===== */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Snap & Solve Drop Zone */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Snap & Solve</h3>
            {!snapPreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:border-gray-600'}`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/15">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="mb-1 text-sm font-medium text-gray-300">Drop your SAT problem here</p>
                <p className="mb-4 text-xs text-gray-500">PNG, JPG up to 10MB</p>
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                    Browse Files
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSnapFile(e.target.files[0])} className="hidden" />
                  </label>
                  <label className="cursor-pointer rounded-lg border border-emerald-600 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/20 transition-colors md:hidden">
                    Camera
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleSnapFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-900 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={snapPreview} alt="Problem" className="max-h-48 w-full rounded object-contain" />
                </div>
                {!snapSolution && !snapLoading && (
                  <button onClick={handleSnapSolve} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
                    Solve with AI
                  </button>
                )}
                {snapLoading && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <span className="text-xs text-gray-400">Analyzing with GPT-4o...</span>
                  </div>
                )}
                {snapSolution && (
                  <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/10 p-4">
                    <h4 className="mb-2 text-xs font-semibold text-emerald-300">Solution</h4>
                    <p className="whitespace-pre-wrap text-sm text-gray-300">{snapSolution}</p>
                  </div>
                )}
                <button onClick={() => { setSnapFile(null); setSnapPreview(null); setSnapSolution(null); }} className="text-xs text-gray-500 hover:text-gray-300">
                  Upload different image
                </button>
              </div>
            )}
          </div>

          {/* Socratic Voice Vault */}
          <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Socratic Voice Vault</h3>
            <p className="mb-4 text-xs text-gray-400">Re-listen to past AI coaching sessions. Audio breakdowns saved from your voice coach interactions.</p>
            <div className="space-y-3">
              {[
                { title: 'Algebra: Systems of Equations', date: 'Today', duration: '2:34' },
                { title: 'Geometry: Circle Theorems', date: 'Yesterday', duration: '3:12' },
                { title: 'Reading: Inference Questions', date: '2 days ago', duration: '1:58' },
              ].map((session, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-3 transition-all hover:border-gray-600 hover:bg-gray-800/50">
                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors">
                    <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-medium text-gray-200">{session.title}</div>
                    <div className="text-[10px] text-gray-500">{session.date}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{session.duration}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[10px] text-gray-600">Voice sessions are saved automatically after each coaching interaction</p>
          </div>
        </div>

        {/* ===== ROW 5: Quick Actions ===== */}
        <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Quick Actions</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/quiz" className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-600/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-200">Practice Quiz</div>
                <div className="text-[10px] text-gray-500">Adaptive session</div>
              </div>
            </Link>
            <Link href="/snap-solve" className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-600/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-200">Snap & Solve</div>
                <div className="text-[10px] text-gray-500">Photo solver</div>
              </div>
            </Link>
            <Link href="/quiz" className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-purple-500/50 hover:bg-purple-600/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-200">Focus Mode</div>
                <div className="text-[10px] text-gray-500">Timed practice</div>
              </div>
            </Link>
            <Link href="/quiz" className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-600/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600/20 text-amber-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-200">Voice Coach</div>
                <div className="text-[10px] text-gray-500">Socratic tutoring</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} mediaXtreme LLC | ACESATAI All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
