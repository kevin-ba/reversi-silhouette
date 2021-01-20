let size = 8

function cellType(value) {
    switch(value) {
        case 1: return "white";
        case 2: return "black";
        //case 3: return "candidate";
        default: return "notSet";
    }
}

function toScalar(house, cell) {
    return house*size + cell;
}

function row(scalar) {
    return Math.floor(scalar / size);
}

function col(scalar) {
    return Math.floor(scalar % size);
}

class Grid {
    constructor(size, activePlayer){
        this.size = size;
        this.cells = [];
        this.activePlayer = activePlayer;
    }

    fill(json) {
        for (let scalar=0; scalar <this.size*this.size;scalar++) {
            this.cells[scalar]=(json[toScalar(row(scalar),col(scalar))].cell);
        }
    }
}

let grid = new Grid(8)

function updateGrid(grid) {
    console.log("Update grid");
    for (let scalar=0; scalar <grid.size*grid.size;scalar++) {
            document.getElementById("scalar"+scalar).className = cellType(grid.cells[scalar]);
    }
}

function setCell(scalar, activePlayer) {
    if(grid.cells[scalar] == 3) {
        console.log("Setting cell " + scalar + " to " + activePlayer);
        grid.cells[scalar] = activePlayer;
        document.getElementById("scalar"+scalar).className = cellType(activePlayer);
        setCellOnServer(row(scalar), col(scalar))
        $("#scalar"+scalar).off("click");
    }
}

function registerClickListener() {
    for (let scalar=0; scalar <grid.size*grid.size;scalar++) {
        if (grid.cells[scalar] != 1 & grid.cells[scalar] != 2) {
            $("#scalar"+scalar).click(function() {setCell(scalar, grid.activePlayer)});
        }
    }
}

function registerMouseEnterListener() {
    for (let scalar = 0; scalar < grid.size * grid.size; scalar++) {
        if (grid.cells[scalar] != 1 & grid.cells[scalar] != 2) {
            $("#scalar"+scalar).on("mouseenter", function() {highlight(scalar)});
        }
    }
}

function registerMouseLeaveListener() {
    for (let scalar = 0; scalar < grid.size * grid.size; scalar++) {
        if (grid.cells[scalar] != 1 & grid.cells[scalar] != 2) {
            $("#scalar"+scalar).on("mouseleave", function() {unhighlight(scalar)});
        }
    }
}

function highlight(scalar) {
    if(grid.cells[scalar] == 3) {
        document.getElementById("scalar"+scalar).className = "candidate";
    } else {
        document.getElementById("scalar"+scalar).className = "nocandidate";
    }
}

function unhighlight(scalar) {
    document.getElementById("scalar"+scalar).className = cellType(grid.cells[scalar]);
}

function setCellOnServer(row, col) {
    $.get("/set/"+row+"/"+col, function(data) {
        console.log("Set cell on Server");
    });
}

function loadJson() {
    $.ajax({
        method: "GET",
        url: "/json",
        dataType: "json",

        success: function (result) {
            grid = new Grid(result.grid.size, result.grid.activePlayer);
            grid.fill(result.grid.cells);
            updateGrid(grid);
            registerClickListener();
            registerMouseEnterListener();
            registerMouseLeaveListener();
        }
    });
}

function connectWebSocket() {
    var websocket = new WebSocket("ws://localhost:9000/websocket");
    websocket.setTimeout

    websocket.onopen = function(event) {
        console.log("Connected to Websocket");
    }

    websocket.onclose = function () {
        console.log('Connection with Websocket Closed!');
    };

    websocket.onerror = function (error) {
        console.log('Error in Websocket Occured: ' + error);
    };

    websocket.onmessage = function (e) {
        if (typeof e.data === "string") {
            let json = JSON.parse(e.data);
            let cells = json.grid.cells;
            grid.fill(cells);
            updateGrid(grid);
            registerClickListener();
            registerMouseEnterListener();
            registerMouseLeaveListener();
        }

    };
}

$( document ).ready(function() {
    console.log( "Document is ready" );
    loadJson();
    connectWebSocket();
});
