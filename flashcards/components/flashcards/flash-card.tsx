"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioButton } from "@/components/review/audio-button";
import { FlipCard } from "@/components/review/flip-card";
import { RATINGS, type Rating } from "@/lib/ratings";
import { usePronunciation, type AudioStatus } from "@/lib/speech";
import { cn } from "@/lib/utils";

export type FlashCardData = {
  id: string;
  targetText: string;
  translation: string;
  pronunciation: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
};

const RATING_LABELS: Record<Rating, string> = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
};

const RATING_KEY_LABELS: Record<Rating, string> = {
  AGAIN: "1",
  HARD: "2",
  GOOD: "3",
  EASY: "4",
};

const RATING_BUTTON_STYLES: Record<Rating, string> = {
  AGAIN: "outline-ring hover:border-destructive/60 hover:text-destructive",
  HARD: "outline",
  GOOD: "default",
  EASY: "outline-success hover:border-success/60 hover:text-success",
};

function FrontFace({
  languageLabel,
  targetText,
  audioStatus,
  onPlayAudio,
}: {
  languageLabel: string;
  targetText: string;
  audioStatus: AudioStatus;
  onPlayAudio: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Badge variant="outline" className="px-2.5 py-1 text-xs">
        {languageLabel}
      </Badge>

      <p className="text-3xl font-semibold tracking-tight">{targetText}</p>

      <AudioButton status={audioStatus} onPlay={onPlayAudio} />

      <p className="text-xs text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          Space
        </kbd>{" "}
        or tap to reveal
      </p>
    </div>
  );
}

function BackFace({
  card,
  pending,
  onRate,
}: {
  card: FlashCardData;
  pending: boolean;
  onRate: (rating: Rating) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="text-xl font-medium">{card.translation}</p>
        {card.pronunciation && (
          <p className="text-sm text-muted-foreground">[{card.pronunciation}]</p>
        )}
        {card.partOfSpeech && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
            {card.partOfSpeech}
          </p>
        )}
        {card.exampleSentence && (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-sm italic text-muted-foreground">
              &quot;{card.exampleSentence}&quot;
            </p>
            {card.exampleTranslation && (
              <p className="text-xs text-muted-foreground/70">
                {card.exampleTranslation}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        data-no-flip
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
        onClick={(e) => e.stopPropagation()}
      >
        {RATINGS.map((rating) => {
          const isDefault = RATING_BUTTON_STYLES[rating] === "default";
          return (
            <Button
              key={rating}
              variant={isDefault ? "default" : "outline"}
              className={
                isDefault
                  ? undefined
                  : `transition-all active:scale-[0.98] ${RATING_BUTTON_STYLES[rating]}`
              }
              disabled={pending}
              onClick={() => onRate(rating)}
            >
              <span className="flex flex-col leading-tight">
                <span>{RATING_LABELS[rating]}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {RATING_KEY_LABELS[rating]}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function FlashCard({
  card,
  index,
  total,
  languageLabel,
  languageCode,
  flipped,
  onFlip,
  disabled = false,
  pending,
  onRate,
}: {
  card: FlashCardData;
  index: number;
  total: number;
  languageLabel: string;
  languageCode: string;
  flipped: boolean;
  onFlip: () => void;
  disabled?: boolean;
  pending: boolean;
  onRate: (rating: Rating) => void;
}) {
  const audio = usePronunciation(card.targetText, languageCode, card.audioUrl);
  const faceClassName = cn("rounded-2xl border border-border bg-card shadow-sm");
  return (
    <FlipCard
      flipped={flipped}
      onFlip={onFlip}
      disabled={disabled}
      aria-label={`Flashcard ${index + 1} of ${total}${
        flipped ? ", answer revealed" : ""
      }`}
      className="w-full min-h-72"
      frontClassName={faceClassName}
      backClassName={faceClassName}
      front={
        <FrontFace
          languageLabel={languageLabel}
          targetText={card.targetText}
          audioStatus={audio.status}
          onPlayAudio={audio.play}
        />
      }
      back={<BackFace card={card} pending={pending} onRate={onRate} />}
    />
  );
}