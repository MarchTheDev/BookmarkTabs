/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";

import { channelContextMenuPatch, guildContextMenuPatch } from "./components/ContextMenus";
import QuickBar from "./components/QuickBar";
import * as BookmarkTabsUtils from "./util";
import { settings } from "./util/constants";

// Put your own name here (the id is your Discord user id as a BigInt)
const BookmarkTabsAuthor = { name: "TheMarch88", id: 0n } as const;

// Injects the bookmarks bar into the chat view, right after the channel
// header (and before the messages). Verified against the live Discord
// stable bundle (Aug 2026): the find string is unique to the Chat module.
const ChatBarPatch = {
    find: "Missing channel in Channel.handleContextMenu",
    replacement: {
        // `showCall||showActivityPanel?null:this.renderHeaderBar(),`
        match: /(\i\|\|\i\?null:this\.renderHeaderBar\(\),)/,
        replace: "$1$self.renderBar(),"
    }
};

export default definePlugin({
    name: "BookmarkTabs",
    description: "Bookmark channels, DMs, servers and pages, then jump back to them from a bar below the channel header",
    tags: ["Appearance", "Customisation", "Organisation", "Servers"],
    authors: [BookmarkTabsAuthor],

    dependencies: ["ContextMenuAPI"],

    settings,

    contextMenus: {
        "channel-context": channelContextMenuPatch,
        "channel-mention-context": channelContextMenuPatch,
        "user-context": channelContextMenuPatch,
        "gdm-context": channelContextMenuPatch,
        "guild-context": guildContextMenuPatch
    },

    patches: [ChatBarPatch],

    start() {
        // migrate away from settings of older versions
        const store = settings.store as any;
        if (store.showBookmarkButton !== undefined) delete store.showBookmarkButton;
        if (store.buttonSide !== undefined) delete store.buttonSide;
        if (store.sidebarButton !== undefined) delete store.sidebarButton;

        BookmarkTabsUtils.init();
    },

    // Rendered right below the channel header (see ChatBarPatch)
    renderBar() {
        return (
            <ErrorBoundary>
                <QuickBar />
            </ErrorBoundary>
        );
    },

    util: BookmarkTabsUtils
});
