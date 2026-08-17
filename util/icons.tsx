/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ComponentType, JSX } from "react";

import { getSpecialPage, PageIconKind } from "./constants";

export interface IconProps {
    height?: number | string;
    width?: number | string;
    className?: string;
}

type SvgProps = IconProps & {
    fill?: string;
    strokeWidth?: number;
    children: JSX.Element | JSX.Element[];
};

function Svg({ height = 20, width = 20, className, fill = "none", strokeWidth = 2, children }: SvgProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill={fill}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={true}
        >
            {children}
        </svg>
    );
}

export function StarIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </Svg>
    );
}

export function StarFilledIcon(p: IconProps = {}) {
    return (
        <Svg {...p} fill="currentColor" strokeWidth={1}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </Svg>
    );
}

export function BookmarkRibbonIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
    );
}

export function PlusIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M12 5v14M5 12h14" />
        </Svg>
    );
}

export function CheckIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <polyline points="20 6 9 17 4 12" />
        </Svg>
    );
}

export function XIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M18 6L6 18M6 6l12 12" />
        </Svg>
    );
}

export function PencilIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </Svg>
    );
}

export function TrashIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M10 11v6M14 11v6" />
        </Svg>
    );
}

export function FriendsIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
    );
}

export function ShopIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </Svg>
    );
}

export function LibraryIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
        </Svg>
    );
}

export function NitroIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </Svg>
    );
}

export function QuestIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <path d="M4 22v-7" />
        </Svg>
    );
}

export function DiscoveryIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </Svg>
    );
}

export function MessageRequestsIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polyline points="22 6 12 13 2 6" />
        </Svg>
    );
}

export function ActivityIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
    );
}

export function SettingsIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
    );
}

export function GlobeIcon(p: IconProps = {}) {
    return (
        <Svg {...p}>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
    );
}

const PAGE_ICONS: Record<PageIconKind, ComponentType<IconProps>> = {
    friends: FriendsIcon,
    shop: ShopIcon,
    library: LibraryIcon,
    nitro: NitroIcon,
    quests: QuestIcon,
    discovery: DiscoveryIcon,
    messageRequests: MessageRequestsIcon,
    activity: ActivityIcon,
    settings: SettingsIcon
};

/** Icon for a page path: special page icon, or a globe for custom paths */
export function getPageIcon(path: string): ComponentType<IconProps> {
    const special = getSpecialPage(path);
    return special ? PAGE_ICONS[special.icon] : GlobeIcon;
}
