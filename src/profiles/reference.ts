import type { Profile } from "@/schemas/profile";

export const conservativeProfile: Profile = {
  id: "ref-conservative",
  name: "Conservative Reference",
  type: "conservative",
  horizon: "long",
  maxPositionPct: 5,
  maxDrawdownPct: 10,
  weights: {
    contradiction: 0.9,
    concentration: 0.8,
    momentum: 0.2,
    behavioral: 0.6,
    forensic: 0.9,
  },
};

export const aggressiveProfile: Profile = {
  id: "ref-aggressive",
  name: "Aggressive Reference",
  type: "aggressive",
  horizon: "short",
  maxPositionPct: 25,
  maxDrawdownPct: 30,
  weights: {
    contradiction: 0.4,
    concentration: 0.3,
    momentum: 0.8,
    behavioral: 0.3,
    forensic: 0.5,
  },
};

export const referenceProfiles: ReadonlyArray<Profile> = [
  conservativeProfile,
  aggressiveProfile,
];
