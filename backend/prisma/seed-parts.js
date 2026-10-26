// Run after seed.js:  node prisma/seed-parts.js   (idempotent)
// Groups template sections 9-25 into submission "parts" and adds the keywords used by the
// automatic relevance check. Edit the lists below to match your institutional template.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PARTS = [
  { number: 1, name: "Teaching Material", description: "Notes, teaching plan and attendance", sections: [9, 10, 11] },
  { number: 2, name: "Assignments, Tutorials and Labs", description: "Assignments, solutions and practical records", sections: [12, 13, 17] },
  { number: 3, name: "Internal Assessment", description: "Question papers, answer scripts and marks", sections: [14, 15, 16] },
  { number: 4, name: "Student Performance and Feedback", description: "Performance analysis, remedial work and feedback", sections: [18, 19, 20] },
  { number: 5, name: "Outcome Attainment and Examinations", description: "CO attainment, CO mapping of papers, previous papers", sections: [21, 22, 23] },
  { number: 6, name: "Completion and Supporting Documents", description: "Course completion report and extras", sections: [24, 25] },
];

const KEYWORDS = {
  9: ["lecture", "notes", "unit", "module", "slides", "topic"],
  10: ["lecture", "teaching plan", "week", "schedule", "planned", "topic", "session"],
  11: ["attendance", "present", "absent", "roll no", "enrollment", "percentage"],
  12: ["assignment", "question", "submit", "due date", "marks", "problem"],
  13: ["assignment", "solution", "answer", "solved", "ans."],
  14: ["question paper", "internal", "mid", "quiz", "marks", "time allowed", "attempt"],
  15: ["answer script", "answer sheet", "evaluated", "marks awarded", "scored"],
  16: ["internal marks", "marks", "roll no", "total", "obtained", "assessment"],
  17: ["tutorial", "laboratory", "lab", "experiment", "practical", "aim", "procedure"],
  18: ["performance", "analysis", "pass percentage", "average", "topper", "distribution", "grade"],
  19: ["remedial", "weak students", "slow learners", "extra class", "doubt", "improvement"],
  20: ["feedback", "survey", "rating", "students responded", "questionnaire"],
  21: ["attainment", "co1", "co2", "co3", "target", "threshold", "achieved"],
  22: ["question paper", "co mapping", "co1", "co2", "bloom", "marks", "mapped"],
  23: ["previous", "examination", "end semester", "question paper", "university exam", "year"],
  24: ["course completion", "syllabus covered", "completed", "report", "outcomes achieved", "summary"],
  25: ["supporting", "additional", "certificate", "reference", "appendix"],
};

async function main() {
  const template = await prisma.courseFileTemplate.findFirst({ where: { isActive: true }, orderBy: { id: "desc" } });
  if (!template) throw new Error("No active template. Run prisma/seed.js first.");

  for (const p of PARTS) {
    const part = await prisma.templatePart.upsert({
      where: { templateId_number: { templateId: template.id, number: p.number } },
      update: { name: p.name, description: p.description },
      create: { templateId: template.id, number: p.number, name: p.name, description: p.description },
    });
    await prisma.templateSection.updateMany({
      where: { templateId: template.id, number: { in: p.sections } },
      data: { partId: part.id },
    });
  }

  for (const [number, keywords] of Object.entries(KEYWORDS)) {
    await prisma.templateSection.updateMany({ where: { templateId: template.id, number: Number(number) }, data: { keywords } });
  }
  // The sample submissions from seed.js have no real file behind them; mark them as checked
  // so the UI does not wait on a relevance check that will never run.
  await prisma.documentSubmission.updateMany({
    where: { validationStatus: "NOT_CHECKED", storagePath: { startsWith: "seed/" } },
    data: { validationStatus: "VALID", validationMessage: "Sample seed data" },
  });
  console.log("Parts and keywords seeded.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
