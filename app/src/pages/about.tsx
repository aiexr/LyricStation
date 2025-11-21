import React from 'react';
import Footer from '../components/footer';
import SiteHeader from '../components/site-header';
const About: React.FC = () => {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <section>
          <p>
            LyricStation is an all-in-one lyric application that runs directly
            in the browser. Cookies are used to store editor keybinds, position
            profiles, and display settings. IndexedDB is used to store data
            locally via the library feature. No data leaves the browser, your
            files are processed locally.
          </p>
        </section>

        <section>
          <h2>Features</h2>
          <ul>
            <li>Create synced lyrics with an intuitive editor</li>
            <li>Show an aesthetic lyric display</li>
            <li>Record the lyric display</li>
          </ul>
        </section>
        <section>
          <h2>Credits</h2>
          <p>
            This project could not have been completed without{' '}
            <a href="https://github.com/Steve-xmh/applemusic-like-lyrics">
              applemusic-like-lyrics
            </a>{' '}
            by Steve-xmh.
          </p>
          <p>
            Source code is released under the AGPL-3.0 license. Author:{' '}
            <a href="https://github.com/aiexr">aiexr</a>.
          </p>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default About;
