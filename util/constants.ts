/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { OptionType } from "@utils/types";

export const logger = new Logger("BookmarkTabs");

/** DataStore key, bookmarks are stored per-user: { [userId]: Bookmark[] } */
export const DATA_KEY = "BookmarkTabs_bookmarks";

export type PageIconKind =
    | "friends"
    | "shop"
    | "library"
    | "nitro"
    | "quests"
    | "discovery"
    | "messageRequests"
    | "activity"
    | "settings";

export interface SpecialPage {
    /** url prefixes that identify this page */
    paths: string[];
    name: string;
    icon: PageIconKind;
}

/** Discord pages that are not channels/DMs/guilds, but can still be bookmarked */
export const SPECIAL_PAGES: SpecialPage[] = [
    { paths: ["/channels/@me"], name: "Friends", icon: "friends" },
    { paths: ["/channels/@me/activity"], name: "Activity", icon: "activity" },
    { paths: ["/message-requests"], name: "Message Requests", icon: "messageRequests" },
    { paths: ["/shop"], name: "Shop", icon: "shop" },
    { paths: ["/library"], name: "Library", icon: "library" },
    { paths: ["/store"], name: "Nitro", icon: "nitro" },
    { paths: ["/quest-home"], name: "Quests", icon: "quests" },
    { paths: ["/discovery", "/guild-discovery"], name: "Discovery", icon: "discovery" },
    { paths: ["/icymi"], name: "ICYMI", icon: "discovery" },
    { paths: ["/settings"], name: "Settings", icon: "settings" }
];

export function getSpecialPage(path: string): SpecialPage | undefined {
    return SPECIAL_PAGES.find(p => p.paths.some(prefix =>
        path === prefix || path.startsWith(prefix + "/") || path.startsWith(prefix + "?")
    ));
}

export const settings = definePluginSettings({
    quickBar: {
        type: OptionType.BOOLEAN,
        description: "Show the bookmarks bar at the top of the chat, right below the channel header",
        default: true
    },
    unreadBadges: {
        type: OptionType.BOOLEAN,
        description: "Show unread (blue) and mention (red) indicators on bookmarks",
        default: true
    }
});
