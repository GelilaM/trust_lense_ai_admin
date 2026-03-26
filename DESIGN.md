# Design System Strategy: The Precision Architect

## 1. Overview & Creative North Star
This design system is built on the philosophy of **"The Precision Architect."** In the world of enterprise fintech, clarity is the ultimate currency. However, "clear" does not mean "generic." While we draw inspiration from the structural rigor of Stripe and Plaid, we elevate the experience through high-end editorial layouts that favor tonal depth over traditional borders.

The "Precision Architect" avoids the "template" look by utilizing intentional asymmetry and a dramatic typographic scale. We treat data not as a chore to be read, but as a landscape to be navigated. By layering surfaces rather than boxing them in, we create a digital environment that feels authoritative, expansive, and premium.

## 2. Colors & Tonal Architecture
The palette is rooted in the authority of **Deep Navy (#0A2540)** and the technical energy of **Secondary Teal (#00BFA6)**. To achieve a signature look, we move beyond flat application.

### The "No-Line" Rule
**Explicit Instruction:** Sectioning via 1px solid borders is prohibited. 
Visual boundaries must be defined exclusively through background color shifts. For example, a sidebar using `surface_container_low` should sit adjacent to a main content area using `surface`. This creates a sophisticated, "app-like" feel that mimics high-end hardware interfaces.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. Use the surface-container tiers to define importance:
*   **Surface (Base):** Your primary canvas.
*   **Surface-Container-Low:** Use for secondary sidebars or utility panels.
*   **Surface-Container-Lowest:** Use for primary cards and content modules to create a "lifted" feel against the background.
*   **Surface-Container-Highest:** Use for subtle interaction states or persistent "active" indicators.

### Signature Textures & Glassmorphism
*   **The Gradient Soul:** For primary CTAs or data-heavy hero headers, use a subtle linear gradient from `primary` (#000F22) to `primary_container` (#0A2540) at a 135-degree angle. This adds "visual weight" that a flat hex code cannot achieve.
*   **Glass Elements:** For floating navigation or tooltips, apply `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 12px.

## 3. Typography
We use **Inter** as our typographic workhorse, but we deploy it with editorial intent.

*   **Display & Headline Scale:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) for data summaries and page titles. Headlines should have a letter-spacing of `-0.02em` to feel tight and custom.
*   **Body & Utility:** `body-md` (0.875rem) is our standard for readability. Maintain a generous line-height (1.6) to provide breathing room in data-dense environments.
*   **Labeling:** `label-md` and `label-sm` should always be in `on_surface_variant` or `primary_fixed_variant` to ensure they act as meta-data without competing with primary information.

## 4. Elevation & Depth
In this system, depth is a function of light and layering, not "box shadows."

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift without needing a shadow.

### Ambient Shadows
When a floating effect is required (e.g., a modal or a primary action card):
*   **Blur:** Use extra-diffused values (24px to 40px).
*   **Opacity:** Keep it between 4% and 8%.
*   **Tinting:** The shadow color should never be pure black. Use a tinted version of `primary` (#000F22) to mimic natural ambient light.

### The "Ghost Border" Fallback
If a border is absolutely necessary for accessibility (e.g., input fields), use a **Ghost Border**. This is the `outline_variant` token at 15% opacity. Never use 100% opaque, high-contrast borders.

## 5. Components

### Cards & Data Modules
*   **Structure:** No dividers. Use `2.5rem` (Spacing 10) of vertical white space to separate content blocks.
*   **Style:** `surface_container_lowest` with `md` (0.375rem) or `lg` (0.5rem) corner radius.

### Buttons
*   **Primary:** `primary_container` (#0A2540) fill with `on_primary` text. Use `md` (0.375rem) roundedness.
*   **Secondary/Tertiary:** Avoid borders. Use a subtle `surface_container_high` fill for secondary actions to maintain the "No-Line" rule.

### Data Tables (Signature Component)
*   **Header:** `label-md` in all caps with `0.05em` letter spacing for an architectural feel.
*   **Rows:** Remove all horizontal lines. Use a very subtle background shift (`surface_container_low`) on hover to indicate row focus.
*   **Status Badges:** Use `secondary_container` for positive signals. They should be pill-shaped (`full` roundedness) with `label-sm` bold text.

### Signal Chips
Chips should be used for AI-driven insights. Use the `secondary` (#00BFA6) color sparingly as a "glow" effect or a small leading icon to draw the eye without overwhelming the data.

### Progress Bars
The track should be `surface_container_highest` and the fill should be the `secondary` Teal. The transition between the two should be seamless—avoid heavy borders or high-contrast tracks.

## 6. Do's and Don'ts

### Do
*   **Do** use white space as a structural element. If an element feels cramped, increase the spacing scale rather than adding a border.
*   **Do** use `primary_container` for deep background sections to create high-contrast "moments" in the user journey.
*   **Do** align all data points to a strict 4px/8px grid to reinforce the "Precision" aspect of the brand.

### Don't
*   **Don't** use 1px solid dividers to separate list items. Use tonal shifts or whitespace.
*   **Don't** use pure black (#000000) for text. Use `on_surface` or `primary` for a softer, more professional contrast.
*   **Don't** use default Material shadows. Always use the Ambient Shadow formula (high blur, low opacity, navy tint).
*   **Don't** use multiple vibrant colors in one view. Let the Navy and Teal lead; use Success/Warning/Error colors only for critical status signals.