-- AlterTable
ALTER TABLE "FlashcardProgress" ADD COLUMN     "easeFactor" DOUBLE PRECISION,
ADD COLUMN     "intervalDays" DOUBLE PRECISION,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "FlashcardProgress_userId_dueAt_idx" ON "FlashcardProgress"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "FlashcardProgress_userId_state_idx" ON "FlashcardProgress"("userId", "state");
