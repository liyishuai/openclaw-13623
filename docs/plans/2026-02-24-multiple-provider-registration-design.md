# Design: Multiple Provider Registration for Gemini CLI Auth

## Problem

The `google-gemini-cli` provider registers a single auth profile shared across all Gemini models.
A 429 quota error on one model (e.g. `gemini-3.1-pro-preview`) marks the entire auth profile as
unavailable, blocking fallback models (`gemini-3-flash-preview`, etc.) even though they have
independent quotas.

Reference: https://github.com/openclaw/openclaw/issues/13623

## Solution

Register three separate providers instead of one. Each provider has its own auth profile state,
so a cooldown on one does not affect the others.

| Provider ID    | Label                    | Default Model                        |
|----------------|--------------------------|--------------------------------------|
| `gemini-pro`   | Gemini Pro (CLI OAuth)   | `gemini-pro/gemini-3.1-pro-preview`  |
| `gemini-flash` | Gemini Flash (CLI OAuth) | `gemini-flash/gemini-3-flash-preview`|
| `gemini-lite`  | Gemini Lite (CLI OAuth)  | `gemini-lite/gemini-2.5-flash-lite`  |

## Changes

### `index.ts`

Replace the single `PROVIDER_ID` / `PROVIDER_LABEL` / `DEFAULT_MODEL` constants with a `PROVIDERS`
array. Define the shared OAuth auth block once. In `register()`, loop over `PROVIDERS` and call
`api.registerProvider()` for each entry, passing the per-entry `id` and `defaultModel` into
`buildOauthProviderAuthResult`.

### `openclaw.plugin.json`

Change `"providers"` from `["google-gemini-cli"]` to
`["gemini-pro", "gemini-flash", "gemini-lite"]`.

### Unchanged

`oauth.ts` and `oauth.test.ts` require no changes.
