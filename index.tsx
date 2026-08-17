/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { isPluginEnabled } from "@api/PluginManager";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { JSX } from "react";

import BookmarkButton from "./components/BookmarkButton";
import { channelContextMenuPatch, guildContextMenuPatch } from "./components/ContextMenus";
import * as BookmarkTabsUtils from "./util";
import { settings, STRIP_HEIGHT } from "./util/constants";

// Put your own name here (the id is your Discord user id as a BigInt)
const BookmarkTabsAuthor = { name: "TheMarch88", id: 0n } as const;

// Same anchor as the ChannelTabs plugin, but with a coexistence strategy:
// if ChannelTabs is enabled it has already replaced the AppView container div,
// so we wrap its injected render call instead of the original "div".
const AppViewPatch = {
    find: '"AppView"',
    replacement: [
        {
            // $self in ChannelTabs' patch expands to `Vencord.Plugins.plugins["ChannelTabs"]`,
            // so we can deterministically match its injected render call and wrap it
            // (their tab bar is re-emitted as our children so both plugins render)
            match: /Vencord\.Plugins\.plugins\["ChannelTabs"\]\.render,\{currentChannel:(\i\?\.params),/,
            replace: "$self.render,{currentChannel:$1,children:Vencord.Plugins.plugins[\"ChannelTabs\"].render,{currentChannel:$1,",
            noWarn: true,
            predicate: () => isPluginEnabled("ChannelTabs")
        },
        {
            match: /"div",{(?=.{0,80}(\i\?\.params))/,
            replace: "$self.render,{currentChannel:$1,"
        }
    ]
};

export default definePlugin({
    name: "BookmarkTabs",
    description: "Bookmark channels, DMs, servers and pages, then jump back to them from a star button",
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
        BookmarkTabsUtils.init();
    },

    // Used by other plugins (e.g. popout positioning) to know how much
    // vertical space this plugin takes up at the top of the app view
    containerHeight: STRIP_HEIGHT,

    render({ children }: { children: JSX.Element; }) {
        return (
            <>
                {settings.store.showBookmarkButton && (
                    <ErrorBoundary>
                        <BookmarkButton />
                    </ErrorBoundary>
                )}
                {children}
            </>
        );
    },

    util: BookmarkTabsUtils
});
