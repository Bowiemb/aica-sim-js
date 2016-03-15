var sim;

function AICASim(j1, j2, h, r1, r2){
	this.j1 = j1;
	this.j2 = j2;
	this.h = h;
	this.r1 = r1;
	this.r2 = r2;

	this.CAsize = 30;

	this.canvas = document.getElementById("sim-canvas");
	this.context = this.canvas.getContext("2d");
	this.cellSize = 14;
	this.cellPadding = 1;
	this.cellColorOn = "#204883";
	this.cellColorOff = "#e1e7ed";
	this.CAbackground = "#ffffff";
	
	this.numUpdated = -1;

	// Initialize a 2D array that represents the cellular automaton
	this.initCA = function(){	
		this.CA = [];

		// Randomly fill the automaton with states of -1 or 1
		for(var i = 0; i < this.CAsize; i++){
			this.CA.push([]);
			for(var j = 0; j < this.CAsize; j++){
				if(Math.random() < 0.5)
					this.CA[i].push(-1);
				else
					this.CA[i].push(1);
			}
		}
	}

	// Initialize an array that holds any cells that have not yet been updated
	this.initUpdateList = function(){
		this.updateList = [];

		for(var i = 0; i < (this.CAsize * this.CAsize); i++){
			this.updateList.push(i);
		}
	}

	// Calculates the distance between two cells; since the automaton is a 
	// torus, the distance between two clelscan never be more than half the 
	// width or height
	this.calcDistance = function(x1, y1, x2, y2){
		var deltaX = Math.abs(x1 - x2);
		if(deltaX > (this.CAsize / 2))
			deltaX = this.CAsize - deltaX

		var deltaY = Math.abs(y1 - y2);
		if(deltaY > (this.CAsize / 2))
			deltaY = this.CAsize - deltaY

		return deltaX + deltaY;
	}

	// Update a single cell 
	this.updateCA = function(){

		// Randomly select a cell to update
		var randomIndex = Math.floor(Math.random() * this.updateList.length);
		var randomCell = this.updateList[randomIndex];

		// Get the cell's x and y position in the grid
		var x = Math.floor(randomCell / this.CAsize);
		var y = randomCell % this.CAsize;
		
		// For this cell, calculate the distance to every other cell
		var sumNear = 0;
		var sumFar = 0;
		for(var i = 0; i < this.CAsize; i++){
			for(var j = 0; j < this.CAsize; j++){

				// Avoid comparing the cell with itself
				if(i != x && j != y){
					var distance = this.calcDistance(x, y, i, j);
					
					// Sum the states of cells within a certain distance 
					// paremeter (R1) of this one
					if(distance < this.r1)
						sumNear += this.CA[i][j];
					
					// Likewise for cells between distances R1 and R2
					else if(distance >= r1 && distance < r2)
						sumFar += this.CA[i][j];
				}
			}
		}

		// Calculate the new value of the cell based on the signs of these summations
		var newState;
		if((this.h + (this.j1 * sumNear) + (this.j2 * sumFar)) >= 0)
			newState = 1;
		else
			newState = -1;
	
		// Update the cellular automaton array with the new state and paint the canvas
		if(newState != this.CA[x][y]){
			this.numUpdated++;
			this.CA[x][y] = newState;
			this.drawCell(x, y);
		}

		// Remove the selected cell from the update list
		this.updateList.splice(randomIndex, 1);
	}


	this.simulate = function(){
		this.initUpdateList();
		
		this.timer = setInterval(updateCallback, 12);
	}

	this.drawCell = function(i, j){
		if(this.CA[i][j] === 1)
			this.context.fillStyle = this.cellColorOn;
		else
			this.context.fillStyle = this.cellColorOff;

		this.context.fillRect(i * (this.cellSize + this.cellPadding),
				j * (this.cellSize + this.cellPadding),
				this.cellSize, 
				this.cellSize);
	}

	this.drawCA = function(){
		this.context.fillStyle = this.CAbackground;
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

		for(var i = 0; i < this.CAsize; i++){
			for(var j = 0; j < this.CAsize; j++){
				this.drawCell(i, j);
			}
		}
	}
}

function simulate(){	
	var j1 = parseFloat(document.getElementById("j1").value);
	var j2 = parseFloat(document.getElementById("j2").value);
	var h = parseFloat(document.getElementById("h").value);
	var r1 = parseFloat(document.getElementById("r1").value);
	var r2 = parseFloat(document.getElementById("r2").value);

	if(isNaN(j1) || isNaN(j2) || isNaN(h) || isNaN(r1) || isNaN(r2)){
		return;
	}

	sim  = new AICASim(j1, j2, h, r1, r2);
	sim.initCA();
	sim.drawCA();
	sim.simulate();
}

function updateCallback(){
	// If all cells have updated and the CA is stable, stop the simulation
	if(sim.numUpdated === 0 && sim.updateList.length === 0){
		clearInterval(sim.timer);
	}

	// If all cells have updated, but the CA is not stable, update all cells again
	else if(sim.updateList.length === 0){
		sim.numUpdated = 0;
		sim.initUpdateList();
		sim.updateCA();	
	}

	// If not all cells have finished updating, continue updating the remaining cells
	else{
		sim.updateCA();
	}
}

// Button controls
function decrement(input){
	var numinput = document.getElementById(input);
	var inputval = numinput.value;
	if(!isNaN(parseFloat(inputval))){
		numinput.value = parseFloat(inputval) - 1;
	}
	verify(input);
}

function increment(input){
	var numinput = document.getElementById(input);
	var inputval = numinput.value;
	if(!isNaN(parseFloat(inputval))){
		numinput.value = parseFloat(inputval) + 1;
	}
	verify(input);
}

function roundTo2(f){
	return (Math.round(f * 100) / 100);
}

// Check if a number is valid or not
function verify(input){
	var numinput = document.getElementById(input);
	var inputval = numinput.value;
	console.log(input);
	
	if(isNaN(parseFloat(inputval))){
		numinput.className = "num-input invalid-input";
	}
	else{
		if(input === "j1"){
			if(inputval >= 0 && inputval <= 1)
				numinput.className = "num-input valid-input";
			else
				numinput.className = "num-input invalid-input";
		}
		else if(input === "j2"){
			if(inputval >= -1 && inputval <= 0)
				numinput.className = "num-input valid-input";
			else
				numinput.className = "num-input invalid-input";
		}
		else if(input === "h"){
			numinput.className = "num-input valid-input";
		}
		else if(input === "r1"){
			if(inputval >= 0 && inputval <= 15)
				numinput.className = "num-input valid-input";
			else
				numinput.className = "num-input invalid-input";
			verify("r2");
		}
		else if(input === "r2"){
			if(inputval >= parseFloat(document.getElementById("r1").value) && inputval <= 15 && inputval >= 0)
				numinput.className = "num-input valid-input";
			else
				numinput.className = "num-input invalid-input";
		}
	}
	
	numinput.value = roundTo2(numinput.value);
}

function setParameters(j1, j2, h, r1, r2){
	document.getElementById("j1").value = j1;
	document.getElementById("j2").value = j2;
	document.getElementById("h").value = h;
	document.getElementById("r1").value = r1;
	document.getElementById("r2").value = r2;
	toggleHelp();
	simulate();
}

function toggleHelp(){
	var help = document.getElementById("help-menu");
	var button = document.getElementById("help");
	if(help.style.display === "none" || help.style.display === ""){
		help.style.display = "initial";
		button.className = "help-active";
	}
	else{
		help.style.display = "none";
		button.className = "";
	}
}
