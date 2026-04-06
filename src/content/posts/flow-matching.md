---
title: "Can we construct an ODE that follows a prescribed limit cycle?"
date: 2026-03-23
category: Machine Learning
excerpt: "Constructing an ODE that attaches to a prescribed curve — using flow-matching machinery to derive a marginal vector field that generates a limit cycle from pure noise."
thumbnail: "/assets/images/flow-matching-loop3d-still.png"
thumbnailAlt: "Learned trajectories converging onto a nonplanar 3D loop"
---

<figure>
<img src="/assets/images/flow-matching-loop3d-t10.gif" alt="Learned flow trajectories converging onto a 3D loop" style="max-width: 520px;" />
<figcaption>Trajectories under the learned ODE converging onto the target 3D loop.</figcaption>
</figure>

Differential equation systems of the form:

$$ \frac{dx}{dt} = f(x) $$

describe how a trajectory $x(t)$ evolves over time. At each instant in time, the above equation specifies the velocity vector at $x(t)$ and we can integrate this in time. What happens in the long run for these systems? The regions of state space where these trajectories converge are known as an [attractor](https://en.wikipedia.org/wiki/Attractor). Trajectories may converge to a single point, to a periodic [limit cycle](https://en.wikipedia.org/wiki/Limit_cycle) (a closed trajectory in state space), or to fascinating structures known as strange attractors like the famous [Lorenz](https://en.wikipedia.org/wiki/Lorenz_system) attractor. 

Usually, we have a system that is known and we want to discover its attractor and long-term behavior. I got curious about a reversed situation: Given a curve, could I construct a differential equation that has this curve as its limit cycle?

I started thinking about this after reading a post from [Unconventional AI](https://www.linkedin.com/pulse/steering-future-computing-experiment-oscillators-unconvai-e2ibc/) where they steered a small oscillator system so its trajectory swept out a target pattern. I wondered whether flow-matching ideas — the same machinery behind modern generative models — could get you to a similar place, but from a different angle.

This post is a record of that exploration. I didn't do a thorough literature search beforehand, so if you know of published work along these lines, I'd appreciate a pointer — please reach out and I'll add references.

The post has two parts. The first builds a time-dependent flow that learns to chase a curve. The second asks what happens in the long-time limit — and finds that the flow becomes autonomous, giving us a static vector field that acts as a curve attractor and gets us to our goal.

## Chasing a Moving Target

Here's the basic picture. Imagine a cloud of particles scattered randomly in space. I want a velocity field that makes them all converge onto a prescribed closed curve and then circulate along it. That's a limit cycle in dynamical systems language.

The approach I'll take is to parametrize the velocity field with a small neural network $u_\theta(x, t)$ and train it using flow matching. But before getting into the learning, it helps to design the target behavior we want the network to reproduce.

### One Point at a Time

Start simple. Instead of trying to cover the whole curve at once, pick a single point on it and ask everything to chase that point.

Fix a latent phase $\phi$ and let it select a point on the curve $\gamma$ that moves over time:

$$z_t(\phi) = \gamma(\omega t + \phi).$$


This gives a target that slides around the curve as $t$ increases. Now specify what the particle cloud should do: follow a Gaussian distribution whose mean tracks the moving point while the variance shrinks, concentrating the cloud onto the target over time:

$$X_t = \alpha_t z_t(\phi) + \beta_t \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I_d),$$

with

$$\alpha_t = 1 - e^{-t/\tau}, \qquad \beta_t = e^{-t/\tau}.$$

At early times, $\beta_t$ is large and the distribution is mostly noise. As time increases, $\beta_t$ decays toward zero and the cloud tightens around the moving point on the curve.

<figure>
<img src="/assets/images/flow-matching-probability-path.gif" alt="Conditional probability path: Gaussian cloud converging to a moving target" style="max-width: 760px;" />
<figcaption>The conditional probability path: a Gaussian cloud whose mean follows the moving target point while the variance shrinks over time.</figcaption>
</figure>

### The Velocity That Does It

Given that probability path, what velocity field generates it? The conditional flow map is

$$\psi_t(x_0 \mid \phi) = \alpha_t \gamma(\omega t + \phi) + \beta_t x_0.$$

Differentiating with respect to time:

$$\frac{d}{dt}\psi_t(x_0 \mid \phi) = \dot{\alpha}_t \gamma(\omega t + \phi) + \alpha_t \omega \gamma'(\omega t + \phi) + \dot{\beta}_t x_0.$$

Eliminating the initial point by substituting $x_0 = (x - \alpha_t \gamma(\omega t + \phi)) / \beta_t$, and using $\dot{\beta}_t / \beta_t = -1/\tau$:

$$u_t(x \mid \phi) = -\frac{1}{\tau}(x - z_t(\phi)) + \omega \alpha_t \gamma'(\omega t + \phi).$$

This has exactly two pieces, each doing something clear:

- a **normal term** $-\frac{1}{\tau}(x - z_t(\phi))$ that pulls the particle toward the moving target
- a **tangential term** $\omega \alpha_t \gamma'(\omega t + \phi)$ that pushes it along the curve

That decomposition is satisfying because it mirrors the intuitive picture — attraction inward, transport along. The math didn't just produce *some* velocity field; it produced one with the structure we'd want to design by hand.

<figure>
<img src="/assets/images/flow-matching-conditional-theory.gif" alt="Animated conditional flow matching showing convergence to a moving target" style="max-width: 760px;" />
<figcaption>Trajectories under the conditional field $u_t(x \mid \phi)$ for one fixed phase $\phi$, together with the moving target point $z_t(\phi)$.</figcaption>
</figure>

<figure>
<img src="/assets/images/flow-matching-theory-diagram.svg" alt="Diagram showing conditional and marginal probability paths and vector fields" style="max-width: 760px; background: #131b24; padding: 1rem;" />
<figcaption>From conditional to marginal: the probability path and its associated vector field, connected by averaging over the latent phase.</figcaption>
</figure>

### What If We Don't Know Which Point?

The conditional field above works perfectly for one fixed phase $\phi$. But we don't want to track a single point — we want the whole curve covered. The question becomes: what happens when we don't know which point on the curve a particle is supposed to be chasing?

The answer is to make $\phi$ a latent random variable. Draw

$$\Phi \sim \mathrm{Unif}[0, 2\pi),$$

and average the conditional probability path over all possible phases:

$$p_t(x) = \int p_t(x \mid \phi)\, p(\phi)\, d\phi.$$

Instead of one cloud chasing one point, this gives mass spread all around the curve. Early on, the distribution looks diffuse. As time increases, it contracts toward a narrow band wrapped around the entire target curve.

<figure>
<img src="/assets/images/flow-matching-marginal-probability-path.gif" alt="Marginal probability path showing mass concentrating around the full curve" style="max-width: 760px;" />
<figcaption>The marginal probability path: after averaging over latent phase, the mass concentrates around the whole curve rather than tracking a single point.</figcaption>
</figure>

### The Marginal Field

Once we know the marginal distribution we want, we need the velocity field that transports it. The right construction is to take a posterior average of the conditional fields — weighting each conditional field by how likely that particular phase is, given the observed position:

$$u_t^{\mathrm{marg}}(x) = \mathbb{E}[u_t(x \mid \Phi) \mid X_t = x].$$

Written as an integral:

$$u_t^{\mathrm{marg}}(x) = \frac{\int u_t(x \mid \phi)\, p_t(x \mid \phi)\, p(\phi)\, d\phi}{\int p_t(x \mid \phi)\, p(\phi)\, d\phi}.$$

Nearby phases contribute more strongly to the field than distant ones. If you're sitting close to some part of the curve, the conditional fields corresponding to nearby curve points dominate the average.

This isn't a heuristic. The continuity equation confirms it:

$$\partial_t p_t(x) = - \nabla \cdot \bigl(p_t(x)\, u_t^{\mathrm{marg}}(x)\bigr).$$

The marginal density evolves under the marginal field exactly as required.

### What the Network Learns

A small neural network $v_\theta(x,t)$ is trained by regressing against the conditional velocity targets. But here's the key point: the network only sees $(x,t)$ as input — not the latent phase $\phi$ that generated each training example. So what it actually converges to is the marginal field, not any single conditional field.

The long-time picture is then:

- the marginal density concentrates onto the image of $\gamma$
- the marginal field approaches a steady flow with attraction toward the curve in the normal direction and transport along the curve in the tangential direction

### The 3D Experiment

The main visual test is a nonplanar loop in $\mathbb{R}^3$, using a network with just **2,371 parameters**:

$$\gamma(\theta) = \bigl(\cos \theta,\; 0.72 \sin \theta,\; 0.35 \sin 2\theta\bigr).$$

The video below shows trajectories under the learned ODE. The camera rotates so the full 3D geometry stays visible.

<figure>
<video controls playsinline preload="metadata" style="max-width: 680px;">
  <source src="/assets/videos/flow-matching-loop3d-t10.mp4" type="video/mp4" />
</video>
<figcaption>Learned nonautonomous ODE on the target 3D loop, rendered out to $t = 10$.</figcaption>
</figure>

This demonstrates that a small learned velocity field can generate a visually coherent curve-following flow — and that the object being learned is the marginal field, not the conditional one.

## Where Does the Flow End Up?

Everything above depends on time. The network takes $(x, t)$ as input, and the velocity field changes as $t$ grows. But look at what happens to the marginal field in the large-$t$ limit.

As $t \to \infty$, the schedule coefficients approach their limits: $\alpha_t \to 1$ and $\beta_t \to 0$. The conditional density $p_t(x \mid \phi)$ concentrates tightly around the moving target point $z_t(\phi) = \gamma(\omega t + \phi)$, becoming a narrow Gaussian peaked near the curve.

The time dependence enters the marginal integral through $z_t(\phi) = \gamma(\omega t + \phi)$. But since $\phi$ is drawn uniformly from $[0, 2\pi)$, the substitution $\phi' = \omega t + \phi$ simply shifts a uniform distribution — and a uniform distribution on a circle is invariant to shifts. The integral over $\phi$ absorbs the time dependence entirely.

So the marginal field becomes stationary. The time-dependent flow converges to an autonomous vector field — one that attracts toward the curve and circulates along it, with no external clock required.

I tested this empirically by comparing three objects at longer time horizons:

- direct samples from the analytically defined target marginal at final time $T$
- samples from the learned **nonautonomous** ODE $\dot{X}_t = v_\theta(X_t, t)$
- samples from a frozen **autonomous** approximation using the final-time field $\dot{X} = v_\theta(X, T)$

<figure>
<img src="/assets/images/flow-matching-loop3d-long-compare.png" alt="Comparison of ground truth, learned nonautonomous, and frozen autonomous flows" style="max-width: 720px;" />
<figcaption>Ground truth, learned nonautonomous flow, and frozen autonomous approximation. The frozen field works because at large $t$ the flow is already nearly stationary.</figcaption>
</figure>

The frozen field is not always a perfect stand-in — in some 2D cases it's noticeably worse. But for the 3D loop, the frozen approximation came surprisingly close to the full nonautonomous dynamics. That's consistent with the stationarity argument: by the time $t$ is large enough, the field has already settled into its limiting form.

## The Limiting Field

The stationarity argument above suggests we can build the autonomous field directly, rather than extracting it from a time-dependent flow. Here's how.

### The Autonomous Construction

For each phase $\theta$ on the curve, define a local conditional field that attracts toward the curve point and pushes along the tangent:

$$u(x \mid \theta) = -\lambda\bigl(x - \gamma(\theta)\bigr) + \omega\, T(\theta),$$

where $T(\theta)$ is the unit tangent vector at $\gamma(\theta)$. This is the same normal-plus-tangential structure we derived in the time-dependent case, but without the schedule — no $\alpha_t$, no $\beta_t$, no time.

The full autonomous field is the posterior average over curve phases, weighted by how close each curve point is to the query position:

$$u(x) = \sum_k a_k(x)\, u(x \mid \theta_k), \qquad a_k(x) \propto \exp\!\left(-\frac{\|x - \gamma(\theta_k)\|^2}{2\sigma^2}\right).$$

This is the same posterior-averaging move from the first part of the post, applied without time. Nearby curve phases dominate; distant ones are downweighted exponentially.

### Two Ways to Compute It

**Kernel field.** Precompute a set of curve points and their tangent vectors. At query time, evaluate the field by softmax-weighting over all stored curve samples. No training needed — it's an explicit construction. The cost is linear in the number of stored samples.

**Learned neural field.** Train a small MLP to regress against the conditional targets, sampling training points near the curve: $x = \gamma(\theta) + \sigma\varepsilon$. The network learns the posterior-averaged field implicitly. Inference cost is constant regardless of curve resolution.

### Circle Results

The simplest test case is the unit circle with $\lambda = 2.0$, $\omega = 1.0$, $\sigma = 0.3$. The figure below shows the explicit kernel field and the learned neural field side by side, along with sample trajectories and training loss.

<figure>
<img src="/assets/images/flow-matching-autonomous-circle.png" alt="Autonomous limit cycle on the circle: explicit kernel field vs learned neural field" style="max-width: 760px;" />
<figcaption>Autonomous circle attractor. Left: explicit kernel field. Center: learned neural field. Right: training loss. Both fields produce nearly identical inward-spiraling trajectories that settle onto the circular orbit.</figcaption>
</figure>

The two fields are nearly identical — both produce clean inward spirals that settle onto the circular orbit. The learned field loss stabilizes around $0.45$–$0.55$, and the resulting streamlines are visually indistinguishable from the exact kernel construction.

### What This Means

The posterior-mean viewpoint is the thread connecting both parts of this post. In the time-dependent flow, the network learns an expected velocity after marginalizing over latent phase. In the autonomous field, we build the same thing directly — averaging local attraction-plus-tangent fields over plausible phases, weighted by proximity. The difference is just whether time enters the construction or not.

The autonomous limit isn't a separate trick. It's where the nonautonomous flow was always headed.

---

*Views expressed here are my own and do not reflect those of my employer.*
