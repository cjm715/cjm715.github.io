---
title: "Thermodynamic computing on an FPAA"
date: 2026-09-03
category: Analog Computing
excerpt: "A field programmable analog array that computes by settling into equilibrium, and, once noise is injected, samples a matrix inverse from the fluctuations of its state."
thumbnail: "/assets/images/fpaa-an221k04-board.jpg"
thumbnailAlt: "An Anadigm AN221E04 field programmable analog array on its development board, with jumper wires running to its header"
---

<figure>
<img src="/assets/images/fpaa-an221k04-board.jpg" alt="An Anadigm AN221E04 field programmable analog array on its development board, with jumper wires running to its header" style="max-width: 100%;" />
<figcaption>The AN221E04 on its development board. The jumpers carry the noise in and the states back out.</figcaption>
</figure>

Here I dive into the world of thermodynamic computing realized on a field programmable analog array, or FPAA for short.

First, I want to introduce these possibly foreign concepts to the reader who may have stumbled upon this page. What is an FPAA exactly? What is thermodynamic computing?

An FPAA is the analog version of its cousin the FPGA, the field programmable gate array, which is aimed at digital design. An FPAA allows for prototyping analog circuits in software and reconfiguring an analog circuit design over USB. This allows for quick prototyping of various designs without having to physically wire each design on a breadboard or PCB by hand. I'm using an AN221E04 (quite an old board released in 2004) which internally has analog components (such as amplifiers, capacitors, summers, integrators, and so on) that can be wired and parameterized in software. It has configurable analog blocks (CABs) connected through a programmable routing network. Many functions are implemented using switched-capacitor techniques. A switched-capacitor circuit uses a capacitor and periodically controlled switches to move charge in discrete steps, which makes it behave like a programmable resistor or other analog element.

What is thermodynamic computing? It is a form of computing that uses noise as a computational resource. This processing unit is based on the design of Normal Computing's SPU (their first prototype before their more recent processor CN101). My goal here is to implement the same SDEs and ODEs. However, the mapping to hardware is very different between the SPU and the FPAA. The SPU constructs the ODE physically through a network of capacitors and resistors, while the FPAA uses switched-capacitor components to mimic op-amp circuit design. The SPU handles both underdamped and overdamped cases of the Langevin dynamics, while the build here implements the overdamped case only. The FPAA doesn't have a native noise source on chip, so I create a pseudorandom Gaussian noise source that is streamed via a DAQ (data acquisition) device. This DAQ can both output analog signals and receive inputs from the FPAA chip so I can analyze the results.

The goal of this project is to build out my own thermodynamic processing unit on an FPAA so that I can have a test bed for exploring this field further. I tend to learn better by building. In this project, I implement the following linear algebra algorithms from Normal Computing's [work here](https://arxiv.org/abs/2308.05660):
- $A^{-1}$ algorithm
- $Ax = b$ solver

Inspired by the $Ax = b$ solver, I also consider a class of problems that operate under the same principles and give a dynamical systems stability perspective on how they work. These algorithms include:
- Finding the roots of a quadratic polynomial: $ax^2 + bx + c = 0$
- $\sqrt{x}$
- Reciprocal $1/x$

Lastly, I explore the idea of composing functions and show how you can construct $1/\sqrt{x}$ from the above primitives.

# Build

### Reconfiguring the chip from a script

The design tool for the FPAA, AnadigmDesigner2, is a GUI you'd normally click through: drag blocks onto a schematic, set parameters in dialog boxes, hit a button to send it to the board. It also exposes a COM automation interface, and the language it expects is VBScript. So instead of clicking, I have Python write the VBScript.

A small model of the circuit works out where each block goes, what its parameters are and what connects to what, and emits a script that adds the chip, places the blocks, wires their contacts, sets the clocks and tells the chip to download. Running that script sends the design to the board with me out of the loop.

Placement and wiring only need to happen once. After that the script loops over however many systems it was handed, changing parameters and downloading a fresh bitstream each time, so the tool starts once rather than once per point. That's what makes a sweep of a few hundred configurations possible.

The conversion from an SDE form to a circuit of integrators, summers, and multipliers is very similar to the method I used in my previous post on [solving the Lorenz equations with an analog circuit](/posts/lorenz).

<figure>
<img src="/assets/images/fpaa-ad2-solver3-schematic.png" alt="AnadigmDesigner2 schematic view showing three summing stages and three integrators wired into a routed three state linear solver" style="max-width: 400px;" />
<figcaption>What the script produces: three summing stages in green feeding three integrators in pink, placed and routed.</figcaption>
</figure>


### Setting up the noise

The chip has no noise source of its own, so the DAQ makes it. Three of its analog outputs stream independent seeded Gaussian sequences, one into each state.

What the chip receives isn't quite white noise though. The DAC picks a new value every 10 µs and holds it flat in between, so it's really a staircase. The step height, 150 mV here, and the step width together set the effective temperature, a single noise strength $D$ that the results below depend on.

<figure>
<img src="/assets/images/fpaa-scope-noise.png" alt="Oscilloscope screen showing two noise channels and an XY plot of one against the other forming a round blob" style="max-width: 560px;" />
<figcaption>Two of the three sources on the scope. Plotting one against the other gives a round blob, which is what uncorrelated noise looks like.</figcaption>
</figure>

Reading the answer back out goes through the same DAQ. Each state leaves the chip as a differential pair of pins sitting either side of a mid-rail reference, so the state is the difference between them, and the DAQ digitizes both.

<figure>
<img src="/assets/images/fpaa-bench.jpg" alt="The bench: the FPAA board on the left, the DAQ in the middle, a multimeter on the right, and a breadboard above them carrying jumper wires" style="max-width: 100%;" />
<figcaption>The whole bench. FPAA board on the left, DAQ in the middle, multimeter on the right. The breadboard up top is just to share common circuit nodes between the board's header and the DAQ's screw terminals.</figcaption>
</figure>

### Key differences between FPAA and SPU

Here are some key differences between the FPAA and SPU designs.

| | SPU | FPAA |
|---|---|---|
| unit cell | LC resonator, noise current source | summing stage + integrator |
| dynamics | second order, underdamped | first order, the overdamped equation directly |
| matrix realized as | capacitor bank | switched-capacitor design |
| noise | FPGA | DAQ |
| readout | onboard ADC, 12 MHz | external DAQ, 50 kS/s |
| size | 8 cells | 3 states |

# Results

### Computing $A^{-1}$

The inverse and the solve come from the same circuit, and in fact from the same run. One summing stage and one integrator per row of the matrix build

$$dz = (-Az + b)\,dt + \sqrt{2D}\;dW,$$

where $W$ is a Wiener process and $D$ is the diffusion coefficient. For symmetric positive definite $A$ this settles into a stationary distribution

$$z \sim \mathcal{N}\!\left(A^{-1}b,\; DA^{-1}\right),$$

and both of its moments are answers. The mean is the solution to $Ax = b$. The covariance, divided by $D$, is the inverse. So one capture of the fluctuating state gives both: the average of the samples and their spread.

Ten seconds of samples gave the inverse to 1.4%. Measuring it the obvious way instead, one column at a time by solving with $b$ set to each unit vector, needs three separate builds and landed at 3.4%.

<figure>
<img src="/assets/images/fpaa-covariance.png" alt="Three panels: a cloud of sampled circuit states, and two 3 by 3 heatmaps comparing the measured inverse against the expected one" style="max-width: 100%;" />
<figcaption>Left: the circuit wandering. Right: the inverse recovered from that cloud, next to the answer, with nothing fitted.</figcaption>
</figure>

If the solve is all you're after, you can turn the noise source off. Some noise is always left even then, but what remains follows $\dot z = -Az + b$ closely enough that the circuit settles at $A^{-1}b$ and stays there, so the answer is read directly instead of averaged out of a cloud. That's how I ran the sweep: over 24 random symmetric positive definite systems the median error was 6.4% and the worst 19.6%, uncorrected.

Solving $Ax = b$ is the same thing as minimizing the quadratic $\tfrac12 x^{\top}\!Ax - b^{\top}x$, whose gradient is exactly $Ax - b$. So the circuit is rolling downhill on that surface, and its trajectories are gradient flow. To watch it I slowed a two state solver to about a millisecond and kicked it out to twelve starting points, using the noise inputs as a step generator rather than a noise source, then released it.

<figure>
<img src="/assets/images/fpaa-qp-converge.png" alt="Twelve measured trajectories in the x1 x2 plane curving inward to a common point over elliptical contours, and the same runs plotted against time" style="max-width: 100%;" />
<figcaption>Twelve releases, all converging in about a millisecond, crossing the contours at right angles as gradient flow should. The circuit lands a little off the true minimum, which is the same additive offset that limits every deterministic measurement here.</figcaption>
</figure>

The trajectories are worth more than the endpoint. Fitting $\dot x = -Ax$ to them recovers the matrix itself, not just $A^{-1}b$, and it comes back symmetric and within 2.6% of what I asked for, with every entry low by about the same few percent as the gains elsewhere in this post.

The two moments of that one capture are worth comparing. Its mean is off by more than a third on the middle state, while the covariance built from those very same samples is right to 1.4%. A covariance is measured about the sample mean, so a constant offset subtracts out of it exactly, and the error that dominates the first moment doesn't appear in the second at all.

### Algorithms based on stable fixed points of an ODE

The $Ax = b$ result doesn't really depend on the equation being linear. Any $\dot x = f(x)$ ends up at a root of $f$, provided that root is stable, meaning $f'(x^*) < 0$ so small displacements decay, and provided you start inside its basin. So if you can build a circuit whose $f$ has your answer as a root, the circuit computes it by relaxing. Here are three.

#### Roots of a quadratic polynomial

$$\dot x = s\,(ax^2 + bx + c), \qquad s = \pm 1.$$

The fixed points are the two roots. Differentiating at a root gives $s\,a\,(x_\pm - x_\mp)$, which has opposite signs at the two roots, so exactly one of them is stable and which one depends on the sign of $s$. Flipping the sign of the whole right hand side moves the circuit to the other root, and both roots come out of one design.

<figure>
<img src="/assets/images/fpaa-quadratic-concept.png" alt="Two phase line plots of the same quadratic with the sign of the right hand side flipped, a different root stable in each" style="max-width: 680px;" />
<figcaption>The same quadratic, sign flipped. Filled dot is the stable root, arrows show which way the state moves.</figcaption>
</figure>

The integrator starts at zero, so the roots have to straddle zero for the circuit to reach them from there. Over ten root pairs at each sign, the largest error in the twenty measurements was 41 mV.

#### Square root

$$\dot z = a - z^2 \;\longrightarrow\; z^* = \sqrt{a}.$$

Two fixed points, at plus and minus the root, and only the positive one is stable, so a circuit started from zero can only land there. One multiplier squares the state and a summing stage subtracts it from the input.

<figure>
<img src="/assets/images/fpaa-op-sqrt.png" alt="Measured settled voltage against the input, following a square root curve" style="max-width: 460px;" />
<figcaption>24 inputs. The curve is the exact answer for the gains the chip actually built, not for the ones requested.</figcaption>
</figure>

#### Reciprocal

$$\dot x = 1 - bx \;\longrightarrow\; x^* = 1/b.$$

The linear solver with a single state, and the cheapest circuit here: no multiplier at all, since the only product it needs is the state times a fixed gain.

<figure>
<img src="/assets/images/fpaa-op-recip.png" alt="Measured settled voltage against the divisor, following a reciprocal curve" style="max-width: 460px;" />
<figcaption>14 divisors from 0.8 to 3. Errors stay under 1.4%, the best of the three.</figcaption>
</figure>

### Composition

Wire the output of one of these circuits into the other and you don't get two circuits, you get one coupled system:

$$\begin{aligned} \dot z &= a - z^2, \\ \dot x &= c - z\,x, \end{aligned}$$

whose fixed point is $z^* = \sqrt{a}$ and $x^* = c/\sqrt{a}$. The two stages evolve simultaneously, not one after the other.

You can see that in how they settle. I'd assumed the second stage would lag, since the linearized eigenvalues are $-2z^*$ and $-z^*$, so there is a slower mode available. It never shows up. With both integrators starting from zero, substituting $x = (c/a)z$ satisfies the second equation exactly, so $x(t)$ is a rescaled copy of $z(t)$ for all time: same shape, same rate, different amplitude. Not a second stage trailing the first.

Over 12 values of $a$, the square root stage alone was off by 1.2% rms and the composed output by 1.3%.

<figure>
<img src="/assets/images/fpaa-op-invsqrt.png" alt="Measured settled voltage against the input, following an inverse square root curve" style="max-width: 460px;" />
<figcaption>The same axes again, one stage further on. Twelve inputs, both circuits running together.</figcaption>
</figure>

I'd expected the errors to add. They don't, and the reason is that the stages aren't independent. Since $x^* = c/z^*$, a first stage that settles low pushes the second stage high by the same fraction, so part of the error the second stage inherits cancels against the error it makes itself.

# Conclusion

Here we demonstrated that it's possible to build a thermodynamic computer from an FPAA and a DAQ. Now that I have actual hardware capable of thermodynamic computing, it's time to play with some noise.