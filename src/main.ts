// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function

//interface for each cell in the game
interface CellState {
  value: number | null;
}
const cellData = new Map<string, CellState>();

//GamePlay perameters
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const GAMEPLAY_ZOOM_LEVEL = 19;

/* 1) Created map html element for the site */
const mapElement = document.createElement("div");
mapElement.id = "map";
document.body.append(mapElement);

//class room log/lat for the map to reference
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

/* 2) initialized the map with class room location */
const map = leaflet.map(mapElement, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

/* 3) added the background image to the map */
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
})
  .addTo(map);

/* 4) creating the player on the map */
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!!");
playerMarker.addTo(map);

/* 5) funtion to spawn in rectangles to the map */

const cellStyle = {
  color: "#ff0000",
  weight: 2,
  fillOpacity: 0.1,
};

/* loop to create more than one cell */
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    //creating a unique key for each cell for the interface
    const cellKey = `${i}, ${j}`;
    const initialState: CellState = {
      value: null,
    };
    cellData.set(cellKey, initialState);

    const origin = CLASSROOM_LATLNG;
    const bounds = leaflet.latLngBounds([
      [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
      [
        origin.lat + (i + 1) * TILE_DEGREES,
        origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);
    const cellRect = leaflet.rectangle(bounds, cellStyle);
    cellRect.addTo(map);

    //click handling
    cellRect.on("click", () => {
      const state = cellData.get(cellKey);
      console.log(`Clicked cell: ${i}, ${j}, Value: ${state?.value}`);
    });
  }
}
