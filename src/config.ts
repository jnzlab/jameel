export const SITE = {
  website: "https://jnzlab.io/",
  author: "Jameel Ahmad",
  profile: "https://jnzlab.io/about/",
  desc: "Jameel Ahmad is a freelance full-stack software engineer in Gujranwala, Pakistan, building Next.js, TypeScript and AI web apps for clients worldwide.",
  resumeUrl: "https://assets.jnzlab.io/resume.pdf",
  title: "Jameel Ahmad",
  ogImage: "", // empty = use the generated /og.png
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/jnzlab/jameel/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Karachi", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
