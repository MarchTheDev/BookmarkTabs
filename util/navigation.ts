/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavigationRouter } from "@webpack/common";

import { View } from "./types";

/**
 * Navigate Discord to the given view (channel, server or page).
 * Uses path-based transitionTo, the same mechanism ChannelTabs uses
 * for special pages and message links — the most reliable route.
 */
export function navigateToView(view: View) {
    switch (view.kind) {
        case "channel":
            NavigationRouter.transitionTo(`/channels/${view.guildId}/${view.channelId}`);
            break;
        case "guild":
            NavigationRouter.transitionTo(`/channels/${view.guildId}`);
            break;
        case "page":
            NavigationRouter.transitionTo(view.path);
            break;
    }
}
