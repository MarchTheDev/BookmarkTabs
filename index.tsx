/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { isPluginEnabled } from "@api/PluginManager";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { ReactNode } from "react";

import { channelContextMenuPatch, guildContextMenuPatch } from "./components/ContextMenus";
import QuickBar from "./components/QuickBar";
import SidebarButton from "./components/SidebarButton";
import * as BookmarkTabsUtils from "./util";
import { settings } from "./util/constants";

// Put your own name here (the id is your Discord user id as a BigInt)
const BookmarkTabsAuthor = { name: "TheMarch88", id: 0n } as const;

// Injects the star button into the server sidebar (guild rail), right after
// the DM/Quests buttons and before the DM unread circles.
const GuildsBarPatch = {
    find: '"guildsnav"',
    replacement: {
        // `!hideDms && (0,r.jsx)(tm,{})` — tm is the DM unread-circles component
        match: /!(\i)&&\(0,(\i)\.jsx\)\((\i),\{\}\)/,
        replace: "$self.renderRailButton({}),!$1&&(0,$2.jsx)($3,{})"
    }
};

// Same anchor as the ChannelTabs plugin, but with a coexistence strategy:
// if ChannelTabs is enabled it has already replaced the AppView container div,
// so we wrap its injected render call instead of the original "div".
// This patch only powers the optional quick bar.
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

    patches: [GuildsBarPatch, AppViewPatch],

    start() {
        // migrate away from the v1 settings (top strip)
        const store = settings.store as any;
        if (store.showBookmarkButton !== undefined) delete store.showBookmarkButton;
        if (store.buttonSide !== undefined) delete store.buttonSide;

        BookmarkTabsUtils.init();
    },

    // Rendered inside the guild rail (see GuildsBarPatch)
    renderRailButton() {
        return (
            <ErrorBoundary>
                <SidebarButton />
            </ErrorBoundary>
        );
    },

    // Rendered instead of the AppView container div. The quick bar is emitted
    // as a sibling of the container so it lands in Discord's "notice" grid
    // area (the same slot ChannelTabs' top bar uses). When the bar is off,
    // the container is re-emitted byte-for-byte equivalent to vanilla.
    render({ className, children }: { className?: string; currentChannel?: unknown; children: ReactNode; }) {
        const content = <div className={className ?? ""}>{children}</div>;

        if (!settings.store.quickBar) return content;

        return (
            <>
                <ErrorBoundary>
                    <QuickBar />
                </ErrorBoundary>
                {content}
            </>
        );
    },

    util: BookmarkTabsUtils
});
