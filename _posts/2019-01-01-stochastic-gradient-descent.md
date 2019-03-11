---
layout: post
title: "Statistical physics of stochastic gradient descent"
subtitle: ""
date:       2019-01-01 4:17:00
author:     "Chris Miles"
header-img: "img/blog-bg.jpg"
comments: true
future: true
tags: [ Physics, Mathematics, Data ]
---


<h3> Introduction </h3>

In 1847, Augustin-Louis Cauchy introduced the gradient descent algorithm used to solve a large class of optimization problems and has been used throughout the sciences and engineering ever since then. Now, 150+ years later, it is still relevant today. It is the algorithmic workhorse responsible for tuning the weights of many modern deep learning architectures. 


But, why does it work so well? How can we understand it? How long does it take? What are its limitations? Today, I want to explore the dynamics of stochastic gradient descent (a variant of vanilla gradient descent) and hope to provide some insights and shed light on these questions. To do this, I would like to analyze stochastic gradient descent in the context of ordinary least squares regression by using tools from statistical physics. We will begin by reviewing a vanilla gradient descent, then introduce stochasticity, before analyzing the dynamics.  The analysis to follow assumes knowledge of multi-variate calculus. Knowledge of stochastic differential equations could help but not completely necessary as the essential elements will be introduced.

<h3> Gradient descent </h3>
To start, let's review what gradient descent is attempting to solve. Many machine learning problems can be formulated as an optimization problem of the form:
\\[
	\min_\mathbf{w} \varphi(\mathbf{w})
\\]
where \\(\mathbf{w}\\) is a vector of weights and \\(\varphi(\mathbf{w})\\) is a loss function. For this discussion, we will look at ordinary least squares regression with the following loss function:

\\[
	\varphi(\mathbf{w}) = \frac{1}{N} \sum_{i=1}^{N} \|\mathbf{x}^{(i)T}\mathbf{w} - y^{(i)}\|^2
\\]
where $N$ is the total number of data points, $i$ is the index for the $i$th data point in the data set, $\mathbf{x}^{(i)}$ is a vector of features, and $y^{(i)}$ is a scalar-valued target.

 To solve this, we turn to gradient descent. It's update is written as
\\[
	\mathbf{w}^{n+1} = \mathbf{w}^{n} - \alpha \nabla \varphi(\mathbf{w}^n)
\\] 
where $ \nabla \varphi(\mathbf{w}^n)$ is the gradient and $\alpha$ is the learning rate. 

Let's do a live demonstration of gradient descent in the following embedded animation:

<div id='canvasDiv'>
</div>
<script src = "../js/gd.js">
</script> 



<h3> differential equation view </h3>


Note that we can rearrange this expression into the form: 
\\[
	\frac{\mathbf{w}^{n+1} - \mathbf{w}^{n}}{\alpha} =  - \nabla \varphi(\mathbf{w}^n)
\\] 

Notice that the left hand side is a time-discretized approximation of the derivative. Thus, gradient descent can be viewed as a time-discretized version of the differential equation:
\\[
 	\frac{d}{dt} \mathbf{w} = - \nabla \varphi.
\\]
where $t$ is now the continuous analog of $n$. Here we make our first physical interpretation. The dynamics of $\mathbf{w}$ resemble the dynamics of the position of an overdampled particle in the presence an external force given by the potential $\varphi$. In fact, many explain gradient descent with the analogy of a 'ball rolling downhill' where $\varphi$ is viewed as the gravitational potential.



<h3> Stochastic gradient descent --- adding randomness </h3>



 for solving the overdamped Langevin equation given by
\\[\frac{d}{dt}\mathbf{w} = - \nabla \varphi +\mathbf{\eta} \\]
or alternatively
\\[
d\mathbf{w} = -\nabla\varphi dt +  \sqrt{2D}\, d\mathbf{W}.
\\]
There are clear parallels between this framework and statistical physics. the weights \\(\mathbf{w}\\) can be viewed as the position of a Brownian particle subject to an external potential \\(\varphi\\) with thermal noise quantified by diffusion coefficient \\(D\\).


The associated Fokker-Planck Equation (FPE)  governing \\(\rho(\mathbf{w},t)\\) is
\\[
\frac{\partial}{\partial t} \rho + \nabla \cdot( -\rho\nabla \varphi) = D \nabla^2 \rho 
\\]
with \\(\rho(\mathbf{w},0)=\rho_0(\mathbf{w})\\). The steady state solution is given by the Boltzmann distribution,

\\[
\rho_s(\mathbf{w}) = \frac{e^{-\varphi/D}}{Z}
\\]
where the partition function \\(Z\\) is given by
\\[
Z = \int d\mathbf{w} e^{-\varphi/D}.
\\]


<!-- We start with a trivial machine learning task solely to introduce the statistical physics concepts. Let's consider the loss function
\\[
\varphi(w) = \frac{1}{2}|wx - y|^2 
\\]
where \\((x,y)\\) is a single data point where we would like to fit with the model \\(\hat{y}=wx\\). The optimal solution \\(\bar{w}\\) that minimizes \\(\varphi\\) is simply given by \\(\bar{w}= y/x.\\) Thus, we have already solved this optimization task analytically. However, we proceed with solving this numerically through gradient descent since we are interested in its dynamics and not necessarily the solution. Suppose we wish to solve this by stochastic gradient descent where noise is explicitly added instead of it being introduced by batching. The partition function becomes 
\\[
Z = \int dw \,\, e^{-\frac{1}{2D}|wx - y|^2 }= \int dw \,\, e^{-\frac{x^2}{2D}|w - y/x|^2 } 
\\]
\\[
  =\int dw \,\, e^{-\frac{1}{2\sigma^2}|w - \mu|^2 } = \sqrt{2\pi \sigma^2}=\sqrt{\frac{2\pi D}{x^2}}.
\\]
The probability function becomes a normal distribution
\\[
p(w) = \frac{1}{\sqrt{2\pi \sigma^2}}e^{-\frac{1}{2 \sigma^2}|w - \mu|^2 }
\\]
with mean \\(\mu = y/x\\) and variance \\(\sigma^2 = \frac{D}{x^2}\\). What is the expected loss? We can compute this by 
\\[\langle \varphi \rangle = \int dw \,\, p(w)\varphi(w) = - \frac{d}{d\beta} \ln(Z) = \frac{1}{2}D
\\]
where \\(\beta = \frac{1}{D}\\).

Let's now consider the loss \\(\varphi(w)=\frac{1}{2}|wx-y|^2\\\) and the 1-D Fokker-Planck equation
\\[
\frac{\partial}{\partial t} \rho +\frac{\partial}{\partial w}\left( -\rho \frac{\partial}{\partial w}\varphi \right) = D  \frac{\partial^2}{\partial w^2}\ \rho 
\\]
with \\(\rho(w,0)=\rho_0(w)\\). Plugging in the expression for \\(\varphi\\), we have
\\[
\frac{\partial}{\partial t} \rho +\frac{\partial}{\partial w}\left( -\rho (wx-y)x \right) = D  \frac{\partial^2}{\partial w^2}\ \rho.
\\] -->

