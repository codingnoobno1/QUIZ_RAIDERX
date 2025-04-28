'use client';

import { useSearchParams } from 'next/navigation'; // To get the section from the URL params
import QuizSection from './quiz/QuizSection';
import CodeEditorSection from './code/CodeEditorSection';
import ProfileSection from './profile/ProfileSection';
import ProjectsSection from './projects/ProjectsSection';
import SolutionsSection from './solutions/SolutionsSection';
import PageTitle from './ui/PageTitle';

export default function MainContent() {
  const searchParams = useSearchParams(); 
  const section = searchParams.get('section'); // Get 'section' from URL query params

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
