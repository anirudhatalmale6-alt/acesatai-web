'use client';

import { useState, useRef, useCallback } from 'react';

interface VoiceCoachProps {
  questionContext: string;
  questionId: number;
  userId: string;
  section: string;
}

interface ConversationEntry {
  speaker: 'student' | 'coach';
  text: string;
}

type CoachState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export default function VoiceCoach({ questionContext }: VoiceCoachProps) {
  const [state, setState] = useState<CoachState>('idle');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const playAudioChunk = useCallback((pcm16Data: Int16Array) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const float32 = new Float32Array(pcm16Data.length);
    for (let i = 0; i < pcm16Data.length; i++) {
      float32[i] = pcm16Data[i] / 32768;
    }
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }, []);

  const processAudioQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    playAudioChunk(chunk);
    const durationMs = (chunk.length / 24000) * 1000;
    setTimeout(() => {
      isPlayingRef.current = false;
      processAudioQueue();
    }, durationMs);
  }, [playAudioChunk]);

  const startSession = async () => {
    setError(null);
    setShowPanel(true);
    setState('connecting');

    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) throw new Error('AudioContext not supported');
      if (!audioContextRef.current) {
        audioContextRef.current = new AC({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (typeof MediaRecorder === 'undefined') {
        setError('Voice recording is not supported in this browser. Please use Safari on iOS for voice recording.');
        setState('idle');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true } as any,
      });
      streamRef.current = stream;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//api.acesatai.com/api/v1/realtime`);
      wsRef.current = ws;

      ws.onopen = () => {
        setState('listening');

        const audioCtx = audioContextRef.current!;
        const source = audioCtx.createMediaStreamSource(stream);

        const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32768)));
          }
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(audioCtx.destination);
        workletRef.current = scriptProcessor as any;

        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: `The student is looking at this SAT question: ${questionContext}` }],
          },
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'input_audio_buffer.speech_started':
            setState('listening');
            audioQueueRef.current = [];
            break;

          case 'input_audio_buffer.speech_stopped':
            setState('thinking');
            break;

          case 'conversation.item.input_audio_transcription.completed':
            if (data.transcript) {
              setConversation(prev => [...prev, { speaker: 'student', text: data.transcript }]);
            }
            break;

          case 'response.audio.delta':
            setState('speaking');
            if (data.delta) {
              const binary = atob(data.delta);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const pcm16 = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcm16);
              processAudioQueue();
            }
            break;

          case 'response.audio_transcript.done':
            if (data.transcript) {
              setConversation(prev => [...prev, { speaker: 'coach', text: data.transcript }]);
              setTimeout(() => {
                if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
              }, 100);
            }
            break;

          case 'response.done':
            setState('listening');
            break;

          case 'error':
            setError(data.error?.message || 'Realtime API error');
            break;
        }
      };

      ws.onerror = () => {
        setError('Connection failed. Please try again.');
        setState('idle');
      };

      ws.onclose = () => {
        setState('idle');
      };
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow mic permissions.'
        : err?.name === 'NotFoundError'
          ? 'No microphone found.'
          : `Error: ${err?.message || 'Unknown'}`;
      setError(msg);
      setState('idle');
    }
  };

  const endSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setState('idle');
  };

  const handleClick = () => {
    if (state === 'idle') {
      startSession();
    } else {
      endSession();
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'connecting': return { text: 'Connecting...', color: 'bg-amber-600', pulse: false };
      case 'listening': return { text: 'Listening...', color: 'bg-red-600', pulse: true };
      case 'thinking': return { text: 'Thinking...', color: 'bg-amber-600', pulse: false };
      case 'speaking': return { text: 'Speaking...', color: 'bg-emerald-600', pulse: true };
      default: return { text: conversation.length > 0 ? 'Resume Coach' : 'Talk to Coach', color: 'bg-purple-600 hover:bg-purple-700', pulse: false };
    }
  };

  const btn = getButtonContent();

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === 'connecting'}
        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${btn.color} ${btn.pulse ? 'animate-pulse' : ''}`}
      >
        {state === 'idle' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        ) : state === 'connecting' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <div className="flex gap-0.5">
            <div className="h-3 w-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="h-4 w-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        {btn.text}
      </button>

      {showPanel && (
        <>
          <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm" style={{ zIndex: 999 }} onClick={() => { if (state === 'idle') { setShowPanel(false); } }} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl border border-gray-700 bg-[#1e293b] shadow-2xl flex flex-col" style={{ zIndex: 1000, maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 rounded-t-2xl bg-[#0f172a]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600/30">
                  <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <div>
                  <span className="text-sm font-semibold text-purple-300">Socratic Voice Coach</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400">Realtime</span>
                </div>
              </div>
              <button onClick={() => { endSession(); setShowPanel(false); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-lg">&times;</button>
            </div>

            <div ref={panelRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '50vh' }}>
              {conversation.length === 0 && state === 'idle' && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/15">
                    <svg className="h-7 w-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Real-time Voice Conversation</p>
                  <p className="text-xs text-gray-500">Tap the button below to start a live conversation with your AI tutor. Just speak naturally - responses are instant.</p>
                </div>
              )}

              {conversation.map((entry, i) => (
                <div key={i} className="flex gap-3">
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

              {state === 'listening' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="flex gap-1">
                    {[0, 150, 300, 100, 250].map((d, i) => (
                      <div key={i} className="w-1 rounded-full bg-red-500 animate-pulse" style={{ height: `${12 + (i % 3) * 6}px`, animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-sm text-red-400 font-medium">Listening... speak now</span>
                </div>
              )}

              {state === 'thinking' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <span className="text-sm text-amber-400 font-medium">Processing...</span>
                </div>
              )}

              {state === 'speaking' && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex gap-1">
                    {[0, 100, 200, 300, 150].map((d, i) => (
                      <div key={i} className="w-1 rounded-full bg-emerald-500 animate-pulse" style={{ height: `${10 + (i % 3) * 8}px`, animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-sm text-emerald-400 font-medium">Coach is speaking...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-3 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-2 text-xs text-red-300">{error}</div>
            )}

            <div className="px-4 py-3 border-t border-gray-700/50 flex items-center justify-center gap-3">
              <button
                onClick={handleClick}
                disabled={state === 'connecting'}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${state === 'idle' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {state === 'idle' ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    {conversation.length > 0 ? 'Resume' : 'Start Conversation'}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                    End Session
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
