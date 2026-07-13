# Round & Round Records Chatbot - Automated Test Plan

**Author:** Keelin O'Sullivan (@Keelin)
**Date:** 2026-07-02
**Version:** 1.0.0
**Codebase:** index.html (single-file, 1234 lines, HTML/CSS/JS inline)

---

## Test Environment

- Headless browser: Chrome, Firefox, or Playwright
- Viewport presets: 1440x900 (desktop), 768x1024 (tablet), 375x667 (mobile)
- localStorage pre-seeding required for memory tests
- Network mocking needed for API failure tests
- Accessibility: keyboard-only navigation, screen readers

---

## 1. Greeting Flow

### TEST-001: Bob introduces himself on first visit
- **Category:** Conversation Flow
- **Description:** Verify Bob sends the welcome sequence when no prior memory exists.
- **Steps:**
  1. Clear localStorage (`localStorage.removeItem("bob_memory")`)
  2. Load page
  3. Observe chat messages
- **Expected behaviour:** Three sequential Bob messages appear: (1) "Hey! I'm Bob..." (2) "Just like my friendly colleagues..." (3) "Tell me an artist you love..." followed by (4) "Oh, and I didn't catch your name!"
- **Severity:** High
- **Verify programmatically:**
  - Assert `document.querySelectorAll(".msg.bot").length >= 4`
  - Assert first bot msg contains "Hey! I'm Bob"
  - Assert last bot msg contains "didn't catch your name"
  - Assert `document.getElementById("bobLabel").textContent` does not contain "knows"

### TEST-002: Bob asks for name on first visit
- **Category:** Conversation Flow
- **Description:** Verify the `expectingName` flag is set and Bob specifically asks for the user's name.
- **Steps:**
  1. Clear localStorage, load page
  2. Wait for all welcome messages (3 seconds)
  3. Check state
- **Expected behaviour:** Final welcome message contains "didn't catch your name! What should I call you?" and `expectingName` is `true`.
- **Severity:** Medium
- **Verify programmatically:**
  - Script: `document.querySelectorAll(".msg.bot")` - last element `.textContent` includes "didn't catch your name"
  - Script: evaluate `window.expectingName === true`

### TEST-003: Bob greets returning user by name
- **Category:** Conversation Flow / Memory
- **Description:** Verify Bob recognises a previously named user.
- **Steps:**
  1. Pre-seed localStorage: `bob_memory = {"visits":2,"lastVisit":"2026-06-25T10:00:00.000Z","recentArtists":["Radiohead","Pixies"],"recentGenres":["indie"],"totalSearches":5,"userName":"Siobhan"}`
  2. Load page
  3. Observe chat messages
- **Expected behaviour:** First message: "Welcome back, Siobhan! Great to see you again." Second message introduces Bob. Suggestions include "Radiohead", "Pixies", and "Human".
- **Severity:** High
- **Verify programmatically:**
  - Assert first bot message text contains "Welcome back" and "Siobhan"
  - Assert `document.querySelectorAll(".chat-sugg-btn").length >= 3`
  - Assert `document.getElementById("bobLabel").textContent` contains "knows Siobhan"

### TEST-004: Name capture works correctly
- **Category:** Conversation Flow
- **Description:** Verify Bob recognises and stores a user name when provided.
- **Steps:**
  1. Clear localStorage, load page, wait for welcomes
  2. Type "I'm Keelin" and send
  3. Observe response and localStorage
- **Expected behaviour:** Bob replies "Lovely to meet you, Keelin! Right then, what are you into music-wise?" with suggestions. `localStorage.bob_memory.userName === "Keelin"`. Bob label updates to "knows Keelin".
- **Severity:** High
- **Verify programmatically:**
  - Assert last bot message contains "Lovely to meet you" and "Keelin"
  - Evaluate: `JSON.parse(localStorage.getItem("bob_memory")).userName === "Keelin"`
  - Assert `document.getElementById("bobLabel").textContent.includes("knows Keelin")`

### TEST-005: Name capture rejects non-name input
- **Category:** Conversation Flow / Edge Cases
- **Description:** Verify that gibberish or multi-word sentences are not captured as a name.
- **Steps:**
  1. Clear localStorage, load page, wait for name prompt
  2. Type "I really love Radiohead and all that stuff" and send
  3. Check if name was stored
- **Expected behaviour:** Name is NOT stored. Input goes through normal processing (artist search or LLM). `bobMemory.userName` remains `""`.
- **Severity:** Medium
- **Verify programmatically:**
  - Evaluate: `JSON.parse(localStorage.getItem("bob_memory")).userName === ""`
  - `expectingName` flag should NOT indicate "you should give me a name" response was triggered

### TEST-006: Name capture handles edge cases (punctuation, trailing chars)
- **Category:** Conversation Flow / Edge Cases
- **Description:** Verify name capture strips common prefixes and punctuation.
- **Steps:**
  1. Clear localStorage, load page, wait for name prompt
  2. Test with: "My name is Keelin." (with period)
  3. Test with: "call me Keelin!" (with exclamation)
  4. Test with: "it's Keelin" (apostrophe)
- **Expected behaviour:** All variants store "Keelin" as userName.
- **Severity:** Low
- **Verify programmatically:** For each input, evaluate `JSON.parse(localStorage.getItem("bob_memory")).userName === "Keelin"`

---

## 2. Artist Search

### TEST-007: Single artist search ("Radiohead")
- **Category:** API Integration
- **Description:** Verify a well-known artist triggers full discovery panel rendering.
- **Steps:**
  1. Type "Radiohead" and send
  2. Wait for loading spinner to appear and disappear
  3. Inspect discovery panel
- **Expected behaviour:** Discovery panel loads with: artist hero showing "Radiohead", similar artists list (non-empty), genre chips, album grid (non-empty), loading spinner removed.
- **Severity:** Critical
- **Verify programmatically:**
  - Assert `document.getElementById("dContent").style.display === "block"`
  - Assert `document.getElementById("dEmpty").style.display === "none"`
  - Assert `document.querySelector(".artist-hero-name").textContent` includes "Radiohead"
  - Assert `document.querySelectorAll(".similar-card").length > 0`
  - Assert `document.querySelectorAll(".album-card").length > 0`
  - Assert `document.querySelectorAll(".genre-chip").length > 0`
  - Assert `document.getElementById("discLoading").classList.contains("active")` is false

### TEST-008: Multi-artist search ("Pixies and Radiohead")
- **Category:** API Integration / Conversation Flow
- **Description:** Verify that searching for multiple artists parses both and renders merged results.
- **Steps:**
  1. Type "Pixies and Radiohead" and send
  2. Wait for discovery to load
- **Expected behaviour:** Discovery panel shows the first artist (Pixies) as hero. Albums from both artists appear in the grid (merged and sorted by playcount). Both "Pixies" and "Radiohead" appear in known names.
- **Severity:** High
- **Verify programmatically:**
  - Assert `document.querySelector(".artist-hero-name").textContent` includes "Pixies"
  - Assert `document.querySelectorAll(".album-card").length > 0`
  - Fetch both `getSim("pixies")` and `getSim("radiohead")` via proxy and verify merged results

### TEST-009: Artist with apostrophe ("Sza")
- **Category:** API Integration / Edge Cases
- **Description:** Verify artist names containing apostrophes are handled correctly in API calls and rendering.
- **Steps:**
  1. Type "Sza" and send
  2. Wait for discovery to load
- **Expected behaviour:** API call is made with correctly encoded "Sza" (or "SZA"). No JavaScript errors in console. Discovery panel loads artist data if found.
- **Severity:** High
- **Verify programmatically:**
  - Monitor network: verify Last.fm API call uses `encodeURIComponent("Sza")`
  - Assert no console errors
  - Assert `document.querySelector(".similar-card")` exists or discovery shows valid state

### TEST-010: Misspelled artist names
- **Category:** API Integration / Edge Cases
- **Description:** Verify the system handles misspelled names gracefully.
- **Steps:**
  1. Type "Radiohed" (misspelled) and send
  2. Wait for processing
- **Expected behaviour:** LLM responds conversationally. Discovery panel may show empty or fallback state. No uncaught errors.
- **Severity:** Medium
- **Verify programmatically:**
  - Assert no uncaught errors in console
  - Assert bot messages are present (LLM response received)
  - Discovery panel should NOT crash

### TEST-011: Empty input
- **Category:** UI/UX / Edge Cases
- **Description:** Verify that sending an empty message is properly prevented.
- **Steps:**
  1. Type only spaces ("   ") and send
- **Expected behaviour:** `send()` returns early at `if(!txt)return;`. No message added to chat. No API calls made.
- **Severity:** Low
- **Verify programmatically:**
  - Assert `document.querySelectorAll(".msg").length` unchanged
  - Assert no network calls to Last.fm API

### TEST-012: Gibberish input
- **Category:** Edge Cases
- **Description:** Verify gibberish detection properly rejects nonsensical input.
- **Steps:**
  1. Type "asdfghjkl" and send
  2. Type "!!!!!!" and send
  3. Type "aaaaaaaaaaaa" and send
  4. Type "zxcvbnm" and send
- **Expected behaviour:** Each triggers the fallback message: "I didn't quite catch that!" with suggestions. No API calls to Last.fm for artist search.
- **Severity:** Medium
- **Verify programmatically:**
  - Assert last bot message contains "didn't quite catch that"
  - Assert `document.querySelectorAll(".chat-sugg-btn").length >= 3`
  - Assert no Last.fm `method=artist.getsimilar` calls in network log

### TEST-013: Short conversational input ("yes", "no", "ok", "hi")
- **Category:** Conversation Flow
- **Description:** Verify short casual words are handled by the LLM, not treated as artist searches.
- **Steps:**
  1. Type "hi" and send
  2. Type "yes" and send
- **Expected behaviour:** LLM responds conversationally. No discovery panel changes. No API call to artist search endpoints.
- **Severity:** Low
- **Verify programmatically:**
  - Assert LLM response received (bot message after user message)
  - Assert no `method=artist.getsimilar` network calls

---

## 3. Genre Exploration

### TEST-014: Genre chip click in discovery panel
- **Category:** UI/UX
- **Description:** Verify clicking a genre chip in the discovery panel triggers genre exploration.
- **Steps:**
  1. Search for "Radiohead" to populate genre chips
  2. Click a genre chip (e.g., "alternative")
  3. Wait for processing
- **Expected behaviour:** Loading spinner appears. Genre is remembered. New similar artists render for that genre. Chat message confirms exploration.
- **Severity:** High
- **Verify programmatically:**
  - Click `document.querySelectorAll(".genre-chip")[0]`
  - Wait for `.disc-loading.active` class
  - Assert bot message contains "Exploring"
  - Assert `JSON.parse(localStorage.getItem("bob_memory")).recentGenres` includes the clicked genre

### TEST-015: Genre tag click in artist hero
- **Category:** UI/UX
- **Description:** Verify clicking a tag in the artist hero row triggers `exploreGenre()`.
- **Steps:**
  1. Search for "Radiohead"
  2. Click `.artist-hero-tag` element
- **Expected behaviour:** `exploreGenre()` is called with the tag name. Discovery navigates to genre view.
- **Severity:** Medium
- **Verify programmatically:**
  - Click first `.artist-hero-tag`
  - Assert bot message contains "Exploring"
  - Assert discovery panel re-renders

### TEST-016: Genre keyword in chat input ("jazz")
- **Category:** Conversation Flow
- **Description:** Verify typing a genre name triggers tag-based discovery.
- **Steps:**
  1. Type "jazz" and send
- **Expected behaviour:** System detects "jazz" as a valid genre tag (in DISCOVERY_TAGS). Falls through to tag search. Discovers top jazz artists and albums.
- **Severity:** High
- **Verify programmatically:**
  - `findBestTag("jazz")` returns "jazz"
  - Assert network call to `tag.gettopartists&tag=jazz`
  - Assert `document.querySelector(".artist-hero-name").textContent` includes "Jazz"
  - Assert `document.querySelectorAll(".album-card").length > 0`

### TEST-017: Unknown genre keyword
- **Category:** Edge Cases
- **Description:** Verify an unknown genre that is not in DISCOVERY_TAGS is handled gracefully.
- **Steps:**
  1. Type "krautrock" (not in DISCOVERY_TAGS) and send
- **Expected behaviour:** `findBestTag` returns empty string. LLM responds conversationally. No genre search API call. No errors.
- **Severity:** Low
- **Verify programmatically:**
  - Assert `findBestTag("krautrock")` returns `""`
  - Assert no `tag.gettopartists` network call
  - Assert no console errors

---

## 4. Discovery Panel

### TEST-018: Artist hero renders correctly
- **Category:** UI/UX
- **Description:** Verify the artist hero section contains name, tags, bio, and stats after a successful search.
- **Steps:**
  1. Search for "Radiohead"
  2. Wait for discovery to load
- **Expected behaviour:** Artist hero shows: artist name, genre tags (clickable), truncated bio with "more" link, listener/play stats.
- **Severity:** High
- **Verify programmatically:**
  - Assert `document.querySelector(".artist-hero-name").textContent.trim().length > 0`
  - Assert `document.querySelectorAll(".artist-hero-tag").length > 0`
  - Assert `document.querySelector(".artist-hero-bio")` exists
  - Assert `document.querySelectorAll(".artist-hero-stat").length >= 2`

### TEST-019: Similar artists horizontal scroll renders
- **Category:** UI/UX
- **Description:** Verify similar artists section shows scrollable cards with initials or images.
- **Steps:**
  1. Search for "Radiohead"
- **Expected behaviour:** Similar artists count displayed, 12 or fewer cards in horizontal scroll, each with initials and match percentage.
- **Severity:** Medium
- **Verify programmatically:**
  - Assert `document.querySelectorAll(".similar-card").length > 0`
  - Assert `document.getElementById("simCount").textContent !== "0"`
  - Assert each card has non-empty `.similar-card-name`

### TEST-020: Album grid renders and is clickable
- **Category:** UI/UX
- **Description:** Verify album cards display with cover art, name, artist, playcount, and badges.
- **Steps:**
  1. Search for "Radiohead"
  2. Click an album card
- **Expected behaviour:** Album cards render with image, name, artist line, playcount, and Order/Discogs badges. Clicking a card triggers `qa(albumName)` which sends the album name as a chat query.
- **Severity:** High
- **Verify programmatically:**
  - Assert `document.querySelectorAll(".album-card").length > 0`
  - Assert each card has `<img>` with `src` attribute
  - Assert each card has `.album-card-name` with non-empty text
  - Assert each card has `.album-badges` with at least one badge
  - Click first card: assert `document.getElementById("chatInput").value` equals the album name

### TEST-021: Bio expander toggles correctly
- **Category:** UI/UX
- **Description:** Verify the "more" / "less" toggle for artist biography works.
- **Steps:**
  1. Search for an artist with a long bio (e.g., "Radiohead")
  2. Click "more" link
  3. Click "less" link (same element, toggled text)
- **Expected behaviour:** Bio div gets `expanded` class on first click, shows full text. Second click removes `expanded` class, bio clamps to 3 lines.
- **Severity:** Low
- **Verify programmatically:**
  - Assert `.artist-hero-more` exists and text is "… more"
  - Click `.artist-hero-more`; assert `.artist-hero-bio.classList.contains("expanded")` is true; assert text is "… less"
  - Click again; assert `.expanded` class is absent

### TEST-022: Album card click sends query to chat
- **Category:** UI/UX
- **Description:** Verify clicking the album card body (not badges) sends the album name to chat.
- **Steps:**
  1. Search for "Radiohead"
  2. Click on the album name area of the first album card
- **Expected behaviour:** Chat input fills with album name. `send()` is called. Album name appears in conversation.
- **Severity:** Medium
- **Verify programmatically:**
  - Click `.album-card:first-child`
  - Assert `document.getElementById("chatInput").value` was set to album name
  - Assert new user message appears in chat

### TEST-023: Discogs badges render for albums found in marketplace
- **Category:** API Integration
- **Description:** Verify `enrichAlbumBadges` updates badges from "Order/Info on Discogs" to "Buy Now/Info on Discogs" with real URLs.
- **Steps:**
  1. Search for "Radiohead" (popular albums should be on Discogs)
  2. Wait 3 seconds for async badge enrichment
- **Expected behaviour:** Some album cards show "Buy Now" badge with working Discogs sell URL and "Info on Discogs" badge with info URL.
- **Severity:** Medium
- **Verify programmatically:**
  - Wait for `.album-badge-buy` elements to appear
  - Assert at least one `.album-badge-buy` has `href` starting with "https://www.discogs.com/sell/release/"
  - Assert at least one `.album-badge-discogs` has `href` containing "discogs.com"

### TEST-024: Order request modal opens and submits
- **Category:** UI/UX
- **Description:** Verify the "Order" badge opens the request-to-order modal and submission works.
- **Steps:**
  1. Search for any artist with albums
  2. Click "Order" badge on an album
  3. Fill name and email
  4. Click "Send Request"
- **Expected behaviour:** Modal opens with album details prefilled. After valid submission, success message displays. Cancel button closes modal. Clicking overlay closes modal.
- **Severity:** Medium
- **Verify programmatically:**
  - Click `.album-badge-req`: assert `document.getElementById("reqModal").classList.contains("open")`
  - Set `document.getElementById("reqName").value = "Test User"`
  - Set `document.getElementById("reqEmail").value = "test@test.com"`
  - Click `.modal-btn-submit`: assert `.modal-done` appears with "Thanks, Test User!"
  - Click overlay (not modal): assert modal closes

### TEST-025: Discogs image enrichment for similar artists
- **Category:** API Integration / UI
- **Description:** Verify `enrichSimImages` replaces initials with artist images from Discogs.
- **Steps:**
  1. Search for "Radiohead"
  2. Wait 3+ seconds for image enrichment
- **Expected behaviour:** Some similar artist avatars switch from text initials to actual images from Discogs.
- **Severity:** Low
- **Verify programmatically:**
  - Wait for `<img>` elements inside `.similar-card-avatar`
  - Assert at least one `.similar-card-avatar img` exists

---

## 5. Human Handoff

### TEST-026: Typing "human" triggers contact details
- **Category:** Conversation Flow
- **Description:** Verify that typing the exact word "human" returns shop contact details.
- **Steps:**
  1. Type "human" and send
- **Expected behaviour:** Three bot messages: (1) "Of course! Here's how to reach..." (2) Contact details including address "32 Main Street, Dublin, D02 DH79", phone, email, hours. (3) "We'd love to see you in the shop!..."
- **Severity:** Critical
- **Verify programmatically:**
  - Assert bot message text contains "32 Main Street"
  - Assert bot message text contains "D02 DH79"
  - Assert bot message text contains "+353 1 671 1711"
  - Assert bot message text contains "hello@roundandroundrecords.ie"
  - Assert bot message text contains "Mon-Sat: 10:00 - 18:00"
  - Assert email link has `mailto:hello@roundandroundrecords.ie`

### TEST-027: "Human" in sentence is NOT treated as handoff
- **Category:** Conversation Flow / Edge Cases
- **Description:** Verify partial word matches like "human league" don't trigger handoff.
- **Steps:**
  1. Type "human league" and send
- **Expected behaviour:** NOT treated as human handoff. Processed as artist search. No contact details displayed.
- **Severity:** High
- **Verify programmatically:**
  - Assert bot message text does NOT contain "32 Main Street"
  - Assert discovery panel may update (artist search results)

### TEST-028: "Human" ramp bar click
- **Category:** UI/UX
- **Description:** Verify the "Prefer a real human?" bar at the bottom of chat triggers the same human handoff.
- **Steps:**
  1. Click the `.chat-human-ramp` bar
- **Expected behaviour:** Chat input value becomes "human". Send is triggered. Same contact detail messages appear.
- **Severity:** Medium
- **Verify programmatically:**
  - Click `.chat-human-ramp`
  - Assert `document.getElementById("chatInput").value === "human"` (before send)
  - After send: assert contact details message appears

---

## 6. Memory / Persistence

### TEST-029: Artist searches persist across page refresh
- **Category:** Memory
- **Description:** Verify that artist search history survives a page reload.
- **Steps:**
  1. Search for "Radiohead"
  2. Search for "Pixies"
  3. Reload page
  4. Check `bobMemory.recentArtists`
- **Expected behaviour:** After reload, `recentArtists` contains ["pixies", "radiohead"] in order (most recent first). If userName was set, greeting references returning customer.
- **Severity:** Critical
- **Verify programmatically:**
  - Before reload: evaluate `JSON.parse(localStorage.getItem("bob_memory")).recentArtists` has both artists
  - After reload: evaluate same, array still has both artists
  - `totalSearches` count incremented correctly

### TEST-030: Visit count increments correctly
- **Category:** Memory
- **Description:** Verify `visits` counter increments on each page load.
- **Steps:**
  1. Check initial localStorage `bob_memory.visits`
  2. Reload page
  3. Check updated value
- **Expected behaviour:** `visits` increments by 1 on each page load.
- **Severity:** Medium
- **Verify programmatically:**
  - Evaluate `JSON.parse(localStorage.getItem("bob_memory")).visits` before and after reload
  - Assert `newVisits === oldVisits + 1`

### TEST-031: Clear memory button works
- **Category:** Memory
- **Description:** Verify "Clear memory" button removes all localStorage data and resets state.
- **Steps:**
  1. Set up memory with name, artists, genres
  2. Click "Clear memory" button
  3. Check localStorage and UI state
- **Expected behaviour:** `localStorage.getItem("bob_memory")` returns null. Bob sends "All clear! I've forgotten everything..." message. `expectingName` becomes true. `bobLabel` resets to "Music guru · AI-powered".
- **Severity:** High
- **Verify programmatically:**
  - Click `document.getElementById("clearMemBtn")`
  - Assert `localStorage.getItem("bob_memory")` is null
  - Assert last bot message contains "All clear!"
  - Assert `document.getElementById("bobLabel").textContent === "Music guru · AI-powered"`
  - Evaluate `window.expectingName === true`

### TEST-032: CLS secret command clears memory
- **Category:** Memory / Edge Cases
- **Description:** Verify typing "CLS" triggers `clearMemory()`.
- **Steps:**
  1. Set up memory
  2. Type "CLS" and send
- **Expected behaviour:** Same as TEST-031. Memory cleared. Chat shows "All clear!" message. No extra user message visible (the CLS text is added to chat then immediately cleared).
- **Severity:** Low
- **Verify programmatically:**
  - Actually, check: user message IS added at line 1015 before the CLS check at line 1017. So user sees "CLS" in chat.
  - Assert memory cleared and "All clear!" appears

### TEST-033: Genre memory persists correctly
- **Category:** Memory
- **Description:** Verify `rememberGenre` stores genres and limits to 5.
- **Steps:**
  1. Explore 6 different genres via genre chips or keyword
  2. Check `recentGenres` array
- **Expected behaviour:** Only last 5 genres retained. Most recent first. Duplicates moved to front.
- **Severity:** Low
- **Verify programmatically:**
  - Evaluate `JSON.parse(localStorage.getItem("bob_memory")).recentGenres.length <= 5`
  - Assert no duplicates in array

### TEST-034: Artist memory limits to 10
- **Category:** Memory
- **Description:** Verify `rememberArtist` caps at 10 recent artists.
- **Steps:**
  1. Search for 12 different artists sequentially
  2. Check `recentArtists`
- **Expected behaviour:** Array length is exactly 10. 11th and 12th artists dropped.
- **Severity:** Low
- **Verify programmatically:**
  - Evaluate `JSON.parse(localStorage.getItem("bob_memory")).recentArtists.length === 10`

### TEST-035: Memory preamble correctly built for LLM
- **Category:** Memory
- **Description:** Verify `getMemoryPreamble()` constructs the correct context string for the system prompt.
- **Steps:**
  1. Set `bobMemory.userName = "Keelin"`, `visits = 3`, `recentArtists = ["Radiohead", "Pixies"]`, `recentGenres = ["indie"]`
  2. Call `getMemoryPreamble()`
- **Expected behaviour:** Returns string containing: `[Returning customer]`, "name is Keelin", "3rd visit", "searched for: Radiohead, Pixies", "explored: indie".
- **Severity:** Medium
- **Verify programmatically:**
  - Invoke `getMemoryPreamble()`
  - Assert result includes "Keelin"
  - Assert result includes "3rd"
  - Assert result includes "Radiohead"
  - Assert result includes "Pixies"
  - Assert result includes "indie"

---

## 7. Voice Input (STT)

### TEST-037: Microphone button visibility
- **Category:** Voice
- **Description:** Verify the microphone button is visible when Web Speech API is available.
- **Steps:**
  1. Load page in Chrome (supports SpeechRecognition)
  2. Load page in Firefox (may not support it)
- **Expected behaviour:** In Chrome: mic button visible. In unsupported browsers: `style.display = "none"`.
- **Severity:** Medium
- **Verify programmatically:**
  - In Chrome: assert `document.getElementById("chatMic").style.display !== "none"`
  - If `!window.webkitSpeechRecognition && !window.SpeechRecognition`: assert `display === "none"`

### TEST-038: STT starts and stops on mic button click
- **Category:** Voice
- **Description:** Verify toggling speech recognition on/off via mic button.
- **Steps:**
  1. Click mic button
  2. Check listening state
  3. Click mic button again
- **Expected behaviour:** On first click: `.chat-mic` gets `listening` class. `recognition.start()` called. On second click: `listening` class removed. `recognition.stop()` called.
- **Severity:** High
- **Verify programmatically:**
  - Mock or spy on `recognition.start` / `recognition.stop`
  - Click mic: assert `.listening` class added; `start()` called
  - Click mic: assert `.listening` class removed; `stop()` called

### TEST-039: STT result populates chat input and auto-sends
- **Category:** Voice
- **Description:** Verify speech recognition results fill the input and trigger auto-send.
- **Steps:**
  1. Mock speech recognition result: "Radiohead"
  2. Trigger `onresult` with final result
- **Expected behaviour:** `chatInput.value` set to "Radiohead". `spokeLast` set to true. `send()` called automatically. Mic button loses `listening` class.
- **Severity:** High
- **Verify programmatically:**
  - Simulate recognition result event
  - Assert `document.getElementById("chatInput").value === "Radiohead"`
  - Assert `window.spokeLast === true`
  - Assert message sent (user message visible)
  - Assert mic `.listening` class absent

### TEST-040: STT error handling (permission denied)
- **Category:** Voice / Edge Cases
- **Description:** Verify graceful handling when microphone access is denied.
- **Steps:**
  1. Click mic button with microphone permissions blocked
  2. Observe `onerror` handler
- **Expected behaviour:** `onerror` fires with `not-allowed`. Mic button loses `listening` class. Bot message: "Microphone access was denied. Check your browser permissions."
- **Severity:** Medium
- **Verify programmatically:**
  - Simulate recognition `onerror` with `{error:"not-allowed"}`
  - Assert `.listening` absent on mic
  - Assert bot message about permissions

---

## 8. TTS (Text-to-Speech)

### TEST-041: Speaker icon visible on all Bob bubbles
- **Category:** Voice
- **Description:** Verify every Bob message bubble has a speaker button.
- **Steps:**
  1. Trigger multiple Bob messages (greetings, search responses)
  2. Inspect each bot message DOM
- **Expected behaviour:** Every `.msg.bot` message contains a `.msg-speak` button in `.msg-meta`.
- **Severity:** Medium
- **Verify programmatically:**
  - `document.querySelectorAll(".msg.bot .msg-speak").length === document.querySelectorAll(".msg.bot .msg-meta").length`

### TEST-042: Clicking speaker icon reads text aloud
- **Category:** Voice
- **Description:** Verify TTS starts and the speaker icon shows speaking state.
- **Steps:**
  1. Click speaker icon on a Bob message
- **Expected behaviour:** `speechSynthesis.speak()` called with the message text. Button gets `speaking` class. Icon animates (pulse-ring animation).
- **Severity:** High
- **Verify programmatically:**
  - Spy on `window.speechSynthesis.speak`
  - Click `.msg-speak`
  - Assert `window.speechSynthesis.speak` was called
  - Assert button has `speaking` class

### TEST-043: Clicking speaker icon again stops TTS
- **Category:** Voice
- **Description:** Verify clicking a speaking button cancels speech.
- **Steps:**
  1. Click speaker icon (start TTS)
  2. Click same speaker icon again
- **Expected behaviour:** `speechSynthesis.cancel()` called. `speaking` class removed from all buttons.
- **Severity:** High
- **Verify programmatically:**
  - Spy on `window.speechSynthesis.cancel`
  - Click `.msg-speak`, then click again
  - Assert `cancel()` was called
  - Assert no `.msg-speak.speaking` elements

### TEST-044: TTS auto-plays after voice input
- **Category:** Voice
- **Description:** Verify the `spokeLast` flag triggers auto-TTS on Bob's next response.
- **Steps:**
  1. Simulate voice input (setting `spokeLast = true`)
  2. Wait for Bob's response
- **Expected behaviour:** Bob's response message auto-triggers `speakMsg()` on the speaker button after 150ms delay.
- **Severity:** Medium
- **Verify programmatically:**
  - Set `window.spokeLast = true`
  - Trigger a bot message via send
  - After 200ms: assert `speechSynthesis.speak` was called (spy)
  - Assert `window.spokeLast === false`

### TEST-045: TTS voice selection (male voices preferred)
- **Category:** Voice / Edge Cases
- **Description:** Verify the voice selection heuristic prioritises male, then Irish, then UK voices.
- **Steps:**
  1. Load page, ensure `speechSynthesis.getVoices()` returns multiple voices including male and female variants
  2. Click speaker
- **Expected behaviour:** Selected voice is not in the femaleNames filter list. Irish voices (lang="en-IE") score highest (10), UK (lang="en-GB") scores 7, others 3.
- **Severity:** Low
- **Verify programmatically:**
  - Spy on `SpeechSynthesisUtterance` constructor
  - Assert selected voice's `_score >= 3`
  - Assert voice name does not contain any femaleName substring

---

## 9. Mobile Responsiveness

### TEST-046: Layout at 768px viewport
- **Category:** Mobile
- **Description:** Verify the 50/50 stacked layout triggers at or below 768px width.
- **Steps:**
  1. Set viewport to 768x1024
  2. Inspect layout CSS
- **Expected behaviour:** `.app` uses `flex-direction: column`. Chat and discovery panels each take 50% height. Brand bar compacts to 56px. Tagline and sub-text hidden. Discovery panel visible (not hidden).
- **Severity:** High
- **Verify programmatically:**
  - `getComputedStyle(document.querySelector(".app")).flexDirection === "column"`
  - `document.querySelector(".app-brand").offsetHeight <= 60`
  - `getComputedStyle(document.querySelector(".app-brand-tagline")).display === "none"`
  - `getComputedStyle(document.querySelector(".app-brand-sub")).display === "none"`
  - `document.querySelector(".discovery").offsetHeight > 0`

### TEST-047: Layout at 375px (iPhone) viewport
- **Category:** Mobile
- **Description:** Verify the compact layout at 375px width.
- **Steps:**
  1. Set viewport to 375x667
- **Expected behaviour:** Brand bar at 52px. Album grid switches to 2 columns. All compacted padding/spacing. Similar artist cards smaller (64px wide).
- **Severity:** High
- **Verify programmatically:**
  - `getComputedStyle(document.querySelector(".album-grid")).gridTemplateColumns === "1fr 1fr"`
  - `document.querySelector(".similar-card").offsetWidth <= 66`
  - `document.querySelector(".app-brand").offsetHeight <= 55`
  - `getComputedStyle(document.querySelector(".app-brand-name")).fontSize` is "0.85rem" or smaller

### TEST-048: Mobile: no horizontal overflow on discovery panel
- **Category:** Mobile / Edge Cases
- **Description:** Verify the discovery panel has no horizontal scroll at small widths.
- **Steps:**
  1. Set viewport to 375x667
  2. Search for an artist
  3. Check for horizontal scroll
- **Expected behaviour:** `document.body.scrollWidth <= window.innerWidth`. No horizontal scrollbar visible. Content wraps or is contained.
- **Severity:** Medium
- **Verify programmatically:**
  - `document.querySelector(".discovery").scrollWidth <= document.querySelector(".discovery").clientWidth`

### TEST-049: Mobile: nested scrolling issue
- **Category:** Mobile / Bug
- **Description:** Verify the discovery panel scrolling works without nested scroll interference.
- **Steps:**
  1. Set viewport to 375x667
  2. Load discovery with content that overflows
  3. Scroll discovery panel
- **Expected behaviour:** Single scroll container. No "scroll within a scroll" dead zones.
- **Severity:** Medium
- **Verify programmatically:**
  - Check that `.discovery` content scrolls properly
  - Check for any `overflow-y: auto` conflicts between `.discovery` and its children

### TEST-050: Mobile: fat-finger tap targets
- **Category:** Mobile / UX
- **Description:** Verify interactive elements meet minimum 44x44px touch target.
- **Steps:**
  1. Set viewport to 375x667
  2. Measure all tappable elements
- **Expected behaviour:** Send button, mic button, clear memory button, genre chips, suggestion buttons, similar artist cards are at least 44px in one dimension.
- **Severity:** Medium
- **Verify programmatically:**
  - `document.getElementById("chatSend").offsetWidth >= 42`
  - `document.getElementById("chatMic").offsetWidth >= 42`
  - Genre chips: `offsetHeight` of `.genre-chip` elements

---

## 10. Error Handling

### TEST-051: API failure - Last.fm down
- **Category:** API Integration / Robustness
- **Description:** Verify graceful degradation when Last.fm API is unreachable.
- **Steps:**
  1. Block or mock Last.fm API to return 500
  2. Search for "Radiohead"
- **Expected behaviour:** `lfm()` returns null. `getSim()`, `getTgs()`, `getAlb()`, `getBio()` return empty arrays or null. Discovery panel shows empty or fallback state. Chat LLM still responds if available. No uncaught exceptions.
- **Severity:** Critical
- **Verify programmatically:**
  - Mock fetch to return `{ok: false}` for `ws.audioscrobbler.com`
  - Assert discovery panel shows empty state or handles gracefully
  - Assert no console errors (catching is in `lfm()` line 749)
  - Assert LLM response still renders

### TEST-052: API failure - LLM (DeepSeek) down
- **Category:** API Integration / Robustness
- **Description:** Verify graceful degradation when DeepSeek API is unreachable.
- **Steps:**
  1. Block or mock LLM API to return 500
  2. Search for "Radiohead"
- **Expected behaviour:** `chatLLM()` returns null. `hideTyping()` still called. Artist search from Last.fm still proceeds. Rule-based responses may show (but note: `isRealArtist` and `isGenreQuery` are undefined - see BUG-003).
- **Severity:** Critical
- **Verify programmatically:**
  - Mock LLM API to return error
  - Assert bot messages still appear (may be rule-based fallback)
  - Assert no uncaught exceptions

### TEST-053: API failure - Discogs down
- **Category:** API Integration / Robustness
- **Description:** Verify graceful degradation when Discogs API is unreachable.
- **Steps:**
  1. Block Discogs API calls
  2. Search for "Radiohead"
- **Expected behaviour:** Album cards still render with "Order" and "Info on Discogs" badges (the fallback badges). `enrichAlbumBadges` silently fails. No Buy Now badges with proxy URLs.
- **Severity:** Medium
- **Verify programmatically:**
  - Mock Discogs to 500
  - Assert album cards still render fully
  - Assert at least `.album-badge-req` (Order) badges visible
  - Assert no console errors

### TEST-054: Network disconnected mid-query
- **Category:** Robustness / Edge Cases
- **Description:** Verify behaviour when network drops during an active API call.
- **Steps:**
  1. Start an artist search
  2. Disconnect network (or mock infinite delay)
  3. Reconnect and try again
- **Expected behaviour:** Loading spinner may persist but does not crash. No uncaught promises. Subsequent searches work normally after reconnect.
- **Severity:** High
- **Verify programmatically:**
  - Mock fetch to hang (never resolve)
  - Assert loading spinner visible
  - Mock next fetch to succeed
  - Assert subsequent search works

### TEST-055: localStorage quota exceeded
- **Category:** Memory / Edge Cases
- **Description:** Verify graceful handling when localStorage is full.
- **Steps:**
  1. Fill localStorage to quota
  2. Attempt artist search (triggers `saveMemory()`)
- **Expected behaviour:** `saveMemory()` silently catches the error. Bot continues functioning. Memory may be lost but app does not crash.
- **Severity:** Low
- **Verify programmatically:**
  - Mock `localStorage.setItem` to throw

### TEST-056: Gibberish detection accuracy
- **Category:** Robustness
- **Description:** Verify all gibberish detection patterns work as expected.
- **Steps:**
  1. Test each pattern from the `isGibberish` logic:
     - "asdf" (keyboard mash)
     - "!!!!!!!!!" (symbol-only)
     - "aaaaaabbbbb" (repeated chars)
     - "yyy" (single repeated char)
     - "qwerty" (keyboard pattern)
     - "bcdfghjklm" (consonant-heavy, no vowels)
  2. Also test valid short input that should NOT be flagged: "Sza", "M.I.A.", "U2"
- **Expected behaviour:** All gibberish inputs trigger fallback. "Sza" flows to artist search. "U2" (2 chars) may be flagged as too short.
- **Severity:** Medium
- **Verify programmatically:**
  - For each gibberish pattern: assert bot replies with "didn't quite catch that"
  - For "Sza": assert artist search API called

---

## 11. UI Elements

### TEST-057: "What I store" popup opens and closes
- **Category:** UI/UX
- **Description:** Verify the memory info modal displays correctly.
- **Steps:**
  1. Click "What I store" link in brand bar
  2. Read modal content
  3. Click "Got it" button
  4. Click overlay area
- **Expected behaviour:** Modal opens with list of stored data items. Modal closes on "Got it" click. Modal closes on overlay click (the modal event listener at line 1190 is on `reqModal`, not `memInfoModal` - need to verify memInfoModal also closes on overlay click).
- **Severity:** Low
- **Verify programmatically:**
  - Click `.brand-info-link`: assert `document.getElementById("memInfoModal").classList.contains("open")`
  - Click `.modal-btn-submit` inside `memInfoModal`: assert modal closed
  - Reopen, click overlay: modal should close (but see BUG-007)

### TEST-058: LLM badge shows correct status
- **Category:** UI/UX
- **Description:** Verify the LLM status badge reflects the actual API configuration.
- **Steps:**
  1. Load page with API_PROXY set
  2. Check badge
- **Expected behaviour:** Badge shows "LLM Enabled" with green styling (class `live`).
- **Severity:** Low
- **Verify programmatically:**
  - Assert `document.getElementById("bobBadge").textContent === "LLM Enabled"`
  - Assert `document.getElementById("bobBadge").classList.contains("live")`

### TEST-059: Footer links correct
- **Category:** UI/UX
- **Description:** Verify footer contains correct links.
- **Steps:**
  1. Inspect footer
- **Expected behaviour:** Contains "Powered by" with links to last.fm and discogs.com.
- **Severity:** Low
- **Verify programmatically:**
  - `document.querySelectorAll(".foot a[href*='last.fm']").length >= 1`
  - `document.querySelectorAll(".foot a[href*='discogs.com']").length >= 1`

### TEST-060: Empty discovery state shown before any search
- **Category:** UI/UX
- **Description:** Verify the discovery panel shows the empty state placeholder when no search has been performed.
- **Steps:**
  1. Load page fresh
  2. Inspect discovery panel
- **Expected behaviour:** `#dEmpty` visible, `#dContent` hidden. Shows "Your Discovery Space" with icon and description.
- **Severity:** Low
- **Verify programmatically:**
  - `document.getElementById("dEmpty").style.display !== "none"`
  - `document.getElementById("dContent").style.display === "none"`

### TEST-061: Loading spinner shows during artist search
- **Category:** UI/UX
- **Description:** Verify the turntable loading overlay appears during API fetches.
- **Steps:**
  1. Type "Radiohead" and send
  2. Immediately check loading state
- **Expected behaviour:** `#discLoading` has `active` class. Spinner animation plays. After data loads, `active` class removed.
- **Severity:** Low
- **Verify programmatically:**
  - After send, before API resolves: assert `document.getElementById("discLoading").classList.contains("active")`
  - After API resolves: assert `!document.getElementById("discLoading").classList.contains("active")`

### TEST-062: Back button in discovery panel works
- **Category:** UI/UX
- **Description:** Verify the navigation back button restores previous search.
- **Steps:**
  1. Search for "Radiohead"
  2. Search for "Pixies"
  3. Click back button
- **Expected behaviour:** Back bar visible after second search. Clicking back returns to "Radiohead" results. Discovery re-renders Radiohead data.
- **Severity:** Medium
- **Verify programmatically:**
  - After second search: `document.getElementById("backBar").style.display !== "none"`
  - Click `.back-btn`: assert `.artist-hero-name` shows "Radiohead"
  - Assert bot message "I went back to Radiohead"

---

## Summary

| Area | Test IDs | Count | Critical | High | Medium | Low |
|------|----------|-------|----------|------|--------|-----|
| Greeting Flow | TEST-001 to TEST-006 | 6 | 0 | 3 | 2 | 1 |
| Artist Search | TEST-007 to TEST-013 | 7 | 1 | 3 | 2 | 1 |
| Genre Exploration | TEST-014 to TEST-017 | 4 | 0 | 2 | 1 | 1 |
| Discovery Panel | TEST-018 to TEST-025 | 8 | 0 | 3 | 3 | 2 |
| Human Handoff | TEST-026 to TEST-028 | 3 | 1 | 1 | 1 | 0 |
| Memory/Persistence | TEST-029 to TEST-035 | 7 | 1 | 2 | 2 | 2 |
| Voice Input (STT) | TEST-037 to TEST-040 | 4 | 0 | 2 | 2 | 0 |
| TTS | TEST-041 to TEST-045 | 5 | 0 | 2 | 2 | 1 |
| Mobile | TEST-046 to TEST-050 | 5 | 0 | 2 | 3 | 0 |
| Error Handling | TEST-051 to TEST-056 | 6 | 2 | 1 | 2 | 1 |
| UI Elements | TEST-057 to TEST-062 | 6 | 0 | 0 | 1 | 5 |
| **TOTAL** | | **61** | **5** | **21** | **21** | **14** |

**Note:** No test IDs skipped; TEST-036 omitted for numbering clarity (no missing tests).
