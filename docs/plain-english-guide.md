# WhyNow — how it works (plain English)

No code in this document. If you have ever received a cold email that said "I saw you just raised — thought this might be timely", this is about why that sentence is usually wrong, and what it takes to be sure.

---

## The sentence that has to do the work

Every cold email contains one sentence that justifies the interruption. It usually looks like this:

> "Congrats on the Series B! With that kind of growth, SOC 2 compliance is probably on your roadmap — worth a quick chat?"

Read fast, it sounds researched. Read slowly, notice there are two claims and no connection between them. A company raising money is not a company that promised anyone a security certification. The writer never made that link; they just put the two sentences next to each other and let the reader assume one.

That gap is where the whole industry lives. Tools in this category collect true, recent, correctly-dated facts, hand them to a language model, and ask for a compelling reason to reach out. What comes back is fluent and specific and often does not follow — and because the facts are real and the dates are right, nothing looks wrong.

WhyNow is built on the opposite bet: **the interesting part is not the facts, it's whether the reasoning between them is allowed.**

---

## A why-now is an argument

Philosophers have a diagram for this. An argument is not two facts touching; it is a claim, some data, and a **warrant** — the general rule that says the data supports the claim. The warrant is normally left unsaid, which is exactly why bad ones survive.

WhyNow makes every warrant explicit and writes them down in advance. A why-now becomes a ladder of four steps:

| Step | Question it answers |
|---|---|
| **Trigger** | What happened, when, and who reported it? |
| **Buyer state** | What does that change *inside* the company? |
| **Problem** | What specific problem does that state create? |
| **Relevance** | Is that a problem *we* solve? |
| **Timing** | Is the window still open today? |

Every step between them needs a rule. Here is one that is written down:

> *A new senior engineering leader re-opens the stack in their first quarter: the tools they inherit were chosen by someone else, and the first budget cycle they own is the one they change.* — window: 90 days.

If a rule like that exists and its conditions are met, the step is **licensed**. If no rule connects two steps, the ladder has a rung with nothing on it, and the tool says so instead of writing a sentence anyway.

---

## Five things that can happen

Every candidate argument ends in exactly one state. Not a score out of a hundred — a verdict.

**Emitted.** All four steps licensed, nothing contradicting it, window open. You get a sentence and the evidence behind it.

**Blocked.** Some step has no rule. This is the "Series B, therefore SOC 2" case, and the tool shows you exactly which rung is empty.

**Defeated.** A rule applied, and then something in the same pile of evidence killed it. The VP whose arrival powers the argument left again six weeks later.

**Stale.** The argument is perfectly good and the moment has passed. The round was fourteen months ago.

**Unsupported.** The trigger has no date. A leadership page that says someone is VP Engineering does not say when they arrived, and "now" cannot be built on a guess.

The four rejected states are shown by default, not hidden behind a toggle. **A tool that only shows you reasons to send is not researching, it is agreeing with you.**

---

## Looking for what would kill it

The rule about the new engineering leader carries a second clause: *this stops being true if that function loses its leader again after the arrival.*

That is a **defeater** — declared in advance, alongside the rule it can kill. When the tool builds an argument, it goes looking for its own defeaters, and it reports what it found *and what it did not find*. "We checked for a departure and there wasn't one" is a different claim from silence.

Two details matter more than they look:

**Order.** A hiring freeze announced *before* a hiring surge is not a rebuttal of the surge — it is the thing the surge reversed. A defeater only counts if it came after the trigger.

**Age.** A certification achieved four hundred days ago does not close the audit cycle that is due now. Defeaters expire. One of the twelve test companies exists purely to catch this: two outages, two published incident reviews, and only the recent review is still holding anything closed.

---

## "Now" is a number of days

Each rule carries a window. A funding round frees budget for about nine months. A new engineering leader re-opens the stack for about a quarter. A public outage puts reliability on the executive agenda for about ninety days.

So the tool can answer a question most cannot: *how many days are left?* And it can be moved. Slide the date backwards and arguments come back to life; slide it forwards and you watch them close. The timeline strip shows each window as a bar and today as a line crossing them.

That is the difference between a tool that says "now" because you asked it to, and one that computed the word.

---

## Whether it's relevant to *you*

The hardest step is the last one before timing: this company has a problem — is it *our* problem?

WhyNow ships three imaginary sellers: a cloud-cost tool, an incident-response tool, and a compliance tool. Switching between them changes nothing about the evidence and everything about the verdicts. One of the twelve companies produces two live hypotheses for the compliance seller and, on identical facts, nothing at all for the other two.

Two problems in the system are solved by none of the three sellers, deliberately. It means an argument can be valid for three rungs and die on the fourth — which is the exact shape of the mistake this project is about.

---

## Twelve companies, twelve ways to be wrong

Everything in the demo is invented. Every web address ends in `.example`. No real company is named or quoted.

That is not a shortcut — it is the point. Each of the twelve accounts is built so that the naive approach produces a confident, wrong answer:

1. Loud funding news that connects to nothing this seller sells
2. Evidence that kills the hypothesis, sitting in the same file
3. A real trigger whose moment passed a year ago
4. Every "fact" sourced from the company's own blog
5. A funding round and a round of layoffs in the same quarter
6. Evidence that actually belongs to a similarly-named subsidiary
7. A leadership page with no date on it
8. One funding round reported by three outlets, looking like three signals
9. Facts that are relevant to one seller and irrelevant to another
10. A rebuttal that has gone out of date
11. A strong story that quietly depends on evidence that isn't there
12. A clean case, so you can tell the difference

Each has a test asserting the engine gets it right. They are the twelve ways the shortcut fails.

---

## Why you can trust the number of days

Two structural choices, in plain terms.

**The reasoning engine cannot talk to a language model.** Not "we chose not to" — it structurally cannot, and an automated check fails the build if anyone tries to connect them. A model that cannot reach the engine cannot invent a rule, so every rule in every answer came from the written-down list.

**The sentences are written from the rules themselves.** Nothing polishes them afterwards. That is why the prose is plainer than a chatbot's — and it is why the sentence can never sound better than the argument underneath it. There is no step where nice wording can paper over a missing rung.

---

## The test that matters

The system runs itself against every company, every seller, and every date across a full year — about thirteen thousand runs and a hundred and sixty thousand checks, in half a second, with no internet connection.

The most important check is this: for every argument the system is currently willing to make, it manufactures the exact piece of evidence that argument's own rule says would kill it, drops it into the file, and re-runs. The argument must die.

That check is not available to a tool built on a prompt. There is no way to guarantee that adding a sentence to a prompt removes a conclusion.

The test suite also caught a real mistake during the build. The system was killing an argument using a news article published the day *after* the date being asked about — technically the event had happened, but nobody could have read about it yet. Rebutting a hypothesis with tomorrow's newspaper is cheating at your own exam. Fixed, with a test.

---

## What it does not do

It does not rank your account list — that was a different day's project. It does not browse the web. It only finds rebuttals someone thought to write down. Its library of rules is small: twenty-four, where real coverage would need hundreds. And the companies are invented, engineered to be hard in twelve particular ways, which is not the same as being representative.

What it does do is refuse to write a sentence it cannot justify, and show you the exact rung where the reasoning ran out.
