import { Component, AfterViewInit, inject, signal, effect } from '@angular/core';
import * as L from 'leaflet'; // ✅ Import Leaflet
import { WeatherService } from '../../services/weather.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map; // Map instance
  mapCords = signal<any>(null); // ✅ Signal to store coordinates

  constructor(public weatherService: WeatherService) {
    // ✅ Use `effect()` inside the constructor (injection context)
    effect(() => {
      const weatherData = this.weatherService.weatherData();
      if (weatherData) {
        this.mapCords.set(weatherData); // ✅ Update signal reactively
        this.initMap(); // ✅ Initialize the map when data is available
      }
    });
  }

  ngAfterViewInit(): void {
    // ✅ Ensure the map initializes only if coordinates exist
    if (this.mapCords()) {
      this.initMap();
    }
  }

  private initMap(): void {
    if (!this.mapCords()) {
      console.warn("Map coordinates not available yet.");
      return;
    }
  
    console.log(this.mapCords());
  
    let lat = this.mapCords()?.latitude ?? 12.9716; // Default to Bangalore if null
    let lon = this.mapCords()?.longitude ?? 77.5946;
  
    if (this.map) {
      this.map.setView([lat, lon], 10);
    } else {
      this.map = L.map('map').setView([lat, lon], 10);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
    }
  
    // ✅ Remove previous markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });
  
    // ✅ Add a new marker at the updated location
    L.marker([lat, lon]).addTo(this.map)
      .bindPopup('📍 New Location')
      .openPopup();
  
  
    const lightningLayer = L.tileLayer(
      "https://tiles.lightningmaps.org/tiles/hrd/{z}/{x}/{y}.png?timestamp=" + Math.floor(Date.now() / 1000),
      {
        attribution: "Blitzortung.org",
        opacity: 0.8,
        zIndex: 10
      }
    );

    let satelliteLayer = L.tileLayer(
      "https://mausam.imd.gov.in/chennai/index_radar.php",
      { attribution: "RainViewer", opacity: 0.6 }
    );
    
    // ✅ Add Layer Controls
    const baseMaps = {};
    const overlayMaps = {
      "⚡ Live Lightning": lightningLayer,
      "☁️ Live Satellite Cloud": satelliteLayer
    };
  
    L.control.layers(baseMaps, overlayMaps).addTo(this.map);
  
    // ✅ Add Layers to the Map (Default Enabled)
    lightningLayer.addTo(this.map);
    satelliteLayer.addTo(this.map);
  }
  
  
  
  
  
  
}
