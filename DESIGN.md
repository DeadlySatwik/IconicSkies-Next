# Design

## Direction

IconicSkies should feel atmospheric, cinematic, calm, and useful. The design serves the Sky Journal workflow: search weather, understand the sky, save a memory, revisit it later.

## Visual System

- Use a restrained product UI with atmospheric accents rather than a loud landing page.
- Prefer deep readable ink, stormy blue-green neutrals, warm sunlit highlights, and clear semantic states.
- Keep cards purposeful: weather hero, timeline entries, forms, and upload areas only.
- Avoid nested cards, generic icon grids, and unreadable glassmorphism.
- Reuse the original weather icon assets where they help continuity.

## Layout

- Homepage: search-first weather experience with a strong sky identity and clear route into city weather.
- City page: weather hero, forecast summary, and a prominent "Save this sky moment" form.
- Dashboard: chronological Sky Journal timeline with weather, note, and photo context.
- Auth pages: quiet, direct, and fast.

## Components

- Search field with explicit submit button and loading/error states.
- Weather hero with condition, temperature, location, local time, humidity, wind, and forecast.
- Sky moment form with note input and upload/mock upload affordance.
- Timeline item with city, date, weather snapshot, note, and photo if present.
- Navigation with signed-in/signed-out states.

## Accessibility

- Maintain clear focus states for links, buttons, inputs, and file controls.
- Use labels and accessible names for forms and actions.
- Avoid text over busy image areas unless contrast is guaranteed.
- Provide reduced-motion-safe interactions.
