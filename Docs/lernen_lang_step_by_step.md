# Stack

Framework: Next.js
Database: SQLite
ORM: Prisma
Auth: Better Auth
Validation: Zod
Forms: React Hook Form
UI Component: ShadCN


# Lernen Lang MVP Execution Chart

## Phase 0: Product and Data Foundation

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-001 | Create application foundation | Set up the Next.js application, database, environment configuration and basic layout | Application runs locally |
| LL-002 | Create User model | Create the core user entity | Users can be persisted |
| LL-003 | Avoid language-specific accounts | Do not create separate accounts for Spanish, French, German, Portuguese, Russian or Mandarin | One user account can store multiple learning languages |
| LL-004 | Create Language model | Create the master list of supported languages | Languages can be stored and identified |
| LL-005 | Create Level model | Create proficiency levels A1, A2, B1, B2, C1 and C2 | Levels can be stored and ordered |
| LL-006 | Create Course model | Connect a language to a proficiency level through a course | Courses can represent combinations such as Spanish A1 |
| LL-007 | Create Module model | Group lessons within a course | Modules can contain lessons |
| LL-008 | Create Lesson model | Store individual learning lessons | Lessons can belong to a module |
| LL-009 | Create Exercise model | Store exercises linked to lessons | Exercises can be stored by skill/type |
| LL-010 | Create Flashcard model | Store vocabulary and phrase learning items | Flashcards can be stored |
| LL-011 | Create User Language model | Track which languages a user is learning | A user can learn zero or many languages |
| LL-012 | Create User Progress model | Track learning progress by relevant course and lesson | Progress can be persisted |
| LL-013 | Create Flashcard Progress model | Track a user's history with individual flashcards | Review data can be stored per user and flashcard |
| LL-014 | Establish authorization rules | Define which user can view or change each private resource | Users cannot access another user's progress or account data |

Phase exit: The underlying model supports one user learning multiple languages and allows the platform to add future language-level combinations without rebuilding the core data model.


## Phase 1: Authentication and User Account

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-015 | Registration page | Create account registration | New user can register |
| LL-016 | Login page | Allow registered users to sign in | User can authenticate |
| LL-017 | Logout | Allow authenticated users to sign out | Session is terminated |
| LL-018 | Account information | Store user name, email and basic account information | Account details persist |
| LL-019 | Edit account | Allow user to update basic information | Changes are saved |
| LL-020 | Auth protection | Protect private application pages | Unauthenticated users cannot enter private areas |
| LL-021 | Session handling | Persist authenticated session correctly | User remains signed in across protected navigation |
| LL-022 | Account security validation | Validate account inputs and authentication states | Invalid account operations are rejected |

Phase exit: A person can create and manage one Lernen Lang account.


## Phase 2: Language Catalog and Course Structure

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-023 | Create initial language catalogue | Add Spanish, French, Mandarin, German, Portuguese and Russian | All six languages are available in the catalogue |
| LL-024 | Add language metadata | Store language code, display name and active status | Language metadata persists |
| LL-025 | Create proficiency levels | Add A1, A2, B1, B2, C1 and C2 | All supported levels can be selected |
| LL-026 | Order proficiency levels | Store the order of levels for progression | Levels display in the correct sequence |
| LL-027 | Create Spanish A1 course | Create the first active course | Spanish A1 course exists |
| LL-028 | Support future course combinations | Ensure language and level are independently related | New combinations can be added without new application logic |
| LL-029 | Create module structure | Allow courses to contain modules | Modules can be created under Spanish A1 |
| LL-030 | Create lesson structure | Allow modules to contain lessons | Lessons can be created under modules |
| LL-031 | Create exercise structure | Allow lessons to contain exercises | Exercises can be attached to lessons |
| LL-032 | Create content status | Support draft and published learning content | Unpublished content is not shown to learners |

Phase exit: Spanish A1 is available as the first course, while the content model already supports all planned languages and proficiency levels.


## Phase 3: User Language Selection

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-033 | Create language selection page | Build the screen where users choose a language | Available languages are displayed |
| LL-034 | Select learning language | Allow user to start learning a language | Selected language is stored |
| LL-035 | Support multiple learning languages | Allow one account to learn several languages | Multiple language records can exist for one user |
| LL-036 | Set active learning language | Allow one language to be the current learning focus | Dashboard can identify the active language |
| LL-037 | Select starting level | Allow learner to choose an available level | Selected level is stored |
| LL-038 | Default Spanish A1 path | Make Spanish A1 the initial MVP learning path | New Spanish learner can immediately start A1 |
| LL-039 | Change learning language | Allow user to switch between active languages | User can return to any enrolled language |
| LL-040 | Prevent unavailable course access | Prevent users from entering inactive or unavailable courses | Unavailable content is blocked |

Phase exit: A user can choose Spanish A1 and the same account can later support additional languages and levels.


## Phase 4: Spanish A1 Curriculum

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-041 | Create Spanish A1 curriculum | Create the initial Spanish A1 course structure | Curriculum exists |
| LL-042 | Add Module 1 | Add Foundations/Greetings content | Module is visible |
| LL-043 | Add Module 2 | Add Numbers and Time content | Module is visible |
| LL-044 | Add Module 3 | Add People and Family content | Module is visible |
| LL-045 | Add Module 4 | Add Everyday Life content | Module is visible |
| LL-046 | Add additional A1 modules | Add remaining beginner topics required by the final curriculum | Complete A1 module set exists |
| LL-047 | Create Spanish A1 lessons | Add focused lessons under each module | Lessons are accessible |
| LL-048 | Add lesson objectives | Store a clear learning objective for each lesson | Objective is displayed |
| LL-049 | Add lesson learning items | Connect vocabulary, phrases, grammar and exercises to lessons | Lesson contains real learning material |
| LL-050 | Publish Spanish A1 content | Mark approved lessons as published | Published lessons appear to learners |

Phase exit: Spanish A1 has a complete structured curriculum that learners can move through lesson by lesson.


## Phase 5: Flashcard Content

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-051 | Create flashcard fields | Store target text, English meaning, pronunciation, example and metadata | Flashcard data persists |
| LL-052 | Add Spanish A1 vocabulary | Enter the initial Spanish A1 learning items | Flashcards exist for the first lessons |
| LL-053 | Add translations | Store accurate English translations | Learner can reveal meanings |
| LL-054 | Add pronunciation | Store pronunciation guidance where applicable | Pronunciation displays |
| LL-055 | Add example sentences | Add examples showing vocabulary in context | Examples display |
| LL-056 | Add example translations | Store English meaning for example sentences | Example translations display |
| LL-057 | Add audio references | Allow flashcards to reference audio files | Audio can be attached |
| LL-058 | Add difficulty metadata | Store a basic content difficulty value | Flashcards can be categorized |
| LL-059 | Link flashcards to lessons | Associate each flashcard with the correct lesson | Lesson flashcards load correctly |
| LL-060 | Prevent duplicate content | Validate repeated target-language items where necessary | Duplicate records are controlled |

Phase exit: Spanish A1 lessons contain usable flashcard content rather than placeholder data.


## Phase 6: Learning Session

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-061 | Create lesson start action | Allow user to start a lesson | Learning session opens |
| LL-062 | Load session content | Retrieve exercises and flashcards for the selected lesson | Correct lesson items appear |
| LL-063 | Show session progress | Display current item and total items | Learner can see session position |
| LL-064 | Show flashcard front | Initially display target-language content | Front side renders |
| LL-065 | Reveal flashcard answer | Allow learner to reveal English meaning and supporting content | Answer is revealed |
| LL-066 | Play card audio | Allow learner to hear pronunciation | Audio plays when available |
| LL-067 | Rate recall | Add Again, Hard, Good and Easy actions | User can record recall result |
| LL-068 | Advance session | Move to the next learning item | Session progresses correctly |
| LL-069 | Prevent invalid progress | Ensure users cannot submit impossible or missing session states | Invalid state changes are blocked |
| LL-070 | Finish learning session | Detect when all required items are completed | Session ends correctly |
| LL-071 | Show session summary | Show completion, accuracy and review information | Learner receives immediate summary |

Phase exit: A learner can complete a real Spanish A1 lesson from start to finish through an interactive session.


## Phase 7: Reading

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-072 | Create reading exercise type | Support reading content as an exercise | Reading exercises can be stored |
| LL-073 | Add Spanish A1 reading text | Add short beginner-level passages and conversations | Reading content exists |
| LL-074 | Add reading questions | Attach comprehension questions to passages | Questions can be answered |
| LL-075 | Render reading passage | Display readable target-language content | Learner can read the passage |
| LL-076 | Submit reading answer | Allow learner to answer questions | Answer is recorded |
| LL-077 | Score reading exercise | Determine correctness for supported question types | Score is generated |
| LL-078 | Show reading feedback | Show correct/incorrect result | Feedback is visible |
| LL-079 | Track reading progress | Persist completed reading activity | Reading progress updates |

Phase exit: Spanish A1 includes a functioning reading practice experience.


## Phase 8: Listening

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-080 | Create listening exercise type | Support audio-based exercises | Listening exercises can be stored |
| LL-081 | Add Spanish A1 audio | Attach audio to initial listening content | Audio assets are available |
| LL-082 | Add listening questions | Create questions linked to audio | Questions display correctly |
| LL-083 | Build audio player | Allow play and replay | Audio controls work |
| LL-084 | Submit listening answer | Allow the learner to answer the exercise | Answer is recorded |
| LL-085 | Score listening exercise | Evaluate supported objective answers | Score is generated |
| LL-086 | Show listening feedback | Show result after submission | Feedback is visible |
| LL-087 | Track listening progress | Persist completed listening activity | Listening progress updates |

Phase exit: Spanish A1 includes functioning listening practice with real audio.


## Phase 9: Writing

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-088 | Create writing exercise type | Support text-input exercises | Writing exercises can be stored |
| LL-089 | Add Spanish A1 writing content | Add translation, fill-in and sentence exercises | Writing content exists |
| LL-090 | Build writing form | Allow learner to enter an answer | Input works |
| LL-091 | Validate writing submission | Prevent empty or invalid submissions | Invalid submission is rejected |
| LL-092 | Normalize answer comparison | Handle basic capitalization and whitespace differences | Reasonable equivalent answers are accepted |
| LL-093 | Score writing exercise | Compare learner response against expected answer | Correctness can be determined |
| LL-094 | Show writing feedback | Display expected answer and result | Feedback is visible |
| LL-095 | Track writing progress | Persist completed writing activity | Writing progress updates |

Phase exit: Spanish A1 includes functioning writing exercises with immediate feedback.


## Phase 10: Speaking

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-096 | Create speaking exercise type | Support target phrases that can be spoken | Speaking exercises can be stored |
| LL-097 | Add Spanish A1 speaking prompts | Add beginner-level phrases and sentences | Speaking content exists |
| LL-098 | Request microphone permission | Ask for browser microphone access | Permission flow works |
| LL-099 | Record learner speech | Capture a speaking attempt | Recording is created |
| LL-100 | Play recording | Allow learner to replay their attempt | Playback works |
| LL-101 | Add speech recognition integration point | Create a service boundary for speech-to-text | Speaking service can be connected |
| LL-102 | Show detected speech | Display recognized response when available | Learner sees detected text |
| LL-103 | Compare target and detected speech | Provide basic similarity or accuracy feedback | Basic speaking result is produced |
| LL-104 | Handle unsupported browser | Gracefully handle unavailable speech features | User receives useful fallback feedback |
| LL-105 | Track speaking progress | Persist completed speaking activity | Speaking progress updates |

Phase exit: A learner can complete a basic speaking exercise and receive usable feedback, while the architecture remains open for more advanced pronunciation scoring.


## Phase 11: Exercise and Answer Engine

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-106 | Standardize exercise types | Define supported exercise categories | Exercise types are consistent |
| LL-107 | Create answer model | Store learner answers and evaluation results | Answers persist |
| LL-108 | Create scoring rules | Define reusable scoring for objective exercises | Exercises can be scored consistently |
| LL-109 | Record correctness | Store correct or incorrect state | Result persists |
| LL-110 | Record attempts | Track number of attempts where needed | Attempt count is available |
| LL-111 | Provide immediate feedback | Return result after submission | Learner gets feedback without leaving session |
| LL-112 | Support exercise ordering | Preserve lesson sequence | Exercises appear in intended order |

Phase exit: The platform has a reusable exercise engine instead of one-off logic for each lesson.


## Phase 12: Progress Tracking

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-113 | Count total lessons | Determine total published lessons for a course | Total is accurate |
| LL-114 | Count completed lessons | Determine user-completed lessons | Completed count is accurate |
| LL-115 | Calculate course progress | Calculate lesson completion percentage | Percentage is accurate |
| LL-116 | Calculate module progress | Calculate progress per module | Module progress is accurate |
| LL-117 | Track skill progress | Calculate reading, listening, writing and speaking progress | Four skill metrics are available |
| LL-118 | Track flashcard progress | Count reviewed and mastered cards | Flashcard statistics are accurate |
| LL-119 | Track accuracy | Calculate correct-answer rate from recorded exercises | Accuracy is accurate |
| LL-120 | Track study sessions | Store completed learning sessions | History is available |
| LL-121 | Update progress automatically | Recalculate progress after activity | No manual progress update is required |
| LL-122 | Handle empty progress | Avoid invalid percentages when no activity exists | Empty states work |

Phase exit: The learner can immediately see how much of Spanish A1 has been completed and how they are performing across the four skills.


## Phase 13: Flashcard Review and Spaced Repetition Foundation

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-123 | Store review result | Save Again, Hard, Good or Easy response | Review result persists |
| LL-124 | Store last reviewed time | Record latest flashcard review | Timestamp exists |
| LL-125 | Store review count | Track how many times a card was reviewed | Count is accurate |
| LL-126 | Identify due cards | Provide a basic rule for cards needing review | Due cards can be queried |
| LL-127 | Create review session | Allow learners to practice due cards separately | Review session works |
| LL-128 | Prioritize difficult cards | Bring poorly remembered cards back sooner | Review order reflects difficulty |
| LL-129 | Keep algorithm replaceable | Isolate review scheduling logic from the UI | Spaced repetition rules can later be upgraded |

Phase exit: Lernen Lang has a functional review foundation without locking the application into one future spaced-repetition algorithm.




| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-130 | Create XP ledger | Store XP events rather than relying only on a single total | XP history persists |
| LL-131 | Award flashcard XP | Give XP for valid flashcard completion | XP is awarded correctly |
| LL-132 | Award exercise XP | Give XP for completed exercises | XP is awarded correctly |
| LL-133 | Award lesson XP | Give XP for completing lessons | XP is awarded correctly |
| LL-134 | Track daily activity | Record qualifying learning activity by date | Daily activity is available |
| LL-135 | Calculate current streak | Determine consecutive qualifying days | Current streak is accurate |
| LL-136 | Store longest streak | Preserve best streak achieved | Longest streak is accurate |
| LL-137 | Create achievement model | Store reusable achievement definitions and awards | Achievements can be assigned |
| LL-138 | Add initial achievements | Add first lesson, XP and streak milestones | Initial achievements can be unlocked |
| LL-139 | Display achievements | Show earned achievements to the learner | Achievement history is visible |

Phase exit: The learning system can reward consistency without making gamification the core of the product.


## Phase 15: User Dashboard

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-140 | Create dashboard | Build one dashboard for every user | Dashboard loads |
| LL-141 | Show active language | Display the current learning language | Active language is visible |
| LL-142 | Show current course | Display language and level | Course information is visible |
| LL-143 | Show continue learning | Provide direct path to current lesson or review | Continue action works |
| LL-144 | Show overall progress | Display course completion | Progress renders |
| LL-145 | Show four-skill progress | Display reading, listening, writing and speaking metrics | Four metrics render |
| LL-146 | Show daily goal | Display daily learning target and progress | Goal status is visible |
| LL-147 | Show streak | Display current and longest streak | Streak information is visible |
| LL-148 | Show XP | Display current XP | XP renders |
| LL-149 | Show recent activity | Display recent completed learning actions | Activity is visible |
| LL-150 | Show additional languages | Display progress for other enrolled languages | Multiple languages can be managed from one dashboard |
| LL-151 | Handle new-user state | Provide clear next action when no learning has started | New users are not confused |

Phase exit: One dashboard gives a learner a clear view of what to study next and how they are progressing.


## Phase 16: Course and Lesson Navigation

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-152 | Create course page | Build language-level course overview | Course page loads |
| LL-153 | Display modules | Show module list and progress | Modules render |
| LL-154 | Display lessons | Show lessons within each module | Lessons render in order |
| LL-155 | Lock unavailable lessons | Prevent access to content based on defined progression rules where needed | Locked state works |
| LL-156 | Show completed state | Mark completed lessons clearly | Completion state is visible |
| LL-157 | Show in-progress state | Mark current or partially completed lessons | In-progress state is visible |
| LL-158 | Open lesson | Navigate into the selected lesson | Correct lesson loads |
| LL-159 | Return to course | Allow learner to return to course structure | Navigation works |

Phase exit: Learners can move naturally from course → module → lesson → learning session.


## Phase 17: Notifications

Keep notifications event-based and simple.

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-160 | Notification centre | Create user's notification list | Notifications display |
| LL-161 | Daily reminder notification | Notify learner about planned daily study | Reminder appears when triggered |
| LL-162 | Streak-at-risk notification | Notify learner when defined streak rules are met | Notification appears |
| LL-163 | Achievement notification | Notify learner when an achievement is unlocked | Notification appears |
| LL-164 | Course completion notification | Notify learner when a course or level is completed | Notification appears |
| LL-165 | Mark notification read | Allow learner to clear unread state | Read status persists |

Phase exit: Learners can follow important learning events without manually checking every page.


## Phase 18: Admin and Content Management Foundation

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-166 | Create admin access concept | Separate content-management permissions from learner permissions | Only authorized users can manage content |
| LL-167 | Create content management page | Provide a controlled place to manage learning content | Admin can access content tools |
| LL-168 | Manage languages | Add or edit language metadata | Language catalogue can be maintained |
| LL-169 | Manage levels | Add or edit levels where appropriate | Level data can be maintained |
| LL-170 | Manage courses | Create language-level courses | Courses can be maintained |
| LL-171 | Manage modules | Create and edit modules | Modules can be maintained |
| LL-172 | Manage lessons | Create and edit lessons | Lessons can be maintained |
| LL-173 | Manage flashcards | Create and edit flashcards | Flashcards can be maintained |
| LL-174 | Manage exercises | Create and edit exercise content | Exercises can be maintained |
| LL-175 | Attach audio | Upload or connect audio to relevant content | Audio references can be managed |
| LL-176 | Publish content | Publish approved content to learners | Published content becomes available |

Phase exit: Lernen Lang can grow beyond the initial Spanish A1 dataset without developers manually editing application code for every content change.


## Phase 19: MVP Hardening

These are not new product features. They are required to make the existing MVP reliable.

| ID | Atomic Step | What to Implement | Done When |
|---|---|---|---|
| LL-177 | Authorization review | Check every private user, progress, session and account resource | No cross-user access |
| LL-178 | Course access validation | Prevent access to unavailable or unpublished content | Access rules are enforced |
| LL-179 | Progress consistency review | Ensure lesson, exercise and flashcard results update consistently | Progress cannot drift from activity |
| LL-180 | Input validation review | Validate every form and submission | Invalid input is rejected |
| LL-181 | Exercise scoring review | Test objective answer evaluation | Scoring is consistent |
| LL-182 | Flashcard review review | Test repeat, difficulty and due-card behavior | Review behavior is reliable |
| LL-183 | Speaking fallback review | Test browser microphone and speech-feature failures | Unsupported cases show useful fallback |
| LL-184 | Empty states | Add useful empty states across major pages | New users are not confused |
| LL-185 | Error states | Handle failed operations and unavailable resources | Useful errors appear |
| LL-186 | Loading states | Add loading feedback to major interactions | Users know when content is loading |
| LL-187 | Mobile responsiveness | Make core learner flow usable on mobile | MVP works on phone-sized screens |
| LL-188 | Navigation review | Ensure every major user flow is reachable | No dead ends |
| LL-189 | Performance review | Reduce unnecessary data loading and expensive client work | Core pages remain responsive |
| LL-190 | Spanish A1 content review | Check lessons, translations, examples and exercise links | Initial content is internally consistent |
| LL-191 | Full learner journey | Execute complete learner workflow manually | Journey succeeds |
| LL-192 | Multi-language architecture test | Add a second course record without rewriting core features | Additional language/level path works |
| LL-193 | MVP release preparation | Configure production environment and deployment | MVP is deployable |

Phase exit: The Spanish A1 MVP is reliable, the main learner journey works end to end, and the architecture has been tested with future language/level expansion in mind.


# Final MVP Execution Order

The actual implementation sequence is therefore:

Foundation
→ Authentication
→ Language Catalog
→ Course Structure
→ User Language Selection
→ Spanish A1 Curriculum
→ Flashcard Content
→ Learning Session
→ Reading
→ Listening
→ Writing
→ Speaking
→ Exercise Engine
→ Progress Tracking
→ Flashcard Review
→ XP and Streaks
→ Dashboard
→ Course Navigation
→ Notifications
→ Admin Content Foundation
→ MVP Hardening


The key rule is to finish and verify each phase before moving to the next one.

The team should not build advanced AI, payment, social or recommendation systems before the core learning loop is reliable.


# Feature Requirements After MVP

The following should not enter the execution backlog above:

| Future Feature | Status |
|---|---|
| Additional Spanish levels (A2–C2) | Post-MVP |
| French A1–C2 | Post-MVP |
| German A1–C2 | Post-MVP |
| Portuguese A1–C2 | Post-MVP |
| Russian A1–C2 | Post-MVP |
| Mandarin A1–C2 | Post-MVP |
| Advanced spaced repetition algorithm | Post-MVP |
| Placement tests | Post-MVP |
| Personalized lesson recommendations | Post-MVP |
| Personalized review recommendations | Post-MVP |
| AI grammar tutor | Post-MVP |
| AI writing correction | Post-MVP |
| AI conversation practice | Post-MVP |
| Advanced pronunciation scoring | Post-MVP |
| Vocabulary bookmarks | Post-MVP |
| Personal vocabulary lists | Post-MVP |
| Certificates | Post-MVP |
| Leaderboards | Post-MVP |
| Advanced learning goals | Post-MVP |
| Offline learning | Post-MVP |
| Mobile applications | Post-MVP |
| Advanced analytics | Post-MVP |
| Advanced notification scheduling | Post-MVP |
| External calendar integration | Post-MVP |
| Subscription payments | Post-MVP |
| Family or classroom accounts | Post-MVP |


# Definition of MVP Complete

Lernen Lang MVP is complete when this entire scenario works:

A new user creates a Lernen Lang account, selects Spanish as a learning language, starts the Spanish A1 course, opens a lesson, studies flashcards, listens to pronunciation, completes reading, listening, writing and basic speaking exercises, receives immediate feedback, finishes the learning session, and sees the resulting progress, XP and streak update on the dashboard.

The same account can then return to the course, review previously learned flashcards, continue to the next lesson, and see progress across the four communication skills.

Finally, the team should be able to create or enable another language-level combination, such as French A1, using the same language, level, course, lesson, exercise and flashcard architecture rather than creating a second application.

If that scenario works from beginning to end, and the additional language-level architecture has been verified, the core Lernen Lang MVP is working.
