"use client";

import { useState } from "react";
import { Check, X, Link2 } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

interface MatchPayload {
  pairs: { left: string; right: string }[];
}

interface MatchExerciseProps {
  prompt: string;
  payload: MatchPayload;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const pairColors = [
  { left: "bg-blue-200 border-blue-400 text-blue-900", right: "bg-blue-100 border-blue-300 text-blue-800", line: "text-blue-400" },
  { left: "bg-pink-200 border-pink-400 text-pink-900", right: "bg-pink-100 border-pink-300 text-pink-800", line: "text-pink-400" },
  { left: "bg-amber-200 border-amber-400 text-amber-900", right: "bg-amber-100 border-amber-300 text-amber-800", line: "text-amber-400" },
  { left: "bg-green-200 border-green-400 text-green-900", right: "bg-green-100 border-green-300 text-green-800", line: "text-green-400" },
  { left: "bg-purple-200 border-purple-400 text-purple-900", right: "bg-purple-100 border-purple-300 text-purple-800", line: "text-purple-400" },
  { left: "bg-teal-200 border-teal-400 text-teal-900", right: "bg-teal-100 border-teal-300 text-teal-800", line: "text-teal-400" },
];

export default function MatchExercise({
  prompt,
  payload,
  onSubmit,
  disabled,
  isCorrect,
}: MatchExerciseProps) {
  const { pairs } = payload;

  // Shuffle the right-side items once
  const [shuffledRight] = useState(() => {
    const items = pairs.map((p) => p.right);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connectedPairs, setConnectedPairs] = useState<{ left: string; right: string }[]>([]);

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    // If already connected, remove it
    if (connectedPairs.some((p) => p.left === item)) {
      setConnectedPairs(connectedPairs.filter((p) => p.left !== item));
      return;
    }
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft) return;
    // If already connected to something else, remove that connection
    const filtered = connectedPairs.filter(
      (p) => p.left !== selectedLeft && p.right !== item,
    );
    filtered.push({ left: selectedLeft, right: item });
    setConnectedPairs(filtered);
    setSelectedLeft(null);
  };

  const getLeftColor = (item: string) => {
    const pairIndex = connectedPairs.findIndex((p) => p.left === item);
    if (pairIndex >= 0) return pairColors[pairIndex % pairColors.length];
    return null;
  };

  const getRightColor = (item: string) => {
    const pairIndex = connectedPairs.findIndex((p) => p.right === item);
    if (pairIndex >= 0) return pairColors[pairIndex % pairColors.length];
    return null;
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(connectedPairs));
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      {isCorrect === true && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-100 border-2 border-green-300 px-4 py-3 text-green-800 font-semibold">
          <Check className="h-5 w-5" />
          Bravo, tout est bien relie !
        </div>
      )}
      {isCorrect === false && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-100 border-2 border-red-300 px-4 py-3 text-red-800 font-semibold animate-[shake_0.5s_ease-in-out]">
          <X className="h-5 w-5" />
          Essaie encore !
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-3">
          {pairs.map((pair) => {
            const color = getLeftColor(pair.left);
            const isActive = selectedLeft === pair.left;
            return (
              <button
                key={pair.left}
                onClick={() => handleLeftClick(pair.left)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-4 py-4 text-center text-lg font-bold transition-all duration-200
                  ${color
                    ? `${color.left} shadow-md`
                    : isActive
                      ? "border-indigo-400 bg-indigo-100 text-indigo-900 scale-[1.03] shadow-md"
                      : "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                `}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {shuffledRight.map((item) => {
            const color = getRightColor(item);
            return (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-4 py-4 text-center text-lg font-bold transition-all duration-200
                  ${color
                    ? `${color.right} shadow-md`
                    : "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                  ${selectedLeft && !color ? "ring-2 ring-amber-300 ring-offset-2" : ""}
                `}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected pairs indicator */}
      {connectedPairs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {connectedPairs.map((pair, i) => {
            const color = pairColors[i % pairColors.length];
            return (
              <span
                key={`${pair.left}-${pair.right}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${color.line} bg-white border`}
              >
                {pair.left} <Link2 className="h-3 w-3" /> {pair.right}
              </span>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || connectedPairs.length !== pairs.length}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
