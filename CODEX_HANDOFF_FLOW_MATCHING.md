# Flow Matching Curve Attractor: Codex Handoff

## Project Summary

This repo contains a blog post about using flow-matching ideas to construct a velocity field that is attracted to a prescribed curve and moves along it like a limit cycle.

The main post is:

- [`_posts/2026-03-23-flow-matching-curve-attractor.md`](/home/cjmiles/Projects/cjm715.github.io/_posts/2026-03-23-flow-matching-curve-attractor.md)

The post is based on experiment work in:

- `/home/cjmiles/Dropbox/workspace/projects/experiments/00-original-flow-curve`

That experiment folder contains:

- `flow_curve.py`: original conditional flow-matching circle experiment
- `learned_flow_matching_loops.py`: generalized learned nonautonomous loop experiments
- `learned_flow_long_compare.py`: long-horizon comparison between nonautonomous and frozen terminal field
- `autonomous_flow.py`: explicit posterior-averaged autonomous field construction
- `marginal_flow_loops.py`: explicit marginal-flow simulations
- `report.md` and `report.tex`: theory writeup that bridges the lecture notes to this curve-attractor construction

The flow-matching theory source used for the post is:

- `/home/cjmiles/Dropbox/workspace/Papers/lecture-notes_pdf.pdf`

## What We Changed Today

### 1. Rewrote the theory section of the article

The theory section in the post was rewritten to follow this narrative:

1. We want to construct a velocity field with specific geometric behavior.
2. Start with a simpler problem: one moving point sliding around the curve.
3. Specify the probability path first, not the flow.
4. Define the conditional probability path.
5. Derive the conditional vector field from the conditional flow map.
6. Explain why that is not yet enough.
7. Introduce marginalization over latent phase `phi`.
8. Define the marginal probability path.
9. Construct the marginal vector field as a posterior average.
10. Justify that field using the continuity equation.

This is now reflected in the current post content.

### 2. Fixed article prose and one factual mismatch

Earlier in the session, the post was cleaned up for typos and wording near the top.

Also fixed:

- the incorrect claim that the 3D model had `103` parameters

It now says:

- the current 3D model has `2,371` parameters

That matches the current loop model in `learned_flow_matching_loops.py`.

### 3. Added a conditional probability-path animation

Created:

- [`assets/py/flow_matching_probability_path_demo.py`](/home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_probability_path_demo.py)
- [`assets/videos/flow-matching-probability-path.mp4`](/home/cjmiles/Projects/cjm715.github.io/assets/videos/flow-matching-probability-path.mp4)
- [`assets/images/flow-matching-probability-path.gif`](/home/cjmiles/Projects/cjm715.github.io/assets/images/flow-matching-probability-path.gif)

This asset is embedded in the post and is intended to show the **conditional probability path** only.

Important: this animation was originally converted to contour density, then later switched back to scatter because the user preferred the earlier style. The current intent is:

- use scatter points, not contour plots
- keep the cleaner teal/amber palette
- keep the animation embedded via GIF

### 4. Added a marginal probability-path animation

Created:

- [`assets/py/flow_matching_marginal_probability_path_demo.py`](/home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_marginal_probability_path_demo.py)
- [`assets/videos/flow-matching-marginal-probability-path.mp4`](/home/cjmiles/Projects/cjm715.github.io/assets/videos/flow-matching-marginal-probability-path.mp4)
- [`assets/images/flow-matching-marginal-probability-path.gif`](/home/cjmiles/Projects/cjm715.github.io/assets/images/flow-matching-marginal-probability-path.gif)

This was added because the user explicitly wanted a visualization for the marginal probability path as well, not just the conditional one.

The marginal animation is intended to show:

- early-time diffuse mass
- later-time concentration around the full curve
- phase has been marginalized, so mass wraps around the whole loop instead of tracking one point

### 5. Updated the article to embed both probability-path visuals

The post now includes:

- the conditional probability-path animation
- the conditional vector-field animation
- the marginal probability-path animation

## Current State of the Post

The current post structure is roughly:

- intro and motivation
- `## Flow-Matching Theory`
- `## Conditional Probability Path`
- `## Conditional Vector Field`
- `## Marginal Probability Path`
- `## Marginal Vector Field`
- `## What The Learned ODE Represents`
- later experimental sections

The post currently explains the conditional derivation via:

$$
\psi_t(x_0 \mid \phi) = \alpha_t \gamma(\omega t + \phi) + \beta_t x_0
$$

then differentiates and substitutes out `x_0`.

The marginal field is currently written as:

$$
u_t^{\mathrm{marg}}(x)
= \mathbb{E}[u_t(x \mid \Phi)\mid X_t = x]
$$

and then as the corresponding posterior-weighted integral.

The continuity-equation justification is stated briefly, not proved in full.

## Important User Preferences Discovered Today

- The theory section should be conversational and educational.
- It should stay concise.
- The exposition should be intuition-first, not theorem-number-first.
- The right story is: probability path first, vector field second.
- Visuals matter. The user explicitly wanted:
  - a probability-path visualization with no vector field
  - later, a marginal probability-path visualization too
- The user prefers scatter-style probability-path animations over contour-density plots.
- The user disliked the original purple palette.
- The updated visual direction should stay cleaner and less purple.

## Known Issues / Likely Next Steps

### 1. Re-check the two probability-path renderers

Late in the session, the user asked to switch the probability-path animations back from contour plots to scatter plots.

I patched both renderer scripts toward that goal:

- [`assets/py/flow_matching_probability_path_demo.py`](/home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_probability_path_demo.py)
- [`assets/py/flow_matching_marginal_probability_path_demo.py`](/home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_marginal_probability_path_demo.py)

But I did **not** finish rerendering and verifying those final scatter-based assets after that last request.

This is the main place to resume.

Recommended next actions:

1. Open both renderer scripts and confirm they are fully scatter-based and no contour logic remains.
2. Re-render both videos:
   - `python assets/py/flow_matching_probability_path_demo.py`
   - `python assets/py/flow_matching_marginal_probability_path_demo.py`
3. Rebuild both GIFs from the MP4s with `ffmpeg`.
4. Sanity-check frame counts with PIL.
5. Confirm the post still points at the correct GIF paths.

### 2. Possible prose tightening

The theory section is much closer to what the user wanted, but it could still use one last editorial pass for:

- sentence rhythm
- redundancy trimming
- math display spacing
- whether the “What The Learned ODE Represents” section should be shortened further now that the marginal discussion above is stronger

### 3. Optional site build

No full local site build was run after the recent article/asset changes.

If someone continues this work, a local preview/build check would be useful.

## Commands / Workflow That Were Used

Useful commands already used successfully:

- `python /home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_probability_path_demo.py`
- `python /home/cjmiles/Projects/cjm715.github.io/assets/py/flow_matching_marginal_probability_path_demo.py`
- `ffmpeg -y -i /home/cjmiles/Projects/cjm715.github.io/assets/videos/flow-matching-probability-path.mp4 -vf "fps=20,scale=760:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" /home/cjmiles/Projects/cjm715.github.io/assets/images/flow-matching-probability-path.gif`
- `ffmpeg -y -i /home/cjmiles/Projects/cjm715.github.io/assets/videos/flow-matching-marginal-probability-path.mp4 -vf "fps=20,scale=760:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" /home/cjmiles/Projects/cjm715.github.io/assets/images/flow-matching-marginal-probability-path.gif`

Useful verification command:

- `python - <<'PY'`
  `from PIL import Image`
  `img = Image.open('...gif')`
  `print({'frames': getattr(img, 'n_frames', 1), 'size': img.size})`
  `PY`

## Resume Point

If a fresh agent takes over, the most likely next task is:

- finish the requested switch back to scatter-plot probability-path animations
- rerender the two GIF assets
- verify the article visuals match the user’s preference

That is the main unresolved piece. Everything else is largely in place.
