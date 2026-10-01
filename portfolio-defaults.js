export const portfolioDefaults = {
    texts: {
        ru: {
            name: "Максим Аскеров",
            role: "3D Motion Designer · 4+ года опыта",
            description: "Ролики и креативы для игр, приложений и брендов, 3D-моделирование и анимация.",
            workedWith: "Работал с",
            skills: "Навыки",
            motion: "Моушндизайн & Креативы",
            modeling: "Моделирование",
        },
        en: {
            name: "Maxim Askerov",
            role: "3D Motion Designer · 4+ years of experience",
            description: "Videos and creatives for games, apps and brands, 3D modeling and animation.",
            workedWith: "Worked with",
            skills: "Skills",
            motion: "Motion Design & Creatives",
            modeling: "3D Modeling",
        },
    },
    companies: [
        { names: { ru: "CG Bros", en: "CG Bros" }, mark: "CGB", color: "#ef4444" },
        { names: { ru: "Crada.io", en: "Crada.io" }, mark: "CR", color: "#f9a8d4", textColor: "#4a1942" },
        { names: { ru: "Game Gears", en: "Game Gears" }, mark: "GG", color: "#dc2626" },
        { names: { ru: "AdQuantum", en: "AdQuantum" }, mark: "AQ", color: "#2563eb" },
        { names: { ru: "veles.finance", en: "veles.finance" }, mark: "VF", color: "#8b5cf6" },
    ],
    skills: [
        { name: "Blender", color: "#f5792a" },
        { name: "After Effects", color: "#b298ff" },
        { name: "DaVinci Resolve", color: "#22d3ee" },
        { name: "Photoshop", color: "#38b6ff" },
        { name: "ZBrush", color: "#ef4444" },
        { name: "Substance Painter", color: "#fbbf24" },
    ],
    projects: [
        ...["15.mp4", "5.mp4", "8.mp4", "17.mp4", "3.mp4", "18.mp4", "7.mp4", "16.mp4", "6.mp4", "9.mp4", "2.mp4", "1.mp4", "4.mp4", "10.mp4", "3.jpg", "4.jpg", "1.jpg"]
            .map((file, order) => ({ id: `motion-${order + 1}`, tab: "motion", src: `assets/${file.endsWith(".mp4") ? "videos" : "images"}/${file}`, order, visible: true })),
        ...["chest.jpg", "cherep.jpg", "budka.jpg", "zhuk.jpg", "starik.jpg", "tykva2.jpg", "lampa.jpg", "avatar.jpg", "Robot.jpg", "maska.mp4", "koza.jpg", "twitch.jpg", "zhabka.jpg", "malchik.jpg"]
            .map((file, order) => ({ id: `modeling-${order + 1}`, tab: "modeling", src: `assets/${file.endsWith(".mp4") ? "videos/modeling" : "images/modeling"}/${file}`, order, visible: true })),
    ],
    links: [
        { label: { ru: "Написать в Telegram", en: "Message me on Telegram" }, href: "https://t.me/gantmaster", icon: "telegram", visible: true },
    ],
};
