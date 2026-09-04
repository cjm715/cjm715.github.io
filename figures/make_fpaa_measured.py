"""Measured-vs-predicted error for the d=3 FPAA solver, both builds.

All numbers traced to ~/Projects/fpaa-linsolve/README.md and
campaign/stage2_d3_results.md. Nothing here is recomputed or rounded.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BG, INK, INK2, INK3, BORDER = "#070b0f", "#e4ecf4", "#b0c2d4", "#728fa6", "#182030"
S1, S2 = "#3987e5", "#d95926"          # categorical slots 1,2 (dark) - validated
FLOOR = 0.52                            # repeatability floor, README

states = ["z₁", "z₂", "z₃"]
orig   = [-1.93, -3.70, +0.60]          # original build
lam    = [-2.49, -1.63, None]           # lambda_2 x3 build; z3 not measured

fig, ax = plt.subplots(figsize=(6.4, 3.5), dpi=200)
fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

y = [2, 1, 0]
ax.axvspan(-FLOOR, FLOOR, color=INK3, alpha=0.16, lw=0, zorder=0)
ax.axvline(0, color=INK3, lw=1.0, zorder=1)

for yi, a, b in zip(y, orig, lam):
    if b is not None:                   # connector showing the shift
        ax.plot([a, b], [yi, yi], color=INK3, lw=2, alpha=0.55, zorder=2,
                solid_capstyle="round")

ax.scatter(orig, y, s=110, color=S1, zorder=4, label="original build",
           edgecolors=BG, linewidths=2)
ax.scatter([v for v in lam if v is not None], [yi for yi, v in zip(y, lam) if v is not None],
           s=110, color=S2, zorder=4, label="$\\lambda_2\\times3$ build",
           edgecolors=BG, linewidths=2)

for yi, v in zip(y, orig):
    ax.annotate(f"{v:+.2f}%", (v, yi), textcoords="offset points", xytext=(0, 13),
                ha="center", color=INK2, fontsize=8.5)
for yi, v in zip(y, lam):
    if v is not None:
        ax.annotate(f"{v:+.2f}%", (v, yi), textcoords="offset points", xytext=(0, -20),
                    ha="center", color=INK2, fontsize=8.5)
ax.annotate("$\\lambda_2\\times3$ build: not measured for z\u2083", (-4.45, 0),
            ha="left", va="center", color=INK3, fontsize=8, style="italic")

ax.set_yticks(y); ax.set_yticklabels(states, color=INK, fontsize=12)
ax.set_ylim(-0.75, 3.05)
ax.set_xlim(-4.6, 2.0)
ax.set_xlabel("error vs. prediction from realized gains  (%)", color=INK2, fontsize=9.5)
ax.tick_params(axis="x", colors=INK2, labelsize=9, length=0)
ax.tick_params(axis="y", length=0)
ax.annotate("±0.52% repeatability floor", (FLOOR, 2.35), textcoords="offset points",
            xytext=(6, 0), ha="left", va="center", color=INK3, fontsize=8)

ax.grid(axis="x", color=BORDER, lw=1, zorder=0)
ax.set_axisbelow(True)
for s in ax.spines.values():
    s.set_visible(False)

leg = ax.legend(loc="upper left", frameon=False, fontsize=9, handletextpad=0.4,
                borderaxespad=0.1, labelcolor=INK2, ncol=2, columnspacing=1.4)
fig.tight_layout()
out = __file__.rsplit("/", 2)[0] + "/public/assets/images/fpaa-linsolve-measured.png"
fig.savefig(out, facecolor=BG, bbox_inches="tight", pad_inches=0.28)
print("wrote", out)
