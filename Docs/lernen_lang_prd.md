# Lernen Lang

## Product Goal

Lernen Lang is an online language-learning platform for people who understand English and want to learn new languages through structured, interactive practice.

Lernen Lang uses a **single learner account model**. A user does not create separate accounts for different languages.

A user can:

* Learn one or more languages
* Choose a starting proficiency level
* Study vocabulary and phrases through flashcards
* Practice reading
* Practice listening
* Practice writing
* Practice speaking
* Track progress across languages and levels
* Review previously learned material
* Build a daily learning streak

For example, a user could be:

* Learning Spanish at A1
* Learning French at A2
* Reviewing Spanish vocabulary
* Practicing speaking in Spanish
* Working toward completing a Spanish A1 course

The user's learning activity belongs to the language and level they are studying, not to a separate account type.

The MVP should focus on this journey:

**Choose a language → Select a level → Start a lesson → Learn through flashcards → Practice the four communication skills → Review mistakes → Track progress → Continue learning**

---

# Core User Model

## 1. User Account

Every learner has one Lernen Lang account.

A user should be able to:

* Create an account
* Sign in
* Manage basic account information
* Select one or more languages to learn
* Select or change a target level
* Start lessons
* Practice flashcards
* Complete reading exercises
* Complete listening exercises
* Complete writing exercises
* Complete speaking exercises
* Review previous learning
* View learning progress
* Manage account settings

A user does not need to create a separate account for Spanish, French, German, Portuguese, Russian, or Mandarin.

One account can contain progress across multiple languages.

No profile photo is required anywhere in the product for the MVP.

---

## 2. User Profile

Every user should have a simple profile containing:

* Name
* Email
* Preferred interface language
* Languages they are learning
* Current learning goals
* Daily learning goal
* Current streak

The profile may also display:

* Total XP
* Lessons completed
* Words learned
* Overall learning statistics
* Achievements

A user can learn one language or multiple languages from the same account.

---

## 3. Learning Languages

A user should be able to select the language they want to learn.

The initial languages are:

* Spanish
* French
* Mandarin
* German
* Portuguese
* Russian

The application should be designed so that additional languages can be added later without changing the core learning engine.

Each language should have a stable identifier and metadata such as:

* Language name
* Language code
* Native name
* Display information
* Active or inactive status

Example:

### Spanish

* Code: es
* Native name: Español
* Available: Yes

Adding another language should primarily require adding its content rather than rebuilding the application.

---

# Learning Structure

## 4. Proficiency Levels

Lernen Lang should organize learning using proficiency levels.

The initial structure should support:

* A1
* A2
* B1
* B2
* C1
* C2

The MVP should focus on:

* Spanish
* A1

The data model must still support all other levels from the beginning.

A learner should be able to progress through levels over time.

Example:

**Spanish**

* A1 — Beginner
* A2 — Elementary
* B1 — Intermediate
* B2 — Upper-intermediate
* C1 — Advanced
* C2 — Proficient

The platform should not hard-code Spanish A1-specific logic into the application.

---

## 5. Courses

A course represents the structured learning path for a particular language and level.

Example:

### Spanish A1

* Beginner Spanish
* Structured lessons
* Vocabulary
* Basic grammar
* Everyday expressions
* Reading
* Listening
* Writing
* Speaking

A course should belong to a language and a proficiency level.

For example:

**Spanish + A1 → Spanish A1 Course**

The same structure should support:

**French + A1 → French A1 Course**

and:

**Spanish + A2 → Spanish A2 Course**

without requiring a different application structure.

---

## 6. Modules

A course should be divided into modules.

For Spanish A1, modules may include:

### Module 1 — Foundations

* Greetings
* Introducing yourself
* Basic questions

### Module 2 — Numbers and Time

* Numbers
* Days and months
* Telling time

### Module 3 — People

* Family
* Describing people

### Module 4 — Everyday Life

* Daily routines
* Food and drinks

The exact curriculum can evolve, but the module structure should remain flexible.

A module may contain multiple lessons.

---

## 7. Lessons

Each lesson should teach a focused concept or topic.

A lesson may contain:

* Vocabulary
* Phrases
* Grammar points
* Flashcards
* Reading activities
* Listening activities
* Writing activities
* Speaking activities
* Review exercises

Example:

### Spanish A1 — Lesson 1

**Topic:** Greetings

Learning items could include:

* Hola — Hello
* Buenos días — Good morning
* Buenas tardes — Good afternoon
* Buenas noches — Good evening / Good night
* Adiós — Goodbye

The learner should be able to complete a lesson as a learning session rather than simply reading a static page.

---

# Flashcard Learning

## 8. Flashcards

Flashcards should be the central learning mechanism of Lernen Lang.

A flashcard should support more than a word and its translation.

Each flashcard may contain:

* Target-language word or phrase
* English translation
* Pronunciation
* Audio
* Example sentence
* English example translation
* Part of speech, where applicable
* Difficulty
* Topic
* Image, where useful

Example:

### Spanish

**Buenos días**

**English:** Good morning

**Pronunciation:** bweh-nos DEE-as

**Example:** Buenos días, Ana.

**Translation:** Good morning, Ana.

The learner should be able to reveal the answer rather than always seeing both sides immediately.

---

## 9. Flashcard Review

After reviewing a flashcard, the learner should be able to rate how well they remembered it.

Initial options may include:

* Again
* Hard
* Good
* Easy

These responses should be stored so the platform can later use them for spaced repetition.

The MVP may use a simple review model first.

A more advanced spaced-repetition algorithm can be introduced later.

---

## 10. Learning Session

A learning session should guide the learner through a defined group of learning items.

Example:

### Spanish A1 — Greetings

**Card 3 of 10**

> Buenos días

* Play audio
* Reveal answer
* Select difficulty

The session should show:

* Current lesson
* Current question/card number
* Session progress
* Correct or incorrect state
* Next action

At the end of the session, the user should receive a summary.

---

# Four Communication Skills

## 11. Reading

Lernen Lang should include reading activities as part of the learning experience.

Reading exercises may include:

* Words
* Sentences
* Short conversations
* Short passages
* Comprehension questions

Example:

### Read

> Hola. Me llamo Carlos. Soy de Madrid. Tengo veinte años.

Then:

**Question:** Where is Carlos from?

* Madrid
* Barcelona
* Valencia

The reading system should begin with simple A1 material and become more complex at higher levels.

---

## 12. Listening

Lernen Lang should include listening activities using recorded target-language audio.

A listening exercise may contain:

* Audio playback
* Multiple-choice questions
* True/false questions
* Dictation
* Word recognition
* Sentence comprehension

Example:

### Listen

🔊 Audio

**What did you hear?**

* Buenos días
* Buenas noches
* Buenas tardes

Audio should be connected to the relevant lesson or learning item.

The architecture should allow different audio files for different languages and exercises.

---

## 13. Writing

Lernen Lang should include writing exercises that require the learner to produce the target language.

Writing activities may include:

* Translation
* Fill in the blank
* Sentence completion
* Word ordering
* Dictation
* Short answers

Example:

### Translate

**Good morning**

Learner enters:

> Buenos días

The system should compare the answer against the expected answer and provide feedback.

The MVP can use exact or normalized matching.

More advanced writing evaluation can be added later.

---

## 14. Speaking

Lernen Lang should include speaking exercises so learners can practice producing the target language aloud.

A speaking exercise may contain:

* Target sentence
* Audio reference
* Record button
* Playback
* Speech recognition result
* Basic pronunciation or similarity feedback

Example:

### Say this

> Buenos días.

The learner records their answer.

The system may then show:

* Detected speech
* Target phrase
* Accuracy or similarity score
* Basic feedback

Advanced pronunciation scoring does not need to be part of the first MVP.

The architecture should allow speech evaluation to be improved later.

---

# Progress and Learning Data

## 15. User Progress

Lernen Lang should track progress at multiple levels.

Progress should be available for:

* Overall learning
* Language
* Level
* Course
* Module
* Lesson
* Flashcard
* Skill

Example:

### Spanish A1

**Overall Progress**

████████░░ 72%

**Lessons**

8 of 10

**Words Learned**

243

**Accuracy**

87%

Progress should update based on actual learning activity.

---

## 16. Skill Progress

The platform should distinguish the four communication skills.

For example:

### Spanish A1

* Reading — 80%
* Listening — 72%
* Writing — 65%
* Speaking — 58%

This allows the learner to identify weaker areas.

The system may later recommend practice based on those weaknesses.

---

## 17. Learning History

Each user's completed learning activity should be retained.

Learning history may contain:

* Lessons completed
* Flashcards reviewed
* Exercises completed
* Scores
* Review results
* Study sessions
* Time spent learning
* Languages studied
* Levels completed

Users should be able to return to completed lessons and review the material.

---

# Gamification

## 18. XP

Users should earn experience points for learning activities.

Example:

* Complete flashcard — +5 XP
* Complete exercise — +10 XP
* Complete lesson — +25 XP
* Complete daily goal — +50 XP

The exact values can be adjusted later.

XP should be associated with the user and should contribute to an overall learner level or ranking system where appropriate.

---

## 19. Streaks

Lernen Lang should encourage consistent study through learning streaks.

Example:

**🔥 7 day streak**

A streak should increase when the user meets their daily learning requirement.

The system should retain:

* Current streak
* Longest streak
* Last qualifying activity date

The MVP does not need complex social streak features.

---

## 20. Achievements

Users may earn achievements for milestones.

Examples:

* First Lesson
* First 100 Words
* 500 XP
* 7-Day Streak
* 30-Day Streak
* First Listening Exercise
* First Speaking Exercise
* Spanish A1 Complete

Achievements should be reusable across languages where appropriate.

---

# User Dashboard

## 21. Dashboard

Every user should have one dashboard showing their language-learning activity.

The dashboard should show:

### Current Learning

* Active language
* Current level
* Current course
* Current lesson
* Progress
* Continue learning button

### Daily Activity

* Daily goal
* Study progress
* Current streak

### Statistics

* XP
* Words learned
* Lessons completed
* Accuracy
* Time studied

### Other Languages

If the user studies multiple languages, the dashboard should show them separately.

Example:

**Learning**

* Spanish — A1 — 72%
* French — A1 — 25%

A user should not need to switch accounts to move between languages.

---

# Language Discovery and Selection

## 22. Choose a Language

Users should be able to select from the available languages.

Initially:

* Spanish
* French
* Mandarin
* German
* Portuguese
* Russian

Each language should have its own course catalog.

The user can choose one language as their primary active learning language while keeping progress for others.

---

## 23. Choose a Level

When starting a language, the user should be able to choose a starting level.

The experience can offer:

* Start at A1
* Take a placement test later
* Select a higher level manually, where appropriate

For the MVP, the primary supported path is:

**Spanish → A1**

Placement testing does not need to be implemented initially.

---

# Notifications

## 24. Notifications

Users should receive notifications for important learning events such as:

* Daily learning reminder
* Daily goal completed
* Streak at risk
* Streak milestone
* Course or lesson completion
* Achievement unlocked
* New language or level available

Notifications should not overwhelm the learner.

The MVP can begin with in-app notifications.

---

# Additional Features

These features are useful but should remain outside the first MVP.

## Spaced Repetition

Improve flashcard scheduling using a dedicated spaced-repetition algorithm.

Possible capabilities:

* Automatic review scheduling
* Due cards
* Difficulty adjustment
* Forgetting prediction
* Personalized review sessions

The MVP can use a simpler review approach.

---

## Placement Tests

Allow a learner to take a short assessment before starting a language.

Possible result:

**Recommended level: Spanish A2**

This should be introduced after the basic learning system is stable.

---

## Personalized Learning Recommendations

Recommend what a learner should study next based on:

* Progress
* Accuracy
* Weak skills
* Review history
* Missed questions
* Time since last review

Avoid complex recommendation systems in the MVP.

---

## AI Learning Assistant

A future AI assistant could help learners:

* Explain grammar
* Explain vocabulary
* Generate practice questions
* Provide conversation practice
* Correct writing
* Explain mistakes
* Generate personalized review

AI should support the structured course rather than replace it.

---

## AI Conversation Practice

Learners could eventually practice real conversations with an AI in their target language.

Examples:

* Restaurant conversation
* Travel conversation
* Job interview
* Casual conversation

The system could provide feedback on:

* Vocabulary
* Grammar
* Fluency
* Accuracy

This should not be part of the first MVP.

---

## Vocabulary Lists

Allow learners to maintain personal vocabulary collections.

Possible capabilities:

* Save word
* Remove word
* Add notes
* Mark as difficult
* Review saved words

---

## Bookmarks

Users could bookmark:

* Lessons
* Flashcards
* Reading passages
* Difficult questions

---

## Certificates

Lernen Lang could generate certificates for completing a level.

Example:

**Spanish A1 — Completed**

Certificates should be introduced only after the level completion system is reliable.

---

## Leaderboards

Users could optionally compare learning activity with others.

Possible metrics:

* XP
* Weekly XP
* Lessons completed
* Streaks

A social leaderboard is not necessary for the MVP.

---

## Courses for Additional Languages

Once Spanish A1 is stable, the same system should support:

* French A1
* German A1
* Portuguese A1
* Russian A1
* Mandarin A1

The same architecture should later support:

* Spanish A2
* Spanish B1
* Spanish B2
* Spanish C1
* Spanish C2

and equivalent levels for the other supported languages.

No separate codebase should be created for each language.

---

## Admin Content Management

An administrator should eventually be able to manage learning content without changing application code.

Possible capabilities:

* Create language
* Create level
* Create course
* Create module
* Create lesson
* Create flashcard
* Add translations
* Add pronunciation
* Upload audio
* Create reading exercises
* Create listening exercises
* Create writing exercises
* Create speaking exercises
* Publish or unpublish content

This will become important as Lernen Lang grows from Spanish A1 to many languages and levels.

---

## Audio Management

Admins should eventually be able to attach audio to:

* Flashcards
* Vocabulary
* Example sentences
* Listening exercises
* Speaking exercises

The system should keep audio associated with the correct language and learning item.

---

## Analytics

Lernen Lang could eventually provide deeper learning analytics.

Possible metrics:

* Daily active learners
* Lessons completed
* Average session length
* Most studied languages
* Most difficult lessons
* Most frequently missed words
* Skill accuracy
* Course completion rate
* Retention

---

## Learning Goals

Users could eventually set personal goals such as:

* 20 minutes per day
* 10 new words per day
* Complete one lesson per day
* Study 5 days per week

The dashboard can show progress toward those goals.

---

## Offline Learning

A future version could support downloading lessons for offline use.

Potential offline capabilities:

* Flashcard review
* Vocabulary review
* Reading
* Downloaded audio

Progress would synchronize when the user reconnects.

---

## Mobile Applications

Lernen Lang could eventually have:

* iOS app
* Android app

The web application should therefore be built with a responsive architecture and reusable APIs.

---

# MVP Boundary

The first version of Lernen Lang should primarily solve these eight things:

1. **Create an account and maintain a learner profile.**
2. **Choose Spanish as a language and start at A1.**
3. **Learn structured Spanish A1 content through lessons and flashcards.**
4. **Practice reading, listening, writing, and basic speaking.**
5. **Complete learning sessions and receive immediate feedback.**
6. **Track progress across lessons, flashcards, and the four skills.**
7. **Maintain basic XP, streak, and achievement information.**
8. **Preserve the architecture so additional languages and proficiency levels can be added without rebuilding the learning engine.**

The fundamental product rule is:

**Lernen Lang is a language-agnostic learning platform. Spanish A1 is the first content set, not a Spanish-specific application.**

The learning engine should operate on a general structure:

**Language → Level → Course → Module → Lesson → Exercise → Flashcard**

This same structure must be capable of supporting:

**Spanish → A1**

as well as future combinations such as:

**Spanish → A2**  
**French → A1**  
**German → B1**  
**Mandarin → A2**  
**Portuguese → B2**  
**Russian → C1**

without requiring a separate application or separate learning engine.
