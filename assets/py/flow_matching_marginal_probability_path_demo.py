from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FFMpegWriter


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "videos" / "flow-matching-marginal-probability-path.mp4"


def gamma(angle: np.ndarray) -> np.ndarray:
    angle = np.asarray(angle)
    return np.stack([np.cos(angle), np.sin(angle)], axis=-1)


def schedule(t: float, tau: float) -> tuple[float, float]:
    beta = float(np.exp(-t / tau))
    alpha = 1.0 - beta
    return alpha, beta


def sample_marginal_cloud(
    rng: np.random.Generator,
    t: float,
    n: int,
    tau: float,
    omega: float,
) -> tuple[np.ndarray, float, float]:
    alpha, beta = schedule(t, tau)
    phi = rng.uniform(0.0, 2.0 * np.pi, size=n)
    angle = omega * t + phi
    z = gamma(angle)
    eps = rng.standard_normal((n, 2))
    x = alpha * z + beta * eps
    return x, alpha, beta


def draw_base(ax: plt.Axes, lim: float) -> None:
    theta = np.linspace(0.0, 2.0 * np.pi, 600)
    curve = gamma(theta)
    ax.plot(curve[:, 0], curve[:, 1], "--", color="#365b63", lw=1.6, alpha=0.95)
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    ax.set_facecolor("#fbfcfe")
    ax.grid(False)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.set_title(r"Marginal probability path  $p_t(x)$", fontsize=14, pad=10)


def render_video(
    output_path: Path,
    frame_times: np.ndarray,
    tau: float,
    omega: float,
    fps: int,
    lim: float,
    samples_per_frame: int,
    seed: int,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        output_path.unlink()

    rng = np.random.default_rng(seed)
    cloud_rgba = np.array([45 / 255.0, 143 / 255.0, 127 / 255.0, 0.10])

    fig, ax = plt.subplots(figsize=(6.2, 5.8), dpi=140)
    writer = FFMpegWriter(
        fps=fps,
        codec="libx264",
        metadata={"title": "Marginal Probability Path"},
        bitrate=2800,
    )

    with writer.saving(fig, str(output_path), dpi=140):
        for t in frame_times:
            cloud, alpha_t, beta_t = sample_marginal_cloud(rng, float(t), samples_per_frame, tau, omega)

            ax.clear()
            draw_base(ax, lim)
            ax.scatter(
                cloud[:, 0],
                cloud[:, 1],
                s=8,
                color=cloud_rgba,
                linewidths=0,
                zorder=2,
            )

            ax.text(
                0.03,
                0.97,
                (
                    f"t = {t:0.2f}\n"
                    f"alpha_t = {alpha_t:0.3f}\n"
                    f"beta_t = {beta_t:0.3f}\n"
                    f"phi ~ Uniform[0, 2pi)"
                ),
                transform=ax.transAxes,
                ha="left",
                va="top",
                fontsize=10,
                bbox=dict(boxstyle="round,pad=0.35", facecolor="white", edgecolor="#d0d7de", alpha=0.96),
            )

            fig.suptitle(
                "Marginalizing over phase spreads the mass around the curve",
                fontsize=15,
                y=0.98,
            )
            fig.tight_layout()
            writer.grab_frame()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a marginal probability-path animation.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--tau", type=float, default=0.45)
    parser.add_argument("--omega", type=float, default=2.0 * np.pi)
    parser.add_argument("--horizon", type=float, default=2.6)
    parser.add_argument("--frames", type=int, default=180)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--lim", type=float, default=2.2)
    parser.add_argument("--samples-per-frame", type=int, default=4000)
    parser.add_argument("--seed", type=int, default=0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    frame_times = np.linspace(0.0, args.horizon, args.frames)
    render_video(
        output_path=args.output,
        frame_times=frame_times,
        tau=args.tau,
        omega=args.omega,
        fps=args.fps,
        lim=args.lim,
        samples_per_frame=args.samples_per_frame,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
