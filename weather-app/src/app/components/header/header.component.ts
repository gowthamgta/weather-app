import { CommonModule } from '@angular/common';
import { Component, Signal, signal, ViewEncapsulation, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { debounceTime } from 'rxjs';
import { WeatherService } from '../../services/weather.service';

interface City {
  name: string;
  country: string;
  state: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatAutocompleteModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule // Ensure this is included
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
  private http = inject(HttpClient);
  searchControl = new FormControl('');

  APIKEY = `1a44de2e60505e138ac76a85d650dafa`; // OpenWeather API Key
  APIURL = `http://api.openweathermap.org/geo/1.0/direct?q=`;

  cities = signal<City[]>([]);
  filteredCities = signal<City[]>([]);
  currentLocation = signal<string | null>(null);

  constructor(public weatherService: WeatherService) {
    this.getLocation();
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      if (value && value.length > 2) {
        this.fetchCities(value);
      } else {
        this.filteredCities.set([]);
      }
    });
  }

  fetchCities(searchText: string) {
    if (!searchText.trim()) return;

    const cityUrl = `${this.APIURL}${searchText}&limit=5&appid=${this.APIKEY}`;

    this.http.get<any[]>(cityUrl).subscribe(response => {
      const cityData: City[] = response.map(city => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon
      }));

      this.filteredCities.set(cityData);
    });
  }

  onCitySelected(event: any) {
    const selectedCity: City = event.option.value;
    console.log('Selected City:', selectedCity);

    if (selectedCity.lat && selectedCity.lon) {
      this.getWeatherForCity(selectedCity.lat, selectedCity.lon);
    }
  }

  // getWeatherForCity(lat: any, lon: any) {
  //   // https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto

  //   const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  //   this.http.get(apiUrl).subscribe(weatherData => {
  //     console.log('Weather Data:', weatherData);
  //     this.weatherService.setWeatherData(weatherData);
  //   });
  // }

  getWeatherForCity(lat: any, lon: any) {
   this.http.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,temperature_2m_max,is_day,precipitation,weathercode,windspeed_10m,winddirection_10m,windgusts_10m,rain,showers,snowfall',
        hourly: 'temperature_2m,relative_humidity_2m,temperature_2m_max,is_day,precipitation,weathercode,windspeed_10m,winddirection_10m,windgusts_10m,rain,showers,snowfall',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
        forecast_days: 14, // 14-day forecast
        timezone: 'auto',
      }
    }).subscribe((data) => {
      this.weatherService.setWeatherData(data); // Ensure setWeatherData() expects processed data
    });;
  }
  

  displayFn(city: City | null): string {
    return city ? `${city.name} (${city.country})` : '';
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
          this.getWeatherForCity(latitude, longitude);
          this.searchControl.setValue('');
        },
        (error) => {
          console.error("Error getting location", error);
          this.currentLocation.set("Location access denied");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      this.currentLocation.set("Geolocation not supported");
    }
  }

  
}
