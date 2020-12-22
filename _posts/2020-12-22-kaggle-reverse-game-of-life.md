---
layout: post
title: "6th place in Kaggle Reverse Game of Life Competition"
author:
- Chris Miles   
categories: data
---


<script src="{{ base.url | prepend: site.url }}/assets/js/game-of-life.js"></script>

<div id='canvasDiv'>
</div>


<sub>*This simulation is running live in browser! Click anywhere to restart the game of life. This is a modification of the [original "Game of Life" p5.js example](https://p5js.org/examples/simulate-game-of-life.html) by [Daniel Shiffman](https://natureofcode.com/) licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).*</sub>



# What is Conway's game of life?



It is a cellular automaton created by the mathematician John Conway. It consists of a grid where each cell can have either one of two states: dead and alive. The grid is updated each time step by these set of rules:
- If a cell is alive and there are exactly 2 or 3 alive neighbors (out of the 8 neighbors in its Moore neighborhood), then the cell remains alive in the next time step.
- If the cell is dead and there are exactly 3 alive neighbors, then the cell is becomes alive in the next time steps.
- For all other cases, the cell is dead in the next time step.

The game of life can be initialized in any grid configuration of alive and dead cells.

# The competition problem statement
Given only the final state of the game of life and the number of time steps between the final and initial states, determine an initial state that when evolved forward in time according the rules of the game of life closely matches the final site. The closeness between this evolved final state and the given final state is given by mean absolute error of the predictions across cells and multiple instances of the game. note that the initial state provided does have to match the true initial state actually used to arrive at the given final state.


# This solution

The solution provided in this repository uses simulated annealing to solve this challenge. The initial state is solved for by evaluating the mean absolute error on the evolved final state. This error is the cost. For each iteration, a cell is flipped from alive to dead or from dead to alive in the initial state and then the cost is evaluated. If the cost deceased, it will update the initial state guess to this new flipped version. Otherwise, the grid will pick this new version with a certain probability dependent on the change in cost and a temperature variable. Over many iterations, the initial state will tend towards a state that results in a small cost (= mean absolute error).  

# Code

You can find the code [here](https://github.com/cjm715/kaggle-game-of-life) on github.