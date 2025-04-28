@echo off
REM Root components
type nul > Sidebar.jsx
type nul > SidebarLink.jsx
type nul > MainContent.jsx

REM Layouts
mkdir layouts
type nul > layouts\MainLayout.jsx

REM UI
mkdir ui
type nul > ui\PageTitle.jsx

REM Quiz
mkdir quiz
type nul > quiz\QuizSection.jsx
type nul > quiz\QuizQuestion.jsx

REM Code
mkdir code
type nul > code\CodeEditorSection.jsx

REM Profile
mkdir profile
type nul > profile\ProfileSection.jsx

REM Projects
mkdir projects
type nul > projects\ProjectsSection.jsx

REM Solutions
mkdir solutions
type nul > solutions\SolutionsSection.jsx

echo All component files and folders created successfully.
