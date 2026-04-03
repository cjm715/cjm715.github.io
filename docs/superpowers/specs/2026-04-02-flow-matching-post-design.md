# Flow Matching Post Revision — Design Spec

**Date:** 2026-04-02
**File:** `src/content/posts/flow-matching.md`
**Branch:** `wip`
**Source material:** `/home/cjmiles/Projects/flow-cycle/`

## Context

The existing draft covers conditional flow matching and the nonautonomous learned ODE but reads too academic for the target audience. It also stops short of the autonomous construction, which is a major result from the flow-cycle project. This revision restructures the post into a question-driven two-act narrative, adds the autonomous field as a natural limit of the nonautonomous flow, and warms up the prose.

## Audience

Technical but broad: engineers, physicists, grad students who know ODEs and basic ML but may not know flow matching. Also serves as a portfolio piece demonstrating research capability.

## Approach: Question-Driven Two-Act Narrative

Restructure around motivating questions. Math serves the story. Each derivation is prefaced with intuition explaining *why* we need the next step.

## Post Structure

### Opening (rewrite)

Replace the current opening entirely. New structure:

1. Hero GIF stays at top (`flow-matching-loop3d-t10.gif`)
2. Lead with the question: "What does it take to make an ODE follow a curve?" — one sentence, direct
3. Mention Unconventional AI as inspiration (keep the link), but briefly — one sentence on what they did, one on what it made you wonder
4. Frame as personal exploration: "I wanted to see how far flow-matching ideas could take me on a question I found interesting."
5. **Exploration disclaimer**: "I didn't do a thorough literature search. If you know of published work along these lines, please reach out and I'll add references."
6. State what the post covers: Act 1 (nonautonomous flow matching) and Act 2 (the autonomous limit). One sentence.

Total opening: ~6-8 sentences. No equations in the opening.

### Act 1 — "Chasing a Moving Target"

#### 1. The Setup
Intuitive framing paragraph. Cloud of particles, want them to converge onto a curve and circulate. No equations yet.

#### 2. One Point at a Time
*Was: "Conditional Probability Path"*

Fix a phase $\phi$, get a moving target $z_t(\phi) = \gamma(\omega t + \phi)$. Introduce the interpolation schedule ($\alpha_t$, $\beta_t$) through the intuition: "start simple — pick one point and have everything chase it."

**Figure:** Probability path GIF (`flow-matching-probability-path.gif`)

#### 3. The Velocity That Does It
*Was: "Conditional Vector Field"*

Derivation of $u_t(x|\phi)$. Keep the math. Add payoff sentence explaining why the normal + tangential decomposition is satisfying.

**Figures:** Conditional field GIF (`flow-matching-conditional-theory.gif`), SVG theory diagram (`flow-matching-theory-diagram.svg`)

#### 4. What If We Don't Know Which Point?
*Was: "Marginal Probability Path"*

Transition motivated by ambiguity: "We built a flow that chases one moving target. But we want the whole curve. What happens when we average over all possible target points?"

**Figure:** Marginal path GIF (`flow-matching-marginal-probability-path.gif`)

#### 5. The Marginal Field
*Was: "Marginal Vector Field"*

Posterior average derivation. Continuity equation justification. Keep the interpretive sentence about nearby phases contributing more strongly.

#### 6. What the Network Learns
*Was: "What the Learned ODE Represents"*

Brief. Network sees $(x,t)$ not $\phi$, so it learns the marginal field. 2,371 parameters.

#### 7. The 3D Experiment
*Was: "A 3D Example"*

$\gamma(\theta) = (\cos\theta, 0.72\sin\theta, 0.35\sin 2\theta)$. Tighten commentary: cut the two rhetorical questions, replace with direct statement of what this demonstrates.

**Figure:** 3D loop video (`flow-matching-loop3d-t10.mp4`)

### Bridge — "Where Does the Flow End Up?"

Key section connecting the two acts. The argument:

1. As $t \to \infty$: $\alpha_t \to 1$, $\beta_t \to 0$
2. The conditional density concentrates near the curve
3. Time dependence in $z_t(\phi) = \gamma(\omega t + \phi)$ is absorbed by the uniform-phase integral (substitution $\phi' = \omega t + \phi$ preserves uniformity on $[0, 2\pi)$)
4. Therefore the marginal field becomes stationary — an autonomous vector field falls out

Frozen-field comparison as empirical evidence: when you freeze at large $t$, it works because the field is already nearly stationary.

**Figure:** Long-time comparison PNG (`flow-matching-loop3d-long-compare.png`) — relocated from current ending, reframed to emphasize stationarity rather than "method comparison"

### Act 2 — "The Limiting Field"

#### 1. The Autonomous Construction
Derived as the limit from the bridge, not introduced as a separate idea. For each curve phase $\theta$:

$$u(x|\theta) = -\lambda(x - \gamma(\theta)) + \omega T(\theta)$$

Posterior weights: $a_k(x) \propto \exp(-\|x - \gamma(\theta_k)\|^2 / 2\sigma^2)$

Frame as: "The same posterior-averaging idea from Act 1, but with time removed."

#### 2. Two Ways to Compute It
- **Kernel field** (Scheme A): Precompute curve points and tangents, evaluate by softmax weighting. No training. Cost linear in curve samples.
- **Learned neural field** (Scheme B): Train MLP to regress against conditional targets sampled near the curve. Constant inference cost.

Short paragraph each.

#### 3. Circle Results
Circle as the demonstration case. Show kernel vs learned fields produce nearly identical streamlines and trajectories. Reference configuration: $\lambda = 2.0$, $\omega = 1.0$, $\sigma = 0.3$.

**Figure:** Autonomous circle figure (`autonomous_circle.png` from flow-cycle — needs polish for blog styling; see figure notes below)

#### 4. What This Means
Closing synthesis. The posterior-mean viewpoint unifies both acts. Whether time-dependent or autonomous, the core move is: average local attraction-plus-tangent fields over plausible curve phases, weighted by proximity.

### Footer

**Employer disclaimer:** "Views expressed here are my own and do not reflect those of my employer."

## Writing Guidelines

- **Tone:** Conversational, curious. First person. "I wanted to know..." not "We investigate..."
- **Math-to-prose ratio:** Every derivation block preceded by 1-2 sentences of intuition. Every result followed by a "so what" sentence.
- **Section headings:** Question-driven or descriptive, not paper-style ("Conditional Vector Field" becomes "The Velocity That Does It")
- **Cut:** Redundant formalism, rhetorical questions used as padding, any sentence that reads like an abstract

## Figure Plan

### Reuse as-is (Act 1)
| Asset | Location (website) | Notes |
|-------|-------------------|-------|
| `flow-matching-loop3d-t10.gif` | `/assets/images/` | Hero |
| `flow-matching-probability-path.gif` | `/assets/images/` | Conditional path |
| `flow-matching-conditional-theory.gif` | `/assets/images/` | Conditional field |
| `flow-matching-theory-diagram.svg` | `/assets/images/` | Theory diagram |
| `flow-matching-marginal-probability-path.gif` | `/assets/images/` | Marginal path |
| `flow-matching-loop3d-t10.mp4` | `/assets/videos/` | 3D experiment |
| `flow-matching-loop3d-long-compare.png` | `/assets/images/` | Long-time comparison (moves to bridge) |

### Needs work (Act 2)
| Asset | Source | Notes |
|-------|--------|-------|
| Autonomous circle figure | `flow-cycle/autonomous_circle.png` | Needs dark-theme styling, larger text. Consider 2-panel (drop training loss panel) or restyle as a polished blog figure. May want animated version showing trajectories spiraling in. |

### Deferred decisions
- Whether to add an animated figure for Act 2 (trajectories spiraling into circle attractor)
- Exact panel layout for the autonomous circle figure
- Whether the SVG theory diagram needs updating to include the autonomous limit

## Verification

After implementation:
1. `npm run dev` in `cjm715.github.io/` — verify post renders correctly
2. Check all figures/videos load (no broken asset paths)
3. Verify KaTeX math renders (inline and block)
4. Read through on the dev server for flow and pacing
5. Check responsive layout on narrow viewport
