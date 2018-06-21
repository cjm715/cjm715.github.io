---
layout: default
title: "Reinforcement learning approach to Santa Fe Institute's complexity challenge"
date: 2017-11-11
---

## White Paper:
[https://github.com/cjm715/sficc/blob/master/SFICC.pdf](https://github.com/cjm715/sficc/blob/master/SFICC.pdf)

## Code:
[https://github.com/cjm715/sficc](https://github.com/cjm715/sficc)


## Challenge Question:

The Santa Fe Institute recently hosted it's first ever complexity challenge.

The task was to investigate the following system:

>You have a 100x100 square checkerboard and there can be at most one checker on any given square at any time.  At each time step one or more checkers randomly appear on squares in the left-most column of the board.  When a checker arrives on the left-most column it is randomly assigned to a destination square on the right-most column (anytime a checker arrives on the right-most column it is removed from the board).  At each time step, a checker can either stay put or move to an adjacent square in any of the four cardinal directions as long as that adjacent square is open at the start of the time step (if more than one checker wants to move to the same square, one is randomly chosen to occupy the square and the others must stay put).  Checkers must make their movement decisions based on a set of local rules (potentially unique to each checker) that only use information about the checker's current position on the board, its destination, and whether squares in a local neighborhood are occupied.  The local neighborhood consists of all squares that could be reached in R steps in the cardinal directions across adjacent checkers.

The challenge is to explore the system above and determine a strategy for the checkers. The task was also to come up with a good measure of performance and explore the performance of your proposed strategy under various conditions.


## Summary of approach

The problem posed to the individual checker is the following: "Given the current state $s$ (dependent on the local neighborhood information, current position, destination), what is the best choice of action $a$ (staying put or moving up, right, down or left)?" This decision can be viewed as trying to determine a policy $\pi (s,a)$ which is the probability of choosing action $a$ given state $s$. Furthermore, we would ideally like to find the optimal policy denoted $ \pi^{\*}(s,a)$ or at least a suboptimal policy that is 'close'. This search problem is the topic of the research area known as reinforcement learning (also known as approximate dynamic programming). This approach is used to find a policy during a learning or training phase. This found policy at the end of the training phase is then tested in a testing phase to evaluate its performance.
