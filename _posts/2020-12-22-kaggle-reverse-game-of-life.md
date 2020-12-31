---
layout: post
title: "6th place in Kaggle Reverse Game of Life Competition"
author:
- Chris Miles   
categories: data
---




This article explains my solution to the Kaggle Competition: Reverse Game of Life 2020. We will go over the Game of Life itself, the competition description, and then a walk through of the code for my solution (all code is available on github [here](https://github.com/cjm715/kaggle-game-of-life)).




## What is Conway's game of life?

In 1970, the late British mathematician John Horton Conway, who sadly left us only recently due to complications of COVID-19 in April of 2020, created a cellular automaton called the Game of Life which has inspired many scientists from a variety of discplines such as computer science, complexity science, biology, physics, and others ever since its creation.


<!-- BEGINNING OF IMAGE -->
<a href="https://en.wikipedia.org/wiki/John_Horton_Conway">
<img src="{{site.url}}/assets/images/John_H_Conway_2005.jpeg"  width="300" class="image_post">
</a>

<sub>*Mathematician John H. Conway. This image is from the Wikipedia article on ["John Horton Conway"](https://commons.wikimedia.org/wiiFile:John_H_Conway_2005_(cropped).jpg) and authored by [Thane Plambeck](https://www.flickr.com/photos/thane/20366806/) under license [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/deed.en).*</sub>

<br/>
<!-- END OF IMAGE -->

It consists of applying a set of simple rules to a grid where each cell is either dead or alive. The grid is updated each time step by these set of rules:
- If a cell is alive and there are exactly 2 or 3 alive neighbors (out of the 8 neighbors in its neighborhood), then the cell remains alive in the next time step.
- If the cell is dead and there are exactly 3 alive neighbors, then the cell becomes alive in the next time step.
- For all other cases, the cell is dead in the next time step.

The game of life can be initialized in any grid configuration of alive and dead cells. Typically, the grid is initialized randomly throughout the grid with a probability of a given cell being alive is set to 1/2.

When a cell is at the boundary, the definition of neighborhood is ambiguous. Some implementations of the game of life, use periodic boundary conditions which means that a cell will see the neighbor across the board as its neighbor. Another way to view the periodic condition is by imagining the grid tiled indefinitely throughout space. Then when you consider the 8-cell neighborhood, you will always have a full neighborhood. In this competition, the game of life is implemented with this periodic boundary condition.

The simulation below is the game of life running live within this browser. Blue cells are alive and black cells are dead. Each time step is applying the rules mentioned above.

<!-- BEGINNING OF SIMULATION -->
<script src="{{ base.url | prepend: site.url }}/assets/js/game-of-life.js"></script>

<div id='canvasDiv'>
<!--  class='simulation_post'> -->
</div>


<sub>*Click anywhere to restart the game of life. This and all other game-of-life simulations in this post are modifications of the original ["Game of Life"](https://p5js.org/examples/simulate-game-of-life.html) p5.js example by [Daniel Shiffman](https://natureofcode.com/) licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).*</sub>

<br/>
<!-- END OF SIMULATION -->

The Game of Life is ridiculously simple to define. Yet as you can see above in the simulation, it produces interesting patterns over time that almost appear life-like --- hence the name: Game of Life.

If your restart the game above (by clicking on the simulation), you will find that at later times you will see some patterns that keep showing up. Some have have been named by the research community such as the Glider and Blinker shown below.

<!-- BEGINNING OF GLIDER SIMULATION -->
<script src="{{ base.url | prepend: site.url }}/assets/js/glider.js"></script>

<div id='gliderDiv'>
</div>
<sub><center><i>Glider</i></center></sub>

<br/>
<!-- END OF SIMULATION -->

<!-- BEGINNING OF BLINKER SIMULATION -->
<script src="{{ base.url | prepend: site.url }}/assets/js/blinker.js"></script>

<div id='blinkerDiv'>
</div>
<sub><center><i>Blinker</i></center></sub>

<br/>
<!-- END OF SIMULATION -->

## The competition problem statement
Given only the final state of the game of life (on a 25x25 grid) and the number of time steps between the final and initial states, determine an initial state that when eolved forward in time according the rules of the game of life closely matches the given final state.

For instance, suppose we have the following sequence of grid states appearing in the game of life:

<!-- BEGINNING OF TIMELINE SIMULATION-->
<script src="{{ base.url | prepend: site.url }}/assets/js/comp-desc.js"></script>

<div id='compDescDiv'>
</div>

<sub>*Click anywhere above to draw a new example.*</sub>

<br/>
<!-- END OF SIMULATION -->

The given state would be the last state or stop state at t=3. The other states are not given in the Kaggle test data set. The task is to find an initial state or start state at t=0 that would evolve forward in time to a state that is close to the given stop state.

Notice that it does not have to evolve to a state that is exactly the given stop state --- it only needs to be close. The closeness between this evolved stop state and the given stop state is measured by the mean absolute error of the predictions across cells. Also, note that even if we are successful at finding a start state that evolves to the exact stop state, it is possible that this discovered start state does not match the true start state that was used originally. This is due to the fact that multiple states can lead to the same state by the nature of the Game of Life rules.

The number of time steps between the start and stop state, or also referred to as delta, varies from 1 to 5 throughout the test data set. The above example would be for an instance that has a delta of 3. There are roughly 10,000 instances in the test data set for each delta giving a total of 50,000 instances to solve.


##  Simulated Annealing

I used simulated annealing to solve this problem. Simulated annealing is a heuristic probabilistic method for approximating a global optimum. It is inspired by the annealing process in metallurgy, a method of heating and cooling in a controlled way to reduce a metal's defects.

The competition task is framed as an optimization problem. The cost function $$f(x_{start})$$ is the closeness of the stop state $$x_{stop}$$ using the guess $$x_{start}$$ as our start state. The objective is to find the best $$x_{start}$$ that minimizes $$f(x_{start})$$.






## Speed up of forward evolution by pytorch and GPU


```python

import os
import torch
import pandas as pd
from torch.utils.data import DataLoader, Dataset
from torch import FloatTensor, LongTensor
import torch.nn.functional as F
from tqdm import tqdm
import numpy as np
import matplotlib.pyplot as plt
import sys

SIDE_LENGTH = 25
NUM_WARM_UP_STEPS = 5
GRID_SHAPE = (SIDE_LENGTH, SIDE_LENGTH)
device = "cuda"

TOTAL_NUM_CELLS = torch.tensor(SIDE_LENGTH*SIDE_LENGTH).type(torch.LongTensor).to(device)
MASK = torch.tensor([[1, 1, 1],
                     [1, 0, 1],
                     [1, 1, 1]]).view(1, 1, 3, 3).type(torch.FloatTensor).to(device)


def line2grid_tensor(data, device='cuda'):
    grid = data.to_numpy().reshape((data.shape[0], 1, 25, 25))
    return torch.tensor(grid).type(torch.int).to(device)


class TaskDataset(Dataset):
    def __init__(self, data, data_initialize=None, device='cuda'):
        self.id = LongTensor(data.iloc[:, 0].to_numpy()).to(device)
        self.delta = LongTensor(data.iloc[:, 1].to_numpy()).to(device)
        self.stop = line2grid_tensor(data.iloc[:, 2:], device)
        if data_initialize is not None:
            self.start_guess = line2grid_tensor(data_initialize.iloc[:, 1:], device)
        else:
            self.start_guess = None

    def __len__(self):
        return len(self.delta)

    def __getitem__(self, idx):
        if self.start_guess is not None:
            return {'start_guess': self.start_guess[idx], 'stop': self.stop[idx], 'delta': self.delta[idx], 'id': self.id[idx]}
        else:
            return {'stop': self.stop[idx], 'delta': self.delta[idx], 'id': self.id[idx]}


def G(s, grid):
    sumIs2 = s == 2
    sumIs3 = s == 3
    isAlive = grid == 1
    grid = torch.logical_or(
        torch.logical_and(torch.logical_or(sumIs2, sumIs3), isAlive),
        torch.logical_and(sumIs3, torch.logical_not(isAlive)))
    grid = grid.type(torch.int)
    return grid


def sum_neighbors(grid):
    grid_padded = F.pad(grid, (1, 1, 1, 1), mode="circular").type(torch.cuda.FloatTensor)
    s_layer = F.conv2d(grid_padded, MASK).type(torch.cuda.IntTensor)
    return s_layer


def step_single(grid):
    s_layer = sum_neighbors(grid)
    grid = G(s_layer, grid)
    return grid, s_layer


def step(grid, delta=1):
    for _ in range(0, delta):
        grid, s_layer = step_single(grid)
    return grid, s_layer


def accuracy_error(grid_pred, grid_true):
    C = torch.sum(grid_pred != grid_true, (2, 3)).type(
        torch.cuda.FloatTensor)/TOTAL_NUM_CELLS
    return C


def flip_n_bits(grid, n, batch_size):
    flat_index_per_frame = torch.randint(0, SIDE_LENGTH*SIDE_LENGTH, (batch_size, n))
    total_cell_upto_last_frame = torch.arange(
        0, SIDE_LENGTH*SIDE_LENGTH*batch_size, SIDE_LENGTH*SIDE_LENGTH).view(batch_size, 1)
    flat_indices = total_cell_upto_last_frame + flat_index_per_frame
    flat_indices = flat_indices.squeeze()
    grid.flatten()[flat_indices] = 1 - grid.flatten()[flat_indices]
    return grid


def plotg(grid):
    plt.imshow(grid, cmap='Greys',  interpolation='nearest')
```

```python
import os
import torch
import pandas as pd
from torch.utils.data import DataLoader, Dataset
from torch import FloatTensor, LongTensor
import torch.nn.functional as F
from tqdm import tqdm
import numpy as np
import matplotlib.pyplot as plt
import sys
from model import *
import math


dataset_test_pd = pd.read_csv('./data/test.csv')
for delta in range(1, 6):
    dataset_test_pd[dataset_test_pd['delta'] == delta].sort_values(
        'id').to_csv(f"./data/test_delta_{delta}.csv", index=False)

sample_sub_df = pd.read_csv(f'./data/sample_submission.csv')

batch_size_desired = 5000
first_batch = True

for delta in range(5, 2, -1):
    print(delta)
    dataset_test_pd = pd.read_csv(f'./data/test_delta_{delta}.csv')
    dataset_test = TaskDataset(dataset_test_pd)
    dataloader_test = DataLoader(dataset_test, batch_size=batch_size_desired, shuffle=False)

    for i_batch, sample_batched in enumerate(dataloader_test):
        stop_grid = sample_batched['stop']
        batch_size = stop_grid.size()[0]

        start_grid_pred = torch.zeros((batch_size, 1, 25, 25), device=device)

        cost = accuracy_error(step(start_grid_pred, delta=delta)[0], stop_grid)
        cost_best = cost.clone()
        print(cost_best.mean())
        start_grid_pred_best = start_grid_pred.clone()
        pbar = tqdm(torch.arange(360000, device=device))
        temperature = 0.1
        gamma = 0.999
        for i in pbar:
            start_grid_pred_new = start_grid_pred.clone()

            if i % 500 == 0:
                start_grid_pred_new = start_grid_pred_best.clone()

            start_grid_pred_new = flip_n_bits(start_grid_pred_new, 1, batch_size)
            stop_grid_pred_new, _ = step(start_grid_pred_new, delta=delta)
            cost_new = accuracy_error(stop_grid_pred_new, stop_grid)

            cost_change = cost_new - cost  # + reg

            temperature = max(temperature*gamma, 1e-4)

            prob, _ = torch.min(torch.exp(-cost_change/temperature), 1)
            choice = (torch.rand(batch_size, device=device) < prob)
            start_grid_pred = torch.where(choice.view(batch_size, 1, 1, 1),
                                          start_grid_pred_new,
                                          start_grid_pred)
            cost = torch.where(choice.view(batch_size, 1), cost_new, cost)

            start_grid_pred_best = torch.where(
                (cost < cost_best).view(batch_size, 1, 1, 1),
                start_grid_pred,
                start_grid_pred_best)
            cost_best = torch.where(cost < cost_best, cost, cost_best)

            pbar.set_description(f' Cost (best): {cost_best.mean()} Temp : {temperature}')

        start_grid_pred_best_np = start_grid_pred_best.cpu().numpy().reshape(batch_size, SIDE_LENGTH*SIDE_LENGTH)
        sub_df = pd.DataFrame(start_grid_pred_best_np)
        sub_df.insert(loc=0, column='id', value=sample_batched['id'].cpu().numpy())
        sub_df.columns = sample_sub_df.columns

        if first_batch:
            full_sub_df = sub_df.copy()
            cost_best_all = cost_best.clone()
            first_batch = False
        else:
            full_sub_df = pd.concat([full_sub_df, sub_df])
            cost_best_all = torch.cat([cost_best_all, cost_best])

        print(cost_best_all.mean())
        full_sub_df.sort_values('id').to_csv('submission.csv', index=False)

```

You can find the code [here](https://github.com/cjm715/kaggle-game-of-life) on github.
