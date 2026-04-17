"use client";

import QcmPreview from "./QcmPreview";
import MatchPreview from "./MatchPreview";
import OrderPreview from "./OrderPreview";
import DragDropPreview from "./DragDropPreview";
import ShortAnswerPreview from "./ShortAnswerPreview";

type ExerciseType = "qcm" | "drag-drop" | "match" | "order" | "short-answer";

interface ExercisePreviewProps {
  type: ExerciseType;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export default function ExercisePreview({
  type,
  prompt,
  payload,
}: ExercisePreviewProps) {
  if (!prompt && !payload) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        Remplissez le formulaire pour voir l&apos;apercu
      </div>
    );
  }

  switch (type) {
    case "qcm":
      return <QcmPreview prompt={prompt} payload={payload} />;
    case "match":
      return <MatchPreview prompt={prompt} payload={payload} />;
    case "order":
      return <OrderPreview prompt={prompt} payload={payload} />;
    case "drag-drop":
      return <DragDropPreview prompt={prompt} payload={payload} />;
    case "short-answer":
      return <ShortAnswerPreview prompt={prompt} payload={payload} />;
    default:
      return (
        <div className="text-sm text-gray-400">
          Type d&apos;exercice non reconnu
        </div>
      );
  }
}
