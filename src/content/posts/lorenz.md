---
title: "Building an Analog Lorenz Attractor Circuit"
date: 2026-03-26
category: Electronics
excerpt: "Voltages as state variables, op-amp integrators for the linear terms, analog multipliers for the nonlinear products — the circuit continuously solves the Lorenz equations in real time."
---

## Theory

The Lorenz system is one of the classic examples of deterministic chaos. It came from Edward Lorenz's simplified model of atmospheric convection, but it is better known for the shape of its trajectories: instead of settling to a fixed point or a simple periodic orbit, the state winds around a two-lobed strange attractor. Small changes in the initial condition lead to very different long-term motion, even though the equations themselves are completely deterministic.

The equations are

$$\frac{dx}{dt} = \sigma (y - x)$$

$$\frac{dy}{dt} = x(\rho - z) - y$$

$$\frac{dz}{dt} = xy - \beta z$$

and the standard parameter choice is

$$\sigma = 10, \qquad \rho = 28, \qquad \beta = \frac{8}{3}.$$

What makes this system especially interesting in hardware is that the equations map naturally onto analog computing blocks. Voltages represent the state variables $x(t)$, $y(t)$, and $z(t)$. Op-amp integrators and summing stages implement the linear pieces of the dynamics, while analog multipliers generate the nonlinear $xy$ and $xz$ terms. With the right scaling, the circuit continuously solves the differential equations in real time.

I built my breadboard version by following [this YouTube video](https://www.youtube.com/watch?v=DBteowmSN8g) featuring Paul Horowitz.

## The Circuit

The schematic below is the Lorenz analog computer circuit developed by Paul Horowitz at Harvard University. I used it as the starting point for my build. The original source is Paul Horowitz's Harvard page [Build a Lorenz Attractor](http://seti.harvard.edu/unusual_stuff/misc/lorenz.htm).

<figure>
<img src="/assets/images/lorenz-horowitz-schematic.jpg" alt="Paul Horowitz Lorenz attractor analog circuit schematic" style="max-width: 640px;" />
<figcaption>Lorenz attractor analog circuit schematic. Original circuit credit: Paul Horowitz.</figcaption>
</figure>

Horowitz's design uses three op-amp stages as integrator-plus-summing blocks and two analog multipliers to form the nonlinear products. In his write-up, he notes that the three integrator capacitors set the overall timescale of the attractor — changing $C$ changes how quickly the trajectory moves around the butterfly.

## My Build

Once the circuit is wired correctly, the nicest view is the oscilloscope in XY mode. That projection gives the familiar butterfly shape of the Lorenz attractor:

<figure>
<img src="/assets/images/lorenz-attractor-scope.jpg" alt="Oscilloscope showing the Lorenz attractor in XY mode" style="max-width: 420px;" />
<figcaption>The characteristic two-lobed Lorenz attractor on the oscilloscope.</figcaption>
</figure>

<figure>
<img src="/assets/images/lorenz-attractor-breadboard.jpg" alt="Breadboard analog circuit implementing the Lorenz equations" style="max-width: 720px;" />
<figcaption>Breadboard version of the Lorenz system circuit.</figcaption>
</figure>

## Videos

The first clip shows a clean XY view of the attractor on the oscilloscope:

<figure>
<video controls playsinline preload="metadata" poster="/assets/images/lorenz-attractor-scope.jpg" style="max-width: 420px;">
  <source src="/assets/videos/lorenz-attractor-xy.mp4" type="video/mp4" />
</video>
<figcaption>XY mode on the oscilloscope, tracing the Lorenz butterfly.</figcaption>
</figure>

I also captured the three state voltages on my Rigol DHO804 and plotted them directly as a rotating 3D reconstruction of the attractor:

<figure>
<img src="/assets/images/lorenz-attractor-dho804-3d-rotate.gif" alt="Animated 3D Lorenz attractor reconstructed from oscilloscope waveform capture" style="max-width: 720px;" />
<figcaption>Animated 3D trace reconstructed from the scope capture, with the camera orbiting the attractor.</figcaption>
</figure>

The second clip shows more of the full setup, including the scope traces while the breadboard circuit is running:

<figure>
<video controls playsinline preload="metadata" poster="/assets/images/lorenz-attractor-breadboard.jpg" style="max-width: 720px;">
  <source src="/assets/videos/lorenz-attractor-breadboard.mp4" type="video/mp4" />
</video>
<figcaption>Breadboard circuit in action, with both time-domain traces and the XY attractor visible on the oscilloscope.</figcaption>
</figure>
