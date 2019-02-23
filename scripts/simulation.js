var sim;

/*
 * AICASIM
 *    Inits an AICASimulator
 *
 *    Params: The high level parameters j1, j2, h, r1, and r1
 *
 */

var done;
var numExperiments = 0;

function isDone() {
 done = true;
}
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
  ////////////////////////////////
  //
  //
  //
  ////////////////////////////////


  this.doCalcs = function() {
    var data = [];
    var temp = [];
    temp.push("H(s)");
    var hs; 
    clearInterval(sim.timer);

    hs = this.calculateEntropy(); 
    temp.push(hs);
    data.push(temp);

    temp = this.calculateCorrelation();
    data.push(temp);

    temp = this.calcJointEntropyAndMutInfo(hs);
    data.push(temp[0]);
    data.push(temp[1]);

    this.download_csv(data);

  }

  this.download_csv = function(data) {
    var csv = 'Experiment,' + numExperiments + ',\n';
    data.forEach(function(row) {
      csv += row.join(',');
      csv += "\n";
    });

       var hiddenElement = document.createElement('a');
       hiddenElement.href = 'data:test/csv;charset=utf-8,' + encodeURI(csv);
       hiddenElement.target = '_blank';
       hiddenElement.download = 'experiment_data.csv';
       hiddenElement.click();

  }

  // For this cell, calculate the distance to every other cell
  this.calculateCorrelation = function(){ 
    var data = [];
    var numCells = this.CAsize * this.CAsize;
    for(var l = 0; l < 15; l++) {
      var firstTerm = 0;
      var secondTerm = 0;
      for (var i = 0; i < numCells; i++) {
        var currCell = i;
        var x = Math.floor(currCell / this.CAsize);
        var y = currCell % this.CAsize;
        secondTerm += this.CA[x][y];
        for (var j = i+1; j < numCells; j++){
          var nextCell = j;

          // Get the cell's x and y position in the grid
          var x2 = Math.floor(nextCell / this.CAsize);
          var y2 = nextCell % this.CAsize;

          var distance = this.calcDistance(x, y, x2, y2);

          if(distance == l)
            firstTerm += this.CA[x][y] * this.CA[x2][y2];
        }
        if (l > 0){
          var correlation = ( (2 / (30*30 * 4*l))*firstTerm ) - ( ( (1 / (30*30)) * secondTerm)*( (1 / (30*30)) * secondTerm) );
        }
        else {
          var correlation = 1 - ( ( (1 / (30*30)) * secondTerm)*( (1 / (30*30)) * secondTerm) );
        }
      }
        data.push(Math.abs(correlation));
    }
    return data;
  }

  this.calculateEntropy = function(){ 
    var beta = 0;
    var numCells = this.CAsize * this.CAsize;
    console.log(numCells);
    for (var i = 0; i < numCells; i++) {
      var currCell = i;
      var x = Math.floor(currCell / this.CAsize);
      var y = currCell % this.CAsize;
      beta += (this.CA[x][y] + 1) / 2;
      //console.log("beta: "  beta);
    }
    // Pr(+1) 
    var pp1 = (1/(30*30)) * beta;
    // Pr(-1)
    var pm1 = 1 - pp1;
    console.log(pp1);
    console.log(pm1);
    var entropy;
    if (pp1 == 0)
      entropy = -(Math.log(pm1));
    else if (pm1 == 0)
      entropy = -(Math.log(pp1));
    else
      entropy = -(pp1*(Math.log(pp1)) + (pm1*Math.log(pm1)));  

    console.log(entropy);
    return entropy;
  }

  this.calcJointEntropyAndMutInfo = function(hs){ 
    var data = [];
    var je = [];
    var mut_info = [];
    var numCells = this.CAsize * this.CAsize;
    for(var l = 0; l < 15; l++) {
      var sumNegBeta = 0;
      var sumPosBeta = 0;
      var Ppp;
      var Pmm;
      var Ppm;
      var mi;
      for (var i = 0; i < numCells; i++) {
        var currCell = this.updateList[i];
        var x = Math.floor(currCell / this.CAsize);
        var y = currCell % this.CAsize;
        for (var j = i+1; j < numCells; j++){
          var nextCell = this.updateList[j];

          // Get the cell's x and y position in the grid
          var x2 = Math.floor(nextCell / this.CAsize);
          var y2 = nextCell % this.CAsize;

          var distance = this.calcDistance(x, y, x2, y2);

          if(distance == l){
            var beta1 = (this.CA[x][y] + 1) / 2;
            var beta2 = (this.CA[x2][y2] + 1) / 2;
            sumPosBeta += beta1 * beta2;
            beta1 = (1 - this.CA[x][y]) / 2;
            beta2 = (1 - this.CA[x2][y2]) / 2;
            sumNegBeta += beta1 * beta2;
          }
        }
      }
      if (l > 0) {
          Ppp = (2 / (30*30 * 4 * l))*sumPosBeta;
          Pmm = (2 / (30*30 * 4 * l))*sumNegBeta;
          Ppm = 1 - Ppp - Pmm;
      }
      else {
        // this is probably incorrect
        Ppp = 0;
        Pmm = 0;
        Ppm = 1;
      }
      
        var jointEntropy;

        if (Ppp == 0 && Pmm == 0) {
          jointEntropy = -(Math.log(Ppm));
        }
        else if (Ppp == 0 && Pmm != 1) {
          jointEntropy = -(Pmm*Math.log(Pmm) + Ppm*Math.log(Ppm));
        }
        else if (Pmm == 0 && Ppp != 1) {
          jointEntropy = -(Ppp*Math.log(Ppp) + Ppm*Math.log(Ppm));
        }
        else if (Ppm == 0) {
          jointEntropy = -(Ppp*Math.log(Ppp) + Pmm*Math.log(Pmm));
        }
        else {
          Ppp += .00000000000000001;
          Pmm += .00000000000000001;
          Ppm += .00000000000000001;
          jointEntropy = -(Ppp*Math.log(Ppp) + Pmm*Math.log(Pmm) + Ppm*Math.log(Ppm));
        }
        console.log("je: " + jointEntropy);

        // mutual info
        mi = 2*hs - jointEntropy; 
        je.push(jointEntropy);
        mut_info.push(mi);
      }
    data.push(je);
    data.push(mut_info);
    return data;
    }


  this.foo = function() {
    console.log("this works");
    this.barr();
  }

  this.barr = function() {
    console.log("this also works");
  }
}


/*
 * simulate()
 *    main function - this is called when the user clicks "simulate"
 *
 */
function simulate(){	
  var j1 = parseFloat(document.getElementById("j1").value);
  var j2 = parseFloat(document.getElementById("j2").value);
  var h = parseFloat(document.getElementById("h").value);
  var r1 = parseFloat(document.getElementById("r1").value);
  var r2 = parseFloat(document.getElementById("r2").value);

  if(isNaN(j1) || isNaN(j2) || isNaN(h) || isNaN(r1) || isNaN(r2)){
    return;
  }
  done = false;
  numExperiments++;

  sim  = new AICASim(j1, j2, h, r1, r2);
  sim.foo();
  sim.initCA();
  sim.drawCA();
  sim.simulate();
  console.log("under simulate");
  //sim.doCalcs();
  // TODO
  // sim.perform_calculations()
  // sim.save_data()
  // download data
}

function updateCallback(){
  if(done)
  {
       clearInterval(sim.timer); 
       sim.doCalcs(); 
       
  }
  // If all cells have updated and the CA is stable, stop the simulation
  else if(sim.numUpdated === 0 && sim.updateList.length === 0){
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

/*
   AICASim.prototype.doCalcs = function() {
   var data = [];
   var temp = [];
   temp.push("H(s)");
   var hs; 
   clearInterval(sim.timer);

   hs = this.calculateEntropy(); 
   temp.push(hs);
   data.push(temp);


   temp = this.calculateCorrelation();
   data.push(temp);

   temp = this.calcJointEntropyAndMutInfo(hs);
   data.push(temp[0]);
   data.push(temp[1]);

   this.download_csv(data);

   }

   AICASim.prototype.download_csv = function(data) {
   var csv = 'Experiment,\n';
   data.forEach(function(row) {
   csv += row.join(',');
   csv += "\n";
   });

//  var hiddenElement = document.createElement('a');
// hiddenElement.href = 'data:test/csv;charset=utf-8,' + encodeURI(csv);
// hiddenElement.target = '_blank';
// hiddenElement.download = 'experiment_data.csv';
// hiddenElement.click();

}

// For this cell, calculate the distance to every other cell
AICASim.prototype.calculateCorrelation = function(){ 
var data = [];
var numCells = AICASim.CAsize * AICASim.CAsize;
for(var l = 0; l < 15; l++) {
var firstTerm = 0;
var secondTerm = 0;
for (var i = 0; i < numCells; i++) {
var currCell = this.updateList[i];
var x = Math.floor(currCell / this.CAsize);
var y = currCell % this.CAsize;
secondTerm += this.CA[x][y];
for (var j = i+1; j < numCells; j++){
var nextCell = this.updateList[j];

// Get the cell's x and y position in the grid
var x2 = Math.floor(nextCell / this.CAsize);
var y2 = nextCell % this.CAsize;

var distance = this.calcDistance(x, y, x2, y2);

if(distance == l)
firstTerm += this.CA[x][y] * this.CA[x2][y2];
}
if (l > 0){
var correlation = ( (2 / (30*30 * 4*l))*firstTerm ) - 
( ( (1 / (30*30)) * secondTerm)*( (1 / (30*30)) * secondTerm) );
}
else {
var correlation = 1 -  
( ( (1 / (30*30)) * secondTerm)*( (1 / (30*30)) * secondTerm) );
}
data.push(correlation);
}
}
return data;
}

AICASim.prototype.calculateEntropy = function(){ 
  var beta = 0;
  var numCells = AICASim.CAsize * AICASim.CAsize;
  console.log(numCells);
  for (var i = 0; i < numCells; i++) {
    var currCell = this.updateList[i];
    var x = Math.floor(currCell / this.CAsize);
    var y = currCell % this.CAsize;
    beta += (this.CA[x][y] + 1) / 2;
  }
  // Pr(+1) 
  var pp1 = (1/30*30) * beta;
  // Pr(-1)
  var pm1 = 1 - pp1;
  var entropy;
  if (pp1 == 0)
    entropy = -(Math.log(pm1));
  else if (pm1 == 0)
    entropy = -(Math.log(pp1));
  else
    entropy = -(pp1*Math.log(pp1) + pm1*Math.log(pm1));  

  console.log(entropy);
  return entropy;
}

AICASim.prototype.calcJointEntropyAndMutInfo = function(hs){ 
  var data = [];
  var je = [];
  var mut_info = [];
  var numCells = this.CAsize * this.CAsize;
  for(var l = 0; l < 15; l++) {
    var sumNegBeta = 0;
    var sumPosBeta = 0;
    var Ppp;
    var Pmm;
    var Ppm;
    for (var i = 0; i < numCells; i++) {
      var currCell = this.updateList[i];
      var x = Math.floor(currCell / this.CAsize);
      var y = currCell % this.CAsize;
      for (var j = i+1; j < numCells; j++){
        var nextCell = this.updateList[j];

        // Get the cell's x and y position in the grid
        var x2 = Math.floor(nextCell / this.CAsize);
        var y2 = nextCell % this.CAsize;

        var distance = this.calcDistance(x, y, x2, y2);

        if(distance == l){
          var beta1 = (this.CA[x][y] + 1) / 2;
          var beta2 = (this.CA[i][j] + 1) / 2;
          sumPosBeta += beta1 * beta2;
          beta1 = (1 - this.CA[x][y]) / 2;
          beta2 = (1 - this.CA[i][j]) / 2;
          sumNegBeta += beta1 * beta2;
        }
      }
      if (l > 0) {
        Ppp = (2 / (30*30 * 4 * l))*sumPosBeta;
        Pmm = (2 / (30*30 * 4 * l))*sumNegBeta;
        Ppm = 1 - Ppp - Pmm;
      }
      var jointEntropy;

      if (Ppp == 0 && Pmm == 0) {
        jointEntropy = -(Math.log(Ppm));
      }
      else if (Ppp == 0 && Pmm != 1) {
        jointEntropy = -(Pmm*Math.log(Pmm) + Ppm*Math.log(Ppm));
      }
      else if (Pmm == 0 && Ppp != 1) {
        jointEntropy = -(Ppp*Math.log(Ppp) + Ppm*Math.log(Ppm));
      }
      else {
        Ppp += .00000000000000001;
        Pmm += .00000000000000001;
        Ppm += .00000000000000001;
        jointEntropy = -(Ppp*Math.log(Ppp) + Pmm*Math.log(Pmm) + Ppm*Math.log(Ppm));
      }
      // mutual info
      var mi = 2*hs - jointEntropy; 
      je.push(jointEntropy);
      mut_info.push(mi);
    }
  }
  data.push(je);
  data.push(mut_info);
  return data;
}


AICASim.prototype.foo = function() {
  console.log("this works");
  this.barr();
}

AICASim.prototype.barr = function() {
  console.log("this also works");

}
*/
