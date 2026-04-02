#!/usr/bin/env python3

import argparse
import csv
import math
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation, FFMpegWriter


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


def set_equal_axes(ax, data):
    mins = data.min(axis=0)
    maxs = data.max(axis=0)
    centers = (mins + maxs) / 2
    radius = (maxs - mins).max() / 2

    ax.set_xlim(centers[0] - radius, centers[0] + radius)
    ax.set_ylim(centers[1] - radius, centers[1] + radius)
    ax.set_zlim(centers[2] - radius, centers[2] + radius)


def build_animation(
    columns,
    metadata,
    data,
    output_path,
    max_points,
    frames,
    fps,
    elev,
    rotations,
):
    sampled, stride = downsample(data, max_points)
    x, y, z = sampled.T
    sample_count = len(sampled)

    t0 = metadata.get("t0", 0.0)
    t_inc = metadata.get("tInc", 1.0)
    capture_span = len(data) * t_inc

    fig = plt.figure(figsize=(10, 8), dpi=160)
    ax = fig.add_subplot(111, projection="3d")
    fig.patch.set_facecolor("#f4f1ea")
    ax.set_facecolor("#f8f7f4")

    ax.xaxis.pane.set_facecolor((0.94, 0.95, 0.97, 1.0))
    ax.yaxis.pane.set_facecolor((0.94, 0.95, 0.97, 1.0))
    ax.zaxis.pane.set_facecolor((0.94, 0.95, 0.97, 1.0))
    ax.grid(True, linestyle=":", linewidth=0.55, alpha=0.45)

    set_equal_axes(ax, sampled)

    ax.set_title("Lorenz Attractor Circuit Capture", pad=16)
    ax.set_xlabel(columns[0])
    ax.set_ylabel(columns[1])
    ax.set_zlabel(columns[2])

    trace_line, = ax.plot([], [], [], color="#d94841", linewidth=1.4, alpha=0.95)
    glow_line, = ax.plot([], [], [], color="#ffb703", linewidth=3.2, alpha=0.18)
    head_point, = ax.plot([], [], [], marker="o", markersize=5, color="#1d3557")

    info_text = fig.text(0.5, 0.03, "", ha="center", fontsize=10, color="#3f3f46")
    fig.text(
        0.02,
        0.96,
        f"{len(data):,} raw samples, stride {stride}, span {format_time(capture_span)}",
        ha="left",
        va="top",
        fontsize=9,
        color="#52525b",
    )

    def init():
        trace_line.set_data([], [])
        trace_line.set_3d_properties([])
        glow_line.set_data([], [])
        glow_line.set_3d_properties([])
        head_point.set_data([], [])
        head_point.set_3d_properties([])
        ax.view_init(elev=elev, azim=0)
        info_text.set_text("")
        return trace_line, glow_line, head_point, info_text

    def update(frame_index):
        progress = frame_index / max(frames - 1, 1)
        end = max(2, int(progress * (sample_count - 1)))

        trace_line.set_data(x[:end], y[:end])
        trace_line.set_3d_properties(z[:end])

        tail = min(400, end)
        glow_line.set_data(x[end - tail:end], y[end - tail:end])
        glow_line.set_3d_properties(z[end - tail:end])

        head_point.set_data([x[end - 1]], [y[end - 1]])
        head_point.set_3d_properties([z[end - 1]])

        azim = 360.0 * rotations * progress
        ax.view_init(elev=elev, azim=azim)

        current_time = t0 + (end - 1) * t_inc * stride
        info_text.set_text(f"t = {format_time(current_time)}")
        return trace_line, glow_line, head_point, info_text

    animation = FuncAnimation(
        fig,
        update,
        init_func=init,
        frames=frames,
        interval=1000 / fps,
        blit=False,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = FFMpegWriter(fps=fps, bitrate=6000, codec="libx264")
    animation.save(output_path, writer=writer)


def main():
    parser = argparse.ArgumentParser(
        description="Animate a 3D Lorenz trace from a Rigol DHO804 CSV capture."
    )
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("output_video", type=Path)
    parser.add_argument("--max-points", type=int, default=12000)
    parser.add_argument("--frames", type=int, default=600)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--elev", type=float, default=24.0)
    parser.add_argument("--rotations", type=float, default=1.25)
    args = parser.parse_args()

    columns, metadata, data = load_capture(args.input_csv)
    build_animation(
        columns=columns,
        metadata=metadata,
        data=data,
        output_path=args.output_video,
        max_points=args.max_points,
        frames=args.frames,
        fps=args.fps,
        elev=args.elev,
        rotations=args.rotations,
    )


if __name__ == "__main__":
    main()
