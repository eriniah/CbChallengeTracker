import {Component, ViewChild} from '@angular/core';
import {ChallengeTags, SeasonService} from '../data/season.service';
import {DxButtonModule, DxDataGridComponent, DxDataGridModule, DxTagBoxModule} from 'devextreme-angular';
import {CommonModule} from "@angular/common";
import {MatChipsModule} from "@angular/material/chips";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";

@Component({
  selector: 'app-challenge-table',
  imports: [CommonModule, DxDataGridModule, DxTagBoxModule, MatChipsModule, MatIcon, MatIconButton, DxButtonModule],
  templateUrl: './challenge-table.component.html',
  styleUrl: './challenge-table.component.scss',
  standalone: true
})
export class ChallengeTableComponent {
  @ViewChild(DxDataGridComponent) challengeGrid!: DxDataGridComponent;
  protected readonly ChallengeTags: { text: string, value: string }[] = ChallengeTags.map(tag => ({ text: tag, value: tag }));

  data: GridChallenge[] = [];
  completedChallenges: ChallengeId[] = [];

  constructor(private readonly seasonService: SeasonService) {
    this.data = this.seasonService.challenges;
  }

  getSeason(seasonId: SeasonId): Season | undefined {
    return this.seasonService.getSeason(seasonId);
  }

  getSection(sectionId: SectionId): Section | undefined {
    return this.seasonService.getSection(sectionId);
  }

  getStage(stageId: StageId): Stage | undefined {
    return this.seasonService.getStage(stageId);
  }

  calculateTagsValue = (challenge: GridChallenge) => {
    return challenge.tags.join(',');
  }
  calculateTagsFilter = (value: string, operator: string, source: string) => {
    return ['tags', 'contains', value];
  };

}
