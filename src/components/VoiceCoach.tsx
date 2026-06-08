'use client';

import { useState, useRef } from 'react';

interface VoiceCoachProps {
  questionContext: string;
  questionId: number;
  userId: string;
  section: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'playing';

export default function VoiceCoach({ questionContext, questionId, userId, section }: VoiceCoachProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [coachText, setCoachText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('processing');
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendToCoach(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState('recording');
    } catch {
      setError('Microphone access is required for Voice Coach.');
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const sendToCoach = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'student_question.webm');
    formData.append('user_id', userId);
    formData.append('question_id', String(questionId));
    formData.append('current_question_context', questionContext);
    formData.append('section', section);

    try {
      const res = await fetch('https://api.acesatai.com/api/v1/voice-coach', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.student_said) setTranscript(data.student_said);
      if (data.coach_wrote) setCoachText(data.coach_wrote);

      if (data.audio_url) {
        setState('playing');
        const audio = new Audio(data.audio_url);
        audioRef.current = audio;
        audio.onended = () => setState('idle');
        audio.play();
      } else {
        setState('idle');
      }
    } catch {
      setError('Voice Coach connection failed. Please try again.');
      setState('idle');
    }
  };

  const handleClick = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      setShowPanel(true);
      startRecording();
    } else if (state === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setState('idle');
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'recording':
        return { icon: 'stop', text: 'Stop & Ask Coach', color: 'bg-red-600 hover:bg-red-700', pulse: true };
      case 'processing':
        return { icon: 'spin', text: 'Coach is thinking...', color: 'bg-amber-600', pulse: false };
      case 'playing':
        return { icon: 'speaker', text: 'Coach speaking...', color: 'bg-emerald-600', pulse: true };
      default:
        return { icon: 'mic', text: 'Talk to Coach', color: 'bg-purple-600 hover:bg-purple-700', pulse: false };
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
        {btn.icon === 'mic' && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
        {btn.icon === 'stop' && (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        )}
        {btn.icon === 'spin' && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {btn.icon === 'speaker' && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
          </svg>
        )}
        {btn.text}
      </button>

      {showPanel && (transcript || coachText) && (
        <div className="absolute bottom-full mb-3 right-0 w-80 rounded-xl border border-gray-700 bg-[#1e293b] p-4 shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-300">Voice Coach</span>
            <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-white text-xs">&times;</button>
          </div>
          {transcript && (
            <div className="mb-3">
              <div className="text-[10px] text-gray-500 mb-1">You said:</div>
              <p className="text-xs text-gray-300 italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
          {coachText && (
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Coach says:</div>
              <p className="text-xs text-gray-200 leading-relaxed">{coachText}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute bottom-full mb-2 right-0 rounded-lg bg-red-900/50 border border-red-700/50 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
