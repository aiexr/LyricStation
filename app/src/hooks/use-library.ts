import useIndexedDbState from './use-indexed-db-state';
import type { LrcLine } from '../utils/parse-lrc';
import type { DisplaySettings } from '../types/display-settings';
import type { PositionProfile } from '../modals/manage-profiles-modal';

export interface ProjectData {
  lyrics: LrcLine[];
  translationLines: string[] | null;
  audioData: string | null;
  audioFileName: string | null;
  albumArt: string | null;
  albumArtFileName: string | null;
  songName: string;
  artistName: string;
  albumName: string;
  customBg: string | null;
  displaySettings?: DisplaySettings;
  lrcFileName: string;
  profiles: PositionProfile[];
}

export interface ProjectSnapshot {
  name: string;
  data: ProjectData;
}

export default function useLibrary() {
  return useIndexedDbState<ProjectSnapshot[]>('project-library', []);
}
