import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CompletedChallengesFilterOptions} from "../../data/season-utils";
import {DxDropDownBoxModule, DxFormModule} from "devextreme-angular";

@Component({
  selector: 'app-global-options',
  standalone: true,
  imports: [
    DxDropDownBoxModule,
    DxFormModule
  ],
  templateUrl: './global-options.component.html',
  styleUrl: './global-options.component.scss'
})
export class GlobalOptionsComponent {
  @Input() options: undefined | CompletedChallengesFilterOptions;
  @Output() valueChanged = new EventEmitter<CompletedChallengesFilterOptions>();

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

  onValueChanged = (): void => {
    this.valueChanged.emit(this.options);
  }

}
