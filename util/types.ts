/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type BookmarkKind = "channel" | "guild" | "page";

export interface Bookmark {
    /** unique id */
    id: string;
    /**
     * Display name. Empty string means "derive it live from the view"
     * (channel/guild renames are picked up automatically). A non-empty
     * string means the user gave it a custom name.
     */
    name: string;
    kind: BookmarkKind;
    /** channel bookmarks */
    guildId?: string;
    channelId?: string;
    /** page bookmarks (special pages and custom in-app paths) */
    path?: string;
}

/**
 * A "view" is something the user can look at / bookmark:
 * a channel or DM, a whole server, or a page (special or custom path).
 */
export type View =
    | { kind: "channel"; guildId: string; channelId: string; }
    | { kind: "guild"; guildId: string; }
    | { kind: "page"; path: string; };
