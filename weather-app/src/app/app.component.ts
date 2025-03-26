import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ForecastComponent } from './components/forecast/forecast.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent,ForecastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'weather-app';
}
