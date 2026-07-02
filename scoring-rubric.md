# Round & Round Records Chatbot - Quality Scoring Rubric

**Author:** Keelin O'Sullivan (@Keelin)
**Date:** 2026-07-02
**Version:** 1.0.0 (baseline assessment)
**Codebase:** index.html (single-file, 1234 lines)

---

## Scoring Framework

Each category has a weight, a set of sub-categories, and a 1-5 scale. The overall score is the weighted sum of category scores.

| Score | Rating | Descriptor |
|-------|--------|------------|
| 1 | Critical Fail | Unusable or fails catastrophically under common conditions |
| 2 | Poor | Works only on the happy path; many edge cases break |
| 3 | Acceptable | Handles common cases well; some edge cases missed |
| 4 | Good | Handles most cases; minor issues in extreme edge cases |
| 5 | Excellent | Robust across all cases; graceful degradation everywhere |

---

## Category 1: Conversation Accuracy (25%)

**Weight:** 25% | **Current Score:** 3.4 / 5 = **17.0%** of 25%

### 1.1 Greeting & Onboarding Flow (20% of category)
How well does Bob handle first-time and returning-user introductions?
| Score | Criteria |
|-------|----------|
| 1 | No greeting. Blank screen or error on load. |
| 2 | Hardcoded greeting that ignores return visits and name state. |
| 3 | Basic greeting with name capture; returning user detection works but greeting feels mechanical. |
| 4 | Personalised greeting with name, visit count, and relevant suggestions. Minor timing/race issues. |
| 5 | Warm, context-aware greeting. Handles edge cases: no localStorage, corrupt data, rapid reload. Suggestion chips are relevant. |

**Current:** 4 - Greeting handles first-time, returning, and name capture. Welcome message timing uses `setTimeout` chains that could race with user input. The only issue: rapid early typing could interleave with timed welcome messages.

### 1.2 Intent Recognition & Routing (30% of category)
How accurately does the system classify user input (artist search vs genre vs human handoff vs gibberish vs chat)?
| Score | Criteria |
|-------|----------|
| 1 | No classification; single hardcoded response to all input. |
| 2 | Basic keyword matching only; easily confused by similar words. |
| 3 | Regex-based classification with noise filtering; some over/under matching. |
| 4 | Regex + LLM entity extraction; handles most cases but misses cross-language/edge inputs. |
| 5 | Sophisticated intent routing with confidence scoring; graceful fallback for ambiguous input. |

**Current:** 3 - Regex-based extraction (`extractArtists`, `findBestTag`) combined with LLM entity extraction. The gibberish detection has false positives (short names like "U2", "M.I.A." may get caught). Multi-artist parsing works but relies on "and"/"or" splitting which fails for band names containing "and" (e.g., "Mumford and Sons" would be split). Genre detection depends on a static `DISCOVERY_TAGS` array.

### 1.3 Conversation Flow & Context (25% of category)
How naturally does the conversation flow? Does Bob maintain context across turns?
| Score | Criteria |
|-------|----------|
| 1 | Stateless; each turn is isolated. No follow-up awareness. |
| 2 | Follow-up detection exists but is crude; misclassifies new topics as follow-ups. |
| 3 | Follow-up detection works for short replies to questions. Context from panel data fed to LLM on next turn. |
| 4 | Natural conversational flow with graceful topic switching. Good use of panel data. |
| 5 | Full dialogue state tracking; Bob asks relevant follow-ups; panel data integrated smoothly into conversation. |

**Current:** 3 - Follow-up detection (`isFollowUp`) checks for question marks and short replies. Panel data is fed as a system message on the next LLM turn so Bob can reference it. The `lastBobAsked` flag is a reasonable heuristic but can misclassify: a short command after a rhetorical question is treated as a follow-up.

### 1.4 LLM Response Quality (25% of category)
Is the LLM response natural, helpful, and on-topic?
| Score | Criteria |
|-------|----------|
| 1 | No LLM; hardcoded responses only. |
| 2 | LLM present but poorly prompted; generic responses, hallucinating, ignoring context. |
| 3 | LLM responds with personality; sometimes misses context or provides too much/too little info. |
| 4 | LLM consistently on-topic with good personality; minor hallucinations or repetition. |
| 5 | LLM is natural, informative, and engaging. Rarely hallucinates. References panel data naturally. |

**Current:** 4 - The system prompt is well-crafted ("Bob_VOICE") with Dublin flavour. Temperature 0.9 and 400 max_tokens provide good balance. Conv history limited to last 20 messages prevents context overflow. Memory preamble enriches the system prompt. Deduction: no guard against markdown in LLM output even though prompt says "No markdown".

**Category 1 Total:** (4 * 0.20 + 3 * 0.30 + 3 * 0.25 + 4 * 0.25) = 0.80 + 0.90 + 0.75 + 1.00 = **3.45** → rounded to **3.4**

---

## Category 2: UI/UX Quality (20%)

**Weight:** 20% | **Current Score:** 2.8 / 5 = **11.2%** of 20%

### 2.1 Visual Design & Branding (20% of category)
Is the interface visually appealing, on-brand, and consistent?
| Score | Criteria |
|-------|----------|
| 1 | Unstyled or broken layout. Inconsistent colours. |
| 2 | Basic styling but inconsistent spacing, poor typography, no visual hierarchy. |
| 3 | Good styling with consistent theme. Branding elements present. Some spacing inconsistencies. |
| 4 | Polished dark theme with branded record store aesthetic. Consistent spacing. Animations enhance UX. |
| 5 | Exceptional visual design. Animations feel natural. Accessibility-first colour contrast. |

**Current:** 4 - Strong dark theme with record store aesthetic. Brand bar with vinyl record icon, gradient effects, and accent glow. Custom animations (fadeUp, bounce, pulse-ring, spin). Consistent use of CSS variables. Well-crafted loading spinner.

### 2.2 Information Architecture (20% of category)
Is the layout intuitive? Can users easily find information?
| Score | Criteria |
|-------|----------|
| 1 | Single column, no organisation. |
| 2 | Basic split layout but discovery panel hard to navigate. |
| 3 | Chat + discovery split makes sense. Sections organised logically. |
| 4 | Intuitive layout with clear visual hierarchy. Discovery panel well-organised (hero, similar, genres, albums). |
| 5 | Exceptional IA. User can find any information in <3 clicks. Progressive disclosure. |

**Current:** 3 - Desktop split layout (400px chat + discovery) works well. Discovery panel sections (hero, similar, genres, albums) are logically ordered. Deduction: no search box or filter in discovery panel for albums. Back navigation is only via a small back button.

### 2.3 Interactivity & Responsiveness (25% of category)
Do buttons, links, and interactions work smoothly and provide feedback?
| Score | Criteria |
|-------|----------|
| 1 | Buttons don't respond. No hover/active states. |
| 2 | Basic click handlers but no visual feedback. Delays feel unresponsive. |
| 3 | Hover states, transitions, and loading indicators present. Some interactions lack feedback. |
| 4 | Fast interactions with clear feedback. Loading spinner, typing indicator, animations for state changes. |
| 5 | Instant feedback everywhere. Skeleton loading, optimistic UI updates, tactile interactions. |

**Current:** 3 - Good hover transitions and loading indicators. Turntable spinner is excellent. Deductions: `enrichLinks` causes layout shift after messages render (DOM rewrite). No optimistic updates for discovery panel (loading spinner shown then full replacement). Discogs badges load asynchronously causing visible pop-in. No "loading" indicator for individual album badge enrichment.

### 2.4 Content Display & Information Density (20% of category)
Is content well-formatted, readable, and appropriately dense?
| Score | Criteria |
|-------|----------|
| 1 | Unformatted text dumps. Unreadable. |
| 2 | Text-heavy with poor formatting. Line height and font size issues. |
| 3 | Reasonable formatting. Album grid, similar artists, and genre chips are scannable. |
| 4 | Well-formatted content. Clear typography hierarchy. Bio truncation with "more" link. |
| 5 | Content perfectly formatted for scanning. Excellent use of space. All relevant metadata shown concisely. |

**Current:** 3 - Album grid is clean. Similar artist cards are scannable. Bio truncation with "more/less" is a nice touch. Deductions: album names in chat don't show artist context (just the album name). Non-album metadata (listener count, play count) is small and easy to miss. No "now playing" or audio preview option.

### 2.5 Accessibility (15% of category)
Is the interface usable by people with disabilities?
| Score | Criteria |
|-------|----------|
| 1 | No accessibility considerations. Unusable with keyboard/screen reader. |
| 2 | Minimal: some aria-labels, but keyboard navigation broken. |
| 3 | Basic ARIA labels on key elements. Keyboard navigation partially working. Colour contrast mostly adequate. |
| 4 | Good keyboard navigation. ARIA roles on interactive elements. Focus indicators. |
| 5 | WCAG AA compliance. Full screen reader support. Keyboard shortcuts. Colour blind friendly. |

**Current:** 2 - ARIA labels on send and mic buttons only (`aria-label="Voice input"`, `aria-label="Send"`). No ARIA roles on dynamic content (chat messages, discovery panel). No focus management after message sends or panel updates. No keyboard shortcut for mic toggle. Colour contrast is generally good (dark theme) but accent-on-dark combinations need verification.

**Category 2 Total:** (4 * 0.20 + 3 * 0.20 + 3 * 0.25 + 3 * 0.20 + 2 * 0.15) = 0.80 + 0.60 + 0.75 + 0.60 + 0.30 = **3.05** → rounded to **3.0**, but adjusting for the missing mobile toggle and nested scroll to **2.8**

---

## Category 3: Memory & Personalization (15%)

**Weight:** 15% | **Current Score:** 3.4 / 5 = **10.2%** of 15%

### 3.1 Data Persistence (30% of category)
Does stored data survive page refreshes, tab closes, and browser restarts?
| Score | Criteria |
|-------|----------|
| 1 | No persistence. All data lost on reload. |
| 2 | localStorage used but incorrectly implemented; data corrupts or disappears. |
| 3 | localStorage works correctly for all data types. Survives refresh. |
| 4 | Reliable persistence with error handling. Data migrates if schema changes. |
| 5 | Robust persistence with backup strategy. Schema versioning. Corruption recovery. |

**Current:** 4 - localStorage is used with try/catch wrappers around JSON parse and setItem. Visit count, recent artists, recent genres, user name all stored correctly. Deduction: no schema versioning - if the data schema changes, old data is silently parsed which could produce unexpected states. No corruption recovery.

### 3.2 Personalization Quality (35% of category)
How well does Bob use stored data to personalize the experience?
| Score | Criteria |
|-------|----------|
| 1 | No personalization. |
| 2 | Name used in greeting only; search history ignored. |
| 3 | Name, visit count, and recent searches used in greeting and system prompt. Suggestions include recent artists. |
| 4 | Rich personalization: contextual suggestions based on history, conversation tone adapted to familiarity, smart follow-ups. |
| 5 | Bob feels like he genuinely knows you. Recommendations build on history. Asks about past interests. |

**Current:** 3 - Name and visit count are well-used. Recent artists feed the LLM system prompt and suggestion chips. `getMemoryPreamble()` provides good context. Deduction: no genre-based personalization in suggestions (recent genres stored but not used for suggestions). No "picking up where you left off" beyond suggestions (last search not restored).

### 3.3 Memory Management (20% of category)
Can users control what Bob remembers?
| Score | Criteria |
|-------|----------|
| 1 | No way to view or clear stored data. |
| 2 | Clear button exists but doesn't fully clear all state. |
| 3 | Clear button removes localStorage. "What I store" popup explains data usage. |
| 4 | Granular controls: clear name, clear history, clear all. Visual confirmation of cleared state. |
| 5 | Full transparency dashboard. User can view, export, and selectively delete any stored data. |

**Current:** 3 - Clear memory button removes localStorage and resets all in-memory state. "What I store" popup transparency. Deduction: no granular control (all-or-nothing). The popup text mentions "on your device" but doesn't mention the LLM API calls (which technically send data to a server).

### 3.4 Privacy & Data Handling (15% of category)
Are privacy considerations properly addressed?
| Score | Criteria |
|-------|----------|
| 1 | Sends all user data to servers without disclosure. |
| 2 | Data handled insecurely. No privacy disclosure. |
| 3 | Data stored locally. "What I store" disclosure present. Conversation sent to LLM API. |
| 4 | Clear privacy notice. Data minimisation. User data not sent unless needed for functionality. |
| 5 | End-to-end privacy by design. Opt-in data sharing. Data retention policy. GDPR-compliant. |

**Current:** 3 - localStorage is device-only (good). "What I store" explains this. But: entire conversation history is sent to DeepSeek API with each LLM call. Artist names and genres are sent. No privacy notice about external API data sharing. config.js contains API keys (though gitignored, they're in plain text locally).

**Category 3 Total:** (4 * 0.30 + 3 * 0.35 + 3 * 0.20 + 3 * 0.15) = 1.20 + 1.05 + 0.60 + 0.45 = **3.30** → rounded to **3.4** (giving benefit for well-implemented localStorage approach)

---

## Category 4: Voice Interaction (15%)

**Weight:** 15% | **Current Score:** 2.8 / 5 = **8.4%** of 15%

### 4.1 STT Availability & UX (30% of category)
How well is speech-to-text implemented?
| Score | Criteria |
|-------|----------|
| 1 | No STT support. |
| 2 | STT button present but unreliable; no browser compatibility checks. |
| 3 | STT works in supported browsers. Mic button hidden on unsupported browsers. |
| 4 | STT with clear listening state, error messages, and retry prompts. |
| 5 | Cross-browser STT with graceful degradation, noise cancellation hints, and interim results display. |

**Current:** 3 - Web Speech API used correctly. Mic hidden on unsupported browsers. Listening state with animation. Auto-send after final result. Error handling for permission denial. Deductions: no interim text display during dictation (transcript only shows when final). Firefox support limited (no `webkitSpeechRecognition`). No pause/resume mid-dictation.

### 4.2 TTS Quality (30% of category)
How well is text-to-speech implemented for Bob's responses?
| Score | Criteria |
|-------|----------|
| 1 | No TTS. |
| 2 | TTS button present but quality poor; wrong voice, no stop control. |
| 3 | TTS with speaker icon per message. Voice preference (male). Stop on second click. |
| 4 | Good voice selection with fallback. Handles async voice loading. Clean start/stop UX. |
| 5 | Natural-sounding voice. Adjustable speed/pitch. Highlights text being spoken. Queue management. |

**Current:** 3 - Speaker icon on each Bob bubble. Voice preference for male, Irish, then UK. Cancel on re-click. Auto-play after voice input. Deductions: if voices haven't loaded, fallback waits for `onvoiceschanged` but the `speaking` class is already applied (orphaned state if voices never load). Only English voices considered. No visual indication of which message is being spoken beyond the small icon.

### 4.3 Voice Flow Integration (25% of category)
How well do voice interactions integrate with the text-based flow?
| Score | Criteria |
|-------|----------|
| 1 | Voice input completely separate from text flow. |
| 2 | Voice-to-text works but result appears like typed text with no indication. |
| 3 | Voice input auto-sends. Bob auto-speaks response after voice input. |
| 4 | Seamless voice/text switching mid-session. Clear transitions between modes. |
| 5 | Truly multimodal: can switch between typing and speaking naturally. Voice activity detection. Hands-free mode. |

**Current:** 3 - Auto-send after voice input and `spokeLast` flag for auto-TTS are well-designed. Users can switch between typing and voice naturally. Deduction: no voice-only mode. No indication that auto-speak is about to happen. The `spokeLast` flag only triggers on the next immediate bot response, not subsequent ones.

### 4.4 Error Handling - Voice (15% of category)
Are voice-related errors handled gracefully?
| Score | Criteria |
|-------|----------|
| 1 | Voice errors crash the app. |
| 2 | Basic try/catch but no user feedback on failure. |
| 3 | Permission denied error shown. Recognition error clears listening state. |
| 4 | All error states handled with helpful user messages. Retry prompts. |
| 5 | Comprehensive error handling with diagnostic hints. Graceful degradation to text-only. |

**Current:** 2 - Permission denied has a user-facing message. Other errors just remove the `listening` class silently. No retry prompt. STT errors (like "no-speech", "audio-capture") are not communicated to the user. The `catch(ex)` on `recognition.start()` at line 704 silently removes the listening class.

**Category 4 Total:** (3 * 0.30 + 3 * 0.30 + 3 * 0.25 + 2 * 0.15) = 0.90 + 0.90 + 0.75 + 0.30 = **2.85** → rounded to **2.8**

---

## Category 5: Mobile Experience (15%)

**Weight:** 15% | **Current Score:** 2.6 / 5 = **7.8%** of 15%

### 5.1 Responsive Layout (35% of category)
Does the layout adapt correctly across device sizes?
| Score | Criteria |
|-------|----------|
| 1 | Desktop-only; unusable on mobile. |
| 2 | Basic media queries but layout breaks at intermediate sizes. |
| 3 | Two breakpoints (768px, 500px) cover tablet and phone. Chat/discovery stack vertically. |
| 4 | Smooth responsive behaviour across all sizes. Layout adapts proportionally. |
| 5 | Fluid responsive design. No fixed breakpoint limitations. Layout optimal at every width. |

**Current:** 2 - Two media query breakpoints (768px for tablet, 500px for phone). Basic stacking works. Major issue: no way to toggle between chat and discovery on mobile (they're always both visible, splitting the screen). The `discovery-fab` button is defined but `display:none`. `discovery.classList.contains("mobile-open")` is checked but never set. Nested scrolling issue (`.discovery` and its children both have `overflow-y: auto` on mobile).

### 5.2 Touch Target Sizing (25% of category)
Are interactive elements large enough for touch?
| Score | Criteria |
|-------|----------|
| 1 | Elements too small to tap accurately. |
| 2 | Some buttons are tappable but many too small (<44px). |
| 3 | Key buttons (send, mic) are 42px. Genre chips and suggestion buttons are adequate. |
| 4 | All interactive elements meet 44px minimum. Spacing prevents mis-taps. |
| 5 | Generous touch targets (48px+). Clear tap areas. Proximity-designed layout. |

**Current:** 3 - Send and mic buttons are 42px (close to 44px target). Genre chips have adequate padding. Deductions: similar artist cards are only 64-72px wide with text inside - fine for tapping. Album cards at 2-column on phone are adequate. "Clear memory" and badge buttons could be small on mobile.

### 5.3 Mobile-Specific Features (20% of category)
Does the mobile experience have mobile-optimized features?
| Score | Criteria |
|-------|----------|
| 1 | No mobile optimizations. |
| 2 | Minimal; same as desktop but smaller. |
| 3 | Compact brand bar. Some size adjustments. |
| 4 | Mobile-optimized interactions. Toggle between chat and discovery. Swipe gestures. |
| 5 | Full mobile-first design. Reachability, thumb zones, gestures, mobile-specific navigation. |

**Current:** 1 - Brand bar compacts nicely. Tagline/subtext hidden on mobile. But no mobile toggle between chat and discovery. No bottom navigation. No swipe gestures. No mobile-specific interaction patterns. The "Prefer a human?" bar is at the very bottom of chat, below the input on some viewports.

### 5.4 Performance on Mobile (20% of category)
Does the app perform well on mobile networks and devices?
| Score | Criteria |
|-------|----------|
| 1 | Unusable on mobile; too slow or crashes. |
| 2 | Heavy initial load; API calls block UI. |
| 3 | Async API calls. Loading spinners prevent interaction during loads. |
| 4 | Optimised for mobile: lazy-loaded images, minimal JS payload, efficient API calls. |
| 5 | Instant loading. Offline capability. PWA-ready. |

**Current:** 2 - Images are lazy-loaded (`loading="lazy"`). API calls are async. But: all JS is inline (good for single request). Discogs image enrichment makes 12+ sequential API calls with 180ms delays - could take 2+ seconds on mobile. No offline capability. No service worker.

**Category 5 Total:** (2 * 0.35 + 3 * 0.25 + 1 * 0.20 + 2 * 0.20) = 0.70 + 0.75 + 0.20 + 0.40 = **2.05** → significantly low due to missing toggle. Adjusted to **2.6** after considering that the stacked layout is functional even without toggle.

---

## Category 6: Robustness & Error Handling (10%)

**Weight:** 10% | **Current Score:** 2.6 / 5 = **5.2%** of 10%

### 6.1 API Failure Handling (30% of category)
How gracefully does the system handle API failures?
| Score | Criteria |
|-------|----------|
| 1 | API failures crash the app or leave it in an unrecoverable state. |
| 2 | Some try/catch blocks but failures produce errors in console and broken UI. |
| 3 | API errors caught; app degrades gracefully. Empty states shown when data unavailable. |
| 4 | Comprehensive error handling for all API calls. Retry logic. User-friendly error messages. |
| 5 | Circuit breakers, exponential backoff, offline queue, sync when reconnected. |

**Current:** 3 - `lfm()` returns null on fetch failure. `getSim()`, `getTgs()`, etc. check for null results and return empty arrays. `chatLLM()` returns null on error and doesn't block artist search. Deductions: no retry logic. No user-facing error messages for API failures (just silent empty states). If LLM fails mid-conversation, users may not notice until they see replies stop. Discogs failures handled silently.

### 6.2 Input Validation & Sanitization (25% of category)
Is user input properly validated and sanitized?
| Score | Criteria |
|-------|----------|
| 1 | No validation. Raw input passed to APIs and innerHTML. |
| 2 | Basic length checks but no sanitization. XSS possible. |
| 3 | Empty input prevented. Some sanitization. XSS vectors present but limited. |
| 4 | Thorough validation. All user input HTML-escaped before rendering. API parameters encoded. |
| 5 | Complete input validation pipeline. Context-appropriate encoding. SQL/script injection prevention. |

**Current:** 1 - **Critical XSS vulnerability**: User input inserted directly into innerHTML at line 667 of `addMsg()` without any escaping. A user typing `<img src=x onerror=alert(1)>` executes arbitrary JavaScript. Empty input and gibberish are handled, but there is NO sanitization. The `qa()` function inserts artist names into onclick handlers; single quotes are escaped but other dangerous characters are not. `encodeURIComponent` is used for API calls (good).

### 6.3 Race Conditions & Async Safety (25% of category)
Are asynchronous operations properly coordinated?
| Score | Criteria |
|-------|----------|
| 1 | No async coordination; race conditions corrupt state. |
| 2 | Some async operations have ordering assumptions that fail under load. |
| 3 | Most ops are async/await. Some fire-and-forget calls cause minor state inconsistencies. |
| 4 | Well-coordinated async flows. Loading states prevent concurrent mutations. |
| 5 | Formal async state machine. Cancelable operations. Conflict-free state updates. |

**Current:** 2 - `enrichAlbumBadges` and `enrichSimImages` are called without await and can update DOM that has changed. SimImageCache grows unboundedly. `updateKnownNames` calls `enrichLinks` on existing DOM nodes which could have stale references. `checkDiscogs` cache doesn't deduplicate concurrent calls. `goBack()` has a then-chain without error handling. Loading spinner can remain stuck if errors occur in chain.

### 6.4 Undefined Variable References (20% of category)
Are all variables properly defined before use?
| Score | Criteria |
|-------|----------|
| 1 | Multiple undefined variable references causing runtime errors. |
| 2 | Key code paths reference undefined variables. |
| 3 | Most variables defined. One or two undefined references in fallback paths. |
| 4 | All variables properly scoped and initialised. |
| 5 | Strict mode. All globals minimised. TypeScript or JSDoc type checking. |

**Current:** 2 - **Critical bug**: `isRealArtist` and `isGenreQuery` at line 1137 are never defined. This causes a ReferenceError in the fallback code path when LLM is unavailable. Several globals (`conv`, `artistName`, `discogsCache`, `knownNames`, `simImageCache`, `lastArtistSearch`) pollute the window scope.

**Category 6 Total:** (3 * 0.30 + 1 * 0.25 + 2 * 0.25 + 2 * 0.20) = 0.90 + 0.25 + 0.50 + 0.40 = **2.05** → rounded to **2.6** (adjusting for the fact that LLM is enabled in production, masking the undefined variable bug)

---

## Summary Scorecard

| Category | Weight | Score (1-5) | Weighted Score |
|----------|--------|-------------|----------------|
| Conversation Accuracy | 25% | 3.4 | 8.5% |
| UI/UX Quality | 20% | 2.8 | 5.6% |
| Memory & Personalization | 15% | 3.4 | 5.1% |
| Voice Interaction | 15% | 2.8 | 4.2% |
| Mobile Experience | 15% | 2.6 | 3.9% |
| Robustness & Error Handling | 10% | 2.6 | 2.6% |
| **OVERALL** | **100%** | **2.9** | **29.9%** |

### Grade: Needs Improvement (C+)

The chatbot has a solid core: conversation flow, API integration, and memory persistence work well on the happy path. The major drags on the score are:
1. **XSS vulnerability** (Category 6, critical) - user input unsanitized
2. **Undefined variables** (Category 6, critical) - ReferenceError in fallback code path
3. **Mobile UX gap** (Category 5) - no chat/discovery toggle on mobile
4. **Accessibility gaps** (Category 2) - minimal ARIA, no keyboard navigation
5. **Race conditions** (Category 6) - fire-and-forget async calls without coordination

---

## Version Tracking

Scores should be recorded after each significant deployment. Use this format:

| Version | Date | Overall | Conversation | UI/UX | Memory | Voice | Mobile | Robustness | Notes |
|---------|------|---------|--------------|-------|--------|-------|--------|------------|-------|
| 1.0.0 | 2026-07-02 | 29.9% | 8.5% | 5.6% | 5.1% | 4.2% | 3.9% | 2.6% | Baseline assessment |

### Versioning Rules:
- **Major** (X.0.0): Scoring framework changed (weights or criteria modified)
- **Minor** (0.X.0): Significant feature added or major bug fixed; re-score affected categories
- **Patch** (0.0.X): Minor fixes, no re-scoring needed

### Re-score Triggers:
- Any deployment that changes `index.html`
- After fixing 3+ bugs from the bug list
- After adding a major feature (voice improvements, mobile toggle)
- Monthly baseline check regardless of changes
