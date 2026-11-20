import { usePlayerStore } from "@/features/player";
import { matchesShortcut, type ShortcutsSettings } from "@/features/shortcuts";
import {
  addAndReport,
  getCachedPlaylists,
  readRecentPlaylists,
  toTrackDetails,
  useModalStore,
} from "@/features/library";
import { isLocalTrackId } from "@/shared/media/local";
import { showToast } from "@/shared/ui";
import { createTranslatorSync, getStoredLocale } from "@/languages";

type MainAppShortcuts = ShortcutsSettings["mainApp"];

export function handleAddToPlaylistShortcut(
  event: KeyboardEvent,
  mainApp: MainAppShortcuts,
): boolean {
  const openPicker = matchesShortcut(event, mainApp.addToPlaylist);
  if (!openPicker && !matchesShortcut(event, mainApp.quickAddToLastPlaylist)) {
    return false;
  }
  event.preventDefault();
  const t = createTranslatorSync(getStoredLocale());
  const { currentTrack } = usePlayerStore.getState();
  if (!currentTrack || isLocalTrackId(currentTrack.id)) {
    showToast(t("playlist_picker.nothing_playing"), "info");
    return true;
  }
  const details = toTrackDetails([currentTrack]);
  if (openPicker) {
    useModalStore.getState().openAddToPlaylist(details);
    return true;
  }
  const lastId = readRecentPlaylists()[0];
  const last = getCachedPlaylists().find((p) => p.id === lastId);
  if (!last) {
    showToast(t("playlist_picker.no_last_playlist"), "info");
    useModalStore.getState().openAddToPlaylist(details);
    return true;
  }
  void addAndReport(details, [last], t);
  return true;
}
