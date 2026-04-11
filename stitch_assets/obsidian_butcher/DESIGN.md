# Design System Document: High-End Editorial Dark Mode

## 1. Overview & Creative North Star
**The Creative North Star: "The Obsidian Sommelier"**

This design system is not merely a dark mode; it is a digital translation of a high-end, boutique steakhouse experience. It avoids the "flatness" of standard SaaS products by embracing a moody, atmospheric aesthetic that celebrates legacy and artisanal craft. 

To break the "template" look, designers must lean into **intentional asymmetry** and **tonal depth**. The layout should feel like a premium editorial magazine—wide margins, generous whitespace (or "darkspace"), and a dramatic typographic scale. By layering various shades of obsidian and charcoal against the signature burgundy, we create a UI that feels carved, not just drawn.

---

## 2. Colors
The palette is rooted in deep, light-absorbing neutrals punctuated by a rich, blood-red burgundy.

*   **Primary (#ffb3b5 / #800020):** Used for critical calls to action. The `primary_container` (#800020) is our brand's "soul"—the signature burgundy that should feel authoritative and rare.
*   **Surface Hierarchy:** We utilize the obsidian scale to define spatial relationships.
    *   `surface_container_lowest` (#0e0e0e): Backgrounds for hero sections or deep immersive areas.
    *   `surface` (#131313): The standard canvas.
    *   `surface_container_high` (#2a2a2a): For elevated elements like cards or navigation bars.
*   **The "No-Line" Rule:** Explicitly prohibit the use of 1px solid borders to section off content. Boundaries must be defined by shifts in background color (e.g., a `surface_container_low` section transitioning into `surface_container_highest`).
*   **The Glass & Gradient Rule:** For floating modals or navigation overlays, use Glassmorphism. Apply `surface_container` with a 70-80% opacity and a high `backdrop-blur` (20px+). Main buttons should utilize a subtle radial gradient from `primary` to `primary_container` to provide a three-dimensional, "lit-from-within" quality.

---

## 3. Typography
Our typography is a dialogue between heritage and modernity.

*   **Display & Headlines (Newsreader):** A classic serif that carries the weight of history. Use `display-lg` (3.5rem) with tight letter-spacing for high-impact brand moments. This font conveys the "Boutique Butcher" authority.
*   **Title & Body (Work Sans):** A clean, modern sans-serif that ensures high legibility against dark backgrounds. Use `on_surface` (#e5e2e1) to ensure a soft, premium contrast that prevents eye strain.
*   **Editorial Intent:** Use intentional size contrast. A small `label-md` in all-caps placed next to a massive `display-md` headline creates the "High-End Editorial" rhythm required for this brand.

---

## 4. Elevation & Depth
In this design system, light does not hit the UI; it emerges from it.

*   **The Layering Principle:** Depth is achieved by stacking surface tiers. To make a card feel "raised," place a `surface_container_high` card on top of a `surface_dim` background. 
*   **Ambient Shadows:** Traditional black shadows are forbidden. Use extra-diffused shadows (Blur: 40px+) with low opacity (4%-8%). The shadow color should be a deep burgundy-tinted charcoal to mimic the way light behaves in a dimly lit, high-end environment.
*   **The "Ghost Border" Fallback:** If a container lacks sufficient contrast, use a "Ghost Border." This is an `outline_variant` token set to 15% opacity. It should feel like a faint glint on the edge of a knife, not a structural line.
*   **Glassmorphism:** Use semi-transparent layers for navigation to allow "ghosts" of the content to bleed through, softening the interface and making it feel integrated.

---

## 5. Components

### Buttons
*   **Primary:** Filled with `primary_container` (#800020). Typography should be `on_primary_container`. Use the `md` (0.375rem) roundedness for a look that is sophisticated but not "bubbly."
*   **Tertiary:** No background. Use Newsreader Italics for a "signature" look, appearing only as text with a subtle `primary` underline on hover.

### Cards & Lists
*   **Card Styling:** Forbid dividers. Use `surface_container_lowest` for the card body against a `surface` background. Increase vertical padding (e.g., 48px) to let product photography breathe.
*   **Lists:** Separate items with a subtle background shift (from `surface` to `surface_container_low`) rather than lines.

### Input Fields
*   **Styling:** Fields should be "Bottom-Line" only or fully Ghost-Bordered. The background should be `surface_container_highest` to create an inset, tactile feel.
*   **Focus State:** The border should transition to a subtle `primary` glow (using the Ambient Shadow rule).

### Additional Boutique Components
*   **The Heritage Badge:** A custom component using a `full` roundedness scale, utilizing `secondary_container` with `Newsreader` text to highlight "Since 2010" or "Organic" certifications.
*   **Tonal Overlays:** Large-scale imagery should always have a `surface_dim` gradient overlay to ensure `on_surface` text remains legible and the "moody" vibe is maintained.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. Place a large Newsreader headline off-center to create a bespoke, custom-built feel.
*   **Do** use `on_surface_variant` (#e0bfbf) for secondary text to maintain the warm, meaty undertone of the brand.
*   **Do** prioritize high-quality, low-key photography of meats and textures that blend into the #121212 backgrounds.

### Don't:
*   **Don't** use pure #000000 or pure #FFFFFF. It breaks the sophisticated tonal range of the "Obsidian" palette.
*   **Don't** use standard "Material Design" shadows. They look "cheap" and "app-like" in a boutique context.
*   **Don't** use bright, saturated colors for anything other than `primary` actions. If everything is loud, nothing is premium.
*   **Don't** use a 1px border to separate the header from the body. Use a `surface` to `surface_container_high` transition instead.