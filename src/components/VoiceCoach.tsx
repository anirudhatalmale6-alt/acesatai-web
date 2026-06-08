'use client';

import { useState, useRef } from 'react';

interface VoiceCoachProps {
  questionContext: string;
  questionId: number;
  userId: string;
  section: string;
}

interface HistoryEntry {
  speaker: string;
  text: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

export default function VoiceCoach({ questionContext, questionId, userId, section }: VoiceCoachProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unlockAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', ''];
    for (const t of types) {
      try { if (t === '' || MediaRecorder.isTypeSupported(t)) return t; } catch { continue; }
    }
    return '';
  };

  const startRecording = async () => {
    setError(null);
    setShowPanel(true);

    await unlockAudioContext();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('Your browser does not support audio recording. Please use Chrome, Safari, or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } as any,
      });

      audioChunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      const actualMime = recorder.mimeType || 'audio/webm';

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) {
          setError('No audio captured. Please make sure your microphone is working and try again.');
          setState('idle');
          return;
        }
        setState('processing');
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        const ext = actualMime.includes('mp4') ? 'mp4' : actualMime.includes('ogg') ? 'ogg' : 'webm';
        await sendToCoach(blob, ext);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setState('recording');
    } catch {
      setError('Microphone access denied. Please allow mic permissions in your browser settings and try again.');
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const sendToCoach = async (audioBlob: Blob, ext: string) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, `student_question.${ext}`);
    formData.append('user_id', userId);
    formData.append('question_id', String(questionId));
    formData.append('current_question_context', questionContext);
    formData.append('section', section);
    if (sessionId) formData.append('session_id', sessionId);

    try {
      const res = await fetch('https://api.acesatai.com/api/v1/voice-coach', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Server error' }));
        throw new Error(errData.detail || 'Server error');
      }

      const data = await res.json();

      if (data.session_id) setSessionId(data.session_id);
      if (data.current_history_panel) setHistory(data.current_history_panel);

      if (data.audio_url) {
        setState('playing');
        const audio = new Audio();
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.src = data.audio_url;
        audioRef.current = audio;
        audio.onended = () => setState('idle');
        audio.onerror = () => { setState('idle'); setError('Could not play audio response.'); };
        audio.play().catch(() => setState('idle'));
      } else {
        setState('idle');
      }

      setTimeout(() => {
        if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
      }, 100);

    } catch (err: any) {
      setError(err.message || 'Voice Coach connection failed. Please try again.');
      setState('idle');
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio();
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.src = url;
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleClick = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    } else if (state === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setState('idle');
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'recording':
        return { text: 'Stop & Ask Coach', color: 'bg-red-600 hover:bg-red-700', pulse: true };
      case 'processing':
        return { text: 'Coach is thinking...', color: 'bg-amber-600', pulse: false };
      case 'playing':
        return { text: 'Coach speaking...', color: 'bg-emerald-600', pulse: true };
      default:
        return { text: history.length > 0 ? 'Ask Follow-up' : 'Talk to Coach', color: 'bg-purple-600 hover:bg-purple-700', pulse: false };
    }
  };

  const btn = getButtonContent();

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleClick}
        disabled={state === 'processing'}
        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${btn.color} ${btn.pulse ? 'animate-pulse' : ''}`}
      >
        {state === 'recording' ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
        ) : state === 'processing' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : state === 'playing' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" /></svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        )}
        {btn.text}
      </button>

      {/* Backdrop Overlay + Centered Modal */}
      {showPanel && (
        <>
          {/* Dimming backdrop - z-999 */}
          <div
            className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm"
            style={{ zIndex: 999 }}
            onClick={() => { if (state === 'idle') setShowPanel(false); }}
          />

          {/* Coach Modal - z-1000 */}
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl border border-gray-700 bg-[#1e293b] shadow-2xl flex flex-col"
            style={{ zIndex: 1000, maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 rounded-t-2xl bg-[#0f172a]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/30">
                  <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <span className="text-sm font-semibold text-purple-300">Socratic Voice Coach</span>
              </div>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <span className="text-xs text-gray-500">{Math.floor(history.length / 2)} exchange{Math.floor(history.length / 2) !== 1 ? 's' : ''}</span>
                )}
                <button onClick={() => setShowPanel(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-lg">&times;</button>
              </div>
            </div>

            {/* Conversation Feed */}
            <div ref={panelRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '50vh' }}>
              {history.length === 0 && state === 'idle' && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/15">
                    <svg className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Ask your AI tutor anything</p>
                  <p className="text-xs text-gray-500">Tap the mic below and speak your question. The coach will guide you without giving away the answer.</p>
                </div>
              )}

              {history.map((entry, i) => (
                <div key={i} className={`flex gap-3 ${entry.speaker === 'student' ? '' : ''}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${entry.speaker === 'student' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                    {entry.speaker === 'student' ? 'Y' : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 mb-0.5">{entry.speaker === 'student' ? 'You said' : 'Coach says'}</div>
                    <p className={`text-sm leading-relaxed ${entry.speaker === 'student' ? 'text-gray-300 italic' : 'text-gray-100'}`}>
                      {entry.speaker === 'student' ? `"${entry.text}"` : entry.text}
                    </p>
                  </div>
                </div>
              ))}

              {state === 'recording' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="flex gap-1">
                    <div className="h-3 w-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="h-4 w-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                    <div className="h-5 w-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '100ms' }} />
                    <div className="h-3 w-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '250ms' }} />
                  </div>
                  <span className="text-sm text-red-400 font-medium">Listening... speak now</span>
                </div>
              )}

              {state === 'processing' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <span className="text-sm text-amber-400 font-medium">Analyzing your question...</span>
                </div>
              )}

              {state === 'playing' && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex gap-1">
                    <div className="h-3 w-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="h-5 w-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '100ms' }} />
                    <div className="h-2 w-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="h-4 w-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                    <div className="h-3 w-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                  </div>
                  <span className="text-sm text-emerald-400 font-medium">Coach is speaking...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-3 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="px-4 py-3 border-t border-gray-700/50 flex items-center justify-center gap-3">
              <button
                onClick={handleClick}
                disabled={state === 'processing'}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${btn.color} ${btn.pulse ? 'animate-pulse' : ''}`}
              >
                {state === 'recording' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                ) : state === 'processing' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
                {state === 'recording' ? 'Stop & Ask' : state === 'processing' ? 'Thinking...' : history.length > 0 ? 'Ask Follow-up' : 'Start Recording'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
