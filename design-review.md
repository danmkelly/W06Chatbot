# Design & Pedagogical Review -- Bob the Chatbot

**Reviewer:** @Keelin (QA specialist)
**Date:** 2026-07-02 (re-reviewed after explicit consent flow implementation)
**Frameworks applied:** Adamopoulou & Moussiades (2020) Seven-Dimension Chatbot Taxonomy; Reeves & Nass (1996) CASA; Conversation Flow Anatomy (Opener / Intent / Slots / Recovery / Closer / Unexpected)

---

## 1. Scored Findings Table

| # | Framework | Item | Score (PASS/PARTIAL/FAIL) | Evidence | Severity [DESIGN]/[CODE] | Overlap with bugs | Manual Override | Closed |
|---|-----------|------|--------------------------|----------|--------------------------|----------------------|-----------------|----------|
| F1 | Taxonomy | Knowledge domain -- closed vs open | PASS | Domain is music (closed); easter eggs (Guinness, World Cup) are deliberate per victor.html brief, not accidental drift. | [DESIGN] | None | | |
| F2 | Taxonomy | Service provided -- interpersonal support | PARTIAL | Positioned as a "music guide" with Discogs purchase path; but LLM temperature 0.9 + no domain guardrails in `BOB_VOICE` (line 940) risks drift into general chat/emotional support. | [DESIGN] | None | | |
| F3 | Taxonomy | Goals -- task-based vs chat-based | PASS | Flows resolve to action: artist search leads to discovery panel with Discogs "Buy Now" badges; genre exploration produces clickable chips. Conversational LLM serves the task-based goal. | [DESIGN] | None | | |
| F4 | Taxonomy | Response generation -- hybrid (LLM+retrieval+regex) | PARTIAL | Hybrid architecture confirmed: LLM for conversation, Last.fm for panel data, regex fallback in `extractArtists()` (line ~900). Hallucination hot-spot: no RAG verification of LLM claims against Last.fm/Discogs ground truth; `chatLLM` temperature 0.9. | [DESIGN] | BUG-012 (regex brittleness) but hallucination gap is new | | |
| F5 | Taxonomy | Communication channel -- text+voice parity | PARTIAL | Text path has gibberish detection (lines 1088-1113); voice STT transcription bypasses those checks entirely before `send()`. TTS orphan state documented in BUG-005. Not parity. | [DESIGN/CODE] | BUG-005 (TTS) but voice-STT validation gap is new | | |
| F6 | Taxonomy | Human-aid -- reachable at every stage | PASS | "Prefer a real human?" bar is always visible in `.chat-human-ramp`. Typing "human" returns full contact details (lines 1117-1122). Reachable from any conversation state. | [DESIGN] | None | | |
| F7 | Taxonomy | Permissions | N/A | Commercial single-owner context; no relevant permission dimension. | -- | None | | |
| F8 | CASA | Disclosure in turn 1 | PASS | First spoken message (live line 1269): "Hey! I'm Bob, an AI chatbot powered by DeepSeek." Unambiguous self-identification as "AI chatbot". Second message is consent question, not humanising filler. No "friendly colleague" ambiguity from prior version. | [DESIGN] | None | | |
| F9 | CASA | No fake-human cues | FAIL | Human name "Bob"; role label "Music guru & vinyl hunter" (line 502); Dublin dialect ("grand, deadly, class, sound, craic" in `BOB_VOICE` line 940). The victor.html brief explicitly endorses mimicry: "a chatbot named Bob that mimics the experience of talking to a knowledgeable staff member." | [DESIGN] | None | | |
| F10 | CASA | Register matches capability | PARTIAL | `BOB_VOICE` (line 940): "You know band histories, album lore, recording stories, genre connections..." LLM cannot guarantee factual accuracy on these claims; no RAG grounding. Confident Dublin register overpromises. | [DESIGN] | None | | |
| F11 | CASA | Frustration handling -- de-escalation on failure | FAIL | Gibberish path (lines 1109-1113) repeats same cheerful template regardless of repetition count. LLM failure fallback (line 1136): "I'm having trouble connecting..." improved message but still no path to human handoff from failure. No register shift or de-escalation anywhere. | [DESIGN/CODE] | BUG-008 (typing stuck on goBack) -- adds conversation-design dimension | | |
| F12 | CASA | Chummy data extraction -- localStorage disclosed BEFORE collection | PASS | Explicit consent flow implemented (live lines 1269-1274, 1052-1073). Turn 2 asks: "Would you like me to remember your name... yes or no?" `saveMemory()` guarded by `consent==="yes"` (line 594). No localStorage write before consent. If user says no, nothing stored. On return visit with no consent, all counters reset (lines 588-590). Consent disclosure happens before any persistence. | [DESIGN/CODE] | Previously linked to BUG-007 (modal overlay); now resolved by consent flow | | |
| F13 | Flow Anatomy | OPENER -- identity + capability in turn 1 | PARTIAL | Turn 1 (live line 1269): identity ("AI chatbot... music guide") + human handoff path disclosed. Capability specifics ("what are you into music-wise?" with chips) only appear after consent is resolved, creating a delay. Identity is solid; capability demonstration deferred until consent is settled. | [DESIGN] | None | | |
| F14 | Flow Anatomy | INTENT -- one clear purpose per flow | PASS | Three distinct flows: artist search (discovery panel with Discogs purchase), genre exploration (tag artists/albums), human handoff (contact details). LLM chattiness augments but does not derail these paths. | [DESIGN] | None | | |
| F15 | Flow Anatomy | SLOTS -- validated one at a time with back/correction | FAIL | No slot-filling dialogue at all. User free-text is accepted verbatim and fired at APIs (lines 1141-1171). No "Did you mean...?" confirmation before searching. `goBack()` (line 1004) navigates discovery history, not input correction. | [DESIGN] | None | | |
| F16 | Flow Anatomy | RECOVERY LADDER -- 5 failure scenarios | FAIL | **Gibberish** (lines 1109-1113): reaches step 2 (suggestion chips offered). Misses step 3 (human handoff). **Misspelling**: no recovery at all; misspelled name goes to Last.fm with zero/skewed results. **API timeout**: `chatLLM` returns null, fallback line 1136 says "I'm having trouble connecting..." -- improved message but no options, no handoff. **No Discogs match**: `checkDiscogs` returns null silently; chat never informed, buy button just absent. **Empty Last.fm**: discovery panel renders empty sections with zero notification to user. Of 5 scenarios, only gibberish reaches step 2 and none reach step 3. | [DESIGN/CODE] | BUG-002 (fallback), BUG-008 (typing on error), BUG-018 (silent LLM failure now partially resolved) -- adds structural recovery ladder analysis | | |
| F17 | Flow Anatomy | CLOSER -- read-back/confirm + keep exploring + human path | PARTIAL | No explicit read-back/confirm after recommendation. "Keep exploring" is implicit via persistent discovery panel (similar artists, genre chips all clickable). Human path is always visible via the "Prefer a real human?" bar but is never proactively offered as a next step by the bot. | [DESIGN] | None | | |
| F18 | Flow Anatomy | Design the unexpected first | PARTIAL | Gibberish handled (lines 1088-1113). Silence/empty input caught (`if(!txt)return` line 1047). But: rapid topic switches pollute `conv[]` context (no AbortController on fetch); mid-flow corrections unsupported; no idle-timeout re-engagement. | [DESIGN] | None | | |

### Summary counts

| Score | Count |
|-------|-------|
| PASS | 6 |
| PARTIAL | 7 |
| FAIL | 4 |
| N/A | 1 |

---

## 2. Biggest Risk to Trust (Reeves & Nass CASA)

The most recent change (explicit consent flow, F12) has closed the largest trust gap from the previous review: Bob now asks explicit permission before storing any data, and the `saveMemory()` function is guarded so no localStorage write occurs without consent. The pre-consent tracking concern is resolved.

**The biggest remaining risk to trust** is the combination of **strong human mimicry** (F9 -- human name, Dublin personality) and a **broken recovery ladder** (F16). When a user interacts with Bob as if he is a knowledgeable staff member (the persona the bot actively projects), the CASA effect is activated and users apply human social rules, including the expectation that a competent conversational partner will (a) admit mistakes, (b) offer alternatives, and (c) escalate when stuck. Bob fails on all three: he repeats cheerful templates on error, silently degrades on API failures, and never proactively offers the human handoff. The damage is compounded because the human-like persona raises expectations the system cannot meet.

**Secondary risk**: Slot validation (F15) remains completely absent. Users can type ambiguous or misspelled queries that produce poor or zero results with no clarification dialogue. Combined with a recovery ladder that already fails for most scenarios, this means a user who types something slightly wrong has no path back except guessing what to type next.

**Comparison to prior review**: The previous review identified pre-consent localStorage tracking as the single biggest trust risk. That has been resolved. The secondary risk (broken recovery ladder) is now the primary concern. The bot has become more ethical but remains structurally fragile when conversations deviate from the happy path.

---

## 3. Priority Fixes (ranked by impact)

### P1 -- HIGH: Recovery ladder -- acknowledge all failure modes and offer human handoff

**Impact:** 4 of 5 failure scenarios still dead-end silently. When the bot silently degrades, the user interprets the empty panel as either a bug or a problem with their own query -- both erode confidence.

**File:** `index.html`
**Lines:** ~1136 (LLM fallback), ~1179 (after search loop), ~808-818 (enrichAlbumBadges)

**Changes:**

For empty search results (after search loop, around line 1179):
```
// ADD after the searchedAny check:
if(!searchedAny && artists.length > 0){
  addMsg("I looked for that but couldn't find any matches in the catalogue. Want to try a different artist, or <strong>type 'human'</strong> to ask our team?",'bot');
  addSugg(["Radiohead","Pixies","Kendrick Lamar"]);
}
```

For LLM failure (line ~1136):
```
// ENHANCE existing fallback:
if(!llmReply){
  addMsg("Sorry, I'm having trouble connecting right now. The discovery panel may still have results. You can also <strong>type 'human'</strong> to reach our team directly.",'bot');
}
```

For no-Discogs-match notification:
```
// Add counter in enrichAlbumBadges; if totalChecked > 0 && totalMatched === 0:
// Append a chat message notifying the user and offering human handoff.
```

For misspelling: add a "Did you mean...?" step after low-confidence Last.fm results.

### P2 -- HIGH: Add voice-STT validation parity

**Impact:** Voice users currently bypass all gibberish/validation checks. A voice user sending transcribed noise gets the same treatment as a deliberate text query.

**File:** `index.html`
**Line:** Speech recognition result handler
**Change:** After STT produces final transcript, pass it through the same gibberish detection before `send()`:

```
chatInput.value=transcript;
if(e.results[0].isFinal){
  micBtn.classList.remove("listening");
  // Re-validate transcribed text before sending
  if(!validateInput(transcript)){
    addMsg("I didn't quite catch that! Give me an artist name to explore...",'bot');
    addSugg(["Radiohead","Pixies","Jazz","Irish artists","90s indie"]);
    return;
  }
  spokeLast=true;send();
}
```

### P3 -- HIGH: Slot validation before search

**Impact:** Users typing ambiguous input get poor/no results with no clarification step. A "Did you mean...?" pattern would improve accuracy and trust.

**File:** `index.html`
**Line:** ~1141-1151 (before artist search loop)
**Change:** Add a confirmation step for ambiguous or single-word queries.

### P4 -- MEDIUM: Closer read-back/confirm step

**Impact:** Users complete a search but aren't guided to next actions. A structured closer improves task completion.

**File:** `index.html`
**Line:** `BOB_VOICE` system prompt (line ~940) and after LLM reply
**Change:** Add closer instruction to system prompt: "After making recommendations, offer the next step naturally: 'Want me to dig deeper into any of these, or shall I get a real human to help you find a copy?'"

### P5 -- MEDIUM: De-escalation register shift on repeated failures

**Impact:** When the bot fails repeatedly, it should change tone from cheerful to empathetic rather than repeating the same template.

**File:** `index.html`
**Line:** ~1109-1113 (gibberish handler)
**Change:** Track consecutive failure count; on 3rd+ failure, shift register: "I'm really struggling to understand. Let me connect you with a real person -- type 'human' and we'll sort you out."

### P6 -- LOW: Request cancellation on rapid topic switches

**Impact:** Fast users can corrupt conversation context. AbortController would prevent stale requests from polluting state.

**File:** `index.html`
**Line:** ~939 (fetch in chatLLM) and ~1109 (fetch in search loop)
**Change:** Add `AbortController` per search session, abort on new `send()`.

---

## 4. Design Quality Scorecard

| Category | Score | Weight | Notes |
|----------|-------|--------|-------|
| CASA Compliance (Reeves & Nass) | 3.0 / 5 | 35% | Disclosure explicit (PASS); consent flow implemented (PASS); fake-human cues unchanged (FAIL); frustration handling unchanged (FAIL); register partial. Two major gaps closed since prior review. |
| Conversation Flow Anatomy | 2.0 / 5 | 35% | Opener improved (no more humanising filler); recovery ladder still broken for 4/5 scenarios; slots absent; closer partial. |
| Taxonomy Coherence (Adamopoulou & Moussiades) | 3.0 / 5 | 30% | Domain, goals, and human-aid are well-defined; response gen and channel parity have gaps. Unchanged by consent flow. |

### **Overall Design Quality Score: 2.7 / 5 -- Grade C**

The consent flow (F12) is the single most impactful improvement since the previous review: it closes the pre-consent localStorage gap that was the highest-priority ethical failure. Combined with the strengthened disclosure language (F8), the bot has moved from CASA-blind to CASA-aware on two of five dimensions.

However, the score is held back by structural failures that the consent change does not address: the recovery ladder remains non-functional for most failure modes (F16), slot validation is absent (F15), and the fake-human cues (F9) create expectations the system cannot meet. The bot is now more ethical but still fragile when conversations deviate from the happy path.

**Key finding**: The explicit consent flow resolves the most urgent ethical concern from the prior review. The remaining issues are conversation-engineering problems rather than ethical failures: the bot needs a working recovery ladder, input validation, and a de-escalation register to become both trustworthy AND reliable. The fixes are surgical (all under 30 lines each) but structurally important.
