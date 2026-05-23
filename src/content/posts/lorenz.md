---
title: "Solving the Lorenz equations using an analog circuit"
date: 2026-03-26
category: Electronics
excerpt: "Voltages as state variables, op-amp integrators for the linear terms, analog multipliers for the nonlinear products — the circuit continuously solves the Lorenz equations in real time."
thumbnail: "/assets/images/lorenz-attractor-dho804-3d-rotate-still.png"
thumbnailGif: "/assets/images/lorenz-attractor-dho804-3d-rotate.gif"
thumbnailAlt: "Oscilloscope rendering of a Lorenz attractor"
---

## Introduction

Nonlinear dynamics and chaotic systems are sometimes governed by seemingly simple rules yet can have amazing rich dynamics. The Lorenz system is a classic example of such a system. It originated from Edward Lorenz's simplified model of atmospheric convection and was pioneering work in the development of chaos theory. It has always capitivated me and many others. 

I recall at an APS (American Physical Society) conference during graduate school seeing an analog circuit that implemented the Lorenz system and I have always wanted to replicate that circuit ever since. I finally did. I'd like to share details about the build and design for others who want to build one for themselves. Other tutorials I found online didn't go into sufficient detail about how the circuit worked from equations to components. 

Hopefully this will help others who want to understand it in depth as to why it works rather than just following a given circuit diagram and going off of faith. I hope the reader will take more from this article than just an understanding of the implementation for this system but a framework that generalizes and allows them to apply it to other differential equations of interests. If you interested in dynamical systems, analog computing and electonics, this is a really fun and simple build and it's so satifying to see the lorenz attractor come to life on an oscilloscope. 

I learned a lot from this book: [A Concise Guide to Chaotic Electronic Circuits](https://link.springer.com/book/10.1007/978-3-319-05900-6) by Arturo Buscarino et al. I followed its methodology from systematically going from equation to circuit. The book does cover the Lorenz system and comes up with a circuit diagram. However I decided on a simplier cicuit design based off of Paul Horowitz at Harvard University discussed here in [this video](https://www.youtube.com/watch?v=DBteowmSN8g) and the associated [article](http://seti.harvard.edu/unusual_stuff/misc/lorenz.htm). My build differs with choices of resistor values (scaled by constant factor that doesn't impact implementation) based on the resistors I had on hand. Also, I used different mulitplier and op amp components but they are functionally the same.

The Lorenz system is governed by this set of differential equations:

$$\frac{dx}{dt} = \sigma (y - x)$$

$$\frac{dy}{dt} = x(\rho - z) - y$$

$$\frac{dz}{dt} = xy - \beta z$$

and the standard parameter choice which demonstrates chaos is

$$\sigma = 10, \qquad \rho = 28, \qquad \beta = \frac{8}{3}.$$

What makes this system especially interesting in hardware is that the equations map naturally onto analog computing blocks. Voltages represent the state variables $x(t)$, $y(t)$, and $z(t)$. Op-amp integrators and summing stages implement the linear pieces of the dynamics, while analog multipliers generate the nonlinear $xy$ and $xz$ terms. With the right scaling, the circuit continuously solves the differential equations in real time.


## From dimensionless equations to voltages and seconds

The Lorenz equations above are *dimensionless* — $x$, $y$, $z$, and $t$ are all pure numbers. To map them onto an analog circuit we need to give the state variables units of voltage and time units of seconds. We do this with simple linear changes of variable.

Let $X$, $Y$, $Z$ (in volts) and $\tau$ (in seconds) be the dimension-full counterparts, related to the dimensionless variables by

$$X = k_1\, x, \qquad Y = k_2\, y, \qquad Z = k_3\, z, \qquad t = \kappa\, \tau.$$

Here $k_1$, $k_2$, $k_3$ are *voltage* scale factors and $\kappa$ is a *rate* with units of $1/\text{s}$. Equivalently $\tau = t/\kappa$: one unit of dimensionless time corresponds to $1/\kappa$ seconds of real time.

For this build I take

$$k_1 = k_2 = k_3 \equiv k = \tfrac{1}{10}\,\text{V}.$$

With the standard parameters the dimensionless states stay roughly within $|x|, |y| \lesssim 30$ and $0 \lesssim z \lesssim 50$, so $|X|, |Y| \lesssim 3\,\text{V}$ and $0 \lesssim Z \lesssim 5\,\text{V}$ — comfortably inside the $\pm 12\,\text{V}$ supply rails of the op-amps and multipliers, with enough headroom to avoid clipping.

Substituting $x = X/k$, $y = Y/k$, $z = Z/k$, and $t = \kappa \tau$ into the dimensionless equations and tidying up gives the dimension-full system:

$$\frac{dX}{d\tau} = \kappa\, \sigma\, (Y - X)$$

$$\frac{dY}{d\tau} = \kappa\, \rho\, X \;-\; \kappa\, Y \;-\; \frac{\kappa}{k}\, X Z$$

$$\frac{dZ}{d\tau} = \frac{\kappa}{k}\, X Y \;-\; \kappa\, \beta\, Z.$$

A quick units check: every term on the right-hand side works out to volts per second, as it must for the derivative of a voltage. The linear terms carry one factor of $\kappa$ (with units $1/\text{s}$), and the bilinear terms carry $\kappa/k$ which has units of $(1/\text{s})\cdot(1/\text{V})$ — exactly what is needed for a product like $XY$ or $XZ$ (volts²) to come out in volts per second.

Two separate design choices live in these equations:

- **$\kappa$ sets the speed.** It will be set by the integrator time constant in the next section. Smaller $\kappa$ slows the attractor down; larger $\kappa$ speeds it up. Choosing $\kappa$ in the range of $10$–$1000\,\text{s}^{-1}$ produces an attractor that evolves on a millisecond-to-tenths-of-a-second timescale — slow enough to watch unfold on a scope, fast enough to look continuous.
- **$k$ sets the amplitude.** The choice $k = \tfrac{1}{10}\,\text{V}$ keeps the state voltages in the few-volt range, well within rail. It also has a happy interaction with the AD633 analog multiplier (which has its own built-in $10\,\text{V}$ scale factor in the denominator of its transfer function); we will see how that plays out when we wire up the product terms.

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
