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

/**
 * BookmarkTabs — author info
 * @author TheMarch88
 * GitHub: https://github.com/MarchTheDev
 * (This Equicord version's plugin cards only render name + id, so the
 * GitHub link is kept here as documentation.)
 */
const BookmarkTabsAuthor = {
    name: "TheMarch88",
    id: 511186459588427795n
} as const;

// Injects the bookmarks bar into the AppView layout, in the row directly
// below the title bar (the drag bar with the minimize/maximize/close
// buttons). Discord's AppView is a CSS grid with a dedicated area for that
// row ("notice"), so the bar is inserted into the content subgrid and given
// `grid-area: notice` via CSS (grid placement ignores DOM order, so the
// exact insertion spot doesn't matter visually). Anchored after the unique
// sidebar call so it stays clear of the built-in SurfaceClassesAPI patch
// window. Verified against the live stable & canary bundles (Aug 2026):
// exactly one occurrence each, all plugin orders coexist.
const AppViewPatch = {
    find: '"AppView"',
    replacement: {
        // `(0,R.jsx)(OD,{isSidebarOpen:a,...,hideSidebar:!a})` — insert right after
        match: /\{isSidebarOpen:.{0,80}hideSidebar:!\i\}\)/,
        replace: "$&,$self.renderBar()"
    }
};

let barMounted = false;

export default definePlugin({
    name: "BookmarkTabs",
    description: "Bookmark channels, DMs, servers and pages, then jump back to them from a bar below the title bar",
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

    patches: [AppViewPatch],

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

    // Rendered right below the title bar (see AppViewPatch)
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
