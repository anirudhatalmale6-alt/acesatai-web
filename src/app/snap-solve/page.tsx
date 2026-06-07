'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { snapSolve } from '@/lib/api';

export default function SnapSolvePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setSolution(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSolve = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSolution(null);

    try {
      const result = await snapSolve(file);
      setSolution(result.solution || result.response || JSON.stringify(result));
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setSolution(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Snap & <span className="text-emerald-400">Solve</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Upload a photo of any SAT problem and get an AI-powered step-by-step solution
          </p>
        </div>

        {/* Upload Zone */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-[#111827] hover:border-gray-600'
            }`}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="mb-2 text-lg font-medium text-gray-200">
              Drag & drop your SAT problem image here
            </p>
            <p className="mb-6 text-sm text-gray-500">
              PNG, JPG, or JPEG up to 10MB
            </p>
            <label className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Browse Files
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="rounded-2xl border border-gray-800 bg-[#111827] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">Uploaded Image</h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Remove & Upload New
                </button>
              </div>
              <div className="flex justify-center rounded-lg bg-gray-900 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Uploaded SAT problem"
                  className="max-h-80 rounded-lg object-contain"
                />
              </div>
            </div>

            {/* Solve Button */}
            {!solution && !loading && (
              <div className="flex justify-center">
                <button
                  onClick={handleSolve}
                  className="rounded-xl bg-emerald-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:scale-105"
                >
                  Solve with AI
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-800 bg-[#111827] p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className="text-gray-400">GPT-4o is analyzing your problem...</p>
              </div>
            )}

            {/* Solution Display */}
            {solution && (
              <div className="rounded-2xl border border-emerald-700/50 bg-emerald-900/10 p-8">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Solution
                </h3>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-200">
                  {solution}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-700/50 bg-red-900/20 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
