---
name: nextjs-high-level-animations
description: Senior-level motion design and animation orchestration for Next.js websites, focused on premium UX, performance, and long-term maintainability.
---

# Next.js High-Level Animation Skill (Senior Motion Engineering)

This skill defines **how motion should be designed, governed, and implemented** in a Next.js project from a **senior engineering perspective**.

It prioritizes:
- Intentional motion over decoration
- Long-term maintainability over novelty
- UX clarity over visual noise
- Performance and accessibility as non-negotiables

Animations produced with this skill should feel **calm, confident, and premium** — never loud or experimental.

---

## When to use this skill

Use this skill when:

- Designing motion systems for Next.js websites or products
- Adding animations to:
  - Marketing or landing pages
  - SaaS dashboards
  - Product walkthroughs
- Establishing motion standards for a design system
- Refining UX polish before production release

This skill is especially relevant for **high-end brands**, **AI products**, **fintech**, and **enterprise SaaS**.

---

## When NOT to use this skill

Do NOT use this skill for:

- Game-like, physics-heavy, or playful animation styles
- Canvas, WebGL, or Three.js experiences
- One-off experimental motion that won’t be reused
- Mobile-native animation systems

---

## Senior Engineering Principles (MANDATORY)

1. **Motion Serves Meaning**
   - Motion must explain hierarchy, state change, or causality
   - If removing an animation does not reduce clarity, it should not exist

2. **Predictability Over Surprise**
   - Users should subconsciously anticipate how elements move
   - Consistency beats creativity in production systems

3. **Performance Is a Feature**
   - Motion must not degrade TTI, FCP, or CLS
   - GPU-friendly properties only (`transform`, `opacity`)

4. **Scalability**
   - Animations must be reusable, configurable, and token-driven
   - No magic numbers scattered across components

---

## Approved Animation Stack

- **Primary**: `framer-motion`
- **CSS**: TailwindCSS (transform + opacity only)
- **Scroll / Viewport**: `useInView`, `useScroll` (sparingly)
- **Framework**: Next.js App Router compatible
- **Disallowed by default**: GSAP, custom RAF loops

---

## Animation Governance Rules

- Never animate layout-affecting properties
- Never chain long timelines
- Never block interaction with motion
- Never animate on every scroll frame without a hard stop
- Always support `prefers-reduced-motion`

---

## High-Level Animation Patterns

### 1. Page Transitions

Purpose:
- Maintain spatial continuity between routes
- Reduce cognitive load during navigation

Senior guidance:
- Use opacity + small Y translation (4–12px)
- Duration: 300–500ms
- No scale, no rotation

---

### 2. Section Entrance Animations

Purpose:
- Guide reading order
- Reinforce visual hierarchy

Senior guidance:
- Trigger once on viewport entry
- Stagger children subtly (40–80ms)
- Avoid re-triggering on scroll bounce

---

### 3. Scroll-Based Motion

Purpose:
- Emphasize key sections only

Senior guidance:
- Use sparingly and intentionally
- Prefer reveal over continuous scroll-tie
- Must degrade gracefully on low-power devices

---

### 4. Micro-Interactions

Purpose:
- Confirm user intent
- Provide tactile feedback

Senior guidance:
- Hover: subtle elevation or opacity shift
- Tap: slight scale down (0.97–0.99)
- Avoid spring physics unless brand allows playfulness

---

## Motion Timing System (Token-Driven)

| Token | Duration |
|------|----------|
| `motion-fast` | 150–200ms |
| `motion-normal` | 250–350ms |
| `motion-slow` | 400–600ms |

Easing rules:
- Entrances → `easeOut`
- Exits → `easeIn`
- Transitions → `easeInOut`
- Premium feel → custom cubic-bezier (see profile below)

---

## Accessibility & User Respect

- Always respect `prefers-reduced-motion`
- Motion must never convey information alone
- Focus states must remain visible without animation
- Animations must never trap keyboard users

---

## Luxury / Premium Motion Profile

This profile defines motion for **high-end, refined products**.

### Characteristics

- Calm, unhurried motion
- Slightly longer durations (but never slow)
- Minimal displacement
- Soft easing curves
- No bounce, no elasticity

### Recommended Easing

This curve:
- Starts gently
- Settles confidently
- Avoids abrupt stops

### Recommended Values

- Translation: 6–12px max
- Opacity: 0 → 1
- Scale (rare): 0.98 → 1
- Duration: 350–500ms

### Where to apply

- Hero content entrances
- Page transitions
- Feature section reveals
- Primary call-to-action feedback

### Where NOT to apply

- Tables
- Dense dashboards
- High-frequency interactions

---

## Integration with Frontend Agent

This skill:
- Defines **motion standards, profiles, and constraints**
- Provides animation intent and configuration

Frontend Agent:
- Implements animations using `framer-motion`
- Applies tokens and profiles consistently
- Ensures compatibility with Server / Client Components

---

## Output Expectations

When invoked, this skill should provide:

- Motion strategy (what animates and why)
- Chosen animation patterns
- Timing and easing values
- Premium vs standard motion guidance
- Accessibility considerations

No low-level CSS or component wiring unless explicitly requested.

---

## Skill Intent

Deliver **quiet excellence in motion** — animation that users feel, not notice — implemented with the discipline and restraint of a senior engineer.
