// Copy and adapt to the new portfolio's actual sections and language needs.
export const portfolioDefaults = {
    texts: {
        ru: { title: "Имя владельца", subtitle: "Специализация" },
        en: { title: "Owner name", subtitle: "Specialty" },
    },
    links: [
        { id: "contact", label: { ru: "Связаться", en: "Contact" }, href: "https://example.com", visible: true, order: 0 },
    ],
    projects: [
        { id: "project-1", src: "assets/images/project.jpg", category: "featured", visible: true, order: 0 },
    ],
};
