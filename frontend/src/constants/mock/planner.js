export const plannerKpis = [
  { label: "My active policies", value: 6, change: "+1 this month" },
  { label: "Draft policies", value: 3, change: "2 ready to publish" },
  { label: "Total votes received", value: 7451, change: "+8.4%" },
  { label: "Average rating", value: 4.2, change: "Across all policies" },
];

export const plannerPolicies = [
  {
    id: "clean-water-initiative",
    title: "Clean Water Initiative",
    policyCode: "CLEAN123",
    status: "active",
    targetRegions: ["Addis Ababa", "Oromia"],
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    averageRating: 4.3,
    totalVotes: 2483,
    description:
      "Improve access to clean water through filtration hubs and monitoring committees.",
  },
  {
    id: "public-market-renovation",
    title: "Public Market Renovation",
    policyCode: "MKT204",
    status: "active",
    targetRegions: ["Addis Ababa"],
    startDate: "2026-04-20",
    endDate: "2026-07-15",
    averageRating: 3.8,
    totalVotes: 864,
    description:
      "Upgrade drainage, sanitation, and vendor stalls using phased construction.",
  },
  {
    id: "urban-tree-canopy",
    title: "Urban Tree Canopy Program",
    policyCode: "GREEN312",
    status: "draft",
    targetRegions: ["Dire Dawa"],
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    averageRating: 0,
    totalVotes: 0,
    description:
      "Expand tree coverage in urban corridors to reduce heat and improve air quality.",
  },
  {
    id: "school-meal-expansion",
    title: "School Meal Expansion",
    policyCode: "MEAL118",
    status: "closed",
    targetRegions: ["Tigray", "Amhara"],
    startDate: "2026-02-01",
    endDate: "2026-03-31",
    averageRating: 4.5,
    totalVotes: 1740,
    description:
      "Improve meal access for public primary schools in underserved districts.",
  },
];

export const plannerComments = [
  {
    id: "c1",
    policyId: "clean-water-initiative",
    policyTitle: "Clean Water Initiative",
    text: "Please include more neighborhood-level progress updates.",
    sentiment: "neutral",
    confidence: 0.73,
    createdAt: "2026-04-10 10:14",
  },
  {
    id: "c2",
    policyId: "public-market-renovation",
    policyTitle: "Public Market Renovation",
    text: "Strong policy, but displacement support should be clearer.",
    sentiment: "positive",
    confidence: 0.82,
    createdAt: "2026-04-11 13:37",
  },
  {
    id: "c3",
    policyId: "clean-water-initiative",
    policyTitle: "Clean Water Initiative",
    text: "Service points need better evening availability.",
    sentiment: "negative",
    confidence: 0.79,
    createdAt: "2026-04-11 17:21",
  },
];

export const plannerTrends = [
  { period: "W1", votes: 410 },
  { period: "W2", votes: 520 },
  { period: "W3", votes: 610 },
  { period: "W4", votes: 560 },
  { period: "W5", votes: 740 },
  { period: "W6", votes: 680 },
];
