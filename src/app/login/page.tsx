'use client';

import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setVerificationSent(true);
        setLoading(false);
        return;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setError('Please verify your email first. A new verification link has been sent.');
          setLoading(false);
          return;
        }
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Google sign-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />
      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-8">
          <h2 className="mb-2 text-center text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mb-8 text-center text-sm text-gray-400">
            {isSignUp ? 'Start your SAT prep journey' : 'Continue your SAT prep'}
          </p>

          {verificationSent && (
            <div className="mb-6 rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-5 text-center">
              <div className="mb-2 text-2xl">&#9993;</div>
              <h3 className="mb-1 text-base font-semibold text-emerald-300">Check Your Email</h3>
              <p className="mb-3 text-xs text-gray-400">
                We sent a verification link to <span className="font-medium text-white">{email}</span>. Click the link to activate your account, then come back and sign in.
              </p>
              <button
                onClick={() => { setVerificationSent(false); setIsSignUp(false); setError(''); }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Go to Sign In
              </button>
            </div>
          )}

          {!verificationSent && (
            <>
              <button
                onClick={handleGoogle}
                className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm font-medium text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-xs text-gray-500">or</span>
                <div className="h-px flex-1 bg-gray-700" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    placeholder="student@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-900/20 p-3 text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setVerificationSent(false); }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
