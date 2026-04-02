---
title: "Can Flow Matching Learn a Curve Attractor?"
date: 2026-03-23
category: Machine Learning
excerpt: "Constructing an ODE that attaches to a prescribed curve — using flow-matching machinery to derive a marginal vector field that generates a limit cycle from pure noise."
---

<figure>
<img src="/assets/images/flow-matching-loop3d-t10.gif" alt="Learned flow trajectories converging onto a 3D loop" style="max-width: 520px;" />
<figcaption>Trajectories under the learned ODE converging onto the target 3D loop.</figcaption>
</figure>

I came across a recent post from [Unconventional AI](https://www.linkedin.com/pulse/steering-future-computing-experiment-oscillators-unconvai-e2ibc/) which asked: how programmable is a simple dynamical system? Their experiment used a small oscillator system and tried to steer it so that its trajectory swept out a desired pattern in state space — a variation of backpropagation through time, or an adjoint-method approach.

Recently, I've been learning about diffusion and flow-matching models and wondered if I could arrive at a similar system through flow-matching machinery. This post aims to answer: *"Is it possible to construct an ODE that attaches to a prescribed curve in state space?"* I'm considering a small parameterized neural network $u_\theta(x)$ representing the right-hand side of an ODE:

$$\frac{dx}{dt} = u_{\theta}(x)$$

rather than a parametrized oscillator system. I want to find $u_{\theta}(x)$ that follows a parameterized curve $\gamma(\theta)$ that is $2\pi$-periodic — and not just attracted to the curve, but cycling along it. This is a *limit cycle* in dynamical systems language.

## Flow-Matching Theory

What I want in the end is a velocity field with specific behavior: trajectories attracted toward a prescribed curve, and once there, circulating along it.

The first step is a simpler goal. Instead of the whole curve, imagine a single point rotating along it. Can we build a flow that makes a whole population of trajectories chase that moving point?

The flow-matching point of view is that it is often easier to design the **probability path** first and the vector field second. Rather than guessing a velocity field, start by asking: what should a cloud of particles do over time?

## Conditional Probability Path

Fix a latent phase $\phi$. This gives a single moving target point

$$z_t(\phi) = \gamma(\omega t + \phi)$$

sliding around the curve. We specify the distribution we want — a Gaussian cloud whose mean follows that moving target, while its variance shrinks over time so the cloud concentrates onto it:

$$X_t = \alpha_t z_t(\phi) + \beta_t \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I_d),$$

with

$$\alpha_t = 1 - e^{-t/\tau}, \qquad \beta_t = e^{-t/\tau}.$$

At small times, $\beta_t$ is large and the distribution still looks mostly like noise. At large times, $\beta_t$ decays to zero, so the cloud concentrates near the moving point on the curve.

<figure>
<img src="/assets/images/flow-matching-probability-path.gif" alt="Conditional probability path: Gaussian cloud converging to a moving target" style="max-width: 760px;" />
<figcaption>The conditional probability path: a Gaussian cloud whose mean follows the moving target point while the variance shrinks over time.</figcaption>
</figure>

## Conditional Vector Field

Once that path is specified, we can ask for the vector field that generates it. The corresponding conditional flow map is

$$\psi_t(x_0 \mid \phi) = \alpha_t \gamma(\omega t + \phi) + \beta_t x_0.$$

Differentiating with respect to time:

$$\frac{d}{dt}\psi_t(x_0 \mid \phi) = \dot{\alpha}_t \gamma(\omega t + \phi) + \alpha_t \omega \gamma'(\omega t + \phi) + \dot{\beta}_t x_0.$$

Eliminating the latent initial point by substituting $x_0 = (x - \alpha_t \gamma(\omega t + \phi)) / \beta_t$, and using $\dot{\beta}_t / \beta_t = -1/\tau$:

$$u_t(x \mid \phi) = -\frac{1}{\tau}(x - z_t(\phi)) + \omega \alpha_t \gamma'(\omega t + \phi).$$

This has exactly the structure we wanted:

- a **normal term** pulling the state toward the moving target point
- a **tangential term** pushing it along the curve

<figure>
<img src="/assets/images/flow-matching-conditional-theory.gif" alt="Animated conditional flow matching showing convergence to a moving target" style="max-width: 760px;" />
<figcaption>Trajectories under the conditional field $u_t(x \mid \phi)$ for one fixed phase $\phi$, together with the moving target point $z_t(\phi)$.</figcaption>
</figure>

<figure>
<img src="/assets/images/flow-matching-theory-diagram.svg" alt="Diagram showing conditional and marginal probability paths and vector fields" style="max-width: 760px; background: #131b24; padding: 1rem;" />
<figcaption>From conditional to marginal: the probability path and its associated vector field, connected by averaging over the latent phase.</figcaption>
</figure>

## Marginal Probability Path

This is where marginalization enters. Instead of fixing $\phi$, make it a latent random variable. Draw

$$\Phi \sim \mathrm{Unif}[0, 2\pi).$$

Then the marginal probability path is obtained by averaging over that latent phase:

$$p_t(x) = \int p_t(x \mid \phi)\, p(\phi)\, d\phi.$$

Intuitively, this replaces "one cloud chasing one moving point" with "mass spread all around the curve." Early on, the distribution looks diffuse. As time increases, it contracts toward a narrow band wrapped around the target curve.

<figure>
<img src="/assets/images/flow-matching-marginal-probability-path.gif" alt="Marginal probability path showing mass concentrating around the full curve" style="max-width: 760px;" />
<figcaption>The marginal probability path: after averaging over latent phase, the mass concentrates around the whole curve rather than tracking a single point.</figcaption>
</figure>

## Marginal Vector Field

Once we know the marginal distribution we want, we can ask for the associated velocity field. The right field is the posterior average of the conditional fields:

$$u_t^{\mathrm{marg}}(x) = \mathbb{E}[u_t(x \mid \Phi) \mid X_t = x].$$

Written as an integral:

$$u_t^{\mathrm{marg}}(x) = \frac{\int u_t(x \mid \phi)\, p_t(x \mid \phi)\, p(\phi)\, d\phi}{\int p_t(x \mid \phi)\, p(\phi)\, d\phi}.$$

So nearby phases contribute more strongly to the field than phases that are unlikely given the observed point $x$.

The justification is the continuity equation. After averaging over $\phi$:

$$\partial_t p_t(x) = - \nabla \cdot \bigl(p_t(x)\, u_t^{\mathrm{marg}}(x)\bigr).$$

So the marginal density evolves under the marginal field exactly as required. This is not a heuristic averaging trick — it is the vector field that transports the marginal probability path.

## What the Learned ODE Represents

A small neural network $v_\theta(x,t)$ is trained against the conditional targets. Because the network only sees $(x,t)$ and not the latent phase $\phi$, what it actually learns is the marginal field. The current 3D model has **2,371 parameters**.

This leads to the main long-time picture:

- the marginal density concentrates onto the image of $\gamma$
- the marginal field approaches a steady flow with attraction toward the curve in the normal direction and transport along the curve in the tangential direction

## A 3D Example

The main visual experiment is a nonplanar loop in $\mathbb{R}^3$:

$$\gamma(\theta) = \bigl(\cos \theta,\; 0.72 \sin \theta,\; 0.35 \sin 2\theta\bigr).$$

The video below shows trajectories under the learned ODE. The camera rotates around the loop so the geometry stays visible over time.

<figure>
<video controls playsinline preload="metadata" style="max-width: 680px;">
  <source src="/assets/videos/flow-matching-loop3d-t10.mp4" type="video/mp4" />
</video>
<figcaption>Learned nonautonomous ODE on the target 3D loop, rendered out to $t = 10$.</figcaption>
</figure>

What I find most useful about this example is that it separates two questions that often get blurred together:

1. Can a small learned vector field generate a visually coherent curve-following flow?
2. What is the actual mathematical object being learned when the target depends on a latent phase variable?

Here the answer to the second question is clear: the learned field is the marginal flow, not the conditional one.

## Longer-Time Comparison

To see whether the dynamics really settle toward the loop, I compared three objects at longer horizons:

- direct samples from the analytically defined target marginal at final time $T$
- samples from the learned **nonautonomous** ODE $\dot X_t = v_\theta(X_t,t)$
- samples from a frozen **autonomous** approximation using the final-time field $\dot X = v_\theta(X,T)$

<figure>
<img src="/assets/images/flow-matching-loop3d-long-compare.png" alt="Comparison of ground truth, learned nonautonomous, and frozen autonomous flows" style="max-width: 720px;" />
<figcaption>Ground truth, learned nonautonomous flow, frozen autonomous approximation, and mean distance-to-curve over time.</figcaption>
</figure>

A useful lesson from these comparisons is that the frozen field $v(x,T)$ is not always interchangeable with the full nonautonomous dynamics. In 2D cases, the frozen field was noticeably worse. In the 3D loop case, it came surprisingly close — so the autonomous limit is a good approximation in some regimes, but it is still an approximation.
