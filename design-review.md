# Design & Pedagogical Review -- Bob the Chatbot

**Reviewer:** @Keelin (QA specialist)
**Date:** 2026-07-02
**Frameworks applied:** Adamopoulou & Moussiades (2020) Seven-Dimension Chatbot Taxonomy; Reeves & Nass (1996) CASA; Conversation Flow Anatomy (Opener / Intent / Slots / Recovery / Closer / Unexpected)

---

## 1. Scored Findings Table

| # | Framework | Item | Score | Evidence (1 line) | Severity | Overlap with bug-list.md |
|---|-----------|------|-------|--------------------|----------|--------------------------|
| F1.1 | Taxonomy | Knowledge domain -- closed vs open | PASS | Domain is music (closed); easter eggs (Guinness, World Cup) are deliberate per victor.html brief, not accidental drift. | [DESIGN] | None |
| F1.2 | Taxonomy | Service provided -- interpersonal support | PARTIAL | Positioned as a "music guide" with Discogs purchase path; but LLM temperature 0.9 + no domain guardrails in `BOB_VOICE` (line 919) risks drift into general chat/emotional support. | [DESIGN] | None |
| F1.3 | Taxonomy | Goals -- task-based vs chat-based | PASS | Flows resolve to action: artist search leads to discovery panel with Discogs "Buy Now" badges; genre exploration produces clickable chips. Conversational LLM serves the task-based goal. | [DESIGN] | None |
| F1.4 | Taxonomy | Response generation -- hybrid (LLM+retrieval+regex) | PARTIAL | Hybrid architecture confirmed: LLM for conversation, Last.fm for panel data, regex fallback in `extractArtists()` (line 894). Hallucination hot-spot: no RAG verification of LLM claims against Last.fm/Discogs ground truth; `chatLLM` temperature 0.9 (line 940). | [DESIGN] | BUG-012 (regex brittleness) but hallucination gap is new |
| F1.5 | Taxonomy | Communication channel -- text+voice parity | PARTIAL | Text path has gibberish detection (lines 1033-1052); voice STT transcription bypasses those checks entirely before `send()` (line ~switching). TTS orphan state documented in BUG-005. Not parity. | [DESIGN/CODE] | BUG-005 (TTS) but voice-STT validation gap is new |
| F1.6 | Taxonomy | Human-aid -- reachable at every stage | PASS | "Prefer a real human?" bar is always visible in `.chat-human-ramp` (HTML after `.chat-input-wrap`). Typing "human" returns full contact details (lines 1061-1067). Reachable from any conversation state. | [DESIGN] | None |
| F1.7 | Taxonomy | Permissions | N/A | Commercial single-owner context; no relevant permission dimension. | -- | None |
| F2.1 | CASA | Disclosure in turn 1 | PARTIAL | First spoken message (line 1207): "Hey! I'm Bob, your AI powered music guide" -- "AI powered" IS disclosure but embedded in rapport. Second message (line 1208) immediately humanises: "Just like my friendly colleagues in our physical store..." creating ambiguity. Badge is not disclosure. | [DESIGN] | None |
| F2.2 | CASA | No fake-human cues | FAIL | Human name "Bob"; role label "Music guru & vinyl hunter" (line 1200); Dublin dialect ("grand, deadly, class, sound, craic" in `BOB_VOICE` line 919). The victor.html brief explicitly endorses mimicry: "a chatbot named Bob that mimics the experience of talking to a knowledgeable staff member." | [DESIGN] | None |
| F2.3 | CASA | Register matches capability | PARTIAL | `BOB_VOICE` (line 919): "You know band histories, album lore, recording stories, genre connections." LLM cannot guarantee factual accuracy on these claims; no RAG grounding. Confident Dublin register overpromises. | [DESIGN] | None |
| F2.4 | CASA | Frustration handling -- de-escalation on failure | FAIL | Gibberish path (line 1053-1057) repeats same cheerful template regardless of repetition count. LLM failure fallback (line 1136): "I'm listening! Tell me about an artist..." does not acknowledge error. No register shift or de-escalation anywhere. | [DESIGN/CODE] | BUG-008 (typing stuck on goBack) -- adds conversation-design dimension |
| F2.5 | CASA | Chummy data extraction -- localStorage disclosed BEFORE collection | FAIL | `loadMemory()` (line ~1215) writes visit count and timestamp to localStorage immediately on page load, before any disclosure. Name extraction (line 1211): "Oh, and I didn't catch your name! What should I call you?" is framed as friendliness, not data collection. The "What I store" link (line ~brand-info-link) is an opt-in discovery mechanism, not a pre-collection consent prompt. | [DESIGN/CODE] | BUG-007 (modal overlay click) -- adds privacy-by-design gap |
| F3.1 | Flow Anatomy | OPENER -- identity + capability in turn 1 | PARTIAL | Turn 1 (line 1207): identity ("AI powered music guide"). Capability disclosed in turn 3 (line 1209): "Tell me an artist you love, or ask about a genre..." Intervening turn 2 is pure rapport ("Just like my friendly colleagues..."). 2.4-second delay to capability disclosure. | [DESIGN] | None |
| F3.2 | Flow Anatomy | INTENT -- one clear purpose per flow | PASS | Three distinct flows: artist search (discovery panel with Discogs purchase), genre exploration (tag artists/albums), human handoff (contact details). LLM chattiness augments but does not derail these paths. | [DESIGN] | None |
| F3.3 | Flow Anatomy | SLOTS -- validated one at a time with back/correction | FAIL | No slot-filling dialogue at all. User free-text is accepted verbatim and fired at APIs (line 1098-1113). No "Did you mean...?" confirmation before searching. `goBack()` (line 972) navigates discovery history, not input correction. | [DESIGN] | None |
| F3.4 | Flow Anatomy | RECOVERY LADDER -- 5 failure scenarios | FAIL | **Gibberish** (lines 1053-1057): reaches step 2 (suggestion chips offered). Misses step 3 (human handoff). **Misspelling**: no recovery at all; misspelled name goes to Last.fm with zero/skewed results. **API timeout**: `chatLLM` returns null, fallback line 1136 says "I'm listening!" without acknowledging error. No options, no handoff. **No Discogs match**: `checkDiscogs` returns null silently; chat never informed, buy button just absent. **Empty Last.fm**: discovery panel renders empty sections with zero notification to user. Of 5 scenarios, only gibberish reaches step 2 and none reach step 3. | [DESIGN/CODE] | BUG-002 (fallback), BUG-008 (typing on error) -- adds structural recovery ladder analysis |
| F3.5 | Flow Anatomy | CLOSER -- read-back/confirm + keep exploring + human path | PARTIAL | No explicit read-back/confirm after recommendation. "Keep exploring" is implicit via persistent discovery panel (similar artists, genre chips all clickable). Human path is always visible via the "Prefer a real human?" bar but is never proactively offered as a next step by the bot. | [DESIGN] | None |
| F3.6 | Flow Anatomy | Design the unexpected first | PARTIAL | Gibberish handled (lines 1033-1058). Silence/empty input caught (`if(!txt)return` line 1014). But: rapid topic switches pollute `conv[]` context (no AbortController on line 939 fetch); mid-flow corrections unsupported; no idle-timeout re-engagement. | [DESIGN] | None |

### Summary counts

| Score | Count |
|-------|-------|
| PASS | 4 |
| PARTIAL | 8 |
| FAIL | 5 |
| N/A | 1 |

---

## 2. Biggest Risk to Trust (Reeves & Nass CASA)

The single biggest risk to trust is the combination of **undisclosed localStorage collection on page load** (F2.5) and **weak bot-disclosure language in turn 1** (F2.1).

Per Reeves & Nass, when users treat computers as social actors, they apply the same social rules they use with humans -- including the expectation that personal data is collected only with consent. Bob violates this in two ways:

1. **Pre-consent tracking**: `loadMemory()` fires immediately on page load (init block, line ~1215), incrementing `bobMemory.visits` and writing a timestamp to localStorage before the user has seen any disclosure. The user is tracked before they know tracking exists.

2. **Friendly-extraction framing**: The name-request prompt ("Oh, and I didn't catch your name! What should I call you?" at line 1211) is framed as social politeness, not as a data-collection moment. A CASA-aware design would say: "I'd like to remember your name so I can greet you next time. It stays on your device, never sent anywhere. What should I call you?"

These two failures compound: the bot is designed to mimic a human (human name, Dublin personality, "friendly colleague" framing), which activates the CASA effect, but then extracts data using that same human-mimicking rapport without transparent consent. This is the definition of CASA-blind design: exploiting social rules for data capture without the obligations those rules imply.

**Secondary trust risk**: The recovery ladder (F3.4) fails for 4 of 5 failure scenarios. When the bot silently degrades (no Discogs match, empty Last.fm, API timeout), the user interprets the empty panel as either a bug in the bot or a problem with their own query -- both erode confidence. A bot that cannot admit failure cannot build trust.

---

## 3. Priority Fixes (ranked by impact)

### P1 -- CRITICAL: Pre-collection consent for localStorage

**Impact:** Privacy compliance, CASA trust. The highest-priority fix because it is an ethical failure at the first millisecond of interaction.

**File:** `index.html`
**Line:** ~1215 (init IIFE)
**Change:** Move `loadMemory()` call from immediate execution to after an explicit consent interaction. Add a consent toast/banner.

```
// OLD (line ~1215, inside init IIFE):
loadMemory();

// NEW:
// Do NOT call loadMemory() immediately. Instead, show a consent prompt.
// After user clicks "Got it", call loadMemory().
showConsentBanner(); // renders a small bar: "Bob remembers a few things on your device to make visits friendlier. [Got it] [No thanks]"
// On "Got it": loadMemory(); initConversation();
// On "No thanks": initConversation() only (no localStorage writes)
```

**Line 1211:** Reword the name-request to be transparent about storage:
```
// OLD:
addMsg("Oh, and I didn't catch your name! What should I call you?",'bot');

// NEW:
addMsg("If you tell me your name I'll remember you next time -- it stays on your device, never sent anywhere. What should I call you?",'bot');
```

### P2 -- HIGH: Add voice-STT validation parity

**Impact:** Voice users currently bypass all gibberish/validation checks. A voice user sending transcribed noise gets the same treatment as a deliberate text query.

**File:** `index.html`
**Line:** Speech recognition result handler (adjacent to `recognition.onresult`)
**Change:** After STT produces final transcript, pass it through the same gibberish detection before `send()`:

```
// In recognition.onresult, after transcription is final:
// OLD:
chatInput.value=transcript;
if(e.results[0].isFinal){micBtn.classList.remove("listening");spokeLast=true;send()}

// NEW:
chatInput.value=transcript;
if(e.results[0].isFinal){
  micBtn.classList.remove("listening");
  // Re-validate transcribed text before sending
  if(!validateInput(transcript)){
    addMsg("I didn't quite catch that! Give me an artist name to explore, a genre you're curious about, or just tell me what kind of music you're into.",'bot');
    addSugg(["Radiohead","Pixies","Jazz","Irish artists","90s indie"]);
    return;
  }
  spokeLast=true;send();
}
```

### P3 -- HIGH: Recovery ladder -- acknowledge API failures in chat

**Impact:** Current silent degradation (no Discogs match, empty Last.fm, LLM timeout) destroys user confidence. The bot must signal when things go wrong.

**File:** `index.html`
**Line:** ~1136 (LLM fallback path) and ~1102-1113 (search loop)
**Change:**

For LLM failure (line ~1080-1136):
```
// OLD (line 1136):
if(!LLM_KEY||!LLM_URL||!LLM_MODEL){
  addMsg("I'm listening! Tell me about an artist or genre you love and I'll dig in.",'bot');
}

// NEW:
if(!LLM_KEY||!LLM_URL||!LLM_MODEL||!llmReply){
  addMsg("Sorry, I'm having trouble connecting to my brain right now. The discovery panel may still have results. You can also <strong>type 'human'</strong> to reach our team directly.",'bot');
}
```

For empty search results (after search loop, line ~1116):
```
// ADD after line 1116 (before the if(searchedAny&&mergedAlb.length) block):
if(!searchedAny && artists.length > 0){
  addMsg("I looked for that but couldn't find any matches in the catalogue. Want to try a different artist, or <strong>type 'human'</strong> to ask our team?",'bot');
  addSugg(["Radiohead","Pixies","Kendrick Lamar"]);
}
```

For no-Discogs-match notification (in `enrichAlbumBadges`, line ~808-818):
```
// When checkDiscogs returns null for ALL albums, notify user:
// Add a counter at the end of enrichAlbumBadges:
if(totalChecked > 0 && totalMatched === 0){
  // Append a chat message: "I couldn't find marketplace links for these albums. Type 'human' to ask us to hunt them down for you."
}
```

### P4 -- MEDIUM: Slot validation before search

**Impact:** Users typing ambiguous input (e.g., "the scientist" when they mean Coldplay) get poor/no results with no clarification step. A "Did you mean...?" pattern would improve accuracy and trust.

**File:** `index.html`
**Line:** ~1098-1101 (before search loop)
**Change:** Add a confirmation step for low-confidence extractions:

```
// Before the for loop at line 1102, for single-artist queries with short names:
if(artists.length === 1 && artists[0].split(/\s+/).length <= 2 && !isKnownArtist(artists[0])){
  // Ask LLM: "Is X an artist?" before searching
  // Or simpler: add a suggestion chip approach
}
```

### P5 -- MEDIUM: Closer read-back/confirm step

**Impact:** Users complete a search but aren't guided to next actions. A structured closer improves task completion.

**File:** `index.html`
**Line:** ~120 (BOB_VOICE system prompt) and ~946 (after LLM reply)
**Change:** Add closer instruction to system prompt:

```
// OLD (line 919):
var BOB_VOICE="You are Bob...";

// NEW -- append to BOB_VOICE:
"...After making recommendations, always offer the next step naturally: 'Want me to dig deeper into any of these, or shall I get a real human to help you find a copy?'"
```

### P6 -- LOW: Request cancellation on rapid topic switches

**Impact:** Fast users can corrupt conversation context. AbortController would prevent stale requests from polluting state.

**File:** `index.html`
**Line:** ~939 (fetch in chatLLM) and ~1109 (fetch in search loop)
**Change:** Add `AbortController` per search session, abort on new `send()`:

```
// Add at top of send():
if(window._abortSearch){window._abortSearch.abort()}
window._abortSearch=new AbortController();
// Pass signal to all fetch calls.
```

---

## 4. Design Quality Scorecard

| Category | Score | Weight | Notes |
|----------|-------|--------|-------|
| CASA Compliance (Reeves & Nass) | 1.5 / 5 | 35% | Weak disclosure, human mimicry, undisclosed localStorage collection, no frustration de-escalation |
| Conversation Flow Anatomy | 1.5 / 5 | 35% | Opener is partial; slots absent; recovery ladder broken for 4/5 scenarios; closer is partial |
| Taxonomy Coherence (Adamopoulou & Moussiades) | 3.0 / 5 | 30% | Domain, goals, and human-aid are well-defined; response gen and channel parity have gaps |

### **Overall Design Quality Score: 2.0 / 5 -- Grade D**

The bot functions as a music discovery tool but fails as a trustworthy conversational agent. The CASA-blind design choices (pre-consent tracking, weak disclosure, human mimicry) are the most damaging: they violate the social contract Reeves & Nass identified as fundamental to human-computer interaction. The conversation flow anatomy is structurally incomplete: the recovery ladder is non-functional for most failure modes, and there is no input validation step. The taxonomy is the strongest dimension: the bot knows what it is supposed to do (music discovery leading to purchase) and the human handoff is genuinely well-implemented.

**Key finding**: This is a functionally capable tool wrapped in a conversation design that would fail a university ethics review. The fixes are surgical (not architectural) -- the code changes above are all < 20 lines each -- but until the CASA disclosure and localStorage consent gaps are closed, the bot is pedagogically unsound regardless of its technical performance.
