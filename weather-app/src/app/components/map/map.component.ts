import { Component, AfterViewInit, signal, effect, OnInit } from '@angular/core';
import * as L from 'leaflet'; // ✅ Import Leaflet
import { WeatherService } from '../../services/weather.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private mapLayers: L.Layer[] = [];
  mapCords = signal<any>(null);

  constructor(public weatherService: WeatherService) {
    // ✅ Reactive Effect to update map when data changes
    effect(() => {
      const weatherData = this.weatherService.weatherData();
      if (weatherData) {
        this.mapCords.set(weatherData);
        this.initMap();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.mapCords()) {
      this.initMap();
    }
  }
  public layersControl!: L.Control.Layers;
  private async initMap(): Promise<void> {
    if (!this.mapCords()) {
      console.warn("Map coordinates not available yet.");
      return;
    }
  
    console.log(this.mapCords());
  
    let lat = this.mapCords()?.latitude ?? 12.9716;
    let lon = this.mapCords()?.longitude ?? 77.5946;
  
    if (this.map) {
      this.map.setView([lat, lon], 10);
    } else {
      this.map = L.map('map').setView([lat, lon], 10);
  
      L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps'
      }).addTo(this.map);
    }
    
    // ✅ Remove previous markers and layers
    this.map.eachLayer((layer) => {
      // Keep only the base tile layer
      if (!(layer instanceof L.TileLayer) || 
          layer?.options?.attribution !== '© Google Maps') {
        this.map.removeLayer(layer);
      }
    });
  
    // Clear the layers array
    this.mapLayers = [];
  
    // Remove existing layers control if it exists
    if (this.layersControl) {
      this.map.removeControl(this.layersControl);
    }
  
    // ✅ Add a new marker at the updated location
    L.marker([lat, lon]).addTo(this.map)
      .bindPopup('📍 New Location')
      .openPopup();
  
    // ✅ Create Lightning Layer
    const lightningLayer = L.tileLayer(
      "https://tiles.lightningmaps.org/tiles/hrd/{z}/{x}/{y}.png", {
        minZoom: 5,
        maxZoom: 12,
        bounds: L.latLngBounds([-90, -180], [90, 180]), // World bounds
      }
    );
    
    // Refresh every 30 seconds
    setInterval(() => {
      lightningLayer.setUrl(
        `https://tiles.lightningmaps.org/tiles/hrd/{z}/{x}/{y}.png?ts=${Date.now()}`
      );
    }, 30000);
    // ✅ Fetch Latest RainViewer Radar Data
    const radarData = await this.getLatestRadarFrame();
    if (!radarData) {
      console.warn("No radar data available.");
      return;
    }
    console.log("🌧 Radar Frame:", radarData);
  
    // ✅ Radar Layer Configurations
    const radarTileSize = 512;
    const radarColorScheme = 4;
    const radarSmoothData = 1;
    const radarSnowColors = 0;
    const radarExtension = "png";
  
    const radarLayerUrl = `https://tilecache.rainviewer.com${radarData.path}/${radarTileSize}/{z}/{x}/{y}/${radarColorScheme}/${radarSmoothData}_${radarSnowColors}.${radarExtension}`;
    console.log("☔ RainViewer Radar Tile URL:", radarLayerUrl);
  
    const radarLayer = L.tileLayer(radarLayerUrl, {
      attribution: "RainViewer",
      tileSize: 256,
      opacity: 1,
      zIndex: radarData.time,
    });
  
    // ✅ Fetch Latest Satellite Data
    const satelliteFrame = await this.getLatestSatelliteFrame();
    if (!satelliteFrame) {
      console.warn("No satellite data available.");
      return;
    }
    console.log("🌍 Satellite Frame:", satelliteFrame);
  
    // ✅ Satellite Layer Configurations
    const satelliteTileSize = 512;
    const satelliteColorScheme = 0;
    const satelliteSmoothData = 0;
    const satelliteSnowColors = 0;
    const satelliteExtension = "png";
  
    const satelliteLayerUrl = `https://tilecache.rainviewer.com${satelliteFrame.path}/${satelliteTileSize}/{z}/{x}/{y}/${satelliteColorScheme}/${satelliteSmoothData}_${satelliteSnowColors}.${satelliteExtension}`;
    console.log("🌩 RainViewer Tile URL:", satelliteLayerUrl);
  
    const satelliteLayer = L.tileLayer(satelliteLayerUrl, {
      attribution: "RainViewer",
      opacity: 0.6,
      tileSize: 256,
      zIndex: satelliteFrame.time,
      maxZoom: 10
    });
  
    // ✅ Store new layers for future removal
    this.mapLayers.push(lightningLayer, radarLayer, satelliteLayer);
  
    // ✅ Add Layer Controls
    const baseMaps = {};
    const overlayMaps = {
      "⚡ Live Lightning": lightningLayer,
      "🌧️ Live RainViewer Radar": radarLayer,
      "☁️ Live Satellite Cloud": satelliteLayer
    };
  
    // Add the new layers control
    this.layersControl = L.control.layers(baseMaps, overlayMaps).addTo(this.map);
  
    // ✅ Add Layers to the Map (Default Enabled)
    lightningLayer.addTo(this.map);
    radarLayer.addTo(this.map);
    satelliteLayer.addTo(this.map);
  }

  // ✅ Function to get the latest RainViewer radar timestamp
  async getLatestRadarFrame(): Promise<any> {
    try {
      const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await response.json();
      console.log(data)
  
      if (data.radar && data.radar.nowcast.length > 0) {
        return data.radar.nowcast[data.radar.nowcast.length - 1]; // Get the latest timestamp
      }
    } catch (error) {
      console.error("Error fetching RainViewer radar data:", error);
    }
    return null;
  }

  // ✅ Function to get the latest RainViewer satellite timestamp
  async getLatestSatelliteFrame(): Promise<any> {
    try {
      const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await response.json();
  
      if (data.satellite && data.satellite.infrared.length > 0) {
        return data.satellite.infrared[data.satellite.infrared.length - 1]; // Get the latest timestamp
      }
    } catch (error) {
      console.error("Error fetching RainViewer satellite data:", error);
    }
    return null;
  }
}
