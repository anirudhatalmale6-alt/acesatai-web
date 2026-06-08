'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import QuizCard from '@/components/QuizCard';
import VoiceCoach from '@/components/VoiceCoach';
import { getNextQuestion, submitAnswer } from '@/lib/api';

interface QuestionData {
  question_id: number;
  section: string;
  domain: string;
  micro_skill: string;
  difficulty_level: number;
  passage: string | null;
  question_text: string;
  options: Record<string, string>;
  socratic_hints: string[];
}

interface FeedbackData {
  was_correct: boolean;
  correct_answer: string;
  new_theta: number;
  xp_total: number;
}

interface QuestionRecord {
  id: number;
  answered: boolean;
  flagged: boolean;
  selectedAnswer: string;
}

function DesmosEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<any>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const initDesmos = () => {
      if (calcRef.current || !containerRef.current) return;
      const D = (window as any).Desmos;
      if (!D) return;
      calcRef.current = D.GraphingCalculator(containerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsTopbar: true,
        border: false,
        lockViewport: false,
        images: false,
        folders: false,
        notes: false,
        sliders: true,
        links: false,
        trace: true,
        graphpaper: true,
        expressionsCollapsed: false,
      });
      calcRef.current.setExpression({ id: 'demo', latex: '' });
    };

    if ((window as any).Desmos) {
      initDesmos();
    } else if (!scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.async = true;
      script.onload = initDesmos;
      document.head.appendChild(script);
    }

    return () => {
      if (calcRef.current) {
        calcRef.current.destroy();
        calcRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 360, position: 'relative', zIndex: 1 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

const TOTAL_QUESTIONS = 22;
const MODULE_TIME = 32 * 60;

const MATH_REFERENCE = [
  { label: 'Circle Area', formula: 'A = πr²' },
  { label: 'Circle Circumference', formula: 'C = 2πr' },
  { label: 'Rectangle Area', formula: 'A = lw' },
  { label: 'Triangle Area', formula: 'A = ½bh' },
  { label: 'Pythagorean Theorem', formula: 'a² + b² = c²' },
  { label: 'Sphere Volume', formula: 'V = (4/3)πr³' },
  { label: 'Cylinder Volume', formula: 'V = πr²h' },
  { label: 'Cone Volume', formula: 'V = (1/3)πr²h' },
  { label: 'Pyramid Volume', formula: 'V = (1/3)lwh' },
  { label: '30-60-90 Triangle', formula: 'x, x√3, 2x' },
  { label: '45-45-90 Triangle', formula: 'x, x, x√2' },
  { label: 'Slope', formula: 'm = (y₂−y₁)/(x₂−x₁)' },
  { label: 'Quadratic Formula', formula: 'x = (−b ± √(b²−4ac)) / 2a' },
];

export default function QuizPage() {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);
  const [section, setSection] = useState<string>('Verbal');
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  const [timeLeft, setTimeLeft] = useState<number>(MODULE_TIME);
  const [timerHidden, setTimerHidden] = useState<boolean>(false);
  const [timerAlert, setTimerAlert] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [questionRecords, setQuestionRecords] = useState<QuestionRecord[]>(
    Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
      id: 0, answered: false, flagged: false, selectedAnswer: '',
    }))
  );

  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [showRefSheet, setShowRefSheet] = useState<boolean>(false);
  const [showNavMenu, setShowNavMenu] = useState<boolean>(false);
  const [showAnnotateMenu, setShowAnnotateMenu] = useState<{ x: number; y: number } | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [calcPos, setCalcPos] = useState({ x: 100, y: 100 });
  const [calcExpanded, setCalcExpanded] = useState(false);
  const [draggingCalc, setDraggingCalc] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [showLineReader, setShowLineReader] = useState(false);
  const [lineReaderY, setLineReaderY] = useState(300);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<Array<{ text: string; note: string }>>([]);
  const [showNotesPanel, setShowNotesPanel] = useState(false);

  const userId = 'web_user_demo';

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 300 && !timerAlert) {
          setTimerAlert(true);
          setTimerHidden(false);
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerAlert]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey && e.key === 'h') { e.preventDefault(); highlightSelection(); }
      if (e.ctrlKey && !e.altKey && e.key === 'l') { e.preventDefault(); setShowLineReader(p => !p); }
      if (e.ctrlKey && e.altKey && e.key === 'c') { e.preventDefault(); setShowCalc(p => !p); }
      if (e.ctrlKey && e.altKey && e.key === 'v') { e.preventDefault(); toggleFlag(); }
      if (e.ctrlKey && e.altKey && e.key === 'r') { e.preventDefault(); setShowRefSheet(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [questionIndex]);

  const toggleFlag = useCallback(() => {
    setQuestionRecords(prev => {
      const next = [...prev];
      next[questionIndex] = { ...next[questionIndex], flagged: !next[questionIndex].flagged };
      return next;
    });
  }, [questionIndex]);

  const fetchQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedChoice('');
    setEliminatedChoices([]);
    setShowHints(false);
    setCurrentHintIndex(0);

    try {
      const data = await getNextQuestion(userId, section, excludedIds.join(','));
      setQuestion(data);
      setExcludedIds((prev) => [...prev, data.question_id]);
      setQuestionRecords(prev => {
        const next = [...prev];
        next[questionIndex] = { ...next[questionIndex], id: data.question_id };
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch question:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuestionIndex(0);
    setExcludedIds([]);
    setTimeLeft(MODULE_TIME);
    setTimerAlert(false);
    setTimerHidden(false);
    setQuestionRecords(
      Array.from({ length: TOTAL_QUESTIONS }, () => ({
        id: 0, answered: false, flagged: false, selectedAnswer: '',
      }))
    );
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleSubmit = async () => {
    if (!selectedChoice || !question) return;
    try {
      const result = await submitAnswer(userId, question.question_id, selectedChoice, section);
      setFeedback(result);
      setQuestionRecords(prev => {
        const next = [...prev];
        next[questionIndex] = { ...next[questionIndex], answered: true, selectedAnswer: selectedChoice };
        return next;
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex(prev => prev + 1);
      fetchQuestion();
    }
  };

  const jumpToQuestion = (idx: number) => {
    setQuestionIndex(idx);
    setShowNavMenu(false);
    fetchQuestion();
  };

  const toggleElimination = (letter: string) => {
    if (eliminatedChoices.includes(letter)) {
      setEliminatedChoices(eliminatedChoices.filter((item) => item !== letter));
    } else {
      setEliminatedChoices([...eliminatedChoices, letter]);
      if (selectedChoice === letter) setSelectedChoice('');
    }
  };

  const revealNextHint = () => {
    if (question && currentHintIndex < (question.socratic_hints?.length || 0) - 1) {
      setCurrentHintIndex((prev) => prev + 1);
    }
  };

  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setShowAnnotateMenu({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    } else {
      setShowAnnotateMenu(null);
    }
  };

  const highlightSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      setHighlights(prev => [...prev, sel.toString().trim()]);
      const range = sel.getRangeAt(0);
      const span = document.createElement('mark');
      span.style.background = 'rgba(250, 204, 21, 0.3)';
      span.style.color = 'inherit';
      span.style.borderRadius = '2px';
      range.surroundContents(span);
      sel.removeAllRanges();
    }
    setShowAnnotateMenu(null);
  };

  // Draggable calculator
  const handleCalcMouseDown = (e: React.MouseEvent) => {
    setDraggingCalc(true);
    dragOffset.current = { x: e.clientX - calcPos.x, y: e.clientY - calcPos.y };
  };

  useEffect(() => {
    if (!draggingCalc) return;
    const handleMove = (e: MouseEvent) => {
      setCalcPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => setDraggingCalc(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [draggingCalc]);

  return (
    <div className="flex h-screen flex-col bg-[#0a0e1a]">
      {/* ===== ADAPTIVE NAVIGATION BAR ===== */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-[#111827] px-4 py-2">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-base font-bold text-white tracking-tight hover:text-blue-300 transition-colors">ACESATAI</a>
          <span className="text-xs text-gray-600">|</span>
          <a href="/dashboard" className="rounded-md bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-blue-600/20 hover:text-blue-300 transition-colors">Dashboard</a>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs font-medium text-gray-400">
            {section === 'Verbal' ? 'Reading & Writing' : 'Mathematics'}
          </span>
          <div className="flex rounded-md border border-gray-700 overflow-hidden ml-2">
            <button
              onClick={() => setSection('Verbal')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${section === 'Verbal' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >Verbal</button>
            <button
              onClick={() => setSection('Math')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${section === 'Math' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >Math</button>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-2">
          {(!timerHidden || timerAlert) && (
            <div className={`rounded-lg px-4 py-1.5 text-sm font-mono font-bold ${timerAlert ? 'bg-red-600/20 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-200'}`}>
              {formatTime(timeLeft)}
            </div>
          )}
          {!timerAlert && (
            <button
              onClick={() => setTimerHidden(!timerHidden)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              {timerHidden ? 'Show' : 'Hide'}
            </button>
          )}
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-2">
          {/* Mark for Review */}
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${questionRecords[questionIndex]?.flagged ? 'bg-amber-600/20 text-amber-400 border border-amber-600/50' : 'text-gray-400 hover:text-amber-400 hover:bg-gray-800'}`}
            title="Mark for Review (Ctrl+Alt+V)"
          >
            <svg className="h-3.5 w-3.5" fill={questionRecords[questionIndex]?.flagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {questionRecords[questionIndex]?.flagged ? 'Flagged' : 'Flag'}
          </button>

          <div className="h-5 w-px bg-gray-700" />

          {/* Annotate Tools (for Verbal) */}
          {section === 'Verbal' && (
            <>
              <button
                onClick={highlightSelection}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
                title="Highlight Selected Text (Ctrl+H)"
              >
                <svg className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Highlight
              </button>
              <button
                onClick={() => setShowLineReader(p => !p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showLineReader ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50' : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800'}`}
                title="Line Reader (Ctrl+L)"
              >
                <svg className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Reader
              </button>
              {notes.length > 0 && (
                <button
                  onClick={() => setShowNotesPanel(p => !p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showNotesPanel ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-800'}`}
                  title="View Notes"
                >
                  Notes ({notes.length})
                </button>
              )}
            </>
          )}

          {/* Calculator (Math only) */}
          {section === 'Math' && (
            <button
              onClick={() => setShowCalc(!showCalc)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showCalc ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-800'}`}
              title="Desmos Calculator (Ctrl+Alt+C)"
            >
              <svg className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculator
            </button>
          )}

          {/* Reference Sheet (Math only) */}
          {section === 'Math' && (
            <button
              onClick={() => setShowRefSheet(!showRefSheet)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showRefSheet ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' : 'text-gray-400 hover:text-purple-400 hover:bg-gray-800'}`}
              title="Reference Sheet (Ctrl+Alt+R)"
            >
              <svg className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reference
            </button>
          )}

          <div className="h-5 w-px bg-gray-700" />

          {/* Question Counter */}
          <div className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300">
            Q {questionIndex + 1} / {TOTAL_QUESTIONS}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-gray-400">Loading next question...</p>
          </div>
        </div>
      ) : question ? (
        <main className="relative flex flex-1 overflow-hidden">
          {/* Left Panel: Passage */}
          <section
            className="w-1/2 overflow-y-auto border-r border-gray-800 bg-[#0d1117] p-8"
            onMouseUp={section === 'Verbal' ? handleTextSelect : undefined}
          >
            {question.passage ? (
              <div className="rounded-xl border border-gray-800 bg-[#111827] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-300">
                    {question.domain}
                  </span>
                  <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
                    {question.micro_skill}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-300 passage-text select-text cursor-text">
                  {question.passage}
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-xl border border-gray-800 bg-[#111827] p-8">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="rounded bg-emerald-600/20 px-2 py-1 text-xs font-medium text-emerald-300">
                      {question.domain}
                    </span>
                    <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
                      {question.micro_skill}
                    </span>
                  </div>
                  <p className="text-gray-400">
                    No reading passage for this question. Focus on the problem statement to the right.
                  </p>
                </div>
              </div>
            )}

            {/* Socratic Hints */}
            {feedback && !feedback.was_correct && question.socratic_hints && (
              <div className="mt-6 rounded-xl border border-amber-700/50 bg-amber-900/20 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300">Socratic Hints</h3>
                  <button onClick={() => setShowHints(!showHints)} className="text-xs text-amber-400 hover:text-amber-300">
                    {showHints ? 'Hide' : 'Show'} Hints
                  </button>
                </div>
                {showHints && (
                  <div className="space-y-2">
                    {question.socratic_hints.slice(0, currentHintIndex + 1).map((hint, i) => (
                      <p key={i} className="text-sm text-amber-200/80">{i + 1}. {hint}</p>
                    ))}
                    {currentHintIndex < question.socratic_hints.length - 1 && (
                      <button onClick={revealNextHint} className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300">
                        Reveal next hint...
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Panel: Question + Choices */}
          <section className="flex w-1/2 flex-col overflow-y-auto bg-[#0a0e1a] p-8">
            <QuizCard
              question={question}
              selectedChoice={selectedChoice}
              eliminatedChoices={eliminatedChoices}
              feedback={feedback}
              onSelectChoice={setSelectedChoice}
              onToggleElimination={toggleElimination}
            />

            {/* Action Buttons */}
            <div className="mt-auto flex items-center justify-between border-t border-gray-800 pt-6">
              {!feedback ? (
                <div className="flex w-full items-center justify-between">
                  {question && (
                    <VoiceCoach
                      questionContext={question.question_text}
                      questionId={question.question_id}
                      userId={userId}
                      section={section}
                    />
                  )}
                  <button
                    disabled={!selectedChoice}
                    onClick={handleSubmit}
                    className="rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    {feedback.was_correct ? (
                      <span className="rounded-lg bg-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-300">
                        Correct! +10 XP
                      </span>
                    ) : (
                      <span className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-300">
                        Incorrect. Answer: {feedback.correct_answer}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">Theta: {feedback.new_theta}</span>
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40"
                  >
                    Next Question
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ===== FLOATING: Highlight & Notes Menu ===== */}
          {showAnnotateMenu && !showNoteInput && (
            <div
              className="fixed z-50 flex gap-1 rounded-lg border border-gray-700 bg-[#1e293b] p-1.5 shadow-xl"
              style={{ left: showAnnotateMenu.x - 80, top: showAnnotateMenu.y - 40 }}
            >
              <button onClick={highlightSelection} className="rounded px-3 py-1 text-xs text-yellow-400 hover:bg-yellow-600/20 transition-colors">
                Highlight
              </button>
              <button onClick={() => setShowNoteInput(true)} className="rounded px-3 py-1 text-xs text-blue-400 hover:bg-blue-600/20 transition-colors">
                Note
              </button>
              <button onClick={() => setShowAnnotateMenu(null)} className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                &times;
              </button>
            </div>
          )}

          {/* ===== FLOATING: Note Input ===== */}
          {showAnnotateMenu && showNoteInput && (
            <div
              className="fixed z-50 w-64 rounded-lg border border-gray-700 bg-[#1e293b] p-3 shadow-xl"
              style={{ left: showAnnotateMenu.x - 130, top: showAnnotateMenu.y - 120 }}
            >
              <div className="mb-2 text-xs font-medium text-gray-300">Add a note</div>
              <textarea
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="mb-2 w-full rounded-md border border-gray-600 bg-gray-900 p-2 text-xs text-gray-200 outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Type your note..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim() && noteText.trim()) {
                      const selectedText = sel.toString().trim();
                      setNotes(prev => [...prev, { text: selectedText, note: noteText.trim() }]);
                      highlightSelection();
                    }
                    setShowNoteInput(false);
                    setNoteText('');
                    setShowAnnotateMenu(null);
                  }}
                  className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowNoteInput(false); setNoteText(''); setShowAnnotateMenu(null); }}
                  className="rounded px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ===== FLOATING: Notes Panel ===== */}
          {showNotesPanel && notes.length > 0 && (
            <div className="fixed left-4 bottom-16 z-40 w-72 max-h-64 overflow-y-auto rounded-xl border border-gray-700 bg-[#1e293b] shadow-2xl">
              <div className="flex items-center justify-between bg-[#0f172a] px-4 py-2">
                <span className="text-xs font-medium text-gray-300">My Notes ({notes.length})</span>
                <button onClick={() => setShowNotesPanel(false)} className="text-gray-500 hover:text-white text-sm">&times;</button>
              </div>
              <div className="p-3 space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5">
                    <div className="text-[10px] text-yellow-400/70 italic mb-1">&ldquo;{n.text.slice(0, 60)}{n.text.length > 60 ? '...' : ''}&rdquo;</div>
                    <div className="text-xs text-gray-300">{n.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== FLOATING: Line Reader Overlay ===== */}
          {showLineReader && (
            <>
              <div className="fixed inset-0 z-30 pointer-events-none">
                <div className="absolute left-0 right-0 bg-black/60" style={{ top: 0, height: lineReaderY - 30 }} />
                <div className="absolute left-0 right-0 bg-black/60" style={{ top: lineReaderY + 30, bottom: 0 }} />
                <div className="absolute left-0 right-0 border-y border-blue-500/40" style={{ top: lineReaderY - 30, height: 60 }} />
              </div>
              <div
                className="fixed left-0 right-0 z-30 h-16 cursor-ns-resize"
                style={{ top: lineReaderY - 32 }}
                onMouseDown={(e) => {
                  const startY = e.clientY;
                  const startPos = lineReaderY;
                  const onMove = (ev: MouseEvent) => setLineReaderY(Math.max(60, Math.min(window.innerHeight - 60, startPos + ev.clientY - startY)));
                  const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              />
            </>
          )}

          {/* ===== FLOATING: Desmos Calculator (Native API) ===== */}
          {showCalc && (
            <div
              className={`fixed z-40 rounded-xl border border-gray-700 bg-white shadow-2xl transition-all duration-200 ${calcExpanded ? '' : ''}`}
              style={calcExpanded
                ? { left: 40, top: 50, right: 40, bottom: 40, width: 'auto', height: 'auto' }
                : { left: calcPos.x, top: calcPos.y, width: 520, height: 420 }
              }
            >
              <div
                className="flex items-center justify-between bg-[#0f172a] px-4 py-2 cursor-move select-none rounded-t-xl"
                onMouseDown={calcExpanded ? undefined : handleCalcMouseDown}
              >
                <span className="text-xs font-medium text-gray-300">Graphing Calculator</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalcExpanded(!calcExpanded)}
                    className="text-gray-500 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
                    title={calcExpanded ? 'Minimize' : 'Expand'}
                  >
                    {calcExpanded ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                    )}
                  </button>
                  <button onClick={() => { setShowCalc(false); setCalcExpanded(false); }} className="text-gray-500 hover:text-white text-sm">&times;</button>
                </div>
              </div>
              <div style={{ width: '100%', height: calcExpanded ? 'calc(100% - 36px)' : 382 }}>
                <DesmosEmbed />
              </div>
            </div>
          )}

          {/* ===== FLOATING: Reference Sheet ===== */}
          {showRefSheet && (
            <div className="fixed right-4 top-16 z-40 w-80 rounded-xl border border-gray-700 bg-[#1e293b] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between bg-[#0f172a] px-4 py-2">
                <span className="text-xs font-medium text-gray-300">Reference Sheet</span>
                <button onClick={() => setShowRefSheet(false)} className="text-gray-500 hover:text-white text-sm">&times;</button>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="space-y-2">
                  {MATH_REFERENCE.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className="text-xs font-mono text-purple-300">{item.formula}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">No questions available. Try switching sections.</p>
        </div>
      )}

      {/* ===== BOTTOM CONTROL CENTER ===== */}
      <footer className="border-t border-gray-800 bg-[#111827] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Question {questionIndex + 1} of {TOTAL_QUESTIONS}
            </button>
            <div className="text-xs text-gray-600 ml-2">
              Ctrl+H Highlight &middot; Ctrl+L Reader &middot; Ctrl+Alt+C Calculator &middot; Ctrl+Alt+V Flag &middot; Ctrl+Alt+R Reference
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (questionIndex > 0) { setQuestionIndex(prev => prev - 1); fetchQuestion(); }}}
              disabled={questionIndex === 0}
              className="rounded-lg bg-gray-800 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &larr; Back
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={questionIndex >= TOTAL_QUESTIONS - 1}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Question Navigation Grid */}
        {showNavMenu && (
          <div className="mt-3 rounded-xl border border-gray-700 bg-[#0f172a] p-4">
            <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-600" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border border-gray-600" /> Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Flagged
              </span>
            </div>
            <div className="grid grid-cols-11 gap-2">
              {questionRecords.map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToQuestion(idx)}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    idx === questionIndex
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : rec.answered
                        ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {idx + 1}
                  {rec.flagged && (
                    <svg className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
