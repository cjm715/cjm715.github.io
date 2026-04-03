---
title: "6th Place in Kaggle Reverse Game of Life Competition"
date: 2020-12-22
category: Data
excerpt: "Simulated annealing on GPU using PyTorch — running thousands of parallel Game of Life simulations at once, powered by convolutions originally designed for CNNs."
---

This article explains my solution to the [Kaggle Competition: Reverse Game of Life 2020](https://www.kaggle.com/c/conways-reverse-game-of-life-2020). We'll cover the Game of Life itself, the competition problem, and then walk through the code — all available on [GitHub](https://github.com/cjm715/kaggle-game-of-life). The use of PyTorch for GPU computation was essential to the approach. It was fun using PyTorch for something other than neural networks.

## What is Conway's Game of Life?

In 1970, the late British mathematician John Horton Conway created a cellular automaton called the Game of Life. It has inspired scientists across computer science, complexity theory, biology, and physics ever since.

<figure>
<img src="/assets/images/John_H_Conway_2005.jpeg" alt="Mathematician John H. Conway" style="max-width: 280px;" />
<figcaption>Mathematician John H. Conway. Image from Wikipedia, authored by Thane Plambeck under <a href="https://creativecommons.org/licenses/by/2.0/deed.en">CC BY 2.0</a>.</figcaption>
</figure>

The rules are applied to a grid where each cell is either dead or alive, updated at each time step:

- If a cell is **alive** and has exactly 2 or 3 alive neighbors, it remains alive.
- If a cell is **dead** and has exactly 3 alive neighbors, it becomes alive.
- All other cases: the cell is dead in the next step.

The competition uses **periodic boundary conditions** — a cell at the edge sees neighbors across the board, as if the grid were tiled indefinitely.

The Game of Life is ridiculously simple to define, yet produces interesting patterns that almost appear life-like. Certain patterns recur across initializations and have been named by the research community — two well-known ones are the *Glider* (a pattern that translates diagonally) and the *Blinker* (a pattern that oscillates).

## The Competition Problem

Given only the *final state* of the game (on a 25×25 grid) and the number of time steps between the final and initial states, determine an initial state that when evolved forward closely matches the given final state.

The closeness between the predicted initial state's evolved stop state and the true stop state is measured by mean absolute error across cells. Note: even if we find a start state that evolves to the exact stop state, it may not match the true start state — multiple states can lead to the same state due to the nature of the Game of Life rules.

The number of time steps $\delta$ varies from 1 to 5, with roughly 10,000 instances per delta — **50,000 total instances** to solve.

## Simulated Annealing

I used simulated annealing to solve this problem. Simulated annealing is a heuristic probabilistic method for approximating a global optimum, inspired by the annealing process in metallurgy.

The task is framed as an optimization problem. The cost function $f(x)$ measures closeness:

$$f(x) = \sum_{i,j} \left| y(x)_{i,j} - y^{\mathrm{true}}_{i,j} \right|$$

where $y(x)$ is the evolved stop state from start state $x$ according to the Game of Life rules. The objective is to find $x$ minimizing $f(x)$.

To apply simulated annealing, we need a way to modify $x$ slightly to generate a new candidate $x'$. We do this by flipping a single cell at random. If $f(x') < f(x)$, we keep $x'$. Otherwise, we accept the new state with probability:

$$p = \exp\!\left(-\frac{f(x') - f(x)}{T}\right)$$

where $T$ is the temperature, which is slowly decreased over time.

## Speed-up via PyTorch and GPU

<figure>
<img src="/assets/images/gpu5.JPG" alt="GPU used for the Kaggle competition" style="max-width: 520px;" />
<figcaption>The GPU that ran the simulated annealing.</figcaption>
</figure>

The evaluation of $y(x)$ — running the Game of Life forward in time — is the computational bottleneck. It turns out this simulation can be done in about 40 lines of Python by exploiting PyTorch operations. The core computation is finding the total number of alive neighbors around each cell, done with a **convolution** — the same operation primarily used for CNNs:

```python
import torch
import numpy as np
import torch.nn.functional as F

grid_shape = (25, 25)
mask = torch.tensor([[1,1,1],
                     [1,0,1],
                     [1,1,1]]).type(torch.int)

# Initialize random grid
np_grid = np.random.randint(0, 2, grid_shape).astype(int)
grid = torch.from_numpy(np_grid).type(torch.int)

for i in range(20):
    # Count alive neighbors via circular-padded convolution
    grid_padded = F.pad(grid.view(1,1,*grid_shape), (1,1,1,1), mode="circular")
    sum_grid = F.conv2d(
        grid_padded.view(1,1,grid_shape[0]+2, grid_shape[1]+2),
        mask.view(1,1,3,3)
    ).view(*grid_shape)

    cond_prev_alive = torch.logical_and(
        torch.logical_or(sum_grid == 2, sum_grid == 3), grid == 1)
    cond_prev_dead  = torch.logical_and(sum_grid == 3, grid == 0)

    grid = torch.logical_or(cond_prev_alive, cond_prev_dead).type(torch.int)
```

With this PyTorch implementation, two things speed up the code:

1. **GPU acceleration** — tensor operations like the convolution step run faster on GPU
2. **Parallel simulations** — run multiple instances simultaneously, similar to batched inference in CNNs

By breaking the dataset into 5 groups by time delta, it was possible to evolve thousands of simulations simultaneously for each delta value. This made it possible to simultaneously solve multiple optimization problems for each given stop state in the dataset.

All code is available [on GitHub](https://github.com/cjm715/kaggle-game-of-life). To get the final score on Kaggle, I ran the code on an Nvidia GTX 1080 Ti for multiple days, restarting with slightly different temperature schedules within the simulated annealing algorithm.
