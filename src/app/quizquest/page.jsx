import QuizQuestPoster from './QuizQuestPoster';

/**
 * /quizquest — the poster.
 *
 * A server component so the page can carry its own metadata; everything that
 * ticks lives in the client component beside it.
 */
export const metadata = {
    title: 'Quiz QUEST — PIXEL',
    description: 'PIXEL Quiz QUEST. Rooms 519 and 510, reporting 10:00 AM, quiz begins 11:00 AM.',
};

export default function QuizQuestPage() {
    return <QuizQuestPoster />;
}
