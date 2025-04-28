'use client';

import QuizSection from './quiz/QuizSection';
import CodeEditorSection from './code/CodeEditorSection';
import ProfileSection from './profile/ProfileSection';
import ProjectsSection from './project/ProjectsSection';
import SolutionsSection from './solutions/SolutionsSection';
import PageTitle from './ui/PageTitle';

export default function MainContent({ section }) {
  return (
    <>
      {section === 'dashboard' && <PageTitle>Welcome to Coding Club</PageTitle>}
      {section === 'quiz' && <QuizSection />}
      {section === 'code' && <CodeEditorSection />}
      {section === 'profile' && <ProfileSection />}
      {section === 'projects' && <ProjectsSection />}
      {section === 'solutions' && <SolutionsSection />}
    </>
  );
}
