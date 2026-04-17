"use client";

interface DragDropPayload {
  zones: string[];
  items: { text: string; correctZone: string }[];
}

interface DragDropPreviewProps {
  prompt: string;
  payload: DragDropPayload;
}

export default function DragDropPreview({
  prompt,
  payload,
}: DragDropPreviewProps) {
  const { zones, items } = payload;

  // Group items by zone for preview
  const itemsByZone: Record<string, string[]> = {};
  for (const zone of zones) {
    itemsByZone[zone] = [];
  }
  for (const item of items) {
    if (itemsByZone[item.correctZone]) {
      itemsByZone[item.correctZone].push(item.text);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-900">{prompt}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {zones.map((zone) => (
          <div
            key={zone}
            className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4"
          >
            <h4 className="mb-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {zone}
            </h4>
            <div className="space-y-2">
              {(itemsByZone[zone] ?? []).map((text, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700 shadow-sm"
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
