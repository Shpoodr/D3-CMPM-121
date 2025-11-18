# Game Design Vision / Technologies

{a few-sentence description of the game mechanics}

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps.a

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
- [x] Lock the map view
- [x] Make cells clickable
- [x] Create a data model for each cell to store the state
- [x] Impliment the luck function to determine which cells have tokens
- [x] Create the player inventory and a ui element for the status
- [x] Click handlers on the cells
- [x] Add the interaction logic if in range of cell
  - [x] pickup logic/crafting logic then update visuals

## D3.b (player movement and global grid)

Major refactoring to be done in this step. These additions will change the static grid system that I have going currently
to a more global system that uses the whole planet not a set area. Also will be adding player movement.

### Steps.b

- [x] Unlock the map
- [x] Impliment a Grid Conversion function
- [x] Create a layer for the grid
- [x] Impliment the draw grid function to handle old recs and new recs
- [x] Create the moveend event
- [x] Clean up the code
- [x] Add player movement
- [x] Create/update the win condition

### Steps.c

Small amount of refactoring to be done. Making sure the memoryless implimentation no longer exists. Adding the FlyWeight/Memento Logic

- [x] Get rid of the memoryless implimentation (stop clearing grid)
- [x] Refactor createCell and handleCellClick

### Step.d

adding the ability to save game and add the facade game pattern and refactor the movement logic. Finally add the ability to toggle between UI

- [x] create a save game function
- [x] make sure save game is called for each game change
- [x] load the saved game when the link is opened
- [x] give option for a New game
- [] new movement interface
- [] refactor button logic to support the facade game pattern
- [] create the Geolocation logic
- [] impliment the switch to swap between movement logic
