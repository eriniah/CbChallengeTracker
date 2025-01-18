
type SeasonId = number;
type SectionId = `${SeasonId}.${number}`;
type StageId = `${SectionId}.${number}`;
type ChallengeId = `${StageId}.${number}`;

interface Season {
  id: SeasonId;
  name: string;
  sections: Section[];
}

interface Section {
  id: SectionId;
  name: string;
  stages: Stage[];
}

interface Stage {
  id: StageId;
  name: string;
  required: number;
  total: number;
  challenges: Challenge[];
  rewards: Reward[];
}

interface Challenge {
  id: ChallengeId;
  text: string;
  tags: ChallengeTag[];
  conditions: Condition[];
}

interface Condition {
  amount?: number;
  action: string;
}

interface Reward {
  amount?: number
  text: string;
}

type ChallengeTag = 'Siege' | 'Field' | 'Bandit Raid' | 'Open World' | 'Expedition' | 'Territory Wars' | 'Ranked' | 'Free Battles' | 'Deathmatch' | 'General';

interface GridChallenge extends Challenge {
  seasonId: SeasonId;
  sectionId: SectionId;
  stageId: StageId;
}
