-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "score" JSONB NOT NULL,
    "correct" INTEGER,
    "total" INTEGER,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "latestPassed" BOOLEAN,
    "bestCorrect" INTEGER,
    "bestTotal" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_exerciseId_idx" ON "ExerciseAttempt"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_lessonId_idx" ON "ExerciseAttempt"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_createdAt_idx" ON "ExerciseAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseProgress_userId_lessonId_idx" ON "ExerciseProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseProgress_userId_exerciseId_key" ON "ExerciseProgress"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
