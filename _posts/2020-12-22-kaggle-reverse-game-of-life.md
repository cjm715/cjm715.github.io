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


<sub>*This simulation is running live in browser! Click anywhere to restart the game of life. This is a modification of the original ["Game of Life"](https://p5js.org/examples/simulate-game-of-life.html) p5.js example by [Daniel Shiffman](https://natureofcode.com/) licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).*</sub>


This article explains my solution to the Kaggle Competition: Reverse Game of Life 2020. We will go over the Game of Life itself, the competition description, and then a walk through of the code for my solution (all code is avaliable on github [here](https://github.com/cjm715/kaggle-game-of-life)).




















<!-- ==================== -->


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

```python
import torch
import numpy as np
import matplotlib.pyplot as plt
import torch.nn.functional as F
from IPython.display import clear_output
import random

grid_shape = (25,25)
np_grid = np.random.randint(0, 2, grid_shape).astype(int)
grid = torch.from_numpy(np_grid).type(torch.int)

mask = torch.tensor([[1,1,1],
                     [1,0,1],
                     [1,1,1]]).type(torch.int)

for _ in range(200):
    grid_padded = F.pad(grid.view(1,1,*grid_shape),(1,1,1,1), mode="circular")
    s_layer = F.conv2d(grid_padded.view(1,1,grid_shape[0]+2, grid_shape[1]+2),
                       mask.view(1,1,3,3)).view(*grid_shape)
    sum_is_2 = s_layer == 2
    sum_is_3 = s_layer == 3
    is_alive = grid == 1
    cond_prev_alive = torch.logical_and(
        torch.logical_or(sum_is_2, sum_is_3),
        is_alive)
    cond_prev_dead = torch.logical_and(
        sum_is_3,
        torch.logical_not(is_alive))
    grid = torch.logical_or(cond_prev_alive, cond_prev_dead)
    grid = grid.type(torch.int)
    clear_output(wait=True)
    plt.imshow(grid, cmap='Greys',  interpolation='nearest')
    plt.pause(0.02)
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
