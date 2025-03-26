import { Component, computed, effect, signal } from '@angular/core';
import { WeatherService } from '../../services/weather.service';
import { CommonModule } from '@angular/common';
import { format } from 'date-fns'; // ✅ Import date-fns for formatting
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-forecast',
  imports: [CommonModule, MapComponent],
  templateUrl: './forecast.component.html',
  styleUrl: './forecast.component.scss'
})
export class ForecastComponent {
  weatherData = signal<any>(null);

  weatherCodeMap: { [key: number]: string } = {
    0: "☀️ Clear sky",
    1: "🌤️ Mainly clear",
    2: "⛅ Partly cloudy",
    3: "☁️ Overcast",
    45: "🌫️ Fog",
    48: "🌫️ Depositing rime fog",
    51: "🌦️ Drizzle (light)",
    53: "🌦️ Drizzle (moderate)",
    55: "🌧️ Drizzle (dense)",
    56: "🌨️ Freezing Drizzle (light)",
    57: "🌨️ Freezing Drizzle (dense)",
    61: "🌧️ Rain (slight)",
    63: "🌧️ Rain (moderate)",
    65: "🌧️ Rain (heavy)",
    66: "❄️ Freezing Rain (light)",
    67: "❄️ Freezing Rain (heavy)",
    71: "🌨️ Snow (slight)",
    73: "🌨️ Snow (moderate)",
    75: "🌨️ Snow (heavy)",
    77: "❄️ Snow grains",
    80: "🌦️ Rain showers (slight)",
    81: "🌦️ Rain showers (moderate)",
    82: "🌧️ Rain showers (violent)",
    85: "❄️ Snow showers (slight)",
    86: "❄️ Snow showers (heavy)",
    95: "⛈️ Thunderstorm (moderate)",
    96: "⛈️ Thunderstorm (with slight hail)",
    99: "🌩️ Thunderstorm (with heavy hail)"
  };

  nowcast = computed(() => {
    if (!this.weatherData()) return null;
    const data = this.weatherData();
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      isDay: data.current.is_day ? "Day" : "Night",
      precipitation: data.current.precipitation,
      weathercode: this.weatherCodeMap[data.current.weathercode] || "Unknown",
      windSpeed: data.current.windspeed_10m,
      windDirection: this.getWindDirection(data.current.winddirection_10m),
      windGusts: data.current.windgusts_10m,
      rain: data.current.rain,
      showers: data.current.showers,
      snowfall: data.current.snowfall
    };
  });

  forecast = computed(() => {
    if (!this.weatherData()) return [];
    const data = this.weatherData();
  
    return data.daily.time.map((date: string, index: number) => ({
      date: format(new Date(date), "EEE, dd MMM"), // ✅ Format: "Wed, 27 Mar"
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      precipitation: data.daily.precipitation_sum[index],
      weatherCode: this.weatherCodeMap[data.daily.weathercode[index]] || "Unknown"
    }));
  });

  hourlyForecast = computed(() => { 
    if (!this.weatherData()) return [];
    const data = this.weatherData();
    
    const now = new Date(); // ✅ Get current time
  
    return data.hourly.time
      .map((time: string, index: number) => {
        const forecastTime = new Date(time);
        if (forecastTime < now) return null; // ✅ Skip past hours
  
        return {
          time: format(forecastTime, "dd MMM, hh:mm a"), // ✅ Format: "26 Mar, 12:00 PM"
          temperature: data.hourly.temperature_2m[index],
          humidity: data.hourly.relative_humidity_2m[index],
          precipitation: data.hourly.precipitation[index],
          weatherCode: this.weatherCodeMap[data.hourly.weathercode[index]] || "Unknown",
          windSpeed: data.hourly.windspeed_10m[index],
          windGusts: data.hourly.windgusts_10m[index]
        };
      })
      .filter((entry: null) => entry !== null); // ✅ Remove past entries
  });

  constructor(private weatherService: WeatherService) {
    effect(() => {
      this.weatherData.set(this.weatherService.getWeatherData());
    });
  }

//   const satelliteLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
// const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

// const baseMaps = {
//   "Street Map": streetLayer,
//   "Satellite": satelliteLayer
// };

// L.control.layers(baseMaps).addTo(map);
  getWindDirection(degrees: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    const index = Math.round(degrees / 45);
    return directions[index];
  }
}
