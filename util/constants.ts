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

export const STRIP_HEIGHT = 34;
export const POPOUT_WIDTH = 320;

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
    showBookmarkButton: {
        type: OptionType.BOOLEAN,
        description: "Show the bookmark button",
        default: true
    },
    buttonSide: {
        type: OptionType.SELECT,
        description: "Which side of the screen the bookmark button sits on",
        options: [
            { label: "Right", value: "right", default: true },
            { label: "Left", value: "left" }
        ]
    }
});
