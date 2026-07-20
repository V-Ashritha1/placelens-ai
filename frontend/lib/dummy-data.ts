export const currentUser = {
  name: "Ananya Rao",
  email: "ananya.rao@example.com",
  role: "Frontend Engineer",
  location: "Bengaluru, IN",
  avatarInitials: "AR",
  plan: "Pro",
  memberSince: "Feb 2025",
};

export const dashboardStats = [
  { label: "Resumes analyzed", value: "12", delta: "+3 this week" },
  { label: "Avg. ATS score", value: "78%", delta: "+6% vs last month" },
  { label: "JD matches run", value: "34", delta: "+9 this week" },
  { label: "Eligible roles found", value: "21", delta: "+4 this week" },
];

export const recentActivity = [
  {
    id: "a1",
    title: "Resume_Ananya_v4.pdf analyzed",
    detail: "ATS score improved to 82%",
    time: "2h ago",
    kind: "ats" as const,
  },
  {
    id: "a2",
    title: "Matched against Senior Frontend Engineer @ Stripe",
    detail: "Match score 88% — 3 missing keywords",
    time: "5h ago",
    kind: "match" as const,
  },
  {
    id: "a3",
    title: "Skill gap analysis completed",
    detail: "GraphQL and Testing flagged as growth areas",
    time: "Yesterday",
    kind: "skill" as const,
  },
  {
    id: "a4",
    title: "Eligibility check: Staff Engineer @ Vercel",
    detail: "Eligible — meets 9 of 10 requirements",
    time: "2 days ago",
    kind: "eligibility" as const,
  },
];

export const resumeFiles = [
  {
    id: "r1",
    name: "Resume_Ananya_v4.pdf",
    size: "184 KB",
    uploaded: "2 hours ago",
    status: "Analyzed" as const,
    score: 82,
  },
  {
    id: "r2",
    name: "Resume_Ananya_v3.pdf",
    size: "176 KB",
    uploaded: "1 week ago",
    status: "Analyzed" as const,
    score: 74,
  },
  {
    id: "r3",
    name: "Resume_Ananya_frontend_focused.pdf",
    size: "192 KB",
    uploaded: "3 weeks ago",
    status: "Analyzed" as const,
    score: 69,
  },
];

export const atsReport = {
  fileName: "Resume_Ananya_v4.pdf",
  overallScore: 82,
  scannedOn: "July 12, 2026",
  sections: [
    { label: "Formatting & Parseability", score: 91 },
    { label: "Keyword Match", score: 76 },
    { label: "Section Structure", score: 88 },
    { label: "Contact & Metadata", score: 100 },
    { label: "Action Verbs & Impact", score: 68 },
  ],
  issues: [
    {
      severity: "high" as const,
      title: "Missing quantifiable metrics",
      detail: "6 of 9 bullet points lack measurable outcomes (%, $, time saved).",
    },
    {
      severity: "medium" as const,
      title: "Inconsistent date formatting",
      detail: "Work history mixes 'Jan 2023' and '01/2023' formats.",
    },
    {
      severity: "medium" as const,
      title: "Missing keywords",
      detail: "'TypeScript', 'CI/CD', and 'design systems' appear in target JDs but not in your resume.",
    },
    {
      severity: "low" as const,
      title: "Long summary section",
      detail: "Professional summary runs 4 lines; recruiters scan the first 2.",
    },
  ],
  strengths: [
    "Clean single-column layout parses reliably in ATS systems",
    "Consistent use of strong action verbs like 'led', 'shipped', 'architected'",
    "Education and certifications section is well structured",
  ],
};

export const jdMatches = [
  {
    id: "jd1",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    location: "Remote",
    matchScore: 88,
    missingKeywords: ["GraphQL", "Testing (Jest)", "Design Systems"],
    matchedKeywords: ["React", "TypeScript", "Next.js", "Performance", "Accessibility"],
  },
  {
    id: "jd2",
    role: "Staff Software Engineer",
    company: "Vercel",
    location: "Remote — US/EU",
    matchScore: 74,
    missingKeywords: ["Rust", "Edge Functions", "Mentorship"],
    matchedKeywords: ["Next.js", "React", "Performance", "Web Vitals"],
  },
  {
    id: "jd3",
    role: "Frontend Engineer II",
    company: "Linear",
    location: "Remote",
    matchScore: 91,
    missingKeywords: ["Local-first sync"],
    matchedKeywords: ["React", "TypeScript", "Design Systems", "Animation", "Performance"],
  },
  {
    id: "jd4",
    role: "Product Engineer",
    company: "Notion",
    location: "San Francisco, CA",
    matchScore: 65,
    missingKeywords: ["Collaborative editing", "CRDTs", "Node.js"],
    matchedKeywords: ["React", "TypeScript", "Product sense"],
  },
];

export const skillGap = {
  targetRole: "Senior Frontend Engineer",
  overallReadiness: 79,
  categories: [
    {
      name: "Core Frontend",
      skills: [
        { name: "React", level: 92, required: 85 },
        { name: "TypeScript", level: 88, required: 85 },
        { name: "CSS / Tailwind", level: 90, required: 75 },
      ],
    },
    {
      name: "Engineering Practices",
      skills: [
        { name: "Testing (Jest/RTL)", level: 55, required: 80 },
        { name: "CI/CD", level: 60, required: 70 },
        { name: "Design Systems", level: 65, required: 75 },
      ],
    },
    {
      name: "Growth Areas",
      skills: [
        { name: "GraphQL", level: 40, required: 70 },
        { name: "Web Performance", level: 78, required: 75 },
        { name: "Accessibility (a11y)", level: 70, required: 70 },
      ],
    },
  ],
  recommendations: [
    "Complete a testing-focused project using Jest and React Testing Library to close the largest gap.",
    "Contribute to or build a small design system to strengthen the Design Systems score.",
    "Take a short GraphQL course and apply it in a side project — currently your lowest-scoring skill.",
  ],
};

export const eligibilityChecks = [
  {
    id: "e1",
    role: "Staff Engineer",
    company: "Vercel",
    result: "eligible" as const,
    metRequirements: 9,
    totalRequirements: 10,
    requirements: [
      { label: "5+ years frontend experience", met: true },
      { label: "Production React & TypeScript experience", met: true },
      { label: "Experience mentoring engineers", met: true },
      { label: "Open source contributions", met: true },
      { label: "Experience with edge/serverless runtimes", met: false },
    ],
  },
  {
    id: "e2",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    result: "eligible" as const,
    metRequirements: 8,
    totalRequirements: 8,
    requirements: [
      { label: "4+ years frontend experience", met: true },
      { label: "Experience with design systems", met: true },
      { label: "Strong testing practices", met: true },
      { label: "Payments or fintech exposure", met: true },
    ],
  },
  {
    id: "e3",
    role: "Engineering Manager",
    company: "Figma",
    result: "not-eligible" as const,
    metRequirements: 4,
    totalRequirements: 9,
    requirements: [
      { label: "3+ years people management", met: false },
      { label: "Track record hiring & growing teams", met: false },
      { label: "Strong frontend background", met: true },
      { label: "Cross-functional stakeholder management", met: true },
    ],
  },
];

export const profileSkills = [
  "React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL (basic)",
  "Node.js", "Jest", "Figma", "Web Performance", "Accessibility",
];

export const profileExperience = [
  {
    id: "x1",
    title: "Frontend Engineer",
    company: "Zenith Labs",
    period: "2023 — Present",
    description: "Leading the design system and performance initiatives for a B2B analytics platform.",
  },
  {
    id: "x2",
    title: "Software Engineer",
    company: "Northwind Retail",
    period: "2021 — 2023",
    description: "Built customer-facing checkout and search experiences serving 2M+ monthly users.",
  },
];
