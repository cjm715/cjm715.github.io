---
title: "Can we construct an ODE that follows a prescribed limit cycle?"
date: 2026-07-27
category: Machine Learning
excerpt: "Constructing an ODE that attaches to a prescribed curve, using flow-matching machinery to derive a marginal vector field that generates a limit cycle from pure noise."
thumbnail: "/assets/images/flow-matching-trefoil3d-uinf-learned-still.png"
thumbnailGif: "/assets/images/flow-matching-trefoil3d-uinf-learned-t20.gif"
thumbnailAlt: "Trajectories converging onto a 3D trefoil knot"
---

<figure>
<img src="/assets/images/flow-matching-trefoil3d-uinf-learned-t20.gif" alt="Trajectories converging onto a 3D trefoil knot under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories converging onto a 3D trefoil knot

</figcaption>
</figure>

A few months back I came across [an article from Unconventional AI](https://www.linkedin.com/pulse/steering-future-computing-experiment-oscillators-unconvai-e2ibc/) which demonstrated how they successfully steered a simple oscillator system under a time-dependent control signal to follow a given trajectory. It got me curious about a similar question: is it possible to construct an ODE with no time dependence and no control that follows a given trajectory? In other words, is it possible to bake a desired limit cycle into an autonomous ODE? This is a different question than the one posed in the article. There, the complexity appears in the design of the control; here, it appears in the design of the system.

I got curious whether I could take the idea further. If such an ODE can be constructed, could I also realize it as an analog circuit, the way I did [previously for the Lorenz system](/posts/lorenz)? And how would I make sure it could be built from only a few components? If we arrive at a limit cycle that is stable, this fights the unavoidable noise problems in analog computing circuits. These circuit questions are a teaser and I'll leave the circuit build as a potential follow-up.

This post is a record of my attempt at the first goal: constructing an ODE with a given limit cycle. For simplicity I will consider a smooth, periodic parametrized curve $\gamma(\theta)$ with no self-intersections.

Recently, I've had fun learning the theory behind flow matching and diffusion models from this [online MIT course](https://diffusion.csail.mit.edu/2026/index.html), and it felt like the right framework for this problem. The gist of flow matching is to decide how you want a probability distribution to transform over time, and then determine the flow field that accomplishes it. What I do here is nearly identical to that standard construction, adapted to the problem at hand.

The construction is four moves, following the standard flow-matching process, and it helps to see them laid out before diving into each one. First, a **conditional probability path**: for a single fixed phase $\phi$, a density that starts as pure noise and collapses onto one moving point traveling along the curve. Second, the **conditional vector field** that induces that path, which turns out to have a clean closed form. Third, the **marginal probability path**: average the conditional path over all phases, so the mass wraps the whole curve instead of chasing a single point. Fourth, the **marginal vector field** that transports it, recovered by conditioning on where a particle currently sits. That last field is the time-dependent flow I am after, and the four sections below walk these boxes in order.

<figure>
<img src="/assets/images/flow-matching-theory-diagram.svg" alt="Diagram showing conditional and marginal probability paths and vector fields" style="max-width: 760px; background: #131b24; padding: 1rem;" />
<figcaption>The roadmap: build a conditional probability path, derive the field that induces it, marginalize over the latent phase to cover the whole curve, then condition on position to get the field that transports the marginal path.</figcaption>
</figure>

This gets me close to what I want, except that the field it produces is still time dependent:

$$\frac{dx}{dt} = u(x, t).$$

The $u$ we find drives trajectories onto the chosen curve.

I noticed in simulations that the flow appears to become steady at large times (I later show why). We then explore the idea of applying this limiting field for all time. This gets us to an autonomous ODE of the form

$$\frac{dx}{dt} = u_\infty(x)$$

where $x$ approaches a desired parametrized curve $\gamma(\theta)$ and then keeps circulating along it forever, which is exactly what I was after.

If you know of other methods for finding such an ODE, I would love to hear about them, and I'll edit this post to add a reference. From the limited literature search I did, I didn't see anything that took the approach shown here, but it's possible I could have missed it. Regardless, I enjoyed the challenge of trying to solve it myself.

## The Conditional Probability Path

We start with the conditional probability path, which is a designed time-dependent probability density conditioned on a particular phase offset $\phi$. In other words, we design a density that converges onto one moving point specified by $\phi$. Covering the whole curve comes later; for now the target is a single point.

The phase $\phi$ picks out where that point starts, and it then travels around the curve at rate $\omega$:

$$z_t(\phi) = \gamma(\omega t + \phi).$$

The conditional probability path is a Gaussian centered on that moving point, with a variance that shrinks over time:

$$X_t = \alpha_t z_t(\phi) + \beta_t \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I_d),$$

with schedules

$$\alpha_t = 1 - e^{-t/\tau}, \qquad \beta_t = e^{-t/\tau}.$$

At early times $\beta_t$ is close to one and $\alpha_t$ is close to zero, so the density is essentially pure noise. As time goes on $\beta_t$ decays and $\alpha_t$ approaches one, so the density tightens around $z_t(\phi)$. That is the transformation we asked for: noise at the start, a point on the curve at the end.

<figure>
<img src="/assets/images/flow-matching-probability-path.gif" alt="Conditional probability path: Gaussian cloud converging to a moving target" style="max-width: 760px;" />
<figcaption>The conditional probability path: a Gaussian cloud whose mean follows the moving target point while the variance shrinks over time.</figcaption>
</figure>

## The Conditional Vector Field

We designed the density; now we solve for the velocity field that produces it. That is the second half of the flow-matching recipe, and because the conditional path is built from an explicit formula, we can read the field straight off it.

The conditional flow map takes a starting point $x_0$ drawn from the noise and returns where that particle sits at time $t$:

$$\psi_t(x_0 \mid \phi) = \alpha_t \gamma(\omega t + \phi) + \beta_t x_0.$$

Differentiating in time gives its velocity:

$$\frac{d}{dt}\psi_t(x_0 \mid \phi) = \dot{\alpha}_t \gamma(\omega t + \phi) + \alpha_t \omega \gamma'(\omega t + \phi) + \dot{\beta}_t x_0.$$

We want that velocity as a function of where the particle currently is rather than where it started, so we substitute $x_0 = (x - \alpha_t \gamma(\omega t + \phi)) / \beta_t$ and use $\dot{\beta}_t / \beta_t = -1/\tau$:

$$u_t(x \mid \phi) = -\frac{1}{\tau}(x - z_t(\phi)) + \omega \alpha_t \gamma'(\omega t + \phi).$$

This has exactly two pieces, each doing something clear:

- **normal term** $-\frac{1}{\tau}(x - z_t(\phi))$: pulls the particle toward the moving target
- **tangential term** $\omega \alpha_t \gamma'(\omega t + \phi)$: pushes it along the curve

In other words, the field pulls inward and transports along. I found this satisfying, because the algebra didn't just hand back *some* velocity field, it handed back exactly the structure you'd want to design by hand. It's worth keeping this two-piece shape in mind, because it survives every step that follows, all the way to the final autonomous field.

<figure>
<img src="/assets/images/flow-matching-conditional-theory.gif" alt="Animated conditional flow matching showing convergence to a moving target" style="max-width: 760px;" />
<figcaption>

Trajectories under the conditional field $u_t(x \mid \phi)$ for one fixed phase $\phi$, together with the moving target point $z_t(\phi)$.

</figcaption>
</figure>

## The Marginal Probability Path

The conditional path does what we asked, but only for one fixed phase $\phi$: it converges onto a single moving point, not the whole curve. The fix is to stop treating $\phi$ as fixed and make it a random variable instead:

$$\Phi \sim \mathrm{Unif}[0, 2\pi),$$

and marginalize the conditional path over it:

$$p_t(x) = \int p_t(x \mid \phi)\, p(\phi)\, d\phi.$$

In other words, we average the conditional densities over every phase offset. Instead of one cloud chasing one point, the mass is now spread all the way around the curve. Early on the density is diffuse; as time increases, it contracts into a narrow band wrapped around the entire target. This is the probability path we actually want.

<figure>
<img src="/assets/images/flow-matching-marginal-probability-path.gif" alt="Marginal probability path showing mass concentrating around the full curve" style="max-width: 760px;" />
<figcaption>The marginal probability path: after averaging over latent phase, the mass concentrates around the whole curve rather than tracking a single point.</figcaption>
</figure>

## The Marginal Vector Field

Same pattern as before: we have the density we want, so now we solve for the field that transports it. The answer is not a plain average of the conditional fields, but a posterior average, weighted by which phases could plausibly have produced the point we're standing at:

$$u_t^{\mathrm{marg}}(x) = \mathbb{E}[u_t(x \mid \Phi) \mid X_t = x].$$

Written as an integral:

$$u_t^{\mathrm{marg}}(x) = \frac{\int u_t(x \mid \phi)\, p_t(x \mid \phi)\, p(\phi)\, d\phi}{\int p_t(x \mid \phi)\, p(\phi)\, d\phi}.$$

In other words: given that a particle sits at $x$, average the velocities of all the phases that could have put it there, weighted by how likely each one is. If $x$ is near some part of the curve, the conditional fields for nearby phases dominate the average.

This isn't a heuristic. The marginal field is exactly the field that transports the marginal density. This is shown by demonstrating that the following continuity equation holds:

$$\partial_t p_t(x) = - \nabla \cdot \bigl(p_t(x)\, u_t^{\mathrm{marg}}(x)\bigr).$$

At this stage, we actually don't need to compute this integral explicitly. We can move straight to fitting a neural network to this field.

### Simulating the Time-Dependent Flow

To test it I picked a nonplanar "crown" loop in $\mathbb{R}^3$, a circle with three vertical waves, and trained a small network on it:

$$\gamma(\theta) = \bigl(\cos \theta,\; \sin \theta,\; 0.35 \sin 3\theta\bigr).$$

<figure>
<img src="/assets/images/flow-matching-crown3d-nonauto-t8.gif" alt="Trajectories converging onto the 3D crown curve under the learned time-dependent field" style="max-width: 680px;" />
<figcaption>

Trajectories from noise under the learned time-dependent marginal field $v_\theta(x, t)$, rendered out to $t = 8$.

</figcaption>
</figure>


Training follows the standard conditional flow matching recipe, and it's short enough to describe completely. Each step:

1. Sample a batch of phases $\phi \sim \mathrm{Unif}[0, 2\pi)$, times $t \sim \mathrm{Unif}[0, 8]$, and noise $\varepsilon \sim \mathcal{N}(0, I_3)$.
2. Construct the point $x_t = \alpha_t\, \gamma(\omega t + \phi) + \beta_t\, \varepsilon$, a sample from the conditional path.
3. Regress: minimize $\|v_\theta(x_t, t) - u_t(x_t \mid \phi)\|^2$, where the target is the conditional field derived above (which we have in closed form). See the [MIT lecture notes](https://diffusion.csail.mit.edu/2026/docs/lecture_notes.pdf) for an explanation of why we can regress against the conditional field rather than the marginal field.

Notice that there is no ODE solving during training and no simulation in the loop. The network never sees $\phi$, which is exactly why it converges to the marginal field rather than to any one conditional field. The network itself is deliberately tiny: an MLP taking $(x, t)$ with a few narrow hidden layers (SiLU activations). I used $\omega = \pi/2$ and $\tau = 1$.

To make the animation, I then draw 256 particles from $\mathcal{N}(0, I_3)$ and integrate $\dot{x} = v_\theta(x, t)$ with a fixed-step RK4 integrator ($dt = 0.01$), rendering the cloud as it evolves.

## The Marginal Flow Approaches a Steady Flow

At this point we have a flow that drives trajectories onto the curve, but one that still depends on time. Watching the simulation, though, something curious happens. After the initial collapse onto the curve, the field seems to stop changing and the cloud just circulates. That suggests the time-dependent marginal flow is settling into a *steady* flow (time-independent vector field), and it turns out we can show exactly that.

Time enters the marginal field in two distinct ways: through the rotating target $\gamma(\omega t + \phi)$, and through the schedules $\alpha_t, \beta_t$. The two disappear by completely different mechanisms: the first exactly, by symmetry, and the second asymptotically, by concentration. We take them in turn.

**Step 1: the rotation dies exactly, by symmetry.** Substitute

$$\theta = \omega t + \phi \pmod{2\pi}.$$

Since $\phi$ is uniform on the circle and the uniform measure is rotation-invariant, $\theta$ is also uniform, for every $t$. The same integral rewritten over $\theta$ has

$$p_t(x \mid \theta) = \mathcal{N}\bigl(\alpha_t \gamma(\theta),\; \beta_t^2 I_d\bigr), \qquad u_t(x \mid \theta) = -\tfrac{1}{\tau}\bigl(x - \gamma(\theta)\bigr) + \omega \alpha_t \gamma'(\theta),$$

and $\omega t$ has vanished. The only remaining time dependence is through $\alpha_t$ and $\beta_t$.

In other words, at any instant the ensemble of "which point is being chased" looks statistically identical. The rotation was only ever visible *conditionally*, and averaging over a uniform phase erases it. (This step leans entirely on the phase prior being uniform. Any other prior would leave a rotating lump in the weights, and the argument would fail.)

**Step 2: reorganize as a posterior expectation.** Define the Bayes weights

$$w_t(\theta \mid x) \;\propto\; \exp\!\left(-\frac{\|x - \alpha_t \gamma(\theta)\|^2}{2\beta_t^2}\right),$$

so that

$$u_t^{\mathrm{marg}}(x) = \int \left[-\tfrac{1}{\tau}\bigl(x - \gamma(\theta)\bigr) + \omega\alpha_t\gamma'(\theta)\right] w_t(\theta \mid x)\, d\theta.$$

**Step 3: the schedule dies asymptotically, by concentration.** As $\beta_t \to 0$ this is a Gibbs distribution at vanishing temperature: the weight piles exponentially onto whichever $\theta$ minimizes $\|x - \alpha_t\gamma(\theta)\|^2$, and since $\alpha_t \to 1$, those minimizers converge to the nearest points on the curve.

**Step 4: at regular points, the posterior collapses.** If $x$ has a unique nearest point $\pi(x) = \gamma(\theta_x)$:

$$u_\infty(x) = -\frac{1}{\tau}\bigl(x - \pi(x)\bigr) + \omega\,\gamma'(\theta_x).$$

This is the same two-piece structure as the conditional field, but now aimed at the *nearest point* on the curve rather than at a latent moving target. There's no phase left to condition on, and no schedule left to run. On the curve itself the normal term vanishes and $u_\infty(\gamma(\theta)) = \omega\,\gamma'(\theta)$, so the curve is an orbit of the limiting field.

Steps 1 and 2 are exact algebra, but Steps 3 and 4 are a concentration argument at physics-level rigor: I believe the conclusion at regular points, but it breaks down exactly where you'd expect, at points equidistant from multiple parts of the curve, where the posterior refuses to pick a single branch and the limit is a blend of competing velocities.

## Using the Limit for All Time

We derived $u_\infty$ as a $t \to \infty$ limit, but nothing stops us from simply *using* it as the field for all time, starting from noise at $t = 0$:

$$\frac{dx}{dt} = u_\infty(x).$$

This is the autonomous ODE I set out to construct. The follow-the-curve guarantee from earlier belonged to the time-dependent flow; the continuity equation says nothing about running the limiting field from $t = 0$. So what follows is an experiment, but one piece of theory backs it up.

### Orbital Stability: A Stable Limit Cycle in the Tube

Here is a short argument, at the same physics level as the rest of this post, that the curve is a stable limit cycle of $u_\infty$. Track half the squared distance to the curve $\Gamma$ along a trajectory:

$$V(x) = \tfrac{1}{2}\,\mathrm{dist}(x, \Gamma)^2.$$

Stay in a thin tube around the curve, close enough that the nearest point $\pi(x) = \gamma(\theta_x)$ is unique. Two geometric facts do all the work there. The gradient of $V$ is the vector from the nearest point back to $x$,

$$\nabla V(x) = x - \pi(x),$$

and that vector is perpendicular to the tangent $\gamma'(\theta_x)$ — if it weren't, sliding the foot of the segment along the curve would find a closer point. Now differentiate $V$ along a trajectory: the perpendicularity kills the tangential term, and the normal term hands back $V$ itself:

$$\dot{V} \;=\; \Bigl\langle x - \pi(x),\; -\tfrac{1}{\tau}\bigl(x - \pi(x)\bigr) + \omega\,\gamma'(\theta_x) \Bigr\rangle \;=\; -\tfrac{2}{\tau}\,V.$$

This is an exact identity, not a bound: inside the tube, distance to the curve decays as $e^{-t/\tau}$, everywhere at the same rate. Notice how the two-piece structure splits the labor — the normal term does all the stabilizing, while the tangential term only sets the speed of traffic around the loop. And since the normal term vanishes on the curve itself, the curve is a periodic orbit. A periodic orbit whose neighborhood drains onto it exponentially is a **stable limit cycle**.

The argument is local by construction: it lives in the tube where the nearest point is unique, and says nothing at points tied between two parts of the curve, where $u_\infty$ is discontinuous. Starting from noise, far away, do trajectories converge? That *global* question is not proven (maybe the reader can try!). I'm content for now just trying it out in simulation.

### Simulating the Autonomous Field

The deliverable is an autonomous ODE I can actually run: a compact, differentiable network $v(x)$ approximating $u_\infty$, with no time input and no lookup table to carry around.

For the time-dependent field above I used the standard flow-matching move, regressing against the conditional field and letting the hidden phase average into the marginal. That trick earns its keep when the target is a field you *cannot* write down. Here we can: $u_\infty(x) = -\tfrac{1}{\tau}(x - \pi(x)) + \omega\gamma'(\theta_x)$ is closed form, needing only the nearest point $\pi(x)$ on the known curve. So there is nothing to gain from the conditional trick, and worse, it would hand back a smoothed version of $u_\infty$ rather than the sharp field. Instead I regress on $u_\infty$ directly: sample points $x$ at a range of distances from the curve, evaluate the exact $u_\infty(x)$ at each by nearest-point lookup, and fit $v$ to it.

In practice, I didn't have an issue with discontinuities or points equidistant from the curve. If a given curve presented this issue, we could regress against a smoothed version which would be equivalent to the marginal time-dependent field fixed at some large finite time $T$.

The gain is that this decouples where I sample from what I fit. Sampling only has to cover where trajectories go, from right on the curve out to where noise starts, while the target is the sharp $u_\infty$ everywhere, so nothing gets smoothed. A small MLP, on the order of $10^4$ parameters, trained this way gives an autonomous field with no time input anywhere. The only gap left is the network's own fitting error, with no formal guarantee that the learned field keeps the curve as a stable limit cycle, only the objective's promise that $v \approx u_\infty$. To draw a simulation I integrate $\dot{x} = v(x)$ from pure noise with a fixed-step RK4 solver.

## Gallery

The learned autonomous field integrated from pure noise, on six target curves. Each is its own network, trained by the recipe above; the only thing that changes is $\gamma$.

### The Crown

$$\gamma(\theta) = \bigl(\cos \theta,\; \sin \theta,\; 0.35 \sin 3\theta\bigr).$$

<figure>
<img src="/assets/images/flow-matching-crown3d-uinf-learned-t20.gif" alt="Trajectories converging onto the crown curve under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the crown, out to $t = 20$.

</figcaption>
</figure>

### The Trefoil Knot

$$\gamma(\theta) = s\bigl(\sin \theta + 2\sin 2\theta,\; \cos \theta - 2\cos 2\theta,\; -\sin 3\theta\bigr), \qquad s = 0.45.$$

<figure>
<img src="/assets/images/flow-matching-trefoil3d-uinf-learned-t20.gif" alt="Trajectories converging onto the trefoil knot under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the trefoil knot, out to $t = 20$.

</figcaption>
</figure>

### The Loop

$$\gamma(\theta) = \bigl(\cos \theta,\; 0.72 \sin \theta,\; 0.35 \sin 2\theta\bigr).$$

<figure>
<img src="/assets/images/flow-matching-loop3d-uinf-learned-t20.gif" alt="Trajectories converging onto the loop curve under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the loop, out to $t = 20$.

</figcaption>
</figure>

### The Rose

$$\gamma(\theta) = \bigl(r\cos \theta,\; r\sin \theta,\; 0.35 \sin 5\theta\bigr), \qquad r = 1 + 0.35 \cos 5\theta.$$

<figure>
<img src="/assets/images/flow-matching-rose3d-uinf-learned-t20.gif" alt="Trajectories converging onto the rose curve under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the rose, out to $t = 20$.

</figcaption>
</figure>

### The Figure-Eight Knot

$$\gamma(\theta) = s\bigl((2 + \cos 2\theta)\cos 3\theta,\; (2 + \cos 2\theta)\sin 3\theta,\; \sin 4\theta\bigr), \qquad s = 0.6.$$

<figure>
<img src="/assets/images/flow-matching-figure8-uinf-learned-t20.gif" alt="Trajectories converging onto the figure-eight knot under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the figure-eight knot, out to $t = 20$.

</figcaption>
</figure>

### The Baseball Seam

$$\gamma(\theta) = \bigl(a\cos \theta + b\cos 3\theta,\; a\sin \theta - b\sin 3\theta,\; 2\sqrt{ab}\,\sin 2\theta\bigr), \qquad a = 0.6,\; b = 0.4.$$

<figure>
<img src="/assets/images/flow-matching-baseball-uinf-learned-t20.gif" alt="Trajectories converging onto the baseball seam curve under a learned autonomous field" style="max-width: 520px;" />
<figcaption>

Trajectories from noise onto the baseball seam, out to $t = 20$.

</figcaption>
</figure>

## What's next?

Next, I want to see if I can distill $u_\infty$ as a low-order ODE that is buildable with a few analog components like in the Lorenz circuit. The [SINDy algorithm](https://arxiv.org/abs/1509.03580) (sparse identification of nonlinear dynamics) looks like the right tool, and that's where I want to take this next. With a low-order distilled ODE, this could also give us hope to show global stability beyond the local arguments here.


