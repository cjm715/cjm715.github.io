---
title: "Solving the Lorenz equations using an analog circuit"
date: 2026-03-26
category: Electronics
excerpt: "Voltages as state variables, op-amp integrators for the linear terms, analog multipliers for the nonlinear products — the circuit continuously solves the Lorenz equations in real time."
thumbnail: "/assets/images/lorenz-attractor-dho804-3d-rotate-still.png"
thumbnailGif: "/assets/images/lorenz-attractor-dho804-3d-rotate.gif"
thumbnailAlt: "Oscilloscope rendering of a Lorenz attractor"
---

## Theory

The Lorenz system is one of the classic examples of deterministic chaos. It originated from Edward Lorenz's simplified model of atmospheric convection and was pioneering work in the development of chaos theory. Small changes in the initial condition lead to very different long-term motion, even though the equations themselves are completely deterministic.

The Lorenz system is governed by this set of differential equations:

$$\frac{dx}{dt} = \sigma (y - x)$$

$$\frac{dy}{dt} = x(\rho - z) - y$$

$$\frac{dz}{dt} = xy - \beta z$$

and the standard parameter choice which demonstrates chaos is

$$\sigma = 10, \qquad \rho = 28, \qquad \beta = \frac{8}{3}.$$

What makes this system especially interesting in hardware is that the equations map naturally onto analog computing blocks. Voltages represent the state variables $x(t)$, $y(t)$, and $z(t)$. Op-amp integrators and summing stages implement the linear pieces of the dynamics, while analog multipliers generate the nonlinear $xy$ and $xz$ terms. With the right scaling, the circuit continuously solves the differential equations in real time.


## The Build

My build is based off of the design discussed in [this video](https://www.youtube.com/watch?v=DBteowmSN8g) and the associated [article](http://seti.harvard.edu/unusual_stuff/misc/lorenz.htm) by Paul Horowitz at Harvard University. 
<figure>
<img src="/assets/images/lorenz-horowitz-schematic.jpg" alt="Paul Horowitz Lorenz attractor analog circuit schematic" style="max-width: 640px;" />
<figcaption>Lorenz attractor analog circuit schematic. Original circuit credit: Paul Horowitz.</figcaption>
</figure>

I'd recommend seeing the linked resources for more detail on how it works, but I'll describe it briefly here. Each differential equation in the system is implemented as op-amp circuit combining an integrator and an inverting summing circuit. The output voltage of each op-amp corresponds to x, y, and z. The product terms $xy$ and $xz$ require two analog multipliers.

I used an [AD633](https://www.analog.com/media/en/technical-documentation/data-sheets/ad633.pdf) rather than the MPY634 in the original schematic — it dropped in as a direct replacement with no modifications needed. For the op-amps, I used a single [TL084CN](https://www.ti.com/product/TL084/part-details/TL084CN) which contains 4 op-amps internally. The multipliers are the most expensive component in the build at around $11 each, but the rest of the circuit is just standard resistors, capacitors, and the quad op-amp. It's remarkable how few components it takes to continuously solve the Lorenz equations in real time.

For power, I used two 12V DC adapters with their negative and positive terminals connected together to form a common ground, giving the three voltage levels needed for the op-amp and multiplier rails: −12V, 0V, and +12V.

<figure>
<img src="/assets/images/lorenz-attractor-breadboard.jpg" alt="Breadboard analog circuit implementing the Lorenz equations" style="max-width: 720px;" />
<figcaption>The Lorenz system on a breadboard.</figcaption>
</figure>

## Oscilloscope Capture

Once the circuit is wired correctly, the nicest view is the oscilloscope in XY mode. That projection gives the familiar butterfly shape of the Lorenz attractor:

<figure>
<img src="/assets/images/lorenz-attractor-scope.jpg" alt="Oscilloscope showing the Lorenz attractor in XY mode" style="max-width: 420px;" />
<figcaption>The XZ projection on the oscilloscope showing the classic butterfly shape.</figcaption>
</figure>

I captured the three state voltages on my Rigol DHO804 via its rear USB port using [pyvisa](https://pyvisa.readthedocs.io/) to pull the raw waveform data, then plotted them directly as a rotating 3D reconstruction of the attractor.

<figure>
<img src="/assets/images/lorenz-attractor-dho804-3d-rotate.gif" alt="Animated 3D Lorenz attractor reconstructed from oscilloscope waveform capture" style="max-width: 720px;" />
<figcaption>Animated 3D trace reconstructed from the scope capture, with the camera orbiting the attractor.</figcaption>
</figure>
