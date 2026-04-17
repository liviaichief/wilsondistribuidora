```markdown
# Design System Specification: The Primal Noir Boutique

## 1. Overview & Creative North Star: "The Culinary Alchemist"
This design system is built to evoke the sensory experience of a high-end steakhouse: the sear of the grill, the depth of aged oak, and the precision of a master chef’s blade. We move beyond generic dark mode by embracing **The Culinary Alchemist**—a North Star that prioritizes atmosphere over interface. 

The layout must feel "alive" through intentional asymmetry. We reject the rigid, centered grid in favor of editorial-inspired compositions where large-scale serif typography overlaps high-fidelity imagery, and glassmorphic layers suggest the smoke-filled air of an exclusive lounge. The goal is not just to show a menu, but to curate an appetite.

---

## 2. Colors: Depth & Fire
Our palette is rooted in the "low-and-slow" philosophy. We use dark neutrals to create a cavernous depth, punctuated by the "heat" of our primary actions.

### The Foundation
- **Surface (Base):** `#131313` (Deep Onyx)
- **Surface-Container-Lowest:** `#0E0E0E` (The "Charcoal" pit)
- **Surface-Container-Highest:** `#353534` (Smoked Oak)

### The Accents
- **Primary (`#FFB4A8` / Container `#D40000`):** Represents the "Perfect Sear." Use the vibrant red sparingly for high-intent actions (Reservations, Order Now).
- **Tertiary (`#FBBC00`):** The "Liquid Gold." Reserved for premium badges, dry-aged labels, and Michelin-star callouts.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined by background shifts. 
*   Place a `surface-container-low` card atop a `surface` background. 
*   Use `surface-container-highest` only for small, elevated interactive elements.
*   **The Signature Texture:** Apply a linear gradient from `primary` to `primary_container` (at a 45-degree angle) for hero CTAs to give them a "glowing ember" effect.

---

## 3. Typography: Strength & Modernity
We contrast the traditional weight of a steakhouse with the agility of a modern boutique.

*   **Headings (Noto Serif):** Robust and bold. These are your "Statement Pieces." Use `display-lg` (3.5rem) with tight letter-spacing for headers. Headlines should often be set in sentence case to maintain a sophisticated, editorial tone.
*   **Body (Manrope):** Clean, modern, and highly legible. Manrope’s geometric nature balances the serif's traditionalism.
*   **Hierarchy:** Use `title-lg` in Manrope for sub-headers to act as a bridge between the "old world" Serif and the "new world" Body text.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is not simulated with shadows; it is felt through light and transparency.

*   **The Layering Principle:** Treat the UI as stacked sheets of smoked glass. A modal shouldn't just "pop up"; it should be a `surface-container-high` layer with a `backdrop-blur` (20px to 40px) that allows the rich colors of food photography below to bleed through.
*   **The "Ghost Border":** If a separation is required for accessibility, use the `outline-variant` token (`#5E3F3A`) at **15% opacity**. This creates a "glint" on the edge of a container, mimicking light hitting the edge of a glass table.
*   **Ambient Shadows:** For floating elements, use an extra-diffused shadow: `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5)`. The shadow should feel like it's absorbing light, not casting a "drop" effect.

---

## 5. Components: The Boutique Toolkit

### Buttons
*   **Primary:** High-intensity `#D40000`. No border. Slight inner glow on hover to simulate heat.
*   **Secondary:** Glassmorphic. Semi-transparent `surface-container-highest` with a `backdrop-blur`.
*   **Tertiary:** Text-only in `tertiary_fixed_dim` (#FBBC00) for "Discover More" or "View Wine Pairings."

### Cards & Lists
*   **The "No Divider" Mandate:** Forbid horizontal lines between menu items. Instead, use the Spacing Scale (minimum 24px) or a subtle shift to `surface-container-low` for every second item to create a rhythmic, zebra-stripe flow without "cutting" the design.
*   **Glassmorphic Navigation:** The top navigation bar must use a `surface_variant` with 60% opacity and a high blur. It should feel like a floating fog over the content.

### Selection Chips
*   **Style:** Pill-shaped (`rounded-full`). 
*   **State:** Unselected chips use `surface-container-high`. Selected chips transition to `primary_container` (#D40000) with `on_primary_container` text.

### Interactive Inputs
*   **Fields:** Use `surface-container-lowest` as the fill. On focus, the bottom edge should glow with a 2px `tertiary` (#FBBC00) "Gold" line.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Intentional Asymmetry:** Offset text blocks from images to create an editorial feel.
*   **Embrace Large Margins:** High-end means having the luxury of "wasted" space. Let the typography breathe.
*   **Animate the Entry:** Use "smooth-and-slow" transitions (600ms+) for image reveals to mimic the slow-pour of a fine red wine.

### Don’t:
*   **Don't Use Pure White:** For text, use `on_surface` (#E5E2E1). Pure white (#FFFFFF) is too harsh for this "low-light" environment.
*   **Don't Use Standard Grids:** Avoid the "three-card row" layout common in templates. Try a staggered 2-1-2 grid to keep the user’s eye moving.
*   **Don't Use Sharp Corners:** Use the `md` (0.375rem) roundedness for a softened, premium touch that feels "finished" rather than "industrial."