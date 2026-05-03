// ─── Health tier thresholds ───────────────────────────────────────────────────
export const HEALTH_CRITICAL_MAX = 30   // < 30  → critical
export const HEALTH_WARNING_MAX  = 60   // 30–59 → warning
                                        // ≥ 60  → healthy

export const BRAND_CANONICAL_NAME = "Hada Market"

// ─── Next-Best-Action definitions (static content) ───────────────────────────
export const NBA_ACTIONS = [
  {
    id:       "nba-name",
    priority: 1,
    label:    "Priority 1 — Immediate",
    title:    "Fix Brand Name Inconsistencies",
    body:     "Several listings use variants like \"Hada\", \"Hada Mart\" or \"Hada Supermarket\". Google treats each variant as a separate entity, destroying local-pack ranking and brand authority.",
    actions:  [
      "Standardise all GBP names to: Hada Market",
      "Enable GBP profile lock to prevent 3rd-party edits",
      "Submit bulk edits via Google Business Manager",
      "Verify name propagation across every listing",
    ],
    filterKey: "nameIssues" as const,
  },
  {
    id:       "nba-web",
    priority: 1,
    label:    "Priority 1 — Immediate",
    title:    "Add Missing Websites & Phones",
    body:     "5 locations have no website URL and 2 have no phone number. These are top-3 GBP ranking signals — their absence causes customers to choose competitors shown above in Maps results.",
    actions:  [
      "Add website URL (or city landing page) to the 5 missing listings",
      "Add verified phone numbers (+84) to the 2 missing listings",
      "Confirm all URLs are mobile-responsive",
      "Set UTM parameters for traffic attribution per city",
    ],
    filterKey: "missingWeb" as const,
  },
  {
    id:       "nba-reviews",
    priority: 2,
    label:    "Priority 2 — This Week",
    title:    "Respond to Unanswered Reviews",
    body:     "Average response rate is 38% — well below the 80%+ target. Google rewards consistent response behaviour with higher local-pack visibility.",
    actions:  [
      "Reply to all unanswered 1-star & 2-star reviews within 24 h",
      "Set up a review-response template for common themes",
      "Schedule weekly review-monitoring across all listings",
    ],
    filterKey: "lowResponse" as const,
  },
  {
    id:       "nba-content",
    priority: 2,
    label:    "Priority 2 — This Week",
    title:    "Add Photos & Descriptions",
    body:     "7 locations have no business description and 6 have fewer than 5 photos. Rich media directly increases click-through-rate from Maps by up to 35%.",
    actions:  [
      "Write a 150-word description for each of the 7 missing listings",
      "Upload ≥ 10 photos per location (interior, exterior, products)",
      "Add Google Posts to boost freshness signals",
    ],
    filterKey: "missingContent" as const,
  },
] as const
