"use client";

interface ShortAnswerPayload {
  acceptedAnswers: string[];
  tolerance?: string;
}

interface ShortAnswerPreviewProps {
  prompt: string;
  payload: ShortAnswerPayload;
}

export default function ShortAnswerPreview({
  prompt,
  payload,
}: ShortAnswerPreviewProps) {
  const { acceptedAnswers, tolerance } = payload;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{prompt}</p>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <input
          type="text"
          disabled
          placeholder="Tape ta reponse ici..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 placeholder-gray-400"
        />
      </div>
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <span className="font-semibold">Reponses acceptees : </span>
        {acceptedAnswers.join(", ")}
      </div>
      {tolerance && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-semibold">Tolerance : </span>
          {tolerance}
        </div>
      )}
    </div>
  );
}
