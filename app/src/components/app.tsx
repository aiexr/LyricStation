import InputModal from '../modals/input-modal';
import '../styles/app.scss';
import MetadataForm from './metadata-form';
import RepositionPage from '../pages/reposition-page';
import LyricDisplayPage from '../pages/lyric-display-page';
import Footer from './footer';
import SiteHeader from './site-header';
import HomePromptModal from '../modals/home-prompt-modal';
import LibraryPage from '../pages/library-page';
import EditorPage from '../pages/editor-page';
import useAppController from '../hooks/use-app-controller';
function App() {
  const app = useAppController();
  const { step, initialTab, changeStep } = app;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {step !== 'display' && <SiteHeader onHomeClick={app.handleHomeClick} />}
        {step === 'editor' && initialTab && (
          <button
            onClick={() => changeStep('library')}
            style={{ marginLeft: '1rem' }}
          >
            Library
          </button>
        )}
      </div>
      {step === 'metadata' ? (
        <MetadataForm
          onBack={() => changeStep('editor')}
          onNext={(data) => {
            app.setAlbumArt(data.albumArtUrl);
            app.setSongName(data.songName);
            app.setArtistName(data.artistName);
            app.setAlbumName(data.albumName);
            app.setEditing(false);
            changeStep('reposition');
          }}
          initialAlbumArtUrl={app.albumArt}
          initialAlbumArtFileName={app.albumArtFileName}
          onAlbumArtFileNameChange={app.setAlbumArtFileName}
          initialSongName={app.songName}
          initialArtistName={app.artistName}
          initialAlbumName={app.albumName}
        />
      ) : step === 'reposition' ? (
        <RepositionPage
          lines={app.lyrics}
          translation={app.translationLines ?? undefined}
          albumArtUrl={app.albumArt}
          songName={app.songName}
          artistName={app.artistName}
          albumName={app.albumName}
          audioUrl={app.audioUrl}
          customBg={app.customBg}
          onCustomBgChange={app.setCustomBg}
          onBack={() => changeStep('metadata')}
          onSave={(settings) => {
            void app.handleSaveProject(settings);
          }}
          onNext={(settings) => {
            app.setDisplaySettings(settings);
            changeStep('display');
          }}
          settings={app.displaySettings}
        />
      ) : step === 'display' ? (
        <LyricDisplayPage
          lines={app.lyrics}
          translation={app.translationLines ?? undefined}
          albumArtUrl={app.albumArt}
          songName={app.songName}
          artistName={app.artistName}
          albumName={app.albumName}
          audioUrl={app.audioUrl}
          customBg={app.customBg}
          settings={app.displaySettings}
          onBack={() => changeStep('reposition')}
        />
      ) : step === 'library' ? (
        <LibraryPage
          projects={app.projects}
          onLoad={(p) => {
            app.handleLoadProject(p);
            changeStep('editor');
          }}
          onQuickView={(p) => {
            app.handleLoadProject(p);
            changeStep('display');
          }}
          onDelete={(name) =>
            app.setProjects((prev) => prev.filter((p) => p.name !== name))
          }
          onBack={() => changeStep('editor')}
        />
      ) : (
        <EditorPage {...app} changeStep={changeStep} />
      )}
      {step !== 'display' && <Footer />}
      <HomePromptModal
        visible={app.showHomePrompt}
        onCancel={app.handleHomeCancel}
        onReset={app.handleHomeReset}
      />
      <InputModal
        visible={app.promptVisible}
        title={app.promptTitle}
        initialValue={app.promptInitial}
        onCancel={app.handlePromptCancel}
        onSubmit={app.handlePromptSubmit}
      />
    </>
  );
}

export default App;
