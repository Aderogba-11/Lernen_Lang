export type SpeakingItem = {
  slug: string;
  moduleTitle: string;
  targetText: string;
  translation: string;
};

export const SPEAKINGS: SpeakingItem[] = [
  {
    slug: "speaking-foundations",
    moduleTitle: "Foundations",
    targetText: "Me llamo Ana y soy de España.",
    translation: "My name is Ana and I am from Spain.",
  },
  {
    slug: "speaking-numbers-time",
    moduleTitle: "Numbers and Time",
    targetText: "Son las cuatro y media de la tarde.",
    translation: "It is half past four in the afternoon.",
  },
  {
    slug: "speaking-people",
    moduleTitle: "People",
    targetText: "Mi hermano es muy alto y simpático.",
    translation: "My brother is very tall and nice.",
  },
  {
    slug: "speaking-everyday-life",
    moduleTitle: "Everyday Life",
    targetText: "Me levanto a las siete y media todos los días.",
    translation: "I get up at half past seven every day.",
  },
  {
    slug: "speaking-out-and-about",
    moduleTitle: "Out and About",
    targetText: "Perdone, ¿dónde está la estación de tren?",
    translation: "Excuse me, where is the train station?",
  },
  {
    slug: "speaking-free-time",
    moduleTitle: "Free Time",
    targetText: "Los fines de semana juego al fútbol con mis amigos.",
    translation: "On weekends I play football with my friends.",
  },
];
