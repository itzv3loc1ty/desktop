// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import type { TrackDetail } from "@/features/library";
import { useAddToPlaylistMenuItem } from "./useAddToPlaylistMenuItem";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

const library = vi.hoisted(() => ({
  playlists: [] as { id: string; title: string }[],
  recent: [] as string[],
  addAndReport: vi.fn(),
  openAddToPlaylist: vi.fn(),
  openCreatePlaylist: vi.fn(),
}));

vi.mock("@/features/library", () => ({
  usePlaylistsList: () => ({ data: { playlists: library.playlists } }),
  useRecentPlaylists: () => library.recent,
  sortByRecent: <T extends { id: string }>(list: T[], recent: string[]) => {
    const rank = new Map(recent.map((id, i) => [id, i]));
    return [...list].sort(
      (a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99),
    );
  },
  addAndReport: library.addAndReport,
  useModalStore: {
    getState: () => ({
      openAddToPlaylist: library.openAddToPlaylist,
      openCreatePlaylist: library.openCreatePlaylist,
    }),
  },
}));

vi.mock("@/languages", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const track: TrackDetail = {
  id: "t1",
  title: "Demo",
  artists: "Me",
  coverUrl: "",
};

describe("useAddToPlaylistMenuItem", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    library.playlists = [];
    library.recent = [];
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(excludePlaylistId?: string): DropdownMenuItem | null {
    let result: DropdownMenuItem | null = null;
    function Probe() {
      result = useAddToPlaylistMenuItem(track, { excludePlaylistId });
      return null;
    }
    act(() => root.render(<Probe />));
    return result;
  }

  it("opens the picker directly when there are no playlists yet", () => {
    const item = render();
    expect(item?.children).toBeUndefined();
    act(() => void item?.onClick());
    expect(library.openAddToPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", title: "Demo" }),
    );
  });

  it("lists recent playlists first, then new and more", () => {
    library.playlists = [
      { id: "a", title: "Alpha" },
      { id: "b", title: "Beta" },
      { id: "c", title: "Gamma" },
    ];
    library.recent = ["c"];
    const item = render();
    const labels = item?.children?.map((child) => child.label);
    expect(labels?.slice(0, 3)).toEqual(["Gamma", "Alpha", "Beta"]);
    expect(item?.children?.map((child) => child.id).slice(-2)).toEqual([
      "quick-add-new",
      "quick-add-more",
    ]);
    act(() => void item?.children?.[0].onClick());
    expect(library.addAndReport).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "t1" })],
      [{ id: "c", title: "Gamma" }],
      expect.any(Function),
    );
  });

  it("leaves out the playlist the song is shown in", () => {
    library.playlists = [
      { id: "playlist-1", title: "Current" },
      { id: "other", title: "Other" },
    ];
    const labels = render("playlist-1")?.children?.map((c) => c.label);
    expect(labels).not.toContain("Current");
    expect(labels).toContain("Other");
  });
});
