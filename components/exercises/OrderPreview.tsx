"use client";

interface OrderPayload {
  correctSequence: string[];
}

interface OrderPreviewProps {
  prompt: string;
  payload: OrderPayload;
}

export default function OrderPreview({ prompt, payload }: OrderPreviewProps) {
  const { correctSequence } = payload;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{prompt}</p>
      <div className="space-y-2">
        {correctSequence.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
