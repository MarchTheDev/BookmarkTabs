/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChannelStore, GuildStore, UserStore } from "@webpack/common";

import { getSpecialPage } from "./constants";
import { Bookmark, View } from "./types";

const DM_PATH = /^\/channels\/@me\/(\d+)/;
const CHANNEL_PATH = /^\/channels\/(\d+)\/(\d+)/;
const GUILD_PATH = /^\/channels\/(\d+)(?:\/|$)/;

/** Figure out what the user is currently looking at */
export function getCurrentView(): View {
    const path = window.location.pathname;

    // Friends / Activity
    if (path === "/channels/@me" || path === "/channels/@me/activity") {
        return { kind: "page", path };
    }

    // DM / group chat
    let match = DM_PATH.exec(path);
    if (match) return { kind: "channel", guildId: "@me", channelId: match[1] };

    // Channel inside a server (including forum/voice, and message links)
    match = CHANNEL_PATH.exec(path);
    if (match) return { kind: "channel", guildId: match[1], channelId: match[2] };

    // Server home / channel list / any other guild-level page
    match = GUILD_PATH.exec(path);
    if (match) return { kind: "guild", guildId: match[1] };

    // Everything else is a page (special pages like /shop, or custom paths)
    return { kind: "page", path };
}

export function viewKey(view: View): string {
    switch (view.kind) {
        case "channel": return `channel:${view.guildId}:${view.channelId}`;
        case "guild": return `guild:${view.guildId}`;
        case "page": return `page:${view.path}`;
    }
}

export function bookmarkKey(bookmark: Bookmark): string {
    switch (bookmark.kind) {
        case "channel": return `channel:${bookmark.guildId}:${bookmark.channelId}`;
        case "guild": return `guild:${bookmark.guildId}`;
        case "page": return `page:${bookmark.path}`;
    }
}

export function bookmarkToView(bookmark: Bookmark): View {
    if (bookmark.kind === "channel" && bookmark.guildId && bookmark.channelId)
        return { kind: "channel", guildId: bookmark.guildId, channelId: bookmark.channelId };

    if (bookmark.kind === "guild" && bookmark.guildId)
        return { kind: "guild", guildId: bookmark.guildId };

    return { kind: "page", path: bookmark.path ?? "/channels/@me" };
}

function prettifyPath(path: string): string {
    const cleaned = path.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!cleaned) return "Discord";

    return cleaned
        .split(/[/_-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

/** Human-readable name for a view, used as the default bookmark name */
export function getViewName(view: View): string {
    switch (view.kind) {
        case "channel": {
            const channel = ChannelStore.getChannel(view.channelId);
            if (channel) {
                if (channel.name) return `#${channel.name}`;

                if (channel.recipients?.length) {
                    const first = UserStore.getUser(channel.recipients[0]);
                    if (first?.username) return first.username;
                    if (channel.name) return channel.name;
                }
            }
            return "Channel";
        }
        case "guild": {
            const guild = GuildStore.getGuild(view.guildId);
            return guild?.name ?? "Server";
        }
        case "page": {
            const special = getSpecialPage(view.path);
            return special?.name ?? prettifyPath(view.path);
        }
    }
}
