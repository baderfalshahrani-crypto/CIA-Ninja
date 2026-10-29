# CIA Ninja

A responsive static web app for CIA Exam preparation for working internal auditors.

## Features

- Flexible dashboard with CIA Part 1, Part 2, and Part 3 progress
- Study Dojo with all required study units and topics
- Original lesson-note structure, key concepts, definitions, exam-focus points, common mistakes, examples, checklist
- Flashcards with local progress and bookmarks
- Original practice question bank with filters by part, unit, difficulty, history, unanswered, and bookmarked questions
- Timed mock exams with countdown, navigation, flagging, final score, topic performance, weak-area analysis, and review
- Study planner with exam date, target part, days per week, hours per day, task completion, and rescheduling
- Weak-area review ranked by missed-answer severity
- XP, study streak, ranks, achievements, bookmarks, profile, and localStorage persistence
- Home, Login, Signup, About, Resources, Privacy, Terms, and Contact pages

## Run locally

Open `index.html` in a browser.

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `data.js`, `app.js`, and `README.md` to the repository root.
3. Go to Settings → Pages.
4. Select the main branch and root folder.
5. Save and open the generated GitHub Pages URL.

## Notes

- This version is static and uses browser localStorage.
- It is admin-ready through the `data.js` structure. Add or edit units, questions, flashcards, and resources without changing the UI code.
- For production, connect a backend for user accounts, database persistence, admin CMS, and file downloads.
- Content and questions are original and do not reproduce proprietary commercial test-bank explanations or questions.
