import useCookieState from './use-cookie-state';
import type { PositionProfile } from '../modals/manage-profiles-modal';

const COOKIE_KEY = 'position-profiles';

export default function useProfiles() {
  return useCookieState<PositionProfile[]>(COOKIE_KEY, []);
}
