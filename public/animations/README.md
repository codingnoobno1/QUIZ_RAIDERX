# Lottie Animations Directory

This directory contains Lottie animation JSON files used throughout the application.

## How to Add Animations

### Method 1: Download from LottieFiles
1. Visit [LottieFiles.com](https://lottiefiles.com/)
2. Find an animation you like
3. Click "Download" → "Lottie JSON"
4. Save the file in this directory (e.g., `research.json`)
5. Use it in your component: `<LottieWrapper animationData="/animations/research.json" />`

### Method 2: Use from External URL (Not Recommended)
External URLs may fail due to CORS or network issues. If you must use them:
```jsx
<LottieWrapper animationData="https://example.com/animation.json" />
```

### Method 3: Import Directly (Best for Performance)
```jsx
import animationData from '@/public/animations/research.json';
<LottieWrapper animationData={animationData} />
```

## Current Animations
- (Add your animations here as you download them)

## Suggested Free Animations for Research Section
- Research/Science themed animations
- Brain/Neural network animations
- Data visualization animations
- Laboratory/experiment animations
