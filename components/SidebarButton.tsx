/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { Popout, Tooltip, useRef } from "@webpack/common";

import { settings } from "../util/constants";
import { StarFilledIcon, StarIcon } from "../util/icons";
import { isViewBookmarked } from "../util/store";
import { useTotalBadges } from "../util/unread";
import { getCurrentView } from "../util/view";
import BookmarkPopout from "./BookmarkPopout";

const cl = classNameFactory("vc-bookmarktabs-");

/**
 * The star button in the server sidebar (guild rail), right below the
 * DM and Quests buttons. Uses Discord's native Popout, so positioning,
 * outside-click closing and layering are all handled by Discord itself.
 */
export default function SidebarButton() {
    const { sidebarButton, unreadBadges } = settings.use(["sidebarButton", "unreadBadges"]);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const badges = useTotalBadges();
    const view = getCurrentView();
    const active = isViewBookmarked(view);

    if (!sidebarButton) return null;

    return (
        <div className={cl("rail-item")}>
            <Popout
                position="right"
                align="center"
                targetElementRef={buttonRef}
                renderPopout={({ closePopout }) => (
                    <BookmarkPopout view={view} closePopout={closePopout} />
                )}
            >
                {popoutProps => (
                    <Tooltip text="Bookmarks">
                        {({ onMouseEnter, onMouseLeave }) => (
                            <button
                                {...popoutProps}
                                ref={buttonRef}
                                className={classes(cl("rail-button"), active && cl("rail-button-active"))}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                                aria-label="Bookmarks"
                            >
                                {active ? <StarFilledIcon height={22} width={22} /> : <StarIcon height={22} width={22} />}
                                {unreadBadges && badges.mentionCount > 0 && (
                                    <span className={classes(cl("rail-badge"), cl("rail-badge-mention"))}>
                                        {badges.mentionCount > 9 ? "9+" : badges.mentionCount}
                                    </span>
                                )}
                                {unreadBadges && badges.mentionCount === 0 && badges.hasUnread && (
                                    <span className={classes(cl("rail-badge"), cl("rail-badge-unread"))} />
                                )}
                            </button>
                        )}
                    </Tooltip>
                )}
            </Popout>
        </div>
    );
}
