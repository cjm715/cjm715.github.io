from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FFMpegWriter


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "videos" / "flow-matching-conditional-theory.mp4"


def gamma(angle: np.ndarray) -> np.ndarray:
    angle = np.asarray(angle)
    return np.stack([np.cos(angle), np.sin(angle)], axis=-1)


def gamma_prime(angle: np.ndarray) -> np.ndarray:
    angle = np.asarray(angle)
    return np.stack([-np.sin(angle), np.cos(angle)], axis=-1)


def schedule(t: float, tau: float) -> tuple[float, float]:
    beta = float(np.exp(-t / tau))
    alpha = 1.0 - beta
    return alpha, beta


def conditional_state(t: float, phi: float, tau: float, omega: float) -> tuple[float, float, np.ndarray, np.ndarray]:
    alpha, beta = schedule(t, tau)
    angle = omega * t + phi
    z = gamma(angle)
    dz = gamma_prime(angle)
    return alpha, beta, z, dz


def conditional_field(x: np.ndarray, t: float, phi: float, tau: float, omega: float) -> np.ndarray:
    alpha, _, z, dz = conditional_state(t, phi, tau, omega)
    return -(1.0 / tau) * (x - z) + omega * alpha * dz


def rk4_step(x: np.ndarray, t: float, dt: float, phi: float, tau: float, omega: float) -> np.ndarray:
    k1 = conditional_field(x, t, phi, tau, omega)
    k2 = conditional_field(x + 0.5 * dt * k1, t + 0.5 * dt, phi, tau, omega)
    k3 = conditional_field(x + 0.5 * dt * k2, t + 0.5 * dt, phi, tau, omega)
    k4 = conditional_field(x + dt * k3, t + dt, phi, tau, omega)
    return x + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def simulate_population(
    x0: np.ndarray,
    frame_times: np.ndarray,
    substeps: int,
    phi: float,
    tau: float,
    omega: float,
) -> np.ndarray:
    x = x0.copy()
    traj = [x.copy()]

    for frame_idx in range(1, len(frame_times)):
        t_prev = float(frame_times[frame_idx - 1])
        t_curr = float(frame_times[frame_idx])
        dt = (t_curr - t_prev) / substeps
        t_now = t_prev
        for _ in range(substeps):
            x = rk4_step(x, t_now, dt, phi, tau, omega)
            t_now += dt
        traj.append(x.copy())

    return np.stack(traj, axis=0)


def sample_conditional_cloud(
    rng: np.random.Generator,
    t: float,
    n: int,
    phi: float,
    tau: float,
    omega: float,
) -> np.ndarray:
    alpha, beta, z, _ = conditional_state(t, phi, tau, omega)
    eps = rng.standard_normal((n, 2))
    return alpha * z[None, :] + beta * eps


def build_grid(grid_size: int, lim: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    xs = np.linspace(-lim, lim, grid_size)
    ys = np.linspace(-lim, lim, grid_size)
    xg, yg = np.meshgrid(xs, ys)
    grid = np.stack([xg.ravel(), yg.ravel()], axis=-1)
    return xg, yg, grid


def draw_base(ax: plt.Axes, lim: float, title: str) -> None:
    theta = np.linspace(0.0, 2.0 * np.pi, 500)
    unit_circle = gamma(theta)
    ax.plot(unit_circle[:, 0], unit_circle[:, 1], "--", color="#6c7a89", lw=1.6, alpha=0.95)
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    ax.set_facecolor("#fbfcfe")
    ax.grid(True, alpha=0.10, color="#d9dee7")
    ax.set_title(title, fontsize=14, pad=10)


def render_video(
    output_path: Path,
    frame_times: np.ndarray,
    traj: np.ndarray,
    phi: float,
    tau: float,
    omega: float,
    fps: int,
    grid_size: int,
    lim: float,
    cloud_samples: int,
    tail: int,
    seed: int,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        output_path.unlink()

    xg, yg, grid = build_grid(grid_size, lim)
    rng = np.random.default_rng(seed)

    arrow_color = "#a9c5eb"
    target_color = "#4f6b8a"
    point_color = np.array([121 / 255.0, 83 / 255.0, 118 / 255.0, 1.0])

    fig, ax = plt.subplots(figsize=(6.2, 5.8), dpi=140)
    writer = FFMpegWriter(
        fps=fps,
        codec="libx264",
        metadata={"title": "Conditional Flow Matching Theory"},
        bitrate=2800,
    )

    with writer.saving(fig, str(output_path), dpi=140):
        for frame_idx, t in enumerate(frame_times):
            alpha_t, beta_t, z_t, _ = conditional_state(float(t), phi, tau, omega)

            vel = conditional_field(grid, float(t), phi, tau, omega).reshape(grid_size, grid_size, 2)
            speed = np.linalg.norm(vel, axis=-1, keepdims=True)
            vel_norm = vel / (speed + 1e-6)

            ax.clear()
            draw_base(ax, lim, r"Conditional velocity field  $u_t(x\mid \phi)$")

            ax.quiver(
                xg,
                yg,
                vel_norm[..., 0],
                vel_norm[..., 1],
                color=arrow_color,
                pivot="mid",
                scale=28,
                width=0.0040,
                alpha=0.95,
            )

            current = traj[frame_idx]
            ax.scatter(
                current[:, 0],
                current[:, 1],
                s=24,
                color=point_color,
                edgecolors="white",
                linewidths=0.35,
                zorder=4,
            )
            ax.scatter(
                [z_t[0]],
                [z_t[1]],
                s=105,
                color=target_color,
                edgecolors="white",
                linewidths=0.8,
                zorder=5,
            )

            ax.text(
                0.03,
                0.97,
                (
                    f"t = {t:0.2f}\n"
                    f"phi = {phi:0.2f}\n"
                    f"alpha_t = {alpha_t:0.3f}\n"
                    f"beta_t = {beta_t:0.3f}\n"
                    f"tau = {tau:0.2f}\n"
                    f"omega = {omega:0.2f}"
                ),
                transform=ax.transAxes,
                ha="left",
                va="top",
                fontsize=10,
                bbox=dict(boxstyle="round,pad=0.35", facecolor="white", edgecolor="#d0d7de", alpha=0.96),
            )

            fig.suptitle(
                "Conditional field for a fixed latent phase",
                fontsize=15,
                y=0.98,
            )
            fig.tight_layout()
            writer.grab_frame()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a conditional flow-matching theory video.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--phi", type=float, default=0.7)
    parser.add_argument("--tau", type=float, default=0.45)
    parser.add_argument("--omega", type=float, default=2.0 * np.pi)
    parser.add_argument("--horizon", type=float, default=2.6)
    parser.add_argument("--frames", type=int, default=180)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--particles", type=int, default=150)
    parser.add_argument("--cloud-samples", type=int, default=0)
    parser.add_argument("--substeps", type=int, default=4)
    parser.add_argument("--grid-size", type=int, default=23)
    parser.add_argument("--lim", type=float, default=2.2)
    parser.add_argument("--tail", type=int, default=0)
    parser.add_argument("--seed", type=int, default=0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rng = np.random.default_rng(args.seed)
    x0 = rng.standard_normal((args.particles, 2))
    frame_times = np.linspace(0.0, args.horizon, args.frames)
    traj = simulate_population(
        x0=x0,
        frame_times=frame_times,
        substeps=args.substeps,
        phi=args.phi,
        tau=args.tau,
        omega=args.omega,
    )
    render_video(
        output_path=args.output,
        frame_times=frame_times,
        traj=traj,
        phi=args.phi,
        tau=args.tau,
        omega=args.omega,
        fps=args.fps,
        grid_size=args.grid_size,
        lim=args.lim,
        cloud_samples=args.cloud_samples,
        tail=args.tail,
        seed=args.seed,
    )
    print(f"Saved video: {args.output}")


if __name__ == "__main__":
    main()
