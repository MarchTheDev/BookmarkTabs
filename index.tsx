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
// header (and before the messages). Two replacement variants with a
// `(?!$self)` guard so only the first one that matches ever applies:
// the exact ternary used by stable, and a looser fallback that survives
// minor differences in other Discord build channels (PTB / Canary).
const ChatBarPatch = {
    find: "Missing channel in Channel.handleContextMenu",
    replacement: [
        {
            // `showCall||showActivityPanel?null:this.renderHeaderBar(),`
            match: /(\i\|\|\i\?null:this\.renderHeaderBar\(\),)(?!\$self)/,
            replace: "$1$self.renderBar(),",
            noWarn: true
        },
        {
            match: /(this\.renderHeaderBar\(\),)(?!\$self)/,
            replace: "$1$self.renderBar(),"
        }
    ]
};

let barMounted = false;

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
        const cameFromOlderVersion =
            store.showBookmarkButton !== undefined ||
            store.buttonSide !== undefined ||
            store.sidebarButton !== undefined;

        delete store.showBookmarkButton;
        delete store.buttonSide;
        delete store.sidebarButton;

        // The bar used to be an optional extra; it's now the whole UI.
        // For people upgrading, reset the stale value so the new default
        // (enabled) applies. Their own toggle still works afterwards.
        if (cameFromOlderVersion) delete store.quickBar;

        BookmarkTabsUtils.logger.info(
            "BookmarkTabs started. quickBar =",
            settings.store.quickBar,
            "| unreadBadges =",
            settings.store.unreadBadges
        );

        BookmarkTabsUtils.init();
    },

    // Rendered right below the channel header (see ChatBarPatch)
    renderBar() {
        if (!barMounted) {
            barMounted = true;
            BookmarkTabsUtils.logger.info("BookmarkTabs bar mounted — patch is working");
        }
        return (
            <ErrorBoundary onError={({ error }) => BookmarkTabsUtils.logger.error("BookmarkTabs bar crashed:", error)}>
                <QuickBar />
            </ErrorBoundary>
        );
    },

    util: BookmarkTabsUtils
});
