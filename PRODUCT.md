# Product

## Register

product

## Product Purpose

IconicSkies is a weather and Sky Journal app built around one promise: "Remember the sky, not just the weather."

The app helps people check live weather, then save meaningful sky moments tied to place, time, weather, notes, and photos. Weather search is the beginning of the product flow, not the end.

## Users

- Students, travelers, photographers, and everyday weather watchers who want practical weather context and a personal record of memorable skies.
- Developers and reviewers evaluating the project as a modern full-stack rebuild of a first-semester static website.
- Local/demo users running the app without production credentials.

## Core Flows

1. Search a city.
2. View current weather and forecast.
3. Save this sky moment.
4. Add a note.
5. Attach a sky photo through mock upload or GCS-backed upload.
6. Revisit saved moments in the dashboard timeline.

## Sky Moment

A sky moment combines:

- city
- date and time
- weather snapshot
- temperature
- condition
- optional sky photo
- optional journal note

## Product Principles

- Lead with weather utility, then make saving a memory feel natural.
- Make the dashboard feel like a timeline of lived skies, not an admin panel.
- Prefer a complete vertical slice over broad, thin features.
- Keep local development useful without real API keys or cloud credentials.
- Treat security and deployment readiness as part of the product, not cleanup.

## Anti-References

- Generic weather clone layouts with only a card, icon, and temperature.
- SaaS dashboards that make personal memories feel like database records.
- Overused purple-blue gradients, unreadable glass panels, and decorative complexity.
- Client-side secrets or browser-delivered cloud credentials.

## Accessibility And Inclusion

- Target practical WCAG AA contrast and keyboard navigation.
- Provide visible focus states and semantic form labels.
- Respect reduced motion preferences.
- Keep mobile layout readable and usable for one-handed weather lookup.
