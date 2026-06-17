# Design

## Direction

IconicSkies should feel atmospheric, cinematic, calm, and useful. The design serves the Sky Journal workflow: search weather, understand the sky, save a memory, revisit it later.

The product should not feel like a generic dark template. The visual language should stay tied to weather, memory, sky, and atmosphere.

## Visual System

- Use a restrained product UI with atmospheric accents rather than a loud landing page.
- Prefer deep readable ink, stormy blue-green neutrals, warm sunlit highlights, and clear semantic states.
- Keep cards purposeful: weather hero, timeline entries, forms, and upload areas only.
- Avoid nested cards, generic icon grids, and unreadable glassmorphism.
- Use glass surfaces sparingly. Important weather data, form inputs, and upload controls should use solid or semi-solid premium surfaces.
- Reuse the original weather icon assets where they help continuity.

## Layout

- Homepage: one dark cinematic hero with the landing poster/video as an integrated layer, a strong left-side search narrative, and a single refined Sky Journal preview.
- City page: full-width atmospheric weather hero band, followed by elevated details/forecast panels and a prominent "Save this sky moment" form.
- Dashboard: chronological Sky Journal timeline with weather, note, and photo context.
- Auth pages: quiet, direct, and fast.

## Components

- Search field with explicit submit button and loading/error states.
- Weather hero with condition, temperature, location, local time, humidity, wind, and forecast.
- Sky moment form with note input and upload/mock upload affordance.
- Timeline item with city, date, weather snapshot, note, and photo if present.
- Navigation with signed-in/signed-out states.

## Atmospheric Backgrounds

- Curated interface backgrounds live in `public/backgrounds/`, separate from user-uploaded GCS photos.
- Landing assets use `public/backgrounds/landing/landing-poster.webp` for desktop/tablet, `landing-poster-mobile.webp` below 768px, and optional desktop video `landing-loop.mp4`.
- Weather assets use `public/backgrounds/weather/{mood}.webp`; mood keys include clear, partly cloudy, cloudy, rain, thunderstorm, snow, fog, wind, sunrise, sunset, plus `default-day` and `default-night` manifest aliases.
- The resolver maps optional weather metadata when available: OpenWeather id, cloudiness, wind speed, timezone offset, sunrise, and sunset. Older cached snapshots still fall back to condition, description, icon code, and captured time.
- The landing page defaults to image mode. Desktop users may opt into video mode, stored in `localStorage`; mobile and reduced-motion users stay in image mode. The mobile poster uses `object-fit`-equivalent cover behavior with a mobile-specific focal position.
- Background images are single selected `/public` paths with `object-fit: cover`, readable overlays, and no bulk preloading of all moods.
- Landing layering uses the poster/video first, then deep navy/dusk gradients to preserve artwork while keeping the headline and search readable.
- City layering uses condition-specific mood images in the hero only, then transitions into solid/semi-solid panels so the weather mood registers without sacrificing form readability.
- Video mode remains a desktop enhancement: muted, looping, `playsInline`, `preload="metadata"`, and poster fallback if playback fails.

## Accessibility

- Maintain clear focus states for links, buttons, inputs, and file controls.
- Use labels and accessible names for forms and actions.
- Avoid text over busy image areas unless contrast is guaranteed.
- Provide reduced-motion-safe interactions.
