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
let cellData = new Map<string, CellState>();

//new movement interface
interface MovementController {
  start(): void;
  stop(): void;
}

//GamePlay perameters
const TILE_DEGREES = 1e-4;
const GAMEPLAY_ZOOM_LEVEL = 19;
const CACHE_SPAWN_PROBABILITY = 0.1;
const INTERACTION_DISTANCE = 3;

//conversion function for Lat and Lng anchored to (0, 0)
function latlngToCell(latLng: leaflet.LatLng): { i: number; j: number } {
  const i = Math.floor(latLng.lat / TILE_DEGREES);
  const j = Math.floor(latLng.lng / TILE_DEGREES);
  return { i, j };
}

//conversion of cellID to its geographical latLngBounds
function cellToLatLngBounds(i: number, j: number): leaflet.LatLngBounds {
  const sw = leaflet.latLng(i * TILE_DEGREES, j * TILE_DEGREES);
  const ne = leaflet.latLng((i + 1) * TILE_DEGREES, (j + 1) * TILE_DEGREES);
  return leaflet.latLngBounds(sw, ne);
}

//Handling player movement
function movePlayer(latOffset: number, lngOffset: number) {
  const currentPos = playerMarker.getLatLng();

  const newPos = leaflet.latLng(
    currentPos.lat + latOffset,
    currentPos.lng + lngOffset,
  );

  //actually move the player and map when buttons are clicked
  playerMarker.setLatLng(newPos);
  map.panTo(newPos);
}

class ButtonMovementController implements MovementController {
  //stored references
  private northHandler = () => movePlayer(TILE_DEGREES, 0);
  private southHandler = () => movePlayer(-TILE_DEGREES, 0);
  private eastHandler = () => movePlayer(0, TILE_DEGREES);
  private westHandler = () => movePlayer(0, -TILE_DEGREES);

  start() {
    movementButtons.style.display = "block";

    //adding listeners
    btnNorth?.addEventListener("click", this.northHandler);
    btnSouth?.addEventListener("click", this.southHandler);
    btnEast?.addEventListener("click", this.eastHandler);
    btnWest?.addEventListener("click", this.westHandler);
  }

  stop() {
    movementButtons.style.display = "none";

    //Remove listeners
    btnNorth?.removeEventListener("click", this.northHandler);
    btnSouth?.removeEventListener("click", this.southHandler);
    btnEast?.removeEventListener("click", this.eastHandler);
    btnWest?.removeEventListener("click", this.westHandler);
  }
}

class GeolocationMovementController implements MovementController {
  private watchId: number | null = null;
  start() {
    //start watching the position
    this.watchId = navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      const newPos = leaflet.latLng(latitude, longitude);

      //move the player based on coords
      playerMarker.setLatLng(newPos);
      map.panTo(newPos);
    }, (error) => {
      console.error("Geolocation error: ", error);
      alert("unable to retrieve your location");
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
    });
  }

  stop() {
    //stop watching to save battery
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

/* 1) Created map html element for the site */
const mapElement = document.createElement("div");
mapElement.id = "map";
document.body.append(mapElement);

/* creating player UI and scoring */
const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
document.body.append(inventoryDiv);

/* Adding player movement buttons*/
const movementButtons = document.createElement("div");
movementButtons.id = "movement";
document.body.append(movementButtons);

/* adding a div to handle buttons that dont need to go away */
const permanentControlsDiv = document.createElement("div");
permanentControlsDiv.id = "perm-controls";
document.body.append(permanentControlsDiv);

movementButtons.innerHTML = `
  <button id="btn-north">North</button>
  <button id="btn-south">South</button>
  <button id="btn-east">East</button>
  <button id="btn-west">West</button>
`;

permanentControlsDiv.innerHTML = `
  <button id="btn-new-game" style="margin-top: 10px;">New Game</button>
  <button id="btn-sensor">Switch to GPS</button>
`;

//HTML references
const btnNorth = document.getElementById("btn-north");
const btnSouth = document.getElementById("btn-south");
const btnEast = document.getElementById("btn-east");
const btnWest = document.getElementById("btn-west");
const btnNewGame = document.getElementById("btn-new-game");
const btnSensor = document.getElementById("btn-sensor");

//inventory state variable
let playerInventory: number | null = null;

//class room log/lat for the map to reference
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

/* initialized the map with class room location */
const map = leaflet.map(mapElement, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
});

//creating a gridLayer for all the rects to be easily destoryed and added
const gridLayer = leaflet.layerGroup().addTo(map);

/* added the background image to the map */
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

btnSensor?.addEventListener("click", () => {
  activeController.stop();

  if (activeController === buttonController) {
    activeController = geoController;
    btnSensor.innerText = "Switch to Buttons";
  } else {
    activeController = buttonController;
    btnSensor.innerText = "Switch to GPS";
  }

  activeController.start();
});

btnNewGame?.addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to start a new game? All progress will be lost.",
    )
  ) {
    localStorage.removeItem("myGameSave");
    location.reload();
  }
});

/* IMPORTANT: ALL FUNCTIONS FOR GAME AFTER THIS POINT */
//
//

//function for updating the player inventory UI
function updatePlayerUI() {
  if (playerInventory == null) {
    inventoryDiv.innerHTML = "Holding: Nothing";
  } else {
    inventoryDiv.innerHTML = `Holding: Token (Value ${playerInventory})`;
  }
}

//function to load a games save data that will be used on opening the page
function loadGame() {
  const saveData = localStorage.getItem("myGameSave");

  //in the case that there is no save data
  if (saveData !== null) {
    const savedObject = JSON.parse(saveData);

    //restore game states
    playerInventory = savedObject.inventory;
    cellData = new Map<string, CellState>(savedObject.cells);

    console.log("Game loaded from save");
  } else {
    console.log("No Save file found");
  }
}

//function that saves the player inventory and the cells
function saveGame() {
  const serializableCells = [...cellData.entries()];
  const savedObject = {
    inventory: playerInventory,
    cells: serializableCells,
  };

  localStorage.setItem("myGameSave", JSON.stringify(savedObject));
}

/* 5) funtion to spawn in rectangles to the map */
function drawGrid() {
  //clearing all old rectangles and making this memoryless
  gridLayer.clearLayers();

  const bounds = map.getBounds();

  const sw = latlngToCell(bounds.getSouthWest());
  const ne = latlngToCell(bounds.getNorthEast());

  for (let i = sw.i; i <= ne.i; i++) {
    for (let j = sw.j; j <= ne.j; j++) {
      createCell(i, j);
    }
  }
}

//create cell function that will handle all this logic and interation of cells
function createCell(i: number, j: number) {
  const cellKey = `${i}, ${j}`;
  let state: CellState;

  if (cellData.has(cellKey)) {
    state = cellData.get(cellKey)!;
  } else {
    //handling initial value of the tokens in caches
    let initalValue: number | null = null;
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      const valueSituation = [i, j, "initialValue"].toString();
      initalValue = Math.floor(luck(valueSituation) * 10) + 1;
    }
    //no longer saving data into cellData because of flyweight pattern
    state = { value: initalValue };
  }

  //handle the drawing logic
  const cellBounds = cellToLatLngBounds(i, j);
  const cellRect = leaflet.rectangle(cellBounds, {});
  cellRect.addTo(gridLayer);
  updateCellStyle(cellRect, state);

  cellRect.on("click", () => {
    handleCellClick(i, j, cellRect, state);
  });
}

//function for handling all the clicks
function handleCellClick(
  i: number,
  j: number,
  cellRect: leaflet.Rectangle,
  state: CellState,
) {
  const cellKey = `${i}, ${j}`;

  //check interaction distance
  const playerLatLng = playerMarker.getLatLng();
  const playerCell = latlngToCell(playerLatLng);

  if (
    Math.abs(i - playerCell.i) > INTERACTION_DISTANCE ||
    Math.abs(j - playerCell.j) > INTERACTION_DISTANCE
  ) {
    console.log("Too far away!!");
    return;
  }

  if (playerInventory === null) {
    //picking up a token
    if (state.value !== null) {
      playerInventory = state.value;
      state.value = null;
      cellData.set(cellKey, state);
    }
  } else {
    //for crafting
    if (state.value !== null && state.value === playerInventory) {
      state.value *= 2;
      playerInventory = null;
      cellData.set(cellKey, state);

      //handle win condition
      if (state.value !== null && state.value >= 256) {
        alert(`You win!!`);
      }
    }
  }
  //update all the player ui
  updatePlayerUI();
  updateCellStyle(cellRect, state);
  saveGame();
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

//calling all important functions
loadGame();
updatePlayerUI();
map.on("moveend", drawGrid);
drawGrid();

//controller instances
const buttonController = new ButtonMovementController();
const geoController = new GeolocationMovementController();

let activeController: MovementController = buttonController;
activeController.start();
