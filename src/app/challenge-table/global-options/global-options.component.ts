import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CompletedChallenges, CompletedChallengesFilterOptions} from "../../data/season-utils";
import {
  DxButtonModule,
  DxDropDownBoxModule,
  DxFormModule,
  DxTextBoxComponent,
  DxTextBoxModule
} from "devextreme-angular";
import {MatButton} from "@angular/material/button";
import {CdkCopyToClipboard} from "@angular/cdk/clipboard";
import {CompletedStorageKey, LocalStorageService} from "../../store/local-storage.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {confirm} from "devextreme/ui/dialog";

@Component({
  selector: 'app-global-options',
  standalone: true,
  imports: [
    DxDropDownBoxModule,
    DxFormModule,
    DxButtonModule,
    MatButton,
    CdkCopyToClipboard,
    DxTextBoxModule
  ],
  templateUrl: './global-options.component.html',
  styleUrl: './global-options.component.scss'
})
export class GlobalOptionsComponent {
  @Input() options: undefined | CompletedChallengesFilterOptions;
  @Output() valueChanged = new EventEmitter<CompletedChallengesFilterOptions>();
  @Output() onImport = new EventEmitter<CompletedChallenges>();
  @Output() onReset = new EventEmitter<void>();

  challenges: { text: string, value: 'all' | 'incomplete' }[] = [
    {
      text: 'Show All',
      value: 'all'
    },
    {
      text: 'Show Incomplete',
      value: 'incomplete'
    },
  ];

  stages: { text: string, value: 'next' | 'incomplete' }[] = [
    {
      text: 'Only show current stage',
      value: 'next'
    },
    {
      text: 'Show all incomplete',
      value: 'incomplete'
    },
  ];

  importText!: string;

  constructor(private readonly localStorage: LocalStorageService,
              private readonly snackbar: MatSnackBar) {
  }

  onValueChanged = (): void => {
    this.valueChanged.emit(this.options);
  }

  getExportData(): string {
    return JSON.stringify(this.localStorage.get(CompletedStorageKey));
  }

  importData(importTextBox: DxTextBoxComponent): void {
    if (!this.importText) {
      return;
    }

    this.onImport.emit(new CompletedChallenges(JSON.parse(this.importText)));
    this.snackbar.open('Imported', undefined,  { duration: 2000 });

    importTextBox.instance.reset();
  }

  resetData(): void {
    confirm('Are you sure you want to reset all challenge data?', 'Reset?').then(yes => {
      if (yes) {
        this.onReset.emit();
      }
    });
  }

  notifyCopied(): void {
    this.snackbar.open('Copied', undefined,  { duration: 2000 });
  }

}
