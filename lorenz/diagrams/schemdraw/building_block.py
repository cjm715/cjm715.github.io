"""Universal building block: inverting summing integrator with N inputs.

Each Lorenz module (dX/dt, dY/dt, dZ/dt) is an instance of this block.
Schemdraw convention (confirmed from the gallery's inverting-amp example):
op.in1 is the top pin / inverting input, op.in2 is the bottom pin /
non-inverting input.
"""

import schemdraw
import schemdraw.elements as elm


def draw(out_path: str) -> None:
    with schemdraw.Drawing(file=out_path, show=False) as d:
        d.config(unit=2.0, fontsize=14)

        op = elm.Opamp(leads=True).label(
            "$A_\\mathrm{OL}\\to\\infty$", loc="center", fontsize=10
        )
        d += op

        # Non-inverting input to ground.
        d += elm.Line().down(0.5).at(op.in2)
        d += elm.Ground(lead=False)

        # Three input branches at the same height as in1, idiomatic chain.
        # We draw R_1 first at in1, then route the bus upward to add R_2 and R_N.
        # Simpler: route inputs into a vertical bus that ties to in1.

        # Pull the summing-junction wire LEFT from in1.
        d += elm.Line().left(0.6).at(op.in1)
        sum_node = d.here  # absolute coords of the junction

        # Vertical bus extending up and down from the junction.
        bus_up = 2.5
        bus_down = 2.5
        d += elm.Line().endpoints(
            (sum_node[0], sum_node[1] + bus_up),
            (sum_node[0], sum_node[1] - bus_down),
        )
        d += elm.Dot().at(sum_node)

        # Three input branches: V_1 (top), V_2 (middle), V_N (bottom).
        rows = [
            (bus_up, "$V_1$", "$R_1$"),
            (0.0, "$V_2$", "$R_2$"),
            (-bus_down, "$V_N$", "$R_N$"),
        ]
        for y_off, vlab, rlab in rows:
            y = sum_node[1] + y_off
            d += elm.Resistor().endpoints(
                (sum_node[0] - 2.0, y), (sum_node[0], y)
            ).label(rlab)
            d += elm.Line().endpoints(
                (sum_node[0] - 3.0, y), (sum_node[0] - 2.0, y)
            )
            d += elm.Dot(open=True).at((sum_node[0] - 3.0, y))
            d += elm.Label().at((sum_node[0] - 3.3, y)).label(vlab, loc="left")

        # Vertical ellipsis between R_2 and R_N.
        d += elm.Label().at(
            (sum_node[0] - 1.5, sum_node[1] - bus_down / 2 - 0.2)
        ).label("$\\vdots$", fontsize=24)

        # Feedback capacitor from output back to the summing junction,
        # routed up over the top of the op-amp.
        d += elm.Line().right(0.5).at(op.out)
        out_join = d.here
        feedback_y = sum_node[1] + bus_up + 1.0
        d += elm.Line().up().toy(feedback_y)
        d += elm.Capacitor().left().tox(sum_node[0]).label("$C$")
        d += elm.Line().down().toy(sum_node[1] + bus_up)

        # Output wire and label.
        d += elm.Line().right(1.4).at(out_join)
        d += elm.Dot(open=True)
        d += elm.Label().label("$V_\\mathrm{out}$", loc="right")


if __name__ == "__main__":
    draw("building_block.svg")
    print("wrote building_block.svg")
