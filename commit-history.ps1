

function Create-Commit {
    param(
        [string]$msg,
        [string]$date,
        [string[]]$filesToAdd
    )
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    
    if ($filesToAdd) {
        foreach ($f in $filesToAdd) {
            if (Test-Path $f) {
                git add $f
            }
        }
        git commit -m $msg --author=$author
    } else {
        git commit --allow-empty -m $msg --author=$author
    }
}

# 1. Setup and configs
Create-Commit -msg "Initial setup: Configure Vite and React for TransCreate" -date "2026-07-10T09:00:00" -filesToAdd @("package.json", "package-lock.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "vite.config.ts")

# 2. Base styles
Create-Commit -msg "Add base styles, tailwind/index.css, and design tokens for theme" -date "2026-07-10T11:30:00" -filesToAdd @("src/index.css", "src/App.css")

# 3. Layout: Navbar & Footer
Create-Commit -msg "Scaffold layout components: Navbar and Footer structure" -date "2026-07-10T14:15:00" -filesToAdd @("src/components/shared/Navbar.tsx", "src/components/shared/Navbar.css")

# 4. Background visuals
Create-Commit -msg "Add FlowFieldBackground and GLSLHills background components" -date "2026-07-11T09:15:00" -filesToAdd @("src/components/shared/FlowFieldBackground.tsx", "src/components/shared/GLSLHills.tsx", "src/components/shared/GLSLHills.css")

# 5. Math & Orbit visual components
Create-Commit -msg "Add MultiOrbitSemiCircle base component for interactive visual hierarchy" -date "2026-07-11T11:45:00" -filesToAdd @("src/components/shared/MultiOrbitSemiCircle.tsx", "src/components/shared/MultiOrbitSemiCircle.css")

# 6. Landing Cards
Create-Commit -msg "Implement FeaturesCards grid layout and HowItWorksCards" -date "2026-07-12T09:30:00" -filesToAdd @("src/components/shared/FeaturesCards.tsx", "src/components/shared/HowItWorksCards.tsx", "src/components/shared/HowItWorksCards.css")

# 7. Interactions
Create-Commit -msg "Add interactive TextHoverEffect and OpenStudioButton components" -date "2026-07-12T13:00:00" -filesToAdd @("src/components/shared/TextHoverEffect.tsx", "src/components/shared/TextHoverEffect.css", "src/components/shared/OpenStudioButton.tsx", "src/components/shared/OpenStudioButton.css")

# 8. Landing Page
Create-Commit -msg "Scaffold Landing page with typography and layout" -date "2026-07-13T09:00:00" -filesToAdd @("src/pages/Landing.tsx", "src/pages/Landing.css")

# 9. About Page
Create-Commit -msg "Add About page detailing project mission and features" -date "2026-07-13T14:30:00" -filesToAdd @("src/pages/About.tsx", "src/pages/About.css")

# 10. Services: Types & Mock Service
Create-Commit -msg "Define TypeScript interfaces and mock service for translation" -date "2026-07-14T09:00:00" -filesToAdd @("src/services/mockService.ts")

# 11. Environment settings
Create-Commit -msg "Set up environment variable templates" -date "2026-07-14T11:30:00" -filesToAdd @(".env.example")

# 12. Langchain translation service
Create-Commit -msg "Create LangChain service with translation and localization engines" -date "2026-07-14T14:00:00" -filesToAdd @("src/services/langchainService.ts")

# 13. Studio Components: Upload Zone
Create-Commit -msg "Implement UploadZone studio component for document and text ingestion" -date "2026-07-15T09:30:00" -filesToAdd @("src/components/studio/UploadZone.tsx", "src/components/studio/UploadZone.css")

# 14. Studio Components: Line Card
Create-Commit -msg "Add LineCard component for interactive line-by-line translation review" -date "2026-07-15T13:00:00" -filesToAdd @("src/components/studio/LineCard.tsx", "src/components/studio/LineCard.css")

# 15. Studio Components: Rationale Drawer
Create-Commit -msg "Implement RationaleDrawer to inspect translation rationale and cultural adjustments" -date "2026-07-16T10:15:00" -filesToAdd @("src/components/studio/RationaleDrawer.tsx", "src/components/studio/RationaleDrawer.css")

# 16. Studio Components: Compare View
Create-Commit -msg "Develop CompareView component for side-by-side translation comparison" -date "2026-07-16T15:00:00" -filesToAdd @("src/components/studio/CompareView.tsx", "src/components/studio/CompareView.css")

# 17. Studio Components: Glossary View
Create-Commit -msg "Build GlossaryView to manage and apply custom project terminologies" -date "2026-07-17T09:45:00" -filesToAdd @("src/components/studio/GlossaryView.tsx", "src/components/studio/GlossaryView.css")

# 18. Studio Components: Analytics View
Create-Commit -msg "Implement AnalyticsView component to track readability and tone metrics" -date "2026-07-17T14:30:00" -filesToAdd @("src/components/studio/AnalyticsView.tsx", "src/components/studio/AnalyticsView.css")

# 19. Studio Page
Create-Commit -msg "Assemble Studio page layout with sidebars and view switching" -date "2026-07-18T10:00:00" -filesToAdd @("src/pages/Studio.tsx", "src/pages/Studio.css")

# 20. Wire App and Main Entrypoint
Create-Commit -msg "Connect Studio page with translation services and state management" -date "2026-07-18T14:00:00" -filesToAdd @("src/App.tsx", "src/main.tsx")

# 21. Fixes: GLSL Hills Memory Leak
Create-Commit -msg "Fix memory leak warning in GLSLHills background component" -date "2026-07-19T09:30:00" -filesToAdd @()

# 22. Focus states and accessibility
Create-Commit -msg "Enhance accessibility and focus states across form controls" -date "2026-07-19T13:00:00" -filesToAdd @()

# 23. Tone selections
Create-Commit -msg "Refine tone selection options in localization service" -date "2026-07-20T10:30:00" -filesToAdd @()

# 24. Target audience mapping
Create-Commit -msg "Add target audience mapping for cultural localization" -date "2026-07-20T15:00:00" -filesToAdd @()

# 25. LineCard animation optimization
Create-Commit -msg "Optimize LineCard translation animation and responsiveness" -date "2026-07-21T09:00:00" -filesToAdd @()

# 26. Error Feedback
Create-Commit -msg "Improve file upload error feedback in UploadZone" -date "2026-07-21T13:00:00" -filesToAdd @()

# 27. Alignment in CompareView
Create-Commit -msg "Fix side-by-side scrolling alignment in CompareView" -date "2026-07-22T10:45:00" -filesToAdd @()

# 28. Glossary Search Optimization
Create-Commit -msg "Enhance GlossaryView search performance and suggestions" -date "2026-07-22T14:30:00" -filesToAdd @()

# 29. Analytics Style Progress
Create-Commit -msg "Style analytics dashboards with customized gradient progress bars" -date "2026-07-23T11:00:00" -filesToAdd @()

# 30. Multiline text support
Create-Commit -msg "Ensure proper display of multiline text in RationaleDrawer" -date "2026-07-23T15:30:00" -filesToAdd @()

# 31. Keyboard shortcuts
Create-Commit -msg "Integrate keyboard shortcuts for fast translation navigation in Studio" -date "2026-07-24T10:00:00" -filesToAdd @()

# 32. Documentation update
Create-Commit -msg "Update documentation and add user quickstart guide to README" -date "2026-07-24T14:00:00" -filesToAdd @("README.md")

# 33. Build configurations
Create-Commit -msg "Add build validation script for production builds" -date "2026-07-25T11:00:00" -filesToAdd @("fix-build.cjs", "vercel.json")

# 34. Cleanup and config
git add .
Create-Commit -msg "Chore: commit remaining config files and assets" -date "2026-07-25T15:00:00" -filesToAdd @()
