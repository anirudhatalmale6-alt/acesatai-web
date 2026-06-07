'use client';

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

interface QuizCardProps {
  question: QuestionData;
  selectedChoice: string;
  eliminatedChoices: string[];
  feedback: FeedbackData | null;
  onSelectChoice: (letter: string) => void;
  onToggleElimination: (letter: string) => void;
}

export default function QuizCard({
  question,
  selectedChoice,
  eliminatedChoices,
  feedback,
  onSelectChoice,
  onToggleElimination,
}: QuizCardProps) {
  const getChoiceStyle = (letter: string) => {
    const isSelected = selectedChoice === letter;
    const isEliminated = eliminatedChoices.includes(letter);
    const isCorrect = feedback?.correct_answer === letter;
    const isWrong = feedback && isSelected && !feedback.was_correct;

    if (feedback) {
      if (isCorrect) {
        return 'border-emerald-500 bg-emerald-600/20 text-emerald-200';
      }
      if (isWrong) {
        return 'border-red-500 bg-red-600/20 text-red-200';
      }
      if (isSelected) {
        return 'border-blue-500 bg-blue-600/20 text-blue-200';
      }
      return 'border-gray-700 bg-gray-800/50 text-gray-400';
    }

    if (isEliminated) {
      return 'border-gray-800 bg-gray-900/50 text-gray-600 line-through opacity-50';
    }
    if (isSelected) {
      return 'border-blue-500 bg-blue-600/20 text-blue-100 shadow-lg shadow-blue-600/10';
    }
    return 'border-gray-700 bg-[#111827] text-gray-200 hover:border-gray-600 hover:bg-gray-800/70';
  };

  const getLetterStyle = (letter: string) => {
    const isSelected = selectedChoice === letter;
    const isCorrect = feedback?.correct_answer === letter;
    const isWrong = feedback && isSelected && !feedback.was_correct;

    if (feedback) {
      if (isCorrect) return 'bg-emerald-600 text-white';
      if (isWrong) return 'bg-red-600 text-white';
    }
    if (isSelected) return 'bg-blue-600 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  return (
    <div className="flex-1">
      {/* Question Text */}
      <h2 className="mb-8 text-xl font-medium leading-relaxed text-gray-100">
        {question.question_text}
      </h2>

      {/* Choices */}
      <div className="space-y-3">
        {Object.entries(question.options || {}).map(([letter, text]) => {
          const isEliminated = eliminatedChoices.includes(letter);
          const isDisabled = !!feedback || isEliminated;

          return (
            <div key={letter} className="flex items-center gap-3">
              <button
                disabled={isDisabled && !feedback}
                onClick={() => !feedback && onSelectChoice(letter)}
                className={`flex flex-1 items-center gap-4 rounded-xl border p-4 text-left transition-all ${getChoiceStyle(letter)}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${getLetterStyle(letter)}`}
                >
                  {letter}
                </span>
                <span className="text-base">{text}</span>
              </button>

              {/* Elimination Toggle */}
              {!feedback && (
                <button
                  onClick={() => onToggleElimination(letter)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                    isEliminated
                      ? 'border-red-500 bg-red-600/20 text-red-400'
                      : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
                  }`}
                  title="Cross out this answer"
                >
                  {isEliminated ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
