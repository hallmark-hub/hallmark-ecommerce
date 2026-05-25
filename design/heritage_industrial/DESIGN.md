---
name: Heritage Industrial
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#404940'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1b6c3b'
  primary: '#005127'
  on-primary: '#ffffff'
  primary-container: '#1a6b3a'
  on-primary-container: '#99e9ab'
  inverse-primary: '#89d89c'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#5c4200'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a5800'
  on-tertiary-container: '#ffd17a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a4f4b6'
  primary-fixed-dim: '#89d89c'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#f7bd44'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.2'
  h2:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  price-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1'
  h1-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
  h2-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is built for an enterprise hospitality supplier based in Accra, blending industrial reliability with the warmth of West African hospitality. The brand personality is authoritative yet welcoming—positioning the product as a premium partner for hotels, restaurants, and industrial kitchens.

The visual style follows a **Corporate / Modern** approach with subtle **Tactile** influences. It prioritizes clarity and high-quality imagery of industrial equipment, using a sophisticated color palette that evokes growth, value, and professional excellence. The emotional response should be one of absolute trust and "Premium Ghanaian Service."

## Colors

The palette is rooted in the lush landscapes and mineral wealth of Ghana. 

- **Primary (Forest Green):** Used for main actions, navigation headers, and primary branding elements. It represents stability and the hospitality industry's growth.
- **Secondary (White):** Provides clean, breathable spaces for high-density product catalogs.
- **Accent (Gold/Amber):** Reserved for highlights, special offers, and primary "Call to Action" buttons to signify premium quality and value.
- **Background (Light Green):** A soft, proprietary tint used to reduce eye strain in professional procurement environments, providing a unique brand identifier compared to generic white backgrounds.
- **Surface (Neutral/Border):** A cool grey (#E5E7EB) used for structural definition.

## Typography

The design system utilizes **Inter** for its exceptional legibility in technical and industrial contexts. The typographic hierarchy is structured to handle complex product specifications and pricing in Ghana Cedis (GHS).

- **Headlines:** Medium weight (500) ensures a professional, non-aggressive tone while maintaining clear information hierarchy.
- **Currency Display:** Prices should use a slightly heavier weight than body text to highlight the value proposition.
- **Labels:** Uppercase styling with slight tracking for technical specifications and SKU numbers.
- **Mobile Scaling:** Headings scale down on mobile to prevent awkward line breaks in long product names.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for desktop to maintain an organized, catalog-like structure, and a **Fluid Grid** for mobile.

- **Desktop (1280px+):** 12-column grid with 24px gutters. Content is centered with generous side margins to evoke a premium editorial feel.
- **Tablet (768px - 1279px):** 8-column grid with 24px gutters and 24px side margins.
- **Mobile (< 767px):** 4-column grid with 16px gutters and 16px side margins.
- **Spacing Logic:** All spacing is derived from an 8px base unit to ensure visual mathematical harmony across the interface.

## Elevation & Depth

To reflect the "Enterprise" nature of the business, depth is achieved through **Tonal Layers** and **Low-contrast outlines** rather than heavy shadows.

- **Level 0 (Background):** Light Green (#EAF3DE) background.
- **Level 1 (Cards/Containers):** White (#FFFFFF) surfaces with a 1px #E5E7EB border. This creates a crisp, clean environment for product photos.
- **Level 2 (Interactive):** Subtle, tight shadows (0px 2px 4px rgba(0,0,0,0.05)) are used only for hovered cards or active dropdowns to indicate interactivity.
- **Level 3 (Modals/Overlays):** Medium diffusion shadows to separate critical decision points (e.g., checkout or quote requests) from the background.

## Shapes

The shape language balances industrial precision with hospitality warmth.

- **Standard Elements:** Buttons and input fields use a consistent **8px** radius, providing a professional and modern appearance.
- **Structural Elements:** Product cards and main containers use a larger **12px** radius to soften the high-density information layout.
- **Iconography:** Icons should be thick-stroked (2px) with slightly rounded terminals to match the font and corner radii.

## Components

### Buttons
- **Primary:** Forest Green (#1A6B3A) background, white text. 8px border radius.
- **Secondary (CTA):** Gold/Amber (#C9951A) background. Used specifically for "Request Quote" or "Buy Now".
- **Ghost:** 1px #E5E7EB border with Forest Green text. Used for secondary navigation like "View Specs".

### Cards
- **Product Cards:** White background, 12px border radius, 1px #E5E7EB border. Images should have a subtle 4px internal margin from the border to feel "framed".

### Input Fields
- **Search & Forms:** 8px border radius, 1px #E5E7EB border. On focus, the border changes to Forest Green with a 2px soft outer glow in the same color.

### Chips & Status
- **Availability Labels:** Small, pill-shaped indicators. "In Stock" uses a light green tint with dark green text. "Out of Stock" uses a light grey tint.

### Lists & Tables
- **Specification Tables:** Alternate row shading using a 5% opacity of the Forest Green to maintain legibility in long data sets.

### Localized Elements
- **Currency Indicator:** The "GH₵" symbol should be consistently placed to the left of the numerical value, using the Price-lg typography style for prominence.