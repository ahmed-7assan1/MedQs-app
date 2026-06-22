export interface VoicePersona {
  id: string;
  name: string;
  lang: "ar" | "en";
  langLabel: string;
  description: string;
  avatar: string;
  gradient: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "salem",
    name: "سالم",
    lang: "ar",
    langLabel: "عربي",
    description: "صديق عربي ودود، يتحدث بالعامية والفصحى",
    avatar: "S",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "layla",
    name: "ليلى",
    lang: "ar",
    langLabel: "عربي",
    description: "معلمة لغة عربية حكيمة، تتحدث بالفصحى",
    avatar: "ل",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "omar",
    name: "عمر",
    lang: "ar",
    langLabel: "عربي",
    description: "مستشار أعمال ومحلل، يتحدث بالفصحى",
    avatar: "ع",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    id: "alex",
    name: "Alex",
    lang: "en",
    langLabel: "English",
    description: "Friendly American buddy, casual conversation",
    avatar: "A",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "sarah",
    name: "Sarah",
    lang: "en",
    langLabel: "English",
    description: "British academic tutor, formal & precise",
    avatar: "S",
    gradient: "from-rose-500 to-red-600",
  },
  {
    id: "david",
    name: "David",
    lang: "en",
    langLabel: "English",
    description: "Tech entrepreneur & consultant, professional",
    avatar: "D",
    gradient: "from-indigo-500 to-purple-600",
  },
];
