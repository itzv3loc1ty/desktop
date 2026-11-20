import { useMemo } from "react";
import { LuPlus, LuListMusic, LuEllipsis } from "react-icons/lu";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import {
  usePlaylistsList,
  useModalStore,
  useRecentPlaylists,
  sortByRecent,
  addAndReport,
  type TrackDetail,
} from "@/features/library";
import { useTranslation } from "@/languages";

const QUICK_PLAYLISTS = 5;

export function useAddToPlaylistMenuItem(
  track: TrackDetail | null,
  options: { excludePlaylistId?: string } = {},
): DropdownMenuItem | null {
  const { t } = useTranslation();
  const { data: playlistsData } = usePlaylistsList();
  const recent = useRecentPlaylists();
  const { excludePlaylistId } = options;

  return useMemo(() => {
    if (!track) return null;
    const all = (playlistsData?.playlists ?? []).filter(
      (p) => p.id !== excludePlaylistId,
    );
    const quick = sortByRecent(all, recent).slice(0, QUICK_PLAYLISTS);
    const openPicker = () =>
      useModalStore
        .getState()
        .openAddToPlaylist({ ...track, playlists: playlistsData?.playlists });
    const base: DropdownMenuItem = {
      id: "add-to-playlist",
      label: t("common.add_to_playlist"),
      icon: <LuPlus size={15} />,
      onClick: openPicker,
    };
    if (quick.length === 0) return base;
    return {
      ...base,
      children: [
        ...quick.map<DropdownMenuItem>((playlist) => ({
          id: `quick-add-${playlist.id}`,
          label: playlist.title,
          icon: <LuListMusic size={15} />,
          onClick: () => {
            void addAndReport([track], [playlist], t);
          },
        })),
        {
          id: "quick-add-new",
          label: t("playlist_picker.new_playlist"),
          icon: <LuPlus size={15} />,
          separator: true,
          onClick: () =>
            useModalStore.getState().openCreatePlaylist(undefined, track),
        },
        {
          id: "quick-add-more",
          label: t("playlist_picker.more"),
          icon: <LuEllipsis size={15} />,
          onClick: openPicker,
        },
      ],
    };
  }, [track, playlistsData?.playlists, recent, excludePlaylistId, t]);
}
