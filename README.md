##AICA Simulation
This project simulates the behavior of an activation/inhibition cellular automaton (AICA) using JavaScript. The simulation consists of a 30x30 grid of cells, each of which is either in an active or inactive state. The simulation assumes the grid is a torus, which means cells on the bottom of the grid are adjacent to cells on the top of the grid, and cells on the left side of the grid are adjacent to cells on the right. As you run the simulation, cells are updated asynchronously (one at a time, rather than all at once) according to the states of other cells around it, as well as the amount of activation and inhibition chemicals present. Change parameters J1, J2, h, R1, and R2 to change the behavior of the automaton's behavior by controlling the spread of the activator and inhibitor chemicals.

[Demo](http://jhamilton17.github.io/aica-sim-js/)


#TODO
- Adding support for entropy, correlation, joint-entropy, and mutual information calculations.
- Adding support to create csv files with this information and ability to download.
- Be nice to download a the final picture of the simulation as well. 
