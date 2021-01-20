let size = 9
let blocksize =3


function toScalar(house, cell) {
    return house*size + cell;
}

function row(scalar) {
    return (Math.floor((scalar % size) /blocksize)) + (blocksize * Math.floor((scalar /(size*blocksize))));
}

function col(scalar) {
    return (scalar %blocksize) + (blocksize *Math.floor((scalar/size))) - (size*Math.floor((scalar/(size*blocksize))));
}

function cell(houseIndex, cellIndex) {
    return row(toScalar(houseIndex,cellIndex)),col(toScalar(houseIndex,cellIndex))
}

class Grid {
    constructor(size){
        this.size = size;
        this.cellvalue = [];
        this.cellgiven = [];
        this.cellhighlighted = [];
        this.cellshowCandidates = [];
    }

    fill(json) {
        for (let scalar=0; scalar <this.size*this.size;scalar++) {
            this.cellvalue[scalar]=(json[toScalar(row(scalar),col(scalar))].cell.value);
            this.cellgiven[scalar]=(json[toScalar(row(scalar),col(scalar))].cell.given);
            this.cellhighlighted[scalar]=(json[toScalar(row(scalar),col(scalar))].cell.highlighted);
            this.cellshowCandidates[scalar]=(json[toScalar(row(scalar),col(scalar))].cell.showCandidates);
        }
    }
}

let grid = new Grid(9)

function updateGrid(grid) {
    for (let scalar=0; scalar <grid.size*grid.size;scalar++) {
        if (grid.cellvalue[scalar] != 0) {
            $("#scalar"+scalar).html(grid.cellvalue[scalar]);
        }
        if (grid.cellgiven[scalar] == true) {
            $("#scalar"+scalar).addClass("given");
        }
        if (grid.cellhighlighted[scalar] == true) {
            $("#scalar"+scalar).addClass("highlighted");
        }

    }
}

function showCandidates(scalar) {
    let html =""
    for (let candidateIndex=1; candidateIndex <= size;candidateIndex++) {
        html = html + " <div class='candidatecell' onclick='setCell("+scalar+","+candidateIndex+")'> " +candidateIndex + "</div>"
        if (candidateIndex % blocksize == blocksize) html = html + "<div class='clear'></div>"
    }
    $("#scalar"+scalar).html(html)
}

function setCell(scalar, value) {
    console.log("Setting cell " + scalar + " to " + value);
    grid.cellvalue[scalar] = value;
    $("#scalar"+scalar).html(" "+grid.cellvalue[scalar]);
    setCellOnServer(row(scalar), col(scalar), value)
    $("#scalar"+scalar).off("click");

}

function registerClickListener() {
    for (let scalar=0; scalar <grid.size*grid.size;scalar++) {
        if (grid.cellvalue[scalar] == 0) {
            $("#scalar"+scalar).click(function() {showCandidates(scalar)});
        }
    }
}

function setCellOnServer(row, col, value) {
    $.get("/set/"+row+"/"+col+"/"+value, function(data) {
        console.log("Set cell on Server");
    });
}

function loadJson() {
    $.ajax({
        method: "GET",
        url: "/json",
        dataType: "json",

        success: function (result) {
            grid = new Grid(result.grid.size);
            grid.fill(result.grid.cells);
            updateGrid(grid);
            registerClickListener();
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
        }

    };
}

$( document ).ready(function() {
    console.log( "Document is ready, filling grid" );
    loadJson();
    connectWebSocket()
});


