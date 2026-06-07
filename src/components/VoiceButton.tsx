'use client';
import { useState, useRef } from 'react';
import { voiceCoach } from '@/lib/api';

interface VoiceButtonProps {
  userId: string;
  section: string;
  onResponse?: (text: string) => void;
}

export default function VoiceButton({ userId, section, onResponse }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setProcessing(true);
        try {
          const result = await voiceCoach(userId, section, blob);
          onResponse?.(result.ai_response || result.transcript || 'No response');
          if (result.audio_url) {
            const audio = new Audio(result.audio_url);
            audio.play();
          }
        } catch (e) {
          onResponse?.('Voice processing failed. Try again.');
        }
        setProcessing(false);
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      alert('Microphone access required for voice coaching.');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      disabled={processing}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
        recording ? 'bg-red-500 shadow-lg shadow-red-500/30' :
        processing ? 'bg-gray-600 cursor-wait' :
        'bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20'
      }`}
      title={recording ? 'Stop recording' : 'Ask your AI tutor'}
    >
      {processing ? (
        <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
      {recording && (
        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50"/>
      )}
    </button>
  );
}
