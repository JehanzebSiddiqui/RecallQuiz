# Recall AI

A Chrome extension that helps you study with **active recall**. Highlight text on any webpage, or drag a box over any region of the screen, and Recall AI writes short-answer questions from that passage so you can test yourself while you read.

<!-- Add a demo GIF here, for example: ![Demo](docs/demo.gif) -->

## Features

- **Snip a region:** drag a box over text, a PDF, or slides, and the cropped image is sent to Claude to write the quiz.
- **Highlight text:** select text on any page and generate questions from it.
- **Paste a screenshot:** snip anything with `Win+Shift+S`, then press `Ctrl+V` in the side panel.
- **Recall before reveal:** type your answer from memory first, then reveal the correct one.
- **Grounded questions:** the model is instructed to use only facts stated in the passage, so the quiz does not add outside information.

## How it works

| Part | Role |
| --- | --- |
| Content script | Detects highlighted text and draws the drag-to-select overlay on the page |
| Background script | Captures a screenshot of the visible tab |
| Side panel (React) | Crops the image, sends it to the proxy, and shows the quiz |
| Cloudflare Worker proxy | Holds the API key, calls Claude, and returns the questions |

The extension parts are separate programs that communicate through Chrome's message-passing API.

## Tech stack

TypeScript, React, WXT (Manifest V3), Chrome Extension APIs (`sidePanel`, `tabs`, `storage`), Cloudflare Workers, Claude API

## Getting started

### Install without the Web Store
1. Download the latest `.zip` from [Releases](https://github.com/JehanzebSiddiqui/RecallQuiz/releases) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder (the one that contains `manifest.json`).

## Security

The extension never holds an API key. It sends the passage to a Cloudflare Worker proxy, which:

- keeps the Anthropic API key as an encrypted secret
- fixes the model and system prompt server-side, so callers can't use it as a general-purpose Claude endpoint
- validates input type and size
- rate-limits requests per client IP

## Roadmap

- [x] API proxy with rate limiting, so users do not need their own key
- [ ] AI grading of typed answers against the source passage
- [ ] Saved questions with spaced-repetition review (SM-2)
- [ ] Automated tests
- [ ] Chrome Web Store listing

## Project structure

```
entrypoints/
  background.ts      # tab screenshot capture
  content.ts         # text selection and snip overlay
  sidepanel/App.tsx  # quiz UI
utils/
  quiz.ts            # proxy request
  crop.ts            # canvas image cropping
```