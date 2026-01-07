# .NET MAUI Blazor Hybrid Migration Guide

This project folder contains the foundation for migrating the **QUIZ RAIDER X** UI to a mobile application using **.NET MAUI Blazor Hybrid**.

## 🏗️ Folder Structure

- `/Components`: Razor components (.razor). Each component mirrors the logic and structure of the React components.
- `/wwwroot/css`: Global and component-specific styles.
- `/wwwroot/js`: JavaScript interop for complex interactions.
- `/Shared`: Layouts and navigation menus.

## 🚀 Key Differences & Tips

1. **Routing**: Instead of Next.js App Router, use `@page "/route"` at the top of Razor components or `NavigationManager`.
2. **State Management**: Use C# Classes/Signals or `CascadingValue` instead of React Context.
3. **Animations**: CSS animations work identically. Pure CSS animations are preferred for performance on mobile.
4. **Icons**: You can use `Radzen` or `MudBlazor` icons, or continue using SVG/Font-icons via standard HTML.

## 🎨 Extreme Component Portfolio

I have built the following high-fidelity components with "Extreme Depth":

- **`ComponentCatalog.md`**: A master reference of 50+ components for the full app.
- **`BlazorDashboard.razor`**: A complete dashboard reference page combining 10+ custom components.
- **`CyberGauge.razor`**: SVG-based animated metric gauge.
- **`MatrixTerminal.razor`**: Real-time simulated system log terminal.
- **`RotatingCube.razor`**: Enhanced with lighting reflections, dual-axis rotation, and neon-pulse borders.
- **`GlassCard.razor`**: Upgraded with holographic shines, scrolling scanlines, and animated cyber-corners.
- **`CyberGrid.razor`**: A moving 3D matrix background for that immersive "Digital Frontier" feel.
- **`CyberHero.razor`**: A template that combines all extreme elements into a stunning landing section.

## 📐 Design System Specs
Detailed specifications for colors, typography, and animation logic can be found in `CyberDesignSystem.md`.

## 📦 Suggested UI Libraries

### 1. **[Microsoft Fluent UI for Blazor](https://www.fluentui-blazor.net/)**
- **Purpose**: Official Microsoft library for a native, accessible, and high-performance design system. Perfect for consistent buttons, inputs, and layouts.
- **Integration**: `dotnet add package Microsoft.FluentUI.AspNetCore.Components`
- **Why**: Ensures your app feels professional and follows platform standards while being extremely customizable.

### 2. **[SkiaSharp](https://github.com/mono/SkiaSharp)**
- **Purpose**: High-performance 2D graphics engine. Use this for the "Extreme Depth" animations (like the Orb or custom charts) when you need hardware acceleration beyond CSS.
- **Integration**: `dotnet add package SkiaSharp.Views.Blazor` (for Hybrid apps, use `SkiaSharp.Views.Maui.Controls`).
- **Use Case**: Drawing complex procedural backgrounds, smooth energy orbs, and real-time data visualizations with absolute precision.

## 🎨 Asset Mapping
Copy your CSS glow and glassmorphism styles from `CommonUI.jsx` and `index.css` directly into `wwwroot/css/app.css`. Use CSS variables for the HSL colors as defined in `CyberDesignSystem.md`.
