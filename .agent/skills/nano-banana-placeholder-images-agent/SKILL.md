---
name: nano-banana-placeholder-images
description: Generate clean, modern placeholder images for frontend UI, landing pages, and web design using Nano Banana Pro.
---

# Nano Banana Placeholder Images Skill

This skill generates **high-quality placeholder images** for frontend development and landing page design using **Nano Banana Pro (Gemini image preview model)**.

It is designed to help developers and designers quickly visualize layouts before final images or brand assets are available.

---

## When to use this skill

Use this skill when:

- Creating frontend layouts or landing pages
- Building wireframes, mockups, or MVPs
- Designing SaaS, marketing, or product websites
- You need temporary but **design-safe placeholder images**

Common use cases:
- Hero sections
- Feature illustrations
- Cards and thumbnails
- User avatars
- Dashboard or UI scenes
- Background visuals

---

## Image style rules

Always generate images that are:

- Clean, modern, and minimal
- Neutral in color (soft grays, muted blues, light backgrounds)
- UI-friendly and non-distracting
- Free of text, logos, and branding
- Suitable for replacement later with real assets

Avoid:
- Embedded text
- Brand names or logos
- Watermarks
- Overly artistic or surreal styles unless requested

---

## How to use this skill

### 1. Choose the placeholder type

Decide what kind of image is needed:

- Hero / header image
- Feature illustration
- Card or thumbnail
- Avatar or profile image
- Background texture
- Product mockup
- Dashboard UI scene

---

### 2. Write the prompt

Follow this structure:


Hero / Header Image

Completed prompt

Generate a clean, modern placeholder image for a hero section used in a SaaS marketing website.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Abstract shapes, subtle gradients, light background, balanced composition.
No text, no logos.

Feature Section Illustration

Completed prompt

Generate a clean, modern placeholder image for a feature illustration used in a product landing page.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Simple geometric elements, subtle depth, uncluttered layout.
No text, no logos.

Card / Thumbnail Image

Completed prompt

Generate a clean, modern placeholder image for a card thumbnail used in a web application dashboard.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Centered composition, soft shadows, muted color palette.
No text, no logos.

Avatar / Profile Image

Completed prompt

Generate a clean, modern placeholder image for a user avatar used in a SaaS web application.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Simple background, soft focus, UI-friendly framing.
No text, no logos.

Background / Section Divider Image

Completed prompt

Generate a clean, modern placeholder image for a background section used in a marketing website.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Abstract texture, subtle gradients, seamless and non-distracting.
No text, no logos.

Product Mockup Placeholder

Completed prompt

Generate a clean, modern placeholder image for a product mockup used in a SaaS landing page.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Generic device silhouettes, abstract UI blocks, light background.
No text, no logos.

Dashboard / UI Scene

Completed prompt

Generate a clean, modern placeholder image for a dashboard preview used in a SaaS website.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Abstract UI panels, blurred interface elements, neutral colors.
No text, no logos.

Universal Safe Template (recommended default)

Use this when unsure:

Generate a clean, modern placeholder image for a [SECTION TYPE] used in a modern web application.
Style: minimal, professional, soft lighting.
Mood: neutral, modern, premium.
Abstract elements, balanced composition, light background.
No text, no logos.


---

### 3. Call Nano Banana Pro API

Use the **Gemini image preview model** with `IMAGE` response modality.

Recommended defaults:
- `imageSize`: `"1K"`
- `aspectRatio`:
  - `"16:9"` → hero sections
  - `"4:3"` → cards and feature images
  - `"1:1"` → avatars
- `personGeneration`: only enable if avatars are required

---

### 4. Example API call

```bash
#!/bin/bash
set -e -E

MODEL_ID="gemini-3-pro-image-preview"
GENERATE_CONTENT_API="streamGenerateContent"

cat << EOF > request.json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Generate a clean, modern placeholder image for a SaaS landing page hero section. Minimal design, abstract shapes, soft gradients, light background, premium feel. No text, no logos."
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "1K"
    }
  }
}
EOF

curl -X POST \
  -H "Content-Type: application/json" \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" \
  -d '@request.json'
