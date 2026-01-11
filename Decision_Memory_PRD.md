# PRD Section: Prompt & Council Recall (Decision Memory)

## Feature Name

Decision Memory: Prompt & Council Recall

## Problem Statement

Users frequently want to reuse or iterate on prior work but struggle to
recall the exact prompt wording, which AI models were used, and which
council configurations produced the best outcomes. Chronological chat
histories are inefficient and do not match how users remember prior
decisions.

## Goal

Provide an intuitive, fast, and visually recognizable way to recall,
compare, and reuse previously executed prompts together with their
associated AI council configurations.

## Success Criteria

-   Users can recall a prior prompt or council in ≤ 3 seconds
-   Users can re-run prior work without reconfiguration
-   Recall experience feels asset-based, not log-based
-   Feature scales cleanly with hundreds of past runs

## Feature Overview

Each completed council run is stored as a Decision Card---a reusable,
searchable artifact representing the prompt, council composition, and
execution outcome.

## Core Concepts

### Decision Cards

Each council run generates a Decision Card containing: - Editable
title - Prompt intent tag - Council fingerprint (model chips) - Outcome
indicators (consensus, cost tier, depth) - Timestamp - Optional user
rating and notes

### Council Fingerprints

Compact visual representation of the AI council used, including role
badges and hoverable metadata.

### Smart Recall Modes

-   Semantic Recall
-   Outcome-Based Filters
-   Council-First Recall

### Re-Run Actions

-   Re-run exactly
-   Reuse council only
-   Reuse prompt only

### Global Recall Entry Point

Global command bar (⌘K / Ctrl+K) for instant access to prior decisions.

## UX Principles

-   Recognition over recall
-   Progressive disclosure
-   Zero friction reuse

## Non-Goals

-   Prompt version diffing
-   Cross-user shared libraries
-   Token-level replay

## Acceptance Criteria

-   Decision Cards are created automatically on run completion
-   Cards are searchable semantically
-   Council fingerprints are visually distinct
-   Re-runs generate new immutable records
-   Access is restricted by org/project permissions
