import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MedOneX database...");

  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default", siteName: "MedOneX", primaryColor: "#0d9488",
      enableAI: true, enableForum: true, enableAds: true, enableNotifs: true,
    },
  });
  console.log("✅ Site config");

  // Rank IDs match the labels used in lib/engagement.ts
  const rankData = [
    { id: "newbie",      label: "Newbie",      minPoints: 0,    badge: "🎓" },
    { id: "active",      label: "Active",      minPoints: 50,   badge: "⚡" },
    { id: "contributor", label: "Contributor", minPoints: 200,  badge: "🔥" },
    { id: "expert",      label: "Expert",      minPoints: 500,  badge: "💎" },
    { id: "elite",       label: "Elite",       minPoints: 1500, badge: "👑" },
  ];
  for (const rank of rankData) {
    await prisma.rank.upsert({
      where: { id: rank.id },
      update: rank,
      create: rank,
    });
  }
  console.log("✅ Ranks (Newbie → Active → Contributor → Expert → Elite)");

  const university = await prisma.university.upsert({
    where: { id: "demo-uni" },
    update: {},
    create: { id: "demo-uni", name: "Cairo Medical University" },
  });

  const year1 = await prisma.academicYear.upsert({
    where: { id: "year-1" },
    update: {},
    create: { id: "year-1", yearNumber: 1, universityId: university.id },
  });
  const year2 = await prisma.academicYear.upsert({
    where: { id: "year-2" },
    update: {},
    create: { id: "year-2", yearNumber: 2, universityId: university.id },
  });

  const sem1 = await prisma.semester.upsert({
    where: { id: "sem-1-1" },
    update: {},
    create: { id: "sem-1-1", name: "Year 1 – Semester 1", academicYearId: year1.id },
  });
  await prisma.semester.upsert({
    where: { id: "sem-1-2" },
    update: {},
    create: { id: "sem-1-2", name: "Year 1 – Semester 2", academicYearId: year1.id },
  });
  await prisma.semester.upsert({
    where: { id: "sem-2-1" },
    update: {},
    create: { id: "sem-2-1", name: "Year 2 – Semester 1", academicYearId: year2.id },
  });

  console.log("✅ University + 2 years + 3 semesters");

  const modAnatomy = await prisma.module.upsert({
    where: { id: "mod-anatomy" },
    update: {},
    create: { id: "mod-anatomy", name: "Anatomy", semesterId: sem1.id },
  });
  const modPhysio = await prisma.module.upsert({
    where: { id: "mod-physio" },
    update: {},
    create: { id: "mod-physio", name: "Physiology", semesterId: sem1.id },
  });

  const subjUpperLimb = await prisma.subject.upsert({
    where: { id: "subj-upper-limb" },
    update: {},
    create: { id: "subj-upper-limb", name: "Upper Limb", moduleId: modAnatomy.id },
  });
  const subjCardiac = await prisma.subject.upsert({
    where: { id: "subj-cardiac" },
    update: {},
    create: { id: "subj-cardiac", name: "Cardiac Physiology", moduleId: modPhysio.id },
  });

  const lecShoulder = await prisma.lecture.upsert({
    where: { id: "lec-shoulder" },
    update: {},
    create: {
      id: "lec-shoulder", title: "The Shoulder Joint",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      subjectId: subjUpperLimb.id, order: 1,
    },
  });
  const lecHeart = await prisma.lecture.upsert({
    where: { id: "lec-heart" },
    update: {},
    create: {
      id: "lec-heart", title: "Cardiac Cycle",
      subjectId: subjCardiac.id, order: 1,
    },
  });

  // Flashcards for shoulder lecture
  const flashcards = [
    { id: "fc-0", front: "What type of joint is the shoulder?", back: "Ball and socket (synovial)", lectureId: lecShoulder.id },
    { id: "fc-1", front: "Which nerve innervates the deltoid?", back: "Axillary nerve (C5, C6)", lectureId: lecShoulder.id },
    { id: "fc-2", front: "Most common dislocation direction?", back: "Anterior (95% of cases)", lectureId: lecShoulder.id },
    { id: "fc-3", front: "SITS mnemonic for rotator cuff?", back: "Supraspinatus, Infraspinatus, Teres minor, Subscapularis", lectureId: lecShoulder.id },
    { id: "fc-4", front: "Cardiac output = ?", back: "Heart Rate × Stroke Volume", lectureId: lecHeart.id },
  ];
  for (const fc of flashcards) {
    await prisma.flashcard.upsert({ where: { id: fc.id }, update: {}, create: fc });
  }

  // Questions for shoulder lecture
  const questions = [
    {
      id: "q-1",
      body: "Which muscle is NOT part of the rotator cuff?",
      choices: [{ key:"A",text:"Supraspinatus"},{key:"B",text:"Infraspinatus"},{key:"C",text:"Deltoid"},{key:"D",text:"Teres minor"}],
      answer: "C",
      explanation: "The rotator cuff = SITS (Supraspinatus, Infraspinatus, Teres minor, Subscapularis). The Deltoid is the prime mover for shoulder abduction, not a rotator cuff muscle.",
      difficulty: "EASY" as const,
      lectureId: lecShoulder.id,
    },
    {
      id: "q-2",
      body: "After a shoulder dislocation, a patient has lost sensation over the lateral shoulder (regimental badge area). Which nerve is most likely injured?",
      choices: [{key:"A",text:"Musculocutaneous nerve"},{key:"B",text:"Radial nerve"},{key:"C",text:"Axillary nerve"},{key:"D",text:"Suprascapular nerve"}],
      answer: "C",
      explanation: "The axillary nerve (C5,C6) winds around the surgical neck of the humerus and is commonly injured in shoulder dislocations. It supplies the deltoid, teres minor, and the skin over the lateral shoulder via the superior lateral cutaneous nerve of the arm.",
      difficulty: "MEDIUM" as const,
      lectureId: lecShoulder.id,
    },
    {
      id: "q-3",
      body: "Anterior shoulder dislocation most commonly injures which structure?",
      choices: [{key:"A",text:"Supraspinatus tendon"},{key:"B",text:"Anterior labrum + glenohumeral ligament (Bankart lesion)"},{key:"C",text:"Posterior capsule"},{key:"D",text:"Coracohumeral ligament"}],
      answer: "B",
      explanation: "Classic Bankart lesion: avulsion of the anteroinferior glenoid labrum and glenohumeral ligaments. It is the most common structural injury in anterior shoulder dislocation and the leading cause of recurrent instability.",
      difficulty: "HARD" as const,
      lectureId: lecShoulder.id,
    },
    {
      id: "q-4",
      body: "What is the normal cardiac output at rest?",
      choices: [{key:"A",text:"2-3 L/min"},{key:"B",text:"4-6 L/min"},{key:"C",text:"8-10 L/min"},{key:"D",text:"12-15 L/min"}],
      answer: "B",
      explanation: "Normal resting cardiac output is approximately 4-6 L/min. It equals Heart Rate (60-100 bpm) × Stroke Volume (~70 mL). CO = HR × SV.",
      difficulty: "EASY" as const,
      lectureId: lecHeart.id,
    },
  ];
  for (const q of questions) {
    await prisma.question.upsert({ where: { id: q.id }, update: {}, create: q });
  }

  console.log("✅ 2 modules, 2 subjects, 2 lectures, 5 flashcards, 4 questions");

  // Past Papers
  await prisma.pastPaper.upsert({
    where: { id: "pp-anatomy-2024" },
    update: {},
    create: {
      id: "pp-anatomy-2024",
      title: "Anatomy Final Exam 2024",
      isInteractive: true,
      timeLimitMin: 45,
      semesterId: sem1.id,
      moduleId: modAnatomy.id,
    },
  });
  await prisma.pastPaper.upsert({
    where: { id: "pp-physio-2024" },
    update: {},
    create: {
      id: "pp-physio-2024",
      title: "Physiology Mid-Term 2024",
      isInteractive: true,
      timeLimitMin: 30,
      semesterId: sem1.id,
      moduleId: modPhysio.id,
    },
  });
  console.log("✅ 2 past papers");

  // Forums
  await prisma.forum.upsert({
    where: { id: "forum-global" },
    update: {},
    create: {
      id: "forum-global",
      name: "General Discussion",
      type: "GLOBAL",
      status: "OPEN",
      universityId: university.id,
    },
  });
  await prisma.forum.upsert({
    where: { id: "forum-sem1" },
    update: {},
    create: {
      id: "forum-sem1",
      name: "Year 1 – Semester 1",
      type: "SEMESTER",
      status: "OPEN",
      semesterId: sem1.id,
      universityId: university.id,
    },
  });
  console.log("✅ 2 forums (Global + Semester)");

  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────────────────");
  console.log("  University   : Cairo Medical University");
  console.log("  Years        : 2  |  Semesters  : 3");
  console.log("  Modules      : 2  |  Subjects   : 2");
  console.log("  Lectures     : 2  |  Flashcards : 5");
  console.log("  Questions    : 4  |  Past Papers: 2");
  console.log("  Forums       : 2  |  Rank tiers : 5");
  console.log("─────────────────────────────────────────");
  console.log("📌 Next step: make yourself SUPER_ADMIN");
  console.log("   pnpm db:studio");
  console.log("   → find your user → set role to SUPER_ADMIN");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
