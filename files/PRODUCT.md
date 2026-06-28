# Product

## Register

product

## Vision

IconicSkies is a weather app that treats weather as memory, not just data. The product starts with useful city weather lookup, then turns that context into a personal Sky Journal with notes, photos, titles, moods, favorite places, and time-aware recollection.

## Target Users

- People who notice weather as part of daily life: students, travelers, photographers, commuters, and quiet weather-watchers
- Users who want a personal journal of skies tied to place, temperature, mood, and time
- Developers and reviewers exploring a production-style full-stack portfolio app

## Core User Flows

1. Search for a city and view the current weather.
2. Save the moment with a note, title, mood tags, and an optional sky photo.
3. Revisit the dashboard to see Current Sky, favorite locations, and the Sky Journal timeline.
4. Generate AI assistance only when desired: polish a note, suggest a title and tags, or create a monthly recap.
5. Save a past moment from the last 14 days by choosing the captured time and captured city, then attach the correct historical weather snapshot.

## Key Features

- Weather search with atmospheric city pages
- Private Sky Moment saving with notes and photo uploads
- Favorite locations with live previews
- Current Sky preview from explicit location permission
- Monthly Sky Recap generated on demand
- Redis-backed email OTP verification and optional email OTP sign-in protection

## Sky Journal Behavior

A Sky Moment is a saved weather memory, not just a bookmark. Each moment can include:

- captured city and country
- captured time
- live or historical weather snapshot
- note
- optional title
- optional mood tags
- optional private sky photo

The dashboard timeline is journal-first. It is meant to read like a record of remembered skies rather than a weather log. Moments are grouped chronologically in the journal, while the landing page highlights the newest saved moment as the most recent memory added to the account.

## AI Journal Features

AI is optional and assistive.

- Note enhancement helps polish a rough journal entry while preserving meaning
- Title and mood tag suggestions provide short metadata for saved moments
- Monthly recap summarizes a month of saved moments on demand

AI never replaces the user’s note automatically. The saved result is always the version the user approves.

## Favorite Locations and Current Sky

Favorite locations let users save labeled places such as Home or Hostel and view compact weather previews on the dashboard. Current Sky is explicit and permission-based: the browser asks for location only after user action, and nearby weather is shown without background tracking.

## Past Sky Moment Capture

Past moment capture supports saving memories from up to 14 days ago.

- The user can choose the captured date and time
- The user can change the captured city before saving
- Historical weather is fetched for that chosen time and place
- Current weather is not silently substituted for past captures

This flow supports cases where the photo or memory is saved later from a different city than where it was originally experienced.

## Visual Mood and Photo Switching

Saved moments can show either:

- Mood view: the weather mood image is primary and the photo is secondary
- Photo view: the user’s photo is primary and the weather mood becomes the supporting visual

This is a presentation preference for each moment surface, not a change to the saved data.

## Current Limitations

- Email OTP is implemented; SMS OTP is not a current product feature
- Historical weather depends on provider availability for backdated capture
- AI features depend on Groq configuration and are intentionally on-demand
- Local development can run in mock/demo modes for some external services

## Future Roadmap

- richer journal filtering and search
- optional recap history or shareable exports
- stronger photo management and gallery workflows
- broader provider support for OTP delivery if email-only auth expands
- more nuanced memory views and recap formats
