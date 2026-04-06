---
title: "Training an Analog Neural Network Circuit"
date: 2026-03-13
category: Machine Learning
excerpt: "A compact NumPy implementation of predictive-coding inference, exposing the mechanics of local error propagation and hidden-state dynamics — a reference design for analog hardware."
thumbnail: "/assets/images/pcn-function-fit.png"
thumbnailAlt: "Predictive coding network fit against the target function"
---

This post is a write-up of the predictive coding network project in `pcn`. The current codebase is a compact NumPy implementation of predictive-coding-style inference and learning, applied to a toy regression problem: learning the mapping $y = \sin(3x)$ from samples on $[-1, 1]$.

I wanted this project to do two things at once. First, make the predictive coding update rules explicit enough to inspect and modify. Second, test how far a simple implementation can go before adding the usual deep-learning machinery. The result is a small experimental codebase with a clean theory loop: define prediction errors, relax latent states, update weights, and compare the learned function against the target.

## Overview

The repository contains two main scripts:

- `main.py` implements the predictive coding network.
- `main_gd.py` implements a standard feedforward baseline trained with gradient descent.

The predictive coding model uses a layered state representation $x^0, x^1, \dots, x^L$. The input layer is clamped to the observed input, and during training the output layer is clamped to the target. Hidden states are then iteratively relaxed to reduce prediction error throughout the stack. After the hidden states settle, the weights and biases are updated using the resulting local errors.

That separation between inference and learning is the main idea. In a standard feedforward network, hidden activations are produced in one pass. Here, hidden activations are dynamical variables that move toward a lower-energy configuration before the parameter update happens.

## Theory

The project defines the objective as an L1 prediction-error energy:

$$U = \sum_{l=1}^{L} \sum_i \left|x_i^l - \hat{x}_i^l\right|$$

with predictions generated from the layer below,

$$\hat{x}_i^l = f\!\left(\sum_j W_{ij}^l x_j^{l-1} + b_i^l\right).$$

For the hidden layers, the state gradient has a local term and a term coming from the layer above:

$$\frac{\partial U}{\partial x_i^l} = \mathrm{sign}(e_i^l) - \sum_j \mathrm{sign}(e_j^{l+1})\, s_j^{l+1}\, W_{ji}^{l+1}.$$

This is the key structural feature of the model. Each hidden state is pushed by its own local prediction error, but also by how changing it would affect the prediction quality of the next layer. In the code, state inference is just Euler integration on these gradients.

The implementation also uses a clipped activation in the hidden layers — keeping neuron states in a bounded range and introducing a simple gate on the gradients: once a unit saturates, its derivative can be suppressed outside the linear region.

## Code

The predictive pass is implemented in a direct way. For each layer, the code computes the prediction and stores both the error and the activation derivative:

```python
def forward_errors_and_gates(
    Ws, bs, xs, activation_mode, clip_low, clip_high, clip_outside_grad
):
    L = len(Ws)
    e_list, s_list = [], []
    for l in range(L):
        z = Ws[l] @ xs[l] + bs[l]
        if l < L - 1:
            xhat = hidden_activation(z, activation_mode, clip_low, clip_high)
            s = hidden_activation_derivative(
                z, activation_mode, clip_low, clip_high, clip_outside_grad
            )
        else:
            xhat = z
            s = np.ones_like(z, dtype=np.float64)
        e_list.append(xs[l + 1] - xhat)
        s_list.append(s)
    return e_list, s_list
```

Inference is then a relaxation process over the free states:

```python
for t in range(n_inference):
    dF_dx = state_grads_only(
        Ws, bs, xs, activation_mode, clip_low, clip_high, clip_outside_grad, cost_mode
    )
    for l in range(1, free_stop):
        xs[l] += -eta_x * dt * dF_dx[l]
```

After relaxation, the code computes parameter gradients from the equilibrium-like state configuration and applies the weight update. The project also experiments with quantized weights and straight-through-style updates, making it more interesting than a minimal reference implementation.

## Results

The current experiment learns the one-dimensional target function $y = \sin(3x)$ from 100 training points. To make the comparison easier to scan, I put the predictive coding outputs next to the standard gradient-descent baseline:

<figure>
<img src="/assets/images/pcn-vs-gd-comparison.png" alt="Predictive coding versus standard gradient descent" style="max-width: 720px;" />
<figcaption>Predictive coding versus standard gradient descent on the same toy regression task.</figcaption>
</figure>

<figure>
<img src="/assets/images/pcn-learning-curves.png" alt="Predictive coding training objective and test MSE" style="max-width: 720px;" />
<figcaption>Predictive coding training objective and test MSE over training iterations.</figcaption>
</figure>

<figure>
<img src="/assets/images/pcn-function-fit.png" alt="Final predictive coding fit on the sinusoidal target" style="max-width: 720px;" />
<figcaption>Final predictive coding fit on the sinusoidal target.</figcaption>
</figure>

Qualitatively, the model does learn the shape of the target function, although it is noticeably more computationally expensive than the feedforward baseline because every sample requires an inner inference loop for latent-state relaxation. In a quick run of the baseline script, the conventional network reached test MSE values on the order of $10^{-3}$ to $10^{-2}$, which is a useful reminder of the performance cost of making inference explicit.

That tradeoff is exactly why the project is interesting. The predictive coding formulation exposes the mechanics of error propagation and hidden-state dynamics in a way that ordinary backpropagation often hides behind a single backward pass.

## Toward Hardware

What I like about this project is that it stays small enough to reason about line by line while still touching several useful ideas: iterative inference, local prediction errors, saturating nonlinearities, quantization experiments, and baseline comparison.

The handwritten notes for this project also point toward a more ambitious next step: an analog hardware version of the same predictive-coding loop. The rough plan is to map the forward prediction path to resistor-and-op-amp summing circuits, use saturation in the analog blocks to realize the clipped nonlinearity, and build the L1 error term from sign-like comparator stages rather than full-precision multipliers.

<figure>
<img src="/assets/images/inverting-summing-amplifier.svg" alt="Prediction path as an inverting summing amplifier" style="max-width: 600px; background: #131b24; padding: 1.5rem;" />
<figcaption>Prediction path as an inverting summing amplifier with conductance-coded weights and a clipped nonlinearity after the op-amp.</figcaption>
</figure>

Another useful idea in the notes is to separate the dynamics into phases. Instead of updating states and weights continuously at the same time, the hardware could alternate between a *state-relaxation phase* with fixed weights and a *weight-update phase* with approximately fixed states. That kind of periodic update schedule is much more realistic for analog or mixed-signal implementation, and it gives the software project a concrete direction for future experiments.

So the long-term goal is not just to train this model in Python. It is to use the current code as a reference implementation for a predictive coding circuit that can perform local error computation, bounded nonlinear activation, and coarse weight adaptation directly in hardware.
