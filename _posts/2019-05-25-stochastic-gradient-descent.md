---
layout: post
title: "Statistical physics of stochastic gradient descent"
subtitle: ""
date:       2019-05-25 00:00:00
author:     "Chris Miles"
header-img: "img/blog-bg.jpg"
comments: false
future: true
tags: [ Physics, Mathematics, Data ]
---

<script src = "../js/gd.js">
</script> 
<!-- <script src = "../js/sgd.js">
</script>  -->

<h3> Introduction </h3>

In 1847, Augustin-Louis Cauchy introduced the gradient descent algorithm used to solve a large class of optimization problems and has been used throughout the sciences and engineering ever since then. Now, 150+ years later, it is still relevant today. It is the algorithmic workhorse responsible for tuning the weights of many modern deep learning architectures. 


But, why does it work so well? How can we understand it? How long does it take? What are its limitations? Today, I want to explore the dynamics of stochastic gradient descent (a variant of vanilla gradient descent) and hope to provide some insights and shed light on these questions. To do this, I would like to analyze stochastic gradient descent in the context of ordinary least squares regression by using tools from statistical physics and stochastic processes. We will begin by reviewing a vanilla gradient descent, then introduce its variant stochastic gradient descent.  The analysis to follow assumes knowledge of multi-variate calculus. Knowledge of stochastic differential equations could help but not completely necessary as the essential elements will be introduced.

<h3> Gradient descent </h3>
To start, let's review what gradient descent is attempting to solve. Many machine learning problems can be formulated as an optimization problem of the form:
\\[
	\min_\mathbf{w} \varphi(\mathbf{w})
\\]
where \\(\mathbf{w}\\) is a vector of weights and \\(\varphi(\mathbf{w})\\) is a loss function. For this discussion, we will look at ordinary least squares regression with the following loss function:

\\[
	\varphi(\mathbf{w}) = \frac{1}{N} \sum_{i=1}^{N} \|\mathbf{x}^{(i)T}\mathbf{w} - y^{(i)}\|^2
\\]
or equivalently,  
\\[
	\varphi(\mathbf{w}) = \frac{1}{N} \left\lVert\mathbf{X}\mathbf{w} - \mathbf{y}\right\rVert^2
\\]


where $N$ is the total number of data points, $i$ is the index for the $i$th data point in the data set, $\mathbf{x}^{(i)}$ is a vector of features, $y^{(i)}$ is a scalar-valued target, $\mathbf{X}$ is a matrix with $\mathbf{x}^{(i)}$ as rows, $\lVert \cdot \rVert$ is the l2 vector norm.

 To solve this, we turn to gradient descent. It's update is written as
\\[
	\mathbf{w}^{n+1} = \mathbf{w}^{n} - \alpha \nabla \varphi(\mathbf{w}^n)
\\] 
where $ \nabla \varphi(\mathbf{w}^n)$ is the gradient and $\alpha$ is the learning rate. 

To get a feel for the dynamics of gradient descent, here is a live demonstration of gradient descent in the following embedded animation. The left plot shows data points that we are trying to fit with a line $y = w_1 x+ w_0$. The right heatmap shows the loss $\varphi(\mathbf{w})$ across weight-space or parameter-space. Make sure to click the 'Restart' button below.

<div id='canvasDiv'>
</div>



<!-- <h3> differential equation view </h3> -->


Here we make our first physical interpretation. The dynamics of $\mathbf{w}$ resemble the dynamics of the position of an overdamped particle in the presence an external force given by the potential $\varphi$. In fact, many explain gradient descent with the analogy of a 'ball rolling downhill' where $\varphi$ is viewed as the gravitational potential or the hill height.

To strengthen this argument, note that we can rearrange this expression into the form: 
\\[
	\frac{\mathbf{w}^{n+1} - \mathbf{w}^{n}}{\alpha} =  - \nabla \varphi(\mathbf{w}^n)
\\] 

Notice that the left hand side is a time-discretized approximation of the derivative. Thus, gradient descent can be viewed as a time-discretized version of the differential equation:
\\[
 	\frac{d}{dt} \mathbf{w} = - \nabla \varphi.
\\]
where $t$ is now the continuous analog of $n$. This is now exactly the differential equation governing an overdamped particle in presence of an external potential.


<h3> Stochastic gradient descent --- adding randomness </h3>

It is common to use stochastic gradient descent rather than gradient descent when dealing with a large data set. The gradient $\nabla \varphi$ is approximated by $\nabla \varphi_b$ where 
\\[
	\varphi_b(\mathbf{w}) = \frac{1}{N_b} \sum_{i=1}^{N_b} \|\mathbf{x}^{(j_i)T}\mathbf{w} - y^{(j_i)}\|^2
\\]
where $j_1, \dots, j_{N_b}$ are some subset of the indices of the dataset and $N_b \ll N$. At each iteration, a new random subset $j_1, \dots, j_{N_b}$ are generated. This is where the randomness comes in. We can write this estimate of the gradient in the following form:
\\[
	\nabla \varphi_b(\mathbf{w}) = \nabla \varphi(\mathbf{w}) + \mathbf{\eta} 
\\]
where the error $\mathbf{\eta}$ is modeled as white gaussian noise vector. The new model for the dynamics of the 'particle' is now  given by
\\[\frac{d}{dt}\mathbf{w} = - \nabla \varphi +\mathbf{\eta} \\]
or alternatively
\\[
d\mathbf{w} = -\nabla\varphi dt +  \sqrt{2D}\, d\mathbf{W}
\\]
where $\mathbf{W}$ is a Wiener process and $D$ is the molecular coefficient. Again, we see that the weights \\(\mathbf{w}\\) can be viewed as the position of a particle subject to an external potential \\(\varphi\\). But now, we have the addition of noise. This added noise is like the random forcing exerted on a Brownian particle. The above relation is known as the overdamped Langevin equation. Notice that we have a random forcing on the particle, and therefore the position of the particle is now a random variable as a result. Let's observe stochastic gradient descent in action below! 

<div id='canvasDiv-SGD'>
</div>


One natural question is "what is the probability of the particle being at position $\mathbf{w}$ at time $t$?" To be more precise, we are interested in the probability density $\rho(\mathbf{w},t)$ which obeys the Fokker-Planck Equation (FPE) given by
\\[
\frac{\partial}{\partial t} \rho + \nabla \cdot( -\rho\nabla \varphi) = D \nabla^2 \rho 
\\]
with \\(\rho(\mathbf{w},0)=\rho_0(\mathbf{w})\\). The time-dependent solution for general $\varphi$ is a challenging task, however some progress can be made with determining the long-term steady-state behavior. As the particle settles into a local minimum, it will still exhibit motion to due to the random forcing, but the probability distribution will be stationary. This state is also known as equilibrium. It can be shown that this steady state solution is given by the Boltzmann distribution,

\\[
\rho_s(\mathbf{w}) = \frac{e^{-\varphi/D}}{Z}
\\]
where the partition function \\(Z\\) is given by
\\[
Z = \int d\mathbf{w} e^{-\varphi/D}.
\\]

Let's determine $Z$ for linear regression. 
\\[
Z = \int d\mathbf{w} e^{-\varphi/D}= \int d\mathbf{w} e^{-\frac{1}{ND}\left\lVert\mathbf{X}\mathbf{w} - \mathbf{y}\right\rVert^2}
\\]

<!-- 
We start with a trivial machine learning task solely to introduce the statistical physics concepts. Let's consider the loss function
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
\\]  -->

