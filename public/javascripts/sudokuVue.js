let sudokuHighlightButtons =[{text: "None", link: "/highlight/0"}]
for(let index=1; index <=9; index++){
    sudokuHighlightButtons.push({text: index, link: "/highlight/"+index})
}

let sudokuHouses = [cells(0),cells(1),cells(2),cells(3),cells(4),cells(5),cells(6),cells(7),cells(8)]


function cells(house) {
    let sudokuCells = []
    for (let cell = 0; cell < 9; cell++) {
        sudokuCells.push({house: house, cell: cell, scalar: "scalar" + toScalar(house, cell)})
    }
    return sudokuCells
}


$(document).ready(function () {

    var sudokuVueMenu = new Vue({
        el: '#sudoku-vue-menu',
        data: {
            menuItems: sudokuHighlightButtons
        }
    })


    var sudokuGame = new Vue({
        el:'#sudoku-game'
    })

})



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

Vue.component('sudoku-highlight-button-bar', {
    template:`
        <div class="buttonbarcontainer">
            <label>
                Highlight
            </label>
            <div  class=" btn-group" >
                <a v-for="item in menuItems" v-bind:href="item.link" class="btn btn-primary"> {{item.text}} </a>
            </div>
        </div>
    `,
    data: function () {
        return {
            menuItems: sudokuHighlightButtons
        }
    }

})

Vue.component('sudoku-field', {
    template:`
        <div class="gamecontainer">
            <div class="game">
                <div v-for="house in houses" class="house size9">
                    <div v-for="cell in house" class="cell" v-bind:id="cell.scalar"></div>
                </div>
            </div>
        </div>
    `,
    data: function () {
        return {
            houses: sudokuHouses
        }
    },

})