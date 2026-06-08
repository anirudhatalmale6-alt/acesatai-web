'use client';

import { useState, useRef } from 'react';

interface VoiceCoachProps {
  questionContext: string;
  questionId: number;
  userId: string;
  section: string;
}

interface ConversationEntry {
  student: string;
  coach: string;
  audioUrl: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

export default function VoiceCoach({ questionContext, questionId, userId, section }: VoiceCoachProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('Your browser does not support audio recording. Please use Chrome, Safari, or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
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
    formData.append('conversation_history', JSON.stringify(conversation));

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

      const entry: ConversationEntry = {
        student: data.student_said || '',
        coach: data.coach_wrote || '',
        audioUrl: data.audio_url || '',
      };
      setConversation(prev => [...prev, entry]);

      if (data.audio_url) {
        setState('playing');
        const audio = new Audio(data.audio_url);
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
    const audio = new Audio(url);
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
        return { text: conversation.length > 0 ? 'Ask Follow-up' : 'Talk to Coach', color: 'bg-purple-600 hover:bg-purple-700', pulse: false };
    }
  };

  const btn = getButtonContent();

  return (
    <div className="relative">
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

      {showPanel && (
        <div className="absolute bottom-full mb-3 right-0 w-96 max-h-80 rounded-xl border border-gray-700 bg-[#1e293b] shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <span className="text-xs font-semibold text-purple-300">Socratic Voice Coach</span>
            <div className="flex items-center gap-2">
              {conversation.length > 0 && (
                <span className="text-[10px] text-gray-500">{conversation.length} exchange{conversation.length > 1 ? 's' : ''}</span>
              )}
              <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-white text-sm">&times;</button>
            </div>
          </div>

          <div ref={panelRef} className="flex-1 overflow-y-auto p-3 space-y-3 max-h-56">
            {conversation.length === 0 && state === 'idle' && (
              <p className="text-center text-xs text-gray-500 py-4">Tap the mic and ask a question about the current problem. Your AI tutor will guide you without giving away the answer.</p>
            )}

            {conversation.map((entry, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-[10px] text-blue-400 mt-0.5">Y</div>
                  <p className="text-xs text-gray-300 italic">&ldquo;{entry.student}&rdquo;</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-[10px] text-purple-400 mt-0.5">C</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-200 leading-relaxed">{entry.coach}</p>
                    {entry.audioUrl && (
                      <button
                        onClick={() => playAudio(entry.audioUrl)}
                        className="mt-1 flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Replay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {state === 'recording' && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400">Listening... speak now</span>
              </div>
            )}

            {state === 'processing' && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <span className="text-xs text-amber-400">Analyzing your question...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-3 mb-3 rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-[10px] text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
