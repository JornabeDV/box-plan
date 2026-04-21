# Design System Strategy: The Kinetic Grid

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Grid."** 

In the world of high-performance esports and elite fitness, movement is not just a result; it is the intent. This design system moves away from the static, "template-first" approach of modern SaaS apps and instead embraces a high-end editorial layout that feels architectural and alive. By utilizing **Space Grotesk** for high-impact headlines and **Inter** for precision data, we create a hierarchy that feels like a professional racing HUD or a premium fitness lookbook.

The aesthetic is defined by **intentional asymmetry**. We break the rigid, centered grid by using dramatic typography scales and overlapping elements to create "visual momentum." The design system leverages high-contrast tonal shifts and "Glassmorphism" to provide depth, ensuring that the interface feels like a sophisticated digital layer over the user’s physical performance.

## 2. Colors & Surface Architecture
This system utilizes a high-contrast palette to drive focus and energy.

*   **Primary (`#E6FF2B`):** The "Energy" token. Use this exclusively for high-priority actions, active states, and critical performance metrics. 
*   **Surface/Background (`#001115`):** The "Deep Canvas." This provides the dark, immersive void required for an esports aesthetic.

### The "No-Line" Rule
To achieve a bespoke, premium feel, designers are **strictly prohibited** from using 1px solid borders to define layout sections. Boundaries must be established through:
1.  **Background Color Shifts:** A section using `surface-container-low` placed against a `surface` background.
2.  **Vertical Whitespace:** Utilizing the spacing scale to create clear, breathable "zones" of content.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of "Smart Glass." 
*   **Base:** `surface`
*   **Sections:** `surface-container-low` (for large content areas).
*   **Cards:** `surface-container-high` or `surface-container-highest` for interactive elements.
By "nesting" these tiers (e.g., a `surface-container-highest` card inside a `surface-container-low` section), we create depth and importance without a single structural line.

### The "Glass & Gradient" Rule
For floating elements (modals, navigation bars), use semi-transparent surface colors with a `20px` to `40px` backdrop blur. To add "visual soul," use a subtle linear gradient on primary CTAs, transitioning from `primary` to `primary-container` at a 135-degree angle.

## 3. Typography
The typography is the engine of the brand identity. We pair a geometric, tech-forward sans-serif with a highly readable grotesque.

*   **Display & Headlines (Space Grotesk):** These should be treated as graphic elements. Use `display-lg` and `headline-lg` for large-scale motivation and key metrics. The slightly wider tracking and sharp terminals of Space Grotesk convey the "esports" precision.
*   **Body & Titles (Inter):** Used for all functional data, descriptions, and labels. Inter provides the neutral, authoritative voice required for complex fitness data.
*   **Intentional Contrast:** Always pair a large `headline-md` with a significantly smaller `label-md` to create an editorial feel that guides the eye instantly to the most important information.

## 4. Elevation & Tonal Layering
Traditional drop shadows are too "soft" for this aesthetic. We achieve lift through **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" container tokens. A card should feel like it is rising out of the background because it is a lighter tone (`surface-container-high`), not because it has a shadow.
*   **Ambient Shadows:** If a floating effect is required (e.g., a FAB or a floating navigation bar), use an extra-diffused shadow.
    *   *Blur:* 32px - 64px.
    *   *Opacity:* 8% - 12%.
    *   *Color:* Use a tinted version of `on-surface` (Teal-tinted) rather than pure black.
*   **The "Ghost Border":** Per the user's request for vibrant borders, borders are allowed **only** as accents on active states. Use the `primary` token at 100% opacity for a sharp "active" glow, or the `outline-variant` at 15% opacity for a subtle, sophisticated container definition.

## 5. Components

### Buttons
*   **Primary:** Solid `primary` fill with `on-primary` text. Use `rounded-md` (0.375rem) for a sharp, modern feel.
*   **Secondary:** Ghost style. `outline` stroke (at 20% opacity) with `primary` text.
*   **State:** On hover, apply a `primary-dim` glow effect using a subtle outer shadow.

### Cards & Data Displays
*   **Structure:** No divider lines. Separate "blocks" of info (e.g., Workout Name vs. Reps) using a shift from `surface-container-highest` to `surface-variant`.
*   **Visual Accents:** Inspired by `IMAGE_1`, use a 2px left-accent border in `primary` to denote the "Active" or "Current" workout block.

### Inputs & Selectors
*   **Text Fields:** Use `surface-variant` as the background fill. Use a "Ghost Border" of `outline-variant` that transitions to a `primary` 1px border only when focused.
*   **Selection Chips:** For "Level" or "Discipline" selection (as seen in `IMAGE_3`), use `surface-container-highest` for inactive and `primary` for active.

### Progress & Performance
*   **Data Displays:** Use `display-sm` for numbers. Pair with `label-sm` in `slate-grey` (#898A8D) for descriptors. High-contrast metrics should always be in the Primary neon green.

## 6. Do's and Don'ts

### Do
*   **DO** use extreme scale. Make your headlines huge and your labels tiny.
*   **DO** utilize the "No-Line" rule to keep the UI looking premium and custom.
*   **DO** use `primary` sparingly as an "energy hit." If everything is neon, nothing is important.
*   **DO** reference the structural tightness of `IMAGE_1` and `IMAGE_3`, where elements are grouped logically within high-contrast containers.

### Don't
*   **DON'T** use the `DEFAULT` or `sm` roundedness for everything. Mix `none` for a brutalist feel with `md` for interactive elements.
*   **DON'T** use pure black for cards; always use the `surface-container` tiers to maintain a sense of "tealy-charcoal" depth.
*   **DON'T** use 100% opaque slate grey for text. Use the `on-surface-variant` token to ensure the typography feels integrated into the dark background.
*   **DON'T** use standard "Drop Shadows." They muddy the clean, esports-inspired lines of the grid.