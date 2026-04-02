#!/usr/bin/env python3

import argparse
import csv
import math
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np


def parse_header(header_row):
    columns = [item.strip() for item in header_row[:3]]
    metadata = {}
    for item in header_row[3:]:
        item = item.strip()
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        metadata[key.strip()] = float(value.strip())
    return columns, metadata


def load_capture(csv_path):
    with csv_path.open("r", newline="") as handle:
        reader = csv.reader(handle)
        header_row = next(reader)

    columns, metadata = parse_header(header_row)
    data = np.loadtxt(csv_path, delimiter=",", skiprows=1, usecols=(0, 1, 2))
    return columns, metadata, data


def downsample(data, max_points):
    stride = max(1, math.ceil(len(data) / max_points))
    return data[::stride], stride


def format_time(seconds):
    magnitude = abs(seconds)
    if magnitude >= 1:
        return f"{seconds:.3f} s"
    if magnitude >= 1e-3:
        return f"{seconds * 1e3:.3f} ms"
    if magnitude >= 1e-6:
        return f"{seconds * 1e6:.3f} us"
    return f"{seconds * 1e9:.3f} ns"


def build_plot(columns, metadata, data, output_path, max_points, elev, azim):
    sampled, stride = downsample(data, max_points)
    x, y, z = sampled.T

    t0 = metadata.get("t0", 0.0)
    t_inc = metadata.get("tInc", 1.0)
    total_time = len(data) * t_inc
    sample_time = np.arange(len(sampled)) * t_inc * stride + t0

    fig = plt.figure(figsize=(10, 8), dpi=180)
    ax = fig.add_subplot(111, projection="3d")

    # Use a colored point cloud instead of a full million-point line so the
    # attractor structure stays readable and the render stays fast.
    scatter = ax.scatter(
        x,
        y,
        z,
        c=sample_time,
        cmap="plasma",
        s=0.8,
        alpha=0.75,
        linewidths=0,
    )

    ax.plot(x, y, z, color="#111111", linewidth=0.25, alpha=0.18)

    ax.set_title("Lorenz Attractor Circuit Capture", pad=16)
    ax.set_xlabel(columns[0])
    ax.set_ylabel(columns[1])
    ax.set_zlabel(columns[2])
    ax.view_init(elev=elev, azim=azim)

    ax.xaxis.pane.set_facecolor((0.96, 0.97, 0.99, 1.0))
    ax.yaxis.pane.set_facecolor((0.96, 0.97, 0.99, 1.0))
    ax.zaxis.pane.set_facecolor((0.96, 0.97, 0.99, 1.0))
    ax.grid(True, linestyle=":", linewidth=0.5, alpha=0.5)

    subtitle = (
        f"{len(data):,} samples, plotted every {stride} points, "
        f"capture span {format_time(total_time)}"
    )
    fig.text(0.5, 0.03, subtitle, ha="center", fontsize=9, color="#444444")

    cbar = fig.colorbar(scatter, ax=ax, pad=0.08, shrink=0.75)
    cbar.set_label("Time (s)")

    fig.tight_layout(rect=(0, 0.05, 1, 1))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, bbox_inches="tight")


def main():
    parser = argparse.ArgumentParser(
        description="Render a 3D plot from a Rigol DHO804 CSV capture."
    )
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("output_image", type=Path)
    parser.add_argument("--max-points", type=int, default=50000)
    parser.add_argument("--elev", type=float, default=24.0)
    parser.add_argument("--azim", type=float, default=42.0)
    args = parser.parse_args()

    columns, metadata, data = load_capture(args.input_csv)
    build_plot(
        columns=columns,
        metadata=metadata,
        data=data,
        output_path=args.output_image,
        max_points=args.max_points,
        elev=args.elev,
        azim=args.azim,
    )


if __name__ == "__main__":
    main()
