"use client";

interface QcmPayload {
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QcmPreviewProps {
  prompt: string;
  payload: QcmPayload;
}

export default function QcmPreview({ prompt, payload }: QcmPreviewProps) {
  const { options, correctIndex, explanation } = payload;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{prompt}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
              index === correctIndex
                ? "border-green-400 bg-green-50 text-green-800"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                index === correctIndex
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </div>
        ))}
      </div>
      {explanation && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-semibold">Explication : </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
