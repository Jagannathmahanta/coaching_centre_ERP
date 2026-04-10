// ─────────────────────────────────────────────────────────────
// examData.js  –  shared constants, helpers, demo seed data
// ─────────────────────────────────────────────────────────────

export const GRADE_COLOR = {
  "A+": "#10b981", A: "#10b981",
  "B+": "#6366f1", B:  "#6366f1",
  C:   "#f59e0b",  D:  "#f59e0b",
  F:   "#ef4444",
};

export function calcGrade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Demo Students ───────────────────────────────────────────
export const DEMO_STUDENTS = [
  { id: 101, name: "Rahul Kumar",  roll: "BCX001", class: "Class X",   password: "student123" },
  { id: 102, name: "Priya Nayak",  roll: "BCX002", class: "Class X",   password: "student123" },
  { id: 103, name: "Amit Sahoo",   roll: "BCX003", class: "Class IX",  password: "student123" },
  { id: 104, name: "Suman Behera", roll: "BCX004", class: "Class X",   password: "student123" },
  { id: 105, name: "Deepa Panda",  roll: "BCX005", class: "Class XII", password: "student123" },
];

// ─── Demo Exams ──────────────────────────────────────────────
export const DEMO_EXAMS = [
  {
    id: 1,
    title: "Mathematics Unit Test",
    subject: "Mathematics",
    class: "Class X",
    duration: 60,
    totalMarks: 50,
    passMark: 25,
    status: "published",
    startTime: "2026-03-01T09:00",
    endTime:   "2026-04-30T17:00",
    instructions:
      "1. All questions are compulsory.\n2. MCQ: 2 marks each, no negative marking.\n3. Subjective: show all working steps.",
    questions: [
      {
        id: 1, type: "mcq",
        text: "What is the value of √144?",
        options: ["10", "11", "12", "13"],
        correct: 2, marks: 2,
        explanation: "12 × 12 = 144, so √144 = 12",
      },
      {
        id: 2, type: "mcq",
        text: "If 2x + 5 = 15, what is x?",
        options: ["3", "4", "5", "6"],
        correct: 2, marks: 2,
        explanation: "2x = 10 → x = 5",
      },
      {
        id: 3, type: "mcq",
        text: "Sum of angles in a triangle:",
        options: ["90°", "180°", "270°", "360°"],
        correct: 1, marks: 2,
        explanation: "Always 180° in any triangle",
      },
      {
        id: 4, type: "mcq",
        text: "Which is a prime number?",
        options: ["9", "15", "17", "21"],
        correct: 2, marks: 2,
        explanation: "17 is divisible only by 1 and 17",
      },
      {
        id: 5, type: "mcq",
        text: "Area of circle with radius 7 cm (π = 22/7):",
        options: ["44 cm²", "154 cm²", "144 cm²", "196 cm²"],
        correct: 1, marks: 2,
        explanation: "π × r² = 22/7 × 49 = 154 cm²",
      },
      {
        id: 6, type: "subjective",
        text: "Solve: x² − 5x + 6 = 0. Show all steps.",
        marks: 10,
      },
      {
        id: 7, type: "subjective",
        text: "A train travels 360 km in 4 hours. Find its speed and how long it takes to travel 540 km.",
        marks: 8,
      },
      {
        id: 8, type: "subjective",
        text: "Prove that the diagonals of a rectangle are equal in length.",
        marks: 10,
      },
    ],
  },
  {
    id: 2,
    title: "Science Quick Test",
    subject: "Science",
    class: "Class IX",
    duration: 30,
    totalMarks: 20,
    passMark: 10,
    status: "published",
    startTime: "2026-03-01T10:00",
    endTime:   "2026-04-30T17:00",
    instructions:
      "1. All MCQ questions — no subjective.\n2. 2 marks each, no negative marking.\n3. Read carefully before selecting.",
    questions: [
      {
        id: 1, type: "mcq",
        text: "Which organelle is the 'powerhouse' of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"],
        correct: 2, marks: 2,
        explanation: "Mitochondria produces ATP (energy currency)",
      },
      {
        id: 2, type: "mcq",
        text: "Newton's second law: F = ?",
        options: ["ma", "mv", "m/a", "a/m"],
        correct: 0, marks: 2,
        explanation: "Force = mass × acceleration",
      },
      {
        id: 3, type: "mcq",
        text: "Chemical formula of water:",
        options: ["HO", "H2O", "H2O2", "HO2"],
        correct: 1, marks: 2,
        explanation: "2 hydrogen atoms + 1 oxygen atom = H₂O",
      },
      {
        id: 4, type: "mcq",
        text: "Light travels fastest through:",
        options: ["Water", "Glass", "Vacuum", "Air"],
        correct: 2, marks: 2,
        explanation: "Speed of light is ~3×10⁸ m/s in vacuum",
      },
      {
        id: 5, type: "mcq",
        text: "Photosynthesis produces:",
        options: ["CO₂ and water", "Glucose and O₂", "Only O₂", "Only glucose"],
        correct: 1, marks: 2,
        explanation: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂",
      },
      {
        id: 6, type: "mcq",
        text: "The SI unit of electric current is:",
        options: ["Volt", "Watt", "Ampere", "Ohm"],
        correct: 2, marks: 2,
        explanation: "Current is measured in Amperes (A)",
      },
      {
        id: 7, type: "mcq",
        text: "Which gas is most abundant in Earth's atmosphere?",
        options: ["Oxygen", "Carbon dioxide", "Argon", "Nitrogen"],
        correct: 3, marks: 2,
        explanation: "Nitrogen makes up ~78% of the atmosphere",
      },
      {
        id: 8, type: "mcq",
        text: "The process by which plants make food is called:",
        options: ["Respiration", "Digestion", "Photosynthesis", "Fermentation"],
        correct: 2, marks: 2,
        explanation: "Plants use sunlight + CO₂ + water to make glucose",
      },
      {
        id: 9, type: "mcq",
        text: "DNA stands for:",
        options: [
          "Deoxyribonucleic Acid",
          "Diribonucleic Acid",
          "Deoxyribose Nucleic Agent",
          "Dinucleic Acid",
        ],
        correct: 0, marks: 2,
        explanation: "DNA = Deoxyribonucleic Acid — carries genetic info",
      },
      {
        id: 10, type: "mcq",
        text: "The unit of force in SI system is:",
        options: ["Joule", "Newton", "Pascal", "Watt"],
        correct: 1, marks: 2,
        explanation: "Force is measured in Newtons (N = kg·m/s²)",
      },
    ],
  },
  {
    id: 3,
    title: "English Grammar Test",
    subject: "English",
    class: "Class XII",
    duration: 45,
    totalMarks: 30,
    passMark: 15,
    status: "published",
    startTime: "2026-03-01T11:00",
    endTime:   "2026-04-30T17:00",
    instructions:
      "1. Section A: MCQ (2 marks each).\n2. Section B: Subjective (marks as stated).\n3. Write neatly and clearly.",
    questions: [
      {
        id: 1, type: "mcq",
        text: "Choose the correct form: She ___ to school every day.",
        options: ["go", "goes", "going", "gone"],
        correct: 1, marks: 2,
        explanation: "Third person singular (She/He/It) takes 'goes'",
      },
      {
        id: 2, type: "mcq",
        text: "Identify the noun in: 'The dog ran quickly.'",
        options: ["ran", "quickly", "dog", "the"],
        correct: 2, marks: 2,
        explanation: "'Dog' is the noun — names a person/animal/thing",
      },
      {
        id: 3, type: "mcq",
        text: "Which is a synonym for 'happy'?",
        options: ["Sad", "Angry", "Joyful", "Tired"],
        correct: 2, marks: 2,
        explanation: "'Joyful' means the same as 'happy'",
      },
      {
        id: 4, type: "mcq",
        text: "The opposite of 'ancient' is:",
        options: ["Old", "Modern", "Antique", "Historical"],
        correct: 1, marks: 2,
        explanation: "Ancient = very old; Modern = recent/new",
      },
      {
        id: 5, type: "mcq",
        text: "Select the correct sentence:",
        options: [
          "He don't like mangoes.",
          "He doesn't likes mangoes.",
          "He doesn't like mangoes.",
          "He do not likes mangoes.",
        ],
        correct: 2, marks: 2,
        explanation: "Use 'doesn't' (does not) with he/she/it + base verb",
      },
      {
        id: 6, type: "subjective",
        text: "Write a short paragraph (5–7 sentences) on 'The Importance of Education'.",
        marks: 10,
      },
      {
        id: 7, type: "subjective",
        text: "Rewrite the following in passive voice: 'The teacher praised the student.'",
        marks: 5,
      },
      {
        id: 8, type: "subjective",
        text: "Explain the difference between 'their', 'there', and 'they're' with one example each.",
        marks: 5,
      },
    ],
  },
];

// ─── Demo Submissions (pre-seeded for leaderboard demo) ──────
export const DEMO_SUBMISSIONS = [
  {
    id: 1, examId: 1, studentId: 101,
    studentName: "Rahul Kumar", roll: "BCX001",
    submittedAt: "2026-03-28T09:52:00",
    timeTaken: 52,
    answers:    { 1: 2, 2: 2, 3: 1, 4: 2, 5: 1 },
    subAnswers: {
      6: "x² − 5x + 6 = 0\n(x−2)(x−3) = 0\nx = 2 or x = 3",
      7: "Speed = 360/4 = 90 km/h\nTime for 540 km = 540/90 = 6 hours",
      8: "Let ABCD be a rectangle.\nAC² = AB² + BC²  (Pythagoras)\nBD² = AB² + BC²\nTherefore AC = BD",
    },
    mcqScore: 10, subScore: 24, totalScore: 34, grade: "A+", rank: 1,
  },
  {
    id: 2, examId: 1, studentId: 102,
    studentName: "Priya Nayak", roll: "BCX002",
    submittedAt: "2026-03-28T09:58:00",
    timeTaken: 58,
    answers:    { 1: 2, 2: 2, 3: 1, 4: 0, 5: 1 },
    subAnswers: {
      6: "x = 2 and x = 3",
      7: "90 km/h and 6 hours",
      8: "",
    },
    mcqScore: 8, subScore: 18, totalScore: 26, grade: "B+", rank: 2,
  },
  {
    id: 3, examId: 1, studentId: 103,
    studentName: "Amit Sahoo", roll: "BCX003",
    submittedAt: "2026-03-28T09:45:00",
    timeTaken: 45,
    answers:    { 1: 2, 2: 1, 3: 1, 4: 2, 5: 3 },
    subAnswers: {
      6: "x = 2 or 3",
      7: "Speed = 90 km/h",
      8: "",
    },
    mcqScore: 6, subScore: 12, totalScore: 18, grade: "C", rank: 3,
  },
];
