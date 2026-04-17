"use client";

interface MatchPayload {
  pairs: { left: string; right: string }[];
}

interface MatchPreviewProps {
  prompt: string;
  payload: MatchPayload;
}

export default function MatchPreview({ prompt, payload }: MatchPreviewProps) {
  const { pairs } = payload;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{prompt}</p>
      <div className="space-y-2">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="flex-1 rounded-lg bg-indigo-50 px-3 py-2 text-center text-sm font-medium text-indigo-800">
              {pair.left}
            </span>
            <svg
              className="h-5 w-5 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800">
              {pair.right}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
