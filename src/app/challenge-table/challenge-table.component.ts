import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ChallengeTags, SeasonService} from '../data/season.service';
import {DxButtonModule, DxDataGridComponent, DxDataGridModule, DxPopupModule, DxTagBoxModule} from 'devextreme-angular';
import {CommonModule} from "@angular/common";
import {MatChipsModule} from "@angular/material/chips";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import ArrayStore from "devextreme/data/array_store";
import DevExpress from "devextreme";
import LoadOptions = DevExpress.data.LoadOptions;
import {
  CompletedChallenges,
  CompletedChallengesFilterOptions,
  defaultCompletedChallengesFilterOptions,
} from "../data/season-utils";
import {Stack} from "../utils/collections";
import {ColumnButtonClickEvent} from "devextreme/ui/data_grid";
import {CompletedStorageKey, LocalStorageService} from "../store/local-storage.service";
import {Subscription} from "rxjs";
import {GlobalOptionsComponent} from "./global-options/global-options.component";

@Component({
  selector: 'app-challenge-table',
  imports: [
    CommonModule,
    DxDataGridModule,
    DxTagBoxModule,
    MatChipsModule,
    MatIcon,
    MatIconButton,
    DxButtonModule,
    DxPopupModule,
    GlobalOptionsComponent
  ],
  templateUrl: './challenge-table.component.html',
  styleUrl: './challenge-table.component.scss',
  standalone: true
})
export class ChallengeTableComponent implements OnInit, OnDestroy {
  @ViewChild(DxDataGridComponent) challengeGrid!: DxDataGridComponent;
  protected readonly ChallengeTags: { text: string, value: string }[] = ChallengeTags.map(tag => ({ text: tag, value: tag }));

  @Input() completed: CompletedChallenges = new CompletedChallenges();
  @Output() completedChange = new EventEmitter<CompletedChallenges>();

  filterOptions: CompletedChallengesFilterOptions = defaultCompletedChallengesFilterOptions();

  data!: ArrayStore<GridChallenge, ChallengeId>;
  seasons!: { text: string, value: SeasonId }[];
  sections!: { text: string, value: SectionId }[];
  sessionOrderedCompletions = new Stack<Id>();

  private _subs = new Subscription();

  constructor(private readonly seasonService: SeasonService,
              private readonly localStorage: LocalStorageService) {
  }

  ngOnInit(): void {
    const storedProgress = this.localStorage.get(CompletedStorageKey);
    if (storedProgress) {
      this.completed = new CompletedChallenges(storedProgress);
    }

    this.seasons = this.seasonService.seasons.map(season => ({ text: season.name, value: season.id }));
    this.sections = this.seasonService.sections.map(section => ({ text: section.name, value: section.id }));
    this._subs.add(this.completedChange.subscribe(c =>
      this.localStorage.put(CompletedStorageKey, c)
    ));

    this.data = new ArrayStore<GridChallenge, ChallengeId>({
      data: this.seasonService.challenges,
      key: 'id',
      onLoading: (loadOptions: LoadOptions<GridChallenge>) => {
        const challFilter = this.completed.createDxFilter(this.seasonService, this.filterOptions);
        if (challFilter && 0 < challFilter.length) {
          if (loadOptions.filter) {
              loadOptions.filter = [
                loadOptions.filter,
                'and',
                challFilter
              ];
          } else {
            loadOptions.filter = challFilter;
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
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

  completeChallenge = (data: ColumnButtonClickEvent<GridChallenge, ChallengeId>) => {
    if (!data.row) {
      return;
    }

    this.complete(data.row.data.id);
  };

  completeGrouped(data: { value: Id }) {
    this.complete(data.value);
  }

  completeChallengeDblClick = (data: GridChallenge | { key: Id }) => {
    // Handles row and grouped row
    const id: Id = 'key' in data ? data.key : (data as GridChallenge).id;
    this.complete(id);
  }

  private complete(id: Id): void {
    this.completed.complete(id);
    this.completedChange.emit(this.completed);
    this.sessionOrderedCompletions.push(id);
    this.challengeGrid.instance.refresh();
  }

  undo(): void {
    if (this.sessionOrderedCompletions.isEmpty()) {
      return;
    }

    const id = this.sessionOrderedCompletions.pop();
    if (id) {
      this.completed.uncomplete(id);
      this.completedChange.emit(this.completed);
    }
    this.challengeGrid.instance.refresh();
  }
}
