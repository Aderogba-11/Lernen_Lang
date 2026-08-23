-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_lessonId_targetText_key" ON "Flashcard"("lessonId", "targetText");
