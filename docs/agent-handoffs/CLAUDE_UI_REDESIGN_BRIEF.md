# Claude UI Redesign Brief (MISATO)

## Objective
Polish MISATO Tactical HUD visuals while preserving architecture, auth, and safety controls.

## Scope
- `/misato/*` pages only
- component styling/layout refinement
- readability + interaction flow

## Keep Intact (Non-negotiable)
- owner-only auth behavior
- `/api/misato/*` guard behavior
- approval gate routing semantics
- no secrets rendered

## Visual Direction
- dark graphite base
- red = risk, amber = warning, green = safe, cyan/blue = telemetry
- tactical cards + status lights + command strips

## Deliverables
- polished component set
- consistent spacing/typography
- maintain mobile usability
