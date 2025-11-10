// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

//interface for each cell in the game
interface CellState {
  value: number | null;
}
const cellData = new Map<string, CellState>();

//GamePlay perameters
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const GAMEPLAY_ZOOM_LEVEL = 19;
const CACHE_SPAWN_PROBABILITY = 0.1;
const INTERACTION_DISTANCE = 3;

/* 1) Created map html element for the site */
const mapElement = document.createElement("div");
mapElement.id = "map";
document.body.append(mapElement);

/* creating player UI and scoring */
const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
document.body.append(inventoryDiv);

//inventory state variable
let playerInventory: number | null = null;

//function for updating the player inventory UI
function updatePlayerUI() {
  if (playerInventory == null) {
    inventoryDiv.innerHTML = "Holding: Nothing";
  } else {
    inventoryDiv.innerHTML = `Holding: Token (Value ${playerInventory})`;
  }
}
updatePlayerUI();

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

/* 5) "funtion" to spawn in rectangles to the map */

/* loop to create more than one cell */
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    //spawning logic
    let initalValue: number | null = null;

    //seeing if the cell will spawn a token
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      const valueSituation = [i, j, "initialValue"].toString();
      initalValue = Math.floor(luck(valueSituation) * 10) + 1;
    }

    //creating a unique key for each cell for the interface

    const initialState: CellState = {
      value: initalValue,
    };
    const cellKey = `${i}, ${j}`;
    cellData.set(cellKey, initialState);

    //calculating the bounds
    const origin = CLASSROOM_LATLNG;
    const bounds = leaflet.latLngBounds([
      [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
      [
        origin.lat + (i + 1) * TILE_DEGREES,
        origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    const cellRect = leaflet.rectangle(bounds, {});
    cellRect.addTo(map);

    updateCellStyle(cellRect, initialState);

    //click handling
    cellRect.on("click", () => {
      const state = cellData.get(cellKey)!;

      //check interaction distance
      if (
        Math.abs(i) > INTERACTION_DISTANCE || Math.abs(j) > INTERACTION_DISTANCE
      ) {
        console.log("Too far");
        return;
      }

      if (playerInventory === null) {
        //picking up a token
        if (state.value !== null) {
          playerInventory! = state.value;
          state.value = null;
        }
      } else {
        //for crafting
        if (state.value !== null && state.value === playerInventory) {
          state.value *= 2;
          playerInventory = null;
        }
      }
      updatePlayerUI();
      updateCellStyle(cellRect, state);
    });
  }
}
//seperating the cell style into a function for better updates
function updateCellStyle(cellRect: leaflet.Rectangle, state: CellState) {
  if (state.value !== null) {
    cellRect.setStyle({
      color: "#00ff00",
      fillOpacity: 0.3,
    });
    cellRect.bindTooltip(`Value: ${state.value}`);
  } else {
    cellRect.setStyle({
      color: "#0000ff",
      fillOpacity: 0.05,
    });
    cellRect.unbindTooltip();
  }
}
