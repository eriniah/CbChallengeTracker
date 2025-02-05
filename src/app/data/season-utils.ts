import {SeasonService} from "./season.service";
import {range} from "../utils/collections";

const maxChallengesPerStage = 20;

const seasonIdRegex = /^(\d+)/;
const sectionIdRegex = /^(\d+\.\d+)/;
const stageIdRegex = /^(\d+\.\d+\.\d+)/;
const challengeIdRegex = /^(\d+\.\d+\.\d+\.\d+)/;
const idPartRegex  = /\d+/g;

export function seasonIdFrom(id: SectionId | StageId | ChallengeId): SeasonId {
  const match = id.match(seasonIdRegex);
  if (!match?.length) {
    throw new Error(`Invalid id ${id}`);
  }
  return +match[0] as SeasonId;
}

export function sectionIdFrom(id: StageId | ChallengeId): SectionId {
  const match = id.match(sectionIdRegex);
  if (!match || match.length === 0) {
    throw new Error(`Invalid id ${id}`);
  }
  return match[0] as SectionId;
}

export function stageIdFrom(id: ChallengeId): StageId {
  const match = id.match(stageIdRegex);
  if (!match || match.length === 0) {
    throw new Error(`Invalid id ${id}`);
  }
  return match[0] as StageId;
}

export function parseId(id: number | string): undefined | ( ['SEASON', SeasonId] | ['SECTION', SectionId] | ['STAGE', StageId] | ['CHALLENGE', ChallengeId] ) {
  if (typeof id === 'number') {
    return ['SEASON', +id];
  }

  const match = id.match(idPartRegex);
  if (!match) {
    return undefined
  }

  switch (match.length) {
    case 1:
      return ['SEASON', +id as SeasonId];
    case 2:
      return ['SECTION', id as SectionId]
    case 3:
      return ['STAGE', id as StageId];
    case 4:
      return ['CHALLENGE', id as ChallengeId];
    default:
    case 0:
      return undefined;
  }
}

export function isChildId(parentId: SeasonId | SectionId | StageId, childId: SectionId | StageId | ChallengeId): boolean {
  const pId = typeof parentId === 'number' ? `${parentId}` : parentId;
  return childId.startsWith(pId);
}

export function isInSeason(seasonIds: Set<SeasonId>, childId: SectionId | StageId | ChallengeId): boolean {
  return seasonIds.has(seasonIdFrom(childId));
}

export function isInSection(sectionIds: Set<SectionId>, childId: StageId | ChallengeId): boolean {
  return sectionIds.has(sectionIdFrom(childId));
}

export function isInStage(stageIds: Set<StageId>, childId: ChallengeId): boolean {
  return stageIds.has(stageIdFrom(childId));
}

export interface CompletedChallengesFilterOptions {
  challenges: 'all' | 'incomplete';
  stages: 'next' | 'incomplete';
}

export function defaultCompletedChallengesFilterOptions(): CompletedChallengesFilterOptions {
  return {
    challenges: 'incomplete',
    stages: 'next'
  }
}

export const completedChallengeCurrentVersion: CompletedChallengeVersion = 2;

export class CompletedChallengeException extends Error {
  constructor(
    public readonly version: CompletedChallengeVersion,
    message: string
    ) {
    super(message);
  }
}

export class CompletedChallenges {
  seasonIds: Set<SeasonId> = new Set<SeasonId>();
  sectionIds: Set<SectionId> = new Set<SectionId>();
  stageIds: Set<StageId> = new Set<StageId>();
  challengeIds: Set<ChallengeId> = new Set<ChallengeId>();

  constructor(data?: any) {
    if (data) {
      if (!data.v) {
        throw new CompletedChallengeException(1, "Pre-release data conversion not available");
      }

      this.seasonIds = new Set<SeasonId>(data.seasonIds);
      this.sectionIds = new Set<SectionId>(data.sectionIds);
      this.stageIds = new Set<StageId>(data.stageIds);
      this.challengeIds = new Set<ChallengeId>(data.challengeIds);
    }
  }

  isEmpty(): boolean {
    return this.seasonIds.size === 0
      && this.sectionIds.size === 0
      && this.stageIds.size === 0
      && this.challengeIds.size === 0;
  }

  complete(id: Id): void {
    const idd = parseId(id);
    if (!idd) {
      return;
    }

    switch (idd[0]) {
      case "SEASON":
        this.seasonIds.add(idd[1]);
        break;
      case "SECTION":
        this.sectionIds.add(idd[1]);
        break;
      case "STAGE":
        this.stageIds.add(idd[1]);
        break;
      case "CHALLENGE":
        this.challengeIds.add(idd[1]);
        break;
    }
  }

  uncomplete(id: Id): void {
    const idd = parseId(id);
    if (!idd) {
      return;
    }

    switch (idd[0]) {
      case "SEASON":
        this.seasonIds.delete(idd[1]);
        break;
      case "SECTION":
        this.sectionIds.delete(idd[1]);
        break;
      case "STAGE":
        this.stageIds.delete(idd[1]);
        break;
      case "CHALLENGE":
        this.challengeIds.delete(idd[1]);
        break;
    }
  }

  createDxFilter(seasonService: SeasonService, options: CompletedChallengesFilterOptions): any[] | undefined {
    const filters: any[] = [];

    const newIdFilter = (key: string, id: Id) => [key, '<>', id];

    if (options.challenges === 'all') {
      return [];
    }

    this.seasonIds.forEach(id => {
      filters.push(newIdFilter('seasonId', id), 'and');
    });
    this.sectionIds.forEach(id => {
      if (!isInSeason(this.seasonIds, id)) {
        filters.push(newIdFilter('sectionId', id), 'and');
      }
    });

    /* Two modes for stages
     * 1. Default only shows the current stage per section if the season/section isn't over
     * 2. All unfinished sections are shown
     */
    if (options.stages === 'next') {
      const stages: any[] = [];
      seasonService.seasons.forEach(season => {
        if (!this.seasonIds.has(season.id)) {
          season.sections.filter(section => {
            if (!section.requiredStage?.stages || section.requiredStage.stages.length === 0) {
              return true;
            }

            const requiredStages: Stage[] = section.requiredStage.stages
              .map(id => seasonService.getStage(id))
              .filter(v => v !== undefined) as Stage[];

            if (requiredStages.length === 0) {
              return true;
            }

            switch (section.requiredStage.operator) {
              case "single":
                return this.isStageComplete(requiredStages[0]);
              case "and":
                return requiredStages.reduce((prev, curr) => prev && this.isStageComplete(curr), true);
              case "or":
                // Spelled out cause we had some debugging issues
                let temp = false;
                temp = temp || requiredStages.length === 0;
                temp = temp || requiredStages.reduce((prev, curr) => {
                  const comp = this.isStageComplete(curr)
                  return prev || comp;
                }, false);
                return temp;
              default:
                console.log('Section has unhandled rules. Defaulting to show ', section);
                return true;
            }
          }).forEach(section => {
            if (!this.sectionIds.has(section.id)) {
              const stage = section.stages.find(stage => !this.isStageComplete(stage));
              if (stage) {
                stages.push(['stageId', '=', stage.id], 'or');
              }
            }
          });
        }
      });
      stages.pop();
      filters.push(stages);
      filters.push('and');
    } else {
      this.stageIds.forEach(id => {
        if (!isInSeason(this.seasonIds, id) && !isInSection(this.sectionIds, id)) {
          filters.push(newIdFilter('stageId', id), 'and');
        }
      });
    }

    this.challengeIds.forEach(id => {
      if (!isInSeason(this.seasonIds, id) && !isInSection(this.sectionIds, id) && !isInStage(this.stageIds, id)) {
        filters.push(newIdFilter('id', id), 'and');
      }
    });

    if (1 < filters.length) {
      filters.pop();
    }

    return filters;
  }

  private isStageComplete(stage: Stage): boolean {
    return this.seasonIds.has(seasonIdFrom(stage.id))
      || this.sectionIds.has(sectionIdFrom(stage.id))
      || this.stageIds.has(stage.id)
      || stage.required <= stage.challenges.filter(challenge => this.challengeIds.has(challenge.id)).length;
  }

  toJSON(): object {
    return {
      v: completedChallengeCurrentVersion,
      seasonIds: Array.from(this.seasonIds.values()),
      sectionIds: Array.from(this.sectionIds.values()),
      stageIds: Array.from(this.stageIds.values()),
      challengeIds: Array.from(this.challengeIds.values())
    };
  }

  completedStageChallengeIds(stageId: StageId): ChallengeId[] {
    // Quicker than searching entire challenge list.
    // Generate ids for challenges 1-20 in stage (no stage has more than 20 challenges in the game)
    // return challenge ids that are found in set
    return range(1, maxChallengesPerStage + 1)
      .map(n => `${stageId}.${n}` as ChallengeId)
      .filter(cId => this.challengeIds.has(cId));
  }

}

export function isTypeSectionRequiredStages(value: StageId | SectionRequiredStages): value is SectionRequiredStages {
  return typeof value === 'object'
    && "operator" in value
    && "stages" in value;
}
