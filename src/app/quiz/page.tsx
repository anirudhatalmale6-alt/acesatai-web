'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import QuizCard from '@/components/QuizCard';
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
  const [questionCount, setQuestionCount] = useState<number>(0);

  const userId = 'web_user_demo';

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
    } catch (err) {
      console.error('Failed to fetch question:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleSubmit = async () => {
    if (!selectedChoice || !question) return;

    try {
      const result = await submitAnswer(userId, question.question_id, selectedChoice, section);
      setFeedback(result);
      setQuestionCount((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleNextQuestion = () => {
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

  return (
    <div className="flex h-screen flex-col bg-[#0a0e1a]">
      {/* Quiz Header Bar */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-[#111827] px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white tracking-tight">
            ACESAT<span className="text-blue-400">AI</span>
          </h1>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm font-medium text-gray-300">
            {section === 'Verbal' ? 'Reading & Writing' : 'Mathematics'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Section Toggle */}
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            <button
              onClick={() => { setSection('Verbal'); setExcludedIds([]); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                section === 'Verbal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              Verbal
            </button>
            <button
              onClick={() => { setSection('Math'); setExcludedIds([]); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                section === 'Math'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              Math
            </button>
          </div>

          <div className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300">
            Q: {questionCount + 1}
          </div>

          {question && (
            <div className="rounded-lg bg-gray-800 px-4 py-2 text-xs text-gray-400">
              Difficulty: {question.difficulty_level}/5
            </div>
          )}
        </div>
      </header>

      {/* Main Split Screen */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-gray-400">Loading next question...</p>
          </div>
        </div>
      ) : question ? (
        <main className="flex flex-1 overflow-hidden">
          {/* Left Panel: Passage */}
          <section className="w-1/2 overflow-y-auto border-r border-gray-800 bg-[#0d1117] p-8">
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
                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-300">
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

            {/* Socratic Hints Panel */}
            {feedback && !feedback.was_correct && question.socratic_hints && (
              <div className="mt-6 rounded-xl border border-amber-700/50 bg-amber-900/20 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300">Socratic Hints</h3>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {showHints ? 'Hide' : 'Show'} Hints
                  </button>
                </div>
                {showHints && (
                  <div className="space-y-2">
                    {question.socratic_hints.slice(0, currentHintIndex + 1).map((hint, i) => (
                      <p key={i} className="text-sm text-amber-200/80">
                        {i + 1}. {hint}
                      </p>
                    ))}
                    {currentHintIndex < question.socratic_hints.length - 1 && (
                      <button
                        onClick={revealNextHint}
                        className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300"
                      >
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
                <button
                  disabled={!selectedChoice}
                  onClick={handleSubmit}
                  className="ml-auto rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
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
                    <span className="text-xs text-gray-500">
                      Theta: {feedback.new_theta}
                    </span>
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
        </main>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">No questions available. Try switching sections.</p>
        </div>
      )}
    </div>
  );
}
