// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function

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
  zoom: 17,
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
const mapCenter: leaflet.LatLngExpression = [36.9979, -122.057];
const TILE_DEGREES = 1e-4;

const cellBounds: leaflet.LatLngBoundsExpression = [
  [mapCenter[0], mapCenter[1]],
  [mapCenter[0] + TILE_DEGREES, mapCenter[1] + TILE_DEGREES],
];

const cellStyle = {
  color: "#ff0000",
  weight: 2,
  fillOpacity: 0.1,
};

const cellRectangle = leaflet.rectangle(cellBounds, cellStyle);
cellRectangle.addTo(map);
