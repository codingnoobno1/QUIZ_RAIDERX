# 🌌 Extreme Cyber UI Specifications (Blazor Edition)

This document defines the high-fidelity UI specifications for the QUIZ RAIDER X mobile application, ensuring "Extreme Depth" in design and interaction.

## 🎨 Atomic Design Tokens

### Color Palette (The "Cyber" HSL System)
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| **Matrix Cyan** | `#00FFFF` | `180, 100%, 50%` | Primary highlights, functional links, "Success" states. |
| **Cyber Magenta** | `#FF1493` | `327, 100%, 54%` | Secondary highlights, "Action" states, accents. |
| **Void Black** | `#050505` | `0, 0%, 2%` | Main background layer. |
| **Surface Dark** | `#111111` | `0, 0%, 7%` | Component surfaces, card backgrounds. |
| **Glow Layer** | `rgba(0, 255, 255, 0.2)` | — | Subtle atmospheric lighting. |

### Typography
- **Headlines**: `'Space Grotesk'`, Variable Weight (300-900). 
    - *Logic*: All caps, letter-spacing: `8px`, glitch effect enabled.
- **Body**: `'Inter'`, Weight 400.
    - *Logic*: Line-height: `1.6`, anti-aliased.
- **System/Code**: `'Fira Code'` or `monospace`.
    - *Logic*: For progress bars, ID strings, and data fields.

## 🧱 Component Specs (Extreme Depth)

### 1. The Dynamic Glassmorphism System
**Specs**:
- **Background**: `rgba(255, 255, 255, 0.03)`
- **Backdrop Blur**: `15px` (Elevated from 12px for mobile depth)
- **Border**: `1px solid rgba(255, 255, 255, 0.1)`
- **The "Pulse" Logic**: On interaction, the border should transition to a `2px` neon gradient with a `box-shadow` spread of `20px`.

### 2. The 3D Rotating Cube (Blazor Hybrid Specs)
**Specs**:
- **Rotation Axis**: Y-axis primary, slight Z-axis tilt (`15deg`) for depth.
- **Reflection Layer**: Each face has a `::after` element with a linear gradient (white-to-transparent) to simulate light hitting the surface.
- **Edge Glow**: `box-shadow: inset 0 0 10px #FF1493`.

### 3. Navigation "Scanline" Interaction
**Specs**:
- Active nav items feature a horizontal scanline moving at `0.5s` intervals.
- **Logic**: A pseudo-element `::before` with `top: -100%` to `top: 100%` animation.

## ⚙️ Performance Guidelines
- **GPU Acceleration**: Use `transform: translate3d(0,0,0)` and `will-change: transform` for the cube and orb.
- **Blazor State**: Minimize `StateHasChanged()` calls by using CSS-only animations where possible.
