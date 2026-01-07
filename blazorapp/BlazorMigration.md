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

## 📦 Suggested UI Libraries
- **MudBlazor**: (https://mudblazor.com/) Best for highly customizable Material Design.
- **Radzen.Blazor**: Good for tables and data-heavy dashboards.

## 🎨 Asset Mapping
Copy your CSS glow and glassmorphism styles from `CommonUI.jsx` and `index.css` directly into `wwwroot/css/app.css`.
