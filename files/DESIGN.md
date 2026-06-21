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
- Optional AI journal enhancement inside the Sky Moment form, with a writing-style dropdown, a preview card, and user-approved apply/copy/regenerate actions.
- Optional AI title and mood-tag suggestions inside the Sky Moment form, kept compact and user-approved so the journal note still remains the hero.
- Timeline item with city, date, weather snapshot, note, and photo if present.
- Navigation with signed-in/signed-out states.

## Progressive Disclosure

- Optional dashboard surfaces should collapse cleanly instead of stacking tall by default.
- `Current Sky` stays visible, while `Monthly Sky Recap`, `Favorite skies`, and older journal months use collapsible headers with useful summary text.
- The save form keeps the note, photo upload, and save button visible, but AI note enhancement and title/mood tools live in collapsible panels.
- Collapsed headers should remain informative and accessible, with counts or status text so the hidden content is obvious before it is opened.

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
- Non-city app surfaces such as dashboard, journal, and failed lookup states use a shared atmospheric shell: dark navy gradients, subtle radial highlights, and compact readable surfaces. This keeps the journal experience aligned with the landing and city pages without loading weather backgrounds where they are not needed.

## Favorite Locations

- Signed-in users can save private favorite locations with custom labels such as Home, Hostel, or Work.
- The dashboard treats favorites as a compact personal sky board, not a CRUD table.
- Favorite cards show a live weather preview for up to 6 places, with graceful per-card fallback if a preview fails.
- The dashboard also includes an explicit, click-to-use current-location preview card. Location access stays ephemeral until the user explicitly saves it as a favorite.
- Saved sky moments in the timeline show a small favorite pill when the moment belongs to one of the user's saved places.
- Favorite labels and current-location save controls should stay calm, compact, and readable. The user should see the weather first, then the place identity, then the editing actions.

## AI Journal Enhancement

- The AI note helper is optional and only appears when `GROQ_API_KEY` is configured server-side.
- It polishes the user's rough Sky Journal note, but never replaces it automatically.
- Styles currently include Aesthetic, Formal, Classic, Poetic, Minimal, Nostalgic, Travel diary, and Weather report.
- The assistant should use weather context as atmosphere, not as a source of invented facts.
- The result should feel like the user's writing, just clearer and more intentional.
- The default Groq model is `llama-3.3-70b-versatile`, and `GROQ_MODEL` can override it when needed.
- AI journal insights generate optional titles plus mood tags. The title should feel compact and poetic, while tags should stay readable and lowercase.
- Monthly recap lives on the dashboard as an on-demand summary card with month navigation, calm stats, and a generated paragraph only after the user clicks a button.

## Accessibility

- Maintain clear focus states for links, buttons, inputs, and file controls.
- Use labels and accessible names for forms and actions.
- Avoid text over busy image areas unless contrast is guaranteed.
- Provide reduced-motion-safe interactions.
- Collapsible sections should preserve state when closed, support keyboard toggling, and never trigger AI or network work simply because they were opened.
