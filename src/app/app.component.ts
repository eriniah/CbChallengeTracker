import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatIcon, MatIconRegistry} from "@angular/material/icon";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIcon],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'CbChallengeTracker';

  constructor(private readonly iconReg: MatIconRegistry) {
    console.log(iconReg.getDefaultFontSetClass());

  }

}
