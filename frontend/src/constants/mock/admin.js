export const adminKpis = [
  { label: "Total citizens", value: 12458, change: "+4.2%" },
  { label: "Active planners", value: 42, change: "+2" },
  { label: "Pending feedback", value: 17, change: "-5" },
  { label: "Policies monitored", value: 36, change: "+3" },
];

export const planners = [
  {
    id: "p1",
    email: "planner.north@hizbview.et",
    active: true,
    verified: true,
    createdAt: "2026-03-01",
  },
  {
    id: "p2",
    email: "planner.central@hizbview.et",
    active: true,
    verified: true,
    createdAt: "2026-03-12",
  },
  {
    id: "p3",
    email: "planner.east@hizbview.et",
    active: false,
    verified: true,
    createdAt: "2026-01-20",
  },
];

export const citizens = [
  {
    id: "u1",
    email: "amina@example.com",
    region: "Addis Ababa",
    active: true,
    verified: true,
    createdAt: "2026-01-04",
  },
  {
    id: "u2",
    email: "samuel@example.com",
    region: "Oromia",
    active: true,
    verified: true,
    createdAt: "2026-02-18",
  },
  {
    id: "u3",
    email: "lidia@example.com",
    region: "Amhara",
    active: false,
    verified: true,
    createdAt: "2026-02-22",
  },
  {
    id: "u4",
    email: "nahom@example.com",
    region: "Tigray",
    active: true,
    verified: false,
    createdAt: "2026-03-08",
  },
];

export const pendingFeedback = [
  {
    id: "f1",
    policyId: "clean-water-initiative",
    policyTitle: "Clean Water Initiative",
    userEmail: "amina@example.com",
    comment:
      "The distribution schedule is unclear and needs district-level visibility.",
    status: "pending review",
    createdAt: "2026-04-10 09:15",
  },
  {
    id: "f2",
    policyId: "digital-health-kiosks",
    policyTitle: "Digital Health Kiosks",
    userEmail: "samuel@example.com",
    comment:
      "Great concept, but maintenance ownership should be clearly defined.",
    status: "pending review",
    createdAt: "2026-04-11 14:42",
  },
  {
    id: "f3",
    policyId: "urban-tree-canopy",
    policyTitle: "Urban Tree Canopy Program",
    userEmail: "lidia@example.com",
    comment:
      "Please include drought-resistant native species and local nursery support.",
    status: "pending review",
    createdAt: "2026-04-12 18:03",
  },
];

export const analyticsSummary = [
  {
    policy: "Clean Water Initiative",
    votes: 2483,
    averageRating: 4.3,
    positive: 72,
    neutral: 20,
    negative: 8,
  },
  {
    policy: "Public Market Renovation",
    votes: 864,
    averageRating: 3.8,
    positive: 54,
    neutral: 31,
    negative: 15,
  },
  {
    policy: "School Meal Expansion",
    votes: 1740,
    averageRating: 4.5,
    positive: 79,
    neutral: 14,
    negative: 7,
  },
];

export const auditLogs = [
  {
    id: "a1",
    actor: "admin@hizbview.et",
    action: "Created planner account",
    target: "planner.central@hizbview.et",
    at: "2026-04-12 10:05",
  },
  {
    id: "a2",
    actor: "admin@hizbview.et",
    action: "Deactivated citizen",
    target: "lidia@example.com",
    at: "2026-04-12 11:19",
  },
  {
    id: "a3",
    actor: "admin@hizbview.et",
    action: "Queued feedback retry",
    target: "Feedback #f2",
    at: "2026-04-12 14:53",
  },
];
