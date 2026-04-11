# Phase 1 Vertical Slice (V2) API Usage

Prereqs:
- (Browser) Login as `ADMIN` or `SUPER_ADMIN`, then use `/admin/v2-lab`, **or**
- (CLI) Set `MEDQ_DEV_ADMIN_KEY` in `.env`, then pass headers:
  - `x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>`
  - `x-university-id: <UNIVERSITY_UUID>`
- Ensure you know a valid `moduleId` in your university.

## 1) Enable feature flag (university scoped)

`PUT /api/v2/admin/feature-flags`

CLI example:

```bash
curl.exe -X PUT http://localhost:3000/api/v2/admin/feature-flags ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"key\":\"v2_org_content_assessment\",\"enabled\":true,\"scope\":\"university\"}"
```

```json
{
  "key": "v2_org_content_assessment",
  "enabled": true,
  "scope": "university"
}
```

## 2) Create Subject

`POST /api/v2/org/subjects`

CLI example:

```bash
curl.exe -X POST http://localhost:3000/api/v2/org/subjects ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"moduleId\":\"<MODULE_UUID>\",\"name\":\"Cardiology\"}"
```

```json
{
  "moduleId": "<MODULE_UUID>",
  "name": "Cardiology"
}
```

## 3) Create Lecture

`POST /api/v2/content/lectures`

CLI example:

```bash
curl.exe -X POST http://localhost:3000/api/v2/content/lectures ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"subjectId\":\"<SUBJECT_UUID>\",\"title\":\"Arrhythmias I\",\"order\":0}"
```

```json
{
  "subjectId": "<SUBJECT_UUID>",
  "title": "Arrhythmias I",
  "order": 0
}
```

## 4) Attach Quiz to Lecture

`POST /api/v2/assessment/quizzes`

CLI example:

```bash
curl.exe -X POST http://localhost:3000/api/v2/assessment/quizzes ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"lectureId\":\"<LECTURE_UUID>\",\"title\":\"Arrhythmias Quiz\",\"timeLimitMin\":10}"
```

```json
{
  "lectureId": "<LECTURE_UUID>",
  "title": "Arrhythmias Quiz",
  "timeLimitMin": 10
}
```

## 5) Add Question to Quiz

`POST /api/v2/assessment/quizzes/<QUIZ_UUID>/questions`

CLI example:

```bash
curl.exe -X POST http://localhost:3000/api/v2/assessment/quizzes/<QUIZ_UUID>/questions ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"body\":\"Which rhythm is most likely?\",\"choices\":[{\"key\":\"A\",\"text\":\"Sinus tachycardia\"},{\"key\":\"B\",\"text\":\"Atrial fibrillation\"},{\"key\":\"C\",\"text\":\"Ventricular tachycardia\"}],\"answer\":\"B\",\"difficulty\":\"MEDIUM\",\"explanation\":\"Irregularly irregular rhythm.\"}"
```

```json
{
  "body": "Which rhythm is most likely?",
  "choices": [
    { "key": "A", "text": "Sinus tachycardia" },
    { "key": "B", "text": "Atrial fibrillation" },
    { "key": "C", "text": "Ventricular tachycardia" }
  ],
  "answer": "B",
  "difficulty": "MEDIUM",
  "explanation": "Irregularly irregular rhythm."
}
```

## 6) Submit Attempt

`POST /api/v2/assessment/quizzes/<QUIZ_UUID>/attempt`

CLI example:

```bash
curl.exe -X POST http://localhost:3000/api/v2/assessment/quizzes/<QUIZ_UUID>/attempt ^
  -H "content-type: application/json" ^
  -H "x-dev-admin-key: <MEDQ_DEV_ADMIN_KEY>" ^
  -H "x-university-id: <UNIVERSITY_UUID>" ^
  -d "{\"answers\":{ \"<QUESTION_UUID>\":\"B\" },\"timeTaken\":42,\"focusLossCount\":0}"
```

```json
{
  "answers": { "<QUESTION_UUID>": "B" },
  "timeTaken": 42,
  "focusLossCount": 0
}
```

## Minimal UI validator

- Visit `/admin/v2-lab` after login.
- Paste `moduleId` from your admin content tree.
- Click buttons in order.
