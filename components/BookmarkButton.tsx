/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { FluxDispatcher, Tooltip, useEffect, useRef, useState } from "@webpack/common";

import { POPOUT_WIDTH, settings } from "../util/constants";
import { StarFilledIcon, StarIcon } from "../util/icons";
import { isViewBookmarked, useBookmarks } from "../util/store";
import { getCurrentView } from "../util/view";
import BookmarkPopout from "./BookmarkPopout";

const cl = classNameFactory("vc-bookmarktabs-");

export default function BookmarkButton() {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left?: number; right?: number; }>({ top: 0, right: 8 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoutRef = useRef<HTMLDivElement>(null);

    useBookmarks();
    const forceUpdate = useForceUpdater();

    // Re-render the star state on navigation, and close the popout
    useEffect(() => {
        const onNavigation = () => {
            forceUpdate();
            setOpen(false);
        };
        FluxDispatcher.subscribe("CHANNEL_SELECT", onNavigation);
        window.addEventListener("popstate", onNavigation);
        return () => {
            FluxDispatcher.unsubscribe("CHANNEL_SELECT", onNavigation);
            window.removeEventListener("popstate", onNavigation);
        };
    }, []);

    // Close on outside click / Escape
    useEffect(() => {
        if (!open) return;

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!popoutRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onMouseDown, true);
        document.addEventListener("keydown", onKeyDown, true);
        return () => {
            document.removeEventListener("mousedown", onMouseDown, true);
            document.removeEventListener("keydown", onKeyDown, true);
        };
    }, [open]);

    const view = getCurrentView();
    const active = isViewBookmarked(view);

    function toggleOpen() {
        if (open) {
            setOpen(false);
            return;
        }

        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const margin = 8;
        // keep the popout inside the viewport
        const maxOffset = Math.max(margin, window.innerWidth - POPOUT_WIDTH - margin);

        setPos(settings.store.buttonSide === "left"
            ? { top: rect.bottom + margin, left: Math.min(rect.left, maxOffset) }
            : { top: rect.bottom + margin, right: Math.min(window.innerWidth - rect.right, maxOffset) }
        );
        setOpen(true);
    }

    return (
        <div className={classes(cl("strip"), cl(`strip-${settings.store.buttonSide}`))}>
            <Tooltip text={active ? "Bookmarks — this view is bookmarked" : "Bookmarks"}>
                {({ onMouseEnter, onMouseLeave }) => (
                    <button
                        ref={buttonRef}
                        className={classes(cl("button"), active && cl("button-active"))}
                        onClick={toggleOpen}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        aria-label="Open bookmarks"
                        aria-expanded={open}
                    >
                        {active ? <StarFilledIcon height={18} width={18} /> : <StarIcon height={18} width={18} />}
                    </button>
                )}
            </Tooltip>

            {open && (
                <div
                    ref={popoutRef}
                    className={cl("popout-anchor")}
                    style={{ top: pos.top, left: pos.left, right: pos.right }}
                >
                    <BookmarkPopout view={view} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}
