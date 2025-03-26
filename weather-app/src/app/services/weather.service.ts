import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  weatherData = signal<any>(null);

  setWeatherData(data: any) {
    this.weatherData.set(data);
  }

  getWeatherData() {
    return this.weatherData();
  }
}
