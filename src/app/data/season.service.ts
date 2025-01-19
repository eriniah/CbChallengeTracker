import { Injectable } from '@angular/core';
import seasonsJson from '../../data/challenges.json';


export const ChallengeTags = [
  'Siege',
  'Field',
  'Bandit Raid',
  'Open World',
  'Expedition',
  'Territory Wars',
  'Ranked',
  'Free Battles',
  'Deathmatch',
  'General'
];

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  public readonly seasons: Season[] = [];
  public readonly sections: Section[] = [];
  public readonly stages: Stage[] = [];
  public readonly challenges: GridChallenge[] = [];

  private readonly _seasonMap = new Map<SeasonId, Season>();
  private readonly _sectionMap = new Map<SectionId, Section>();
  private readonly _stageMap = new Map<StageId, Stage>();
  private readonly _challengeMap = new Map<ChallengeId, GridChallenge>();

  constructor() {
    (seasonsJson as Season[]).forEach(season => {
      this._seasonMap.set(season.id, season);

      season.sections.forEach(section => {
        this._sectionMap.set(section.id, section);
        this.sections.push(section);

        section.stages.flatMap(stage => {
          this._stageMap.set(stage.id, stage);
          this.stages.push(stage);

          stage.challenges.forEach(challenge => {
            this._challengeMap.set(challenge.id, {...challenge,
              seasonId: season.id,
              sectionId: section.id,
              stageId: stage.id,
            });
          });
        });
      });
    });

    this.seasons = Array.from(this._seasonMap.values());
    this.sections = Array.from(this._sectionMap.values());
    this.stages = Array.from(this._stageMap.values());
    this.challenges = Array.from(this._challengeMap.values());
  }

  getSeason(seasonId: SeasonId): Season | undefined {
    return this._seasonMap.get(seasonId);
  }

  getSection(sectionId: SectionId): Section | undefined {
    return this._sectionMap.get(sectionId);
  }

  getStage(stageId: StageId): Stage | undefined {
    return this._stageMap.get(stageId);
  }

}
