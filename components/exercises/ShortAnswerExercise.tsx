"use client";

import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

interface ShortAnswerPayload {
  acceptedAnswers: string[];
  tolerance?: string;
}

interface ShortAnswerExerciseProps {
  prompt: string;
  payload: ShortAnswerPayload;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

export default function ShortAnswerExercise({
  prompt,
  payload,
  onSubmit,
  disabled,
  isCorrect,
}: ShortAnswerExerciseProps) {
  const [answer, setAnswer] = useState("");
  // payload is used for typing, suppress unused warning
  void payload;

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && answer.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      {isCorrect === true && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-100 border-2 border-green-300 px-4 py-3 text-green-800 font-semibold">
          <Check className="h-5 w-5" />
          Bravo, bonne reponse !
        </div>
      )}
      {isCorrect === false && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-100 border-2 border-red-300 px-4 py-3 text-red-800 font-semibold animate-[shake_0.5s_ease-in-out]">
          <X className="h-5 w-5" />
          Essaie encore !
        </div>
      )}

      <div className="relative">
        <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Tape ta reponse ici..."
          className={`
            w-full rounded-2xl border-3 pl-14 pr-5 py-5 text-xl font-semibold transition-all
            ${isCorrect === true
              ? "border-green-400 bg-green-50 text-green-800"
              : isCorrect === false
                ? "border-red-400 bg-red-50 text-red-800"
                : "border-gray-200 bg-white text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            }
            placeholder-gray-400
            ${disabled ? "cursor-not-allowed opacity-70" : ""}
          `}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !answer.trim()}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
