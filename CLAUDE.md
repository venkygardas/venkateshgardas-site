## Design system

`design/DESIGN.md` is the only source of truth for colour, type, spacing,
radius, and motion.

- Read `design/DESIGN.md` before writing or editing any UI code.
- Never write a raw hex value or an arbitrary px value in a component.
- If a token you need does not exist, stop and ask. Do not invent one.
- After any UI change, re-check every number under `a11y` in DESIGN.md and
  report each as PASS or FAIL with the measured value. Do not report a
  check as passing without a measurement.
- Save each approved output into `design/refs/` and use it as reference
  in the next session.
