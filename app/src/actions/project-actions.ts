import { urlToDataUrl, dataUrlToBlob } from '../utils/project-utils';
import type { LrcLine } from '../utils/parse-lrc';
import type { DisplaySettings } from '../types/display-settings';
import type { ProjectSnapshot, ProjectData } from '../hooks/use-library';
import type { PositionProfile } from '../modals/manage-profiles-modal';
import type React from 'react';

export interface SaveProjectArgs {
  lyrics: LrcLine[];
  translationLines: string[] | null;
  audioUrl: string | null;
  audioFileName: string | null;
  albumArt: string | null;
  albumArtFileName: string | null;
  songName: string;
  artistName: string;
  albumName: string;
  customBg: string | null;
  displaySettings: DisplaySettings | undefined;
  lrcFileName: string;
  profiles: PositionProfile[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectSnapshot[]>>;
  setVersion: React.Dispatch<React.SetStateAction<number>>;
}

export async function saveProject(
  args: SaveProjectArgs,
  settingsOverride?: DisplaySettings,
): Promise<void> {
  const defaultName = `${new Date().toLocaleString()}${args.songName ? ` ${args.songName}` : ''}`;
  const name = window.prompt('Project name', defaultName);
  if (!name) return;
  const audioData = args.audioUrl ? await urlToDataUrl(args.audioUrl) : null;
  const snapshot: ProjectData = {
    lyrics: args.lyrics,
    translationLines: args.translationLines,
    audioData,
    audioFileName: args.audioFileName,
    albumArt: args.albumArt,
    albumArtFileName: args.albumArtFileName,
    songName: args.songName,
    artistName: args.artistName,
    albumName: args.albumName,
    customBg: args.customBg,
    displaySettings: settingsOverride ?? args.displaySettings,
    lrcFileName: args.lrcFileName,
    profiles: args.profiles,
  };
  args.setProjects((prev) => [
    ...prev.filter((p) => p.name !== name),
    { name, data: snapshot },
  ]);
  args.setVersion((v) => v + 1);
}

export interface LoadProjectArgs {
  snapshot: ProjectSnapshot;
  setLyrics: (lines: LrcLine[]) => void;
  setLyricsInitialized: (value: boolean) => void;
  setLyricsInputChosen: (value: boolean) => void;
  setEditing: (value: boolean) => void;
  setTranslationLines: (lines: string[] | null) => void;
  setTranslation: (value: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  setAudioFileName: (name: string | null) => void;
  setAlbumArt: (url: string | null) => void;
  setAlbumArtFileName: (name: string | null) => void;
  setSongName: (name: string) => void;
  setArtistName: (name: string) => void;
  setAlbumName: (name: string) => void;
  setCustomBg: (url: string | null) => void;
  setDisplaySettings: (settings: DisplaySettings | undefined) => void;
  setLrcFileName: (name: string) => void;
  setProfiles: (profiles: PositionProfile[]) => void;
  setVersion: React.Dispatch<React.SetStateAction<number>>;
}

export function loadProject(args: LoadProjectArgs): void {
  const data: ProjectData = args.snapshot.data;
  args.setLyrics(data.lyrics || []);
  args.setLyricsInitialized(true);
  args.setLyricsInputChosen(true);
  args.setEditing(false);
  args.setTranslationLines(data.translationLines || null);
  args.setTranslation(!!data.translationLines);
  if (data.audioData) {
    const blob = dataUrlToBlob(data.audioData);
    const url = URL.createObjectURL(blob);
    args.setAudioUrl(url);
  } else {
    args.setAudioUrl(null);
  }
  args.setAudioFileName(data.audioFileName || null);
  args.setAlbumArt(data.albumArt || null);
  args.setAlbumArtFileName(data.albumArtFileName || null);
  args.setSongName(data.songName || '');
  args.setArtistName(data.artistName || '');
  args.setAlbumName(data.albumName || '');
  args.setCustomBg(data.customBg || null);
  args.setDisplaySettings(data.displaySettings);
  args.setLrcFileName(data.lrcFileName || 'lyrics.lrc');
  if (data.profiles) args.setProfiles(data.profiles);
  args.setVersion((v) => v + 1);
}
