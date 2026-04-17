"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";

interface DragDropPayload {
  zones: string[];
  items: { text: string; correctZone: string }[];
}

interface DragDropExerciseProps {
  prompt: string;
  payload: DragDropPayload;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const zoneColors = [
  { bg: "bg-blue-50", border: "border-blue-300", header: "bg-blue-200 text-blue-900", item: "bg-blue-100 border-blue-200 text-blue-800" },
  { bg: "bg-pink-50", border: "border-pink-300", header: "bg-pink-200 text-pink-900", item: "bg-pink-100 border-pink-200 text-pink-800" },
  { bg: "bg-amber-50", border: "border-amber-300", header: "bg-amber-200 text-amber-900", item: "bg-amber-100 border-amber-200 text-amber-800" },
  { bg: "bg-green-50", border: "border-green-300", header: "bg-green-200 text-green-900", item: "bg-green-100 border-green-200 text-green-800" },
  { bg: "bg-purple-50", border: "border-purple-300", header: "bg-purple-200 text-purple-900", item: "bg-purple-100 border-purple-200 text-purple-800" },
];

function DroppableZone({
  id,
  colorIndex,
  children,
}: {
  id: string;
  colorIndex: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const color = zoneColors[colorIndex % zoneColors.length];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-3 ${color.border} ${color.bg} p-4 min-h-[120px] transition-all ${
        isOver ? "scale-[1.02] shadow-lg ring-2 ring-offset-2 ring-indigo-300" : ""
      }`}
    >
      <h4
        className={`mb-3 rounded-xl ${color.header} px-3 py-2 text-center text-base font-bold`}
      >
        {id}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DraggableItem({
  id,
  disabled,
  inZone,
}: {
  id: string;
  disabled: boolean;
  inZone: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        rounded-xl border-2 px-4 py-3 text-center text-base font-bold transition-all
        ${isDragging ? "opacity-50" : ""}
        ${inZone
          ? "border-gray-200 bg-white text-gray-800 shadow-sm"
          : "border-indigo-200 bg-indigo-50 text-indigo-800 shadow-md hover:shadow-lg"
        }
        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}
      `}
    >
      {id}
    </div>
  );
}

export default function DragDropExercise({
  prompt,
  payload,
  onSubmit,
  disabled,
  isCorrect,
}: DragDropExerciseProps) {
  const { zones, items } = payload;

  // Track which zone each item is in (null = unplaced)
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => {
      const initial: Record<string, string | null> = {};
      for (const item of items) {
        initial[item.text] = null;
      }
      return initial;
    },
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && zones.includes(over.id as string)) {
      setAssignments((prev) => ({
        ...prev,
        [active.id as string]: over.id as string,
      }));
    }
  };

  const handleSubmit = () => {
    const answer: Record<string, string> = {};
    for (const [item, zone] of Object.entries(assignments)) {
      if (zone) answer[item] = zone;
    }
    onSubmit(JSON.stringify(answer));
  };

  const unplacedItems = items.filter((item) => assignments[item.text] === null);
  const allPlaced = unplacedItems.length === 0;

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      {isCorrect === true && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-100 border-2 border-green-300 px-4 py-3 text-green-800 font-semibold">
          <Check className="h-5 w-5" />
          Parfait, tout est bien place !
        </div>
      )}
      {isCorrect === false && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-100 border-2 border-red-300 px-4 py-3 text-red-800 font-semibold animate-[shake_0.5s_ease-in-out]">
          <X className="h-5 w-5" />
          Essaie encore !
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Zones */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {zones.map((zone, i) => {
            const zoneItems = items.filter(
              (item) => assignments[item.text] === zone,
            );
            return (
              <DroppableZone key={zone} id={zone} colorIndex={i}>
                {zoneItems.map((item) => (
                  <DraggableItem
                    key={item.text}
                    id={item.text}
                    disabled={disabled}
                    inZone={true}
                  />
                ))}
              </DroppableZone>
            );
          })}
        </div>

        {/* Unplaced items */}
        {unplacedItems.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="mb-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Glisse les elements dans les bonnes zones
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {unplacedItems.map((item) => (
                <DraggableItem
                  key={item.text}
                  id={item.text}
                  disabled={disabled}
                  inZone={false}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeId ? (
            <div className="rounded-xl border-2 border-indigo-400 bg-indigo-100 px-4 py-3 text-center text-base font-bold text-indigo-800 shadow-xl">
              {activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={disabled || !allPlaced}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
