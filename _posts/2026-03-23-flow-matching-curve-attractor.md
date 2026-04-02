---
layout: post
title: "Can flow matching learn a curve attractor?"
author:
- Chris Miles
categories: machine-learning
---

<img src="{{site.url}}/assets/images/flow-matching-loop3d-t10.gif" alt="Learned flow trajectories converging onto a 3D loop" class="image_post" style="max-width: 520px; width: 100%;" />

I came across a recent post from [Unconventional AI](https://www.linkedin.com/pulse/steering-future-computing-experiment-oscillators-unconvai-e2ibc/?trackingId=ZLjhH5I2eJeL1kN7EMeF1A%3D%3D) which asked: how programmable is a simple dynamical system? Their experiment used a small oscillator system and tried to steer it so that its trajectory swept out a desired pattern in state space. The approach uses a variation of backpropagation through time, or an adjoint-method approach.

Recently, I've been learning about diffusion and flow-matching models and wondered if I could arrive at a similar system through flow-matching machinery. This post aims to answer the question: "Is it possible to construct an ODE that attaches to a prescribed curve in state space?" It's similar to the Unconventional AI problem in the sense that we are constructing or controlling an ODE that follows a prescribed curve. However, in this setting I'm considering a small parameterized neural network $u_\theta(x)$ that represents the right-hand side of an ODE:

$$
\frac{dx}{dt} = u_{\theta}(x)
$$

rather than a parametrized oscillator system. Furthermore, I'm interested in finding a $u_{\theta}(x)$ that follows a parameterized curve $\gamma(\theta)$ that is $2\pi$-periodic in $\theta$. Not only do I want it to be attracted to a given curve, I also want trajectories to cycle along this curve as they are attracted. This is also known as a limit cycle in the field of dynamical systems.

This post will show how I accomplished this and will teach you about dynamical systems and flow-matching techniques.



<br/>

## Flow-Matching Theory

What I want in the end is a velocity field with very specific behavior: trajectories should be attracted toward a prescribed curve, and once they get there they should keep circulating along it.

The first step is to aim at a slightly simpler goal. Instead of trying to move around an entire curve, imagine a single point rotating along that curve. Can we build a flow that makes a whole population of trajectories chase that moving point?

The flow-matching point of view is that it is often easier to design the **probability path** first and the vector field second. So rather than starting by guessing a velocity field, start by asking: what should a cloud of particles do over time?

## Conditional Probability Path

Fix a latent phase $\phi$. This gives a single moving target point

$$
z_t(\phi) = \gamma(\omega t + \phi)
$$

sliding around the curve.

Now specify the distribution we want. We would like a Gaussian cloud whose mean follows that moving target, while its variance shrinks over time so that the cloud concentrates onto it. A convenient choice is

$$
X_t = \alpha_t z_t(\phi) + \beta_t \varepsilon,
\qquad
\varepsilon \sim \mathcal{N}(0, I_d),
$$

with

$$
\alpha_t = 1 - e^{-t/\tau},
\qquad
\beta_t = e^{-t/\tau}.
$$

At small times, $\beta_t$ is large and the distribution still looks mostly like noise. At large times, $\beta_t$ decays to zero, so the cloud concentrates near the moving point on the curve.

<img src="{{site.url}}/assets/images/flow-matching-probability-path.gif" alt="Conditional probability path showing a Gaussian cloud whose mean follows a moving point on the curve." class="image_post" style="max-width: 760px; width: 100%;" />

<sub><center><i>The conditional probability path: a Gaussian cloud whose mean follows the moving target point while the variance shrinks over time.</i></center></sub>

<br/>

This is the **conditional probability path** $p_t(x \mid \phi)$.

## Conditional Vector Field

Once that path is specified, we can ask for the vector field that actually generates it.

The corresponding conditional flow map is

$$
\psi_t(x_0 \mid \phi)
= \alpha_t \gamma(\omega t + \phi) + \beta_t x_0.
$$

Differentiate this with respect to time:

$$
\frac{d}{dt}\psi_t(x_0 \mid \phi)
= \dot{\alpha}_t \gamma(\omega t + \phi)
+ \alpha_t \omega \gamma'(\omega t + \phi)
+ \dot{\beta}_t x_0.
$$

Now eliminate the latent initial point by substituting

$$
x_0 = \frac{x - \alpha_t \gamma(\omega t + \phi)}{\beta_t}.
$$

Using $\dot{\beta}_t / \beta_t = -1/\tau$ and $\dot{\alpha}_t - \alpha_t \dot{\beta}_t / \beta_t = 1/\tau$, the velocity field becomes

$$
u_t(x \mid \phi)
= -\frac{1}{\tau}(x - z_t(\phi)) + \omega \alpha_t \gamma'(\omega t + \phi).
$$

This is exactly the structure we wanted:

- a normal term pulling the state toward the moving target point
- a tangential term pushing it along the curve

<img src="{{site.url}}/assets/images/flow-matching-conditional-theory.gif" alt="Animated conditional flow matching example showing a sample cloud converging toward a moving target point and the corresponding conditional vector field." class="image_post" style="max-width: 760px; width: 100%;" />

<sub><center><i>Trajectories under the conditional field $u_t(x \mid \phi)$ for one fixed phase $\phi$, together with the moving target point $z_t(\phi)$.</i></center></sub>

<br/>

So far, though, this is still not the dynamics we actually want. The conditional system makes every trajectory chase one particular moving point. What we really want is a field whose trajectories circulate around the whole curve.

<img src="{{site.url}}/assets/images/flow-matching-theory-diagram.svg" alt="Diagram showing conditional probability path p_t(x|phi) mapping to conditional vector field u_t(x|phi), and marginal probability path p_t(x) mapping to marginal vector field u_t(x), with averaging and conditional-expectation arrows." class="image_post" style="max-width: 760px; width: 100%;" />

## Marginal Probability Path

This is where marginalization enters. Instead of fixing $\phi$, make it a latent random variable. In other words, the moving target point is now chosen at random by first drawing

$$
\Phi \sim \mathrm{Unif}[0, 2\pi).
$$

Then the marginal probability path is obtained by averaging over that latent phase:

$$
p_t(x) = \int p_t(x \mid \phi)\, p(\phi)\, d\phi.
$$

Intuitively, this replaces "one cloud chasing one moving point" with "mass spread all around the curve." Early on, the distribution still looks diffuse. As time increases, it contracts toward a narrow band wrapped around the target curve.

<img src="{{site.url}}/assets/images/flow-matching-marginal-probability-path.gif" alt="Marginal probability path showing mass concentrating around the full curve after averaging over phase." class="image_post" style="max-width: 760px; width: 100%;" />

<sub><center><i>The marginal probability path: after averaging over latent phase, the mass no longer tracks one point but instead concentrates around the whole curve.</i></center></sub>

<br/>

## Marginal Vector Field

By the same logic as before, once we know the marginal distribution we want, we can ask for the associated velocity field. The lecture-note construction says that the right field is the posterior average of the conditional fields:

$$
u_t^{\mathrm{marg}}(x)
= \mathbb{E}[u_t(x \mid \Phi) \mid X_t = x].
$$

Written out as an integral, this is

$$
u_t^{\mathrm{marg}}(x)
= \frac{\int u_t(x \mid \phi)\, p_t(x \mid \phi)\, p(\phi)\, d\phi}
{\int p_t(x \mid \phi)\, p(\phi)\, d\phi}.
$$

So nearby phases contribute more strongly to the field than phases that are unlikely given the observed point $x$.

This is slightly different from the conditional case. There, we derived the vector field directly by differentiating the trajectory paths. Here, we are constructing the marginal field indirectly by averaging the conditional ones, so we still owe a justification that this really is the field associated with the marginal probability path.

That justification is the continuity equation. The conditional path satisfies it by construction. After averaging over $\phi$, the same calculation shows that

$$
\partial_t p_t(x) = - \nabla \cdot \bigl(p_t(x)\, u_t^{\mathrm{marg}}(x)\bigr).
$$

So the marginal density evolves under the marginal field exactly as required. This is not just a heuristic averaging trick; it is the vector field that transports the marginal probability path.

## What The Learned ODE Represents

A small neural network $v_\theta(x,t)$ is then trained against the conditional targets. But because the network only sees $(x,t)$ and not the latent phase $\phi$, what it actually learns is the marginal field. In the experiments below I pushed the parameter count down substantially: the current 3D model has **2,371 parameters**.

This leads to the main long-time picture:

- the marginal density concentrates onto the image of $\gamma$
- the marginal field approaches a steady flow that looks like
  - attraction toward the curve in the normal direction
  - transport along the curve in the tangential direction

In other words, the route here is unusual, but the asymptotic geometry starts to resemble more standard guidance-vector-field and limit-cycle constructions.

## A 3D Example

The main visual experiment is a nonplanar loop in $\mathbb{R}^3$,

$$
\gamma(\theta) =
\bigl(
\cos \theta,
0.72 \sin \theta,
0.35 \sin 2\theta
\bigr).
$$

The video below shows trajectories under the learned ODE. The camera rotates around the loop so the geometry stays visible over time.



[Open MP4 version]({{site.url}}/assets/videos/flow-matching-loop3d-t10.mp4)

<sub><center><i>Learned nonautonomous ODE on a target 3D loop, rendered out to $t = 10$.</i></center></sub>

<br/>

What I like about this example is that it separates two questions that often get blurred together:

1. Can a small learned vector field generate a visually coherent curve-following flow?
2. What is the actual mathematical object being learned when the target depends on a latent phase variable?

Here the answer to the second question is clear: the learned field is the marginal flow, not the conditional one.

## Longer-Time Comparison

To see whether the dynamics really settle toward the loop, I compared three objects at longer horizons:

- direct samples from the analytically defined target marginal at final time $T$
- samples from the learned **nonautonomous** ODE $\dot X_t = v_\theta(X_t,t)$
- samples from a frozen **autonomous** approximation using the final-time field $\dot X = v_\theta(X,T)$

For the 3D loop, both learned systems move substantially closer to the target loop, while the true target marginal is, as expected, even tighter around it.

<img src="{{site.url}}/assets/images/flow-matching-loop3d-long-compare.png" class="image_post" style="max-width: 720px; width: 100%;">

<sub><center><i>Ground truth, learned nonautonomous flow, frozen autonomous approximation, and mean distance-to-curve over time.</i></center></sub>

<br/>

A useful lesson from these comparisons is that the frozen field $v(x,T)$ is not always interchangeable with the full nonautonomous dynamics. In the 2D cases I tested, the frozen field was noticeably worse. In the 3D loop case, it came surprisingly close. So the autonomous limit is a good approximation in some regimes, but it is still an approximation.
