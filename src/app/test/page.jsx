import Nav from './Nav';
import Sample from './Sample';
import VideoPlayer from './VideoPlayer';

export default function HomePage() {
  return (
    <>
      <Nav />

   

      <div style={{ backgroundColor: '#000', minHeight: '100vh' }}>
        <VideoPlayer />
      </div>
    </>
  );
}
