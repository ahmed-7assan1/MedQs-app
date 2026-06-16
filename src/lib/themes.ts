export type ThemeVariant =
  | "medonex-purple"
  | "ocean-teal"
  | "rose-gold"
  | "forest-green"
  | "midnight-blue"
  | "amber-noir"
  | "cyber-purple"
  | "arctic-gray"
  | "sakura-mint"
  | "ruby-red"
  | "emerald-night"
  | "solar-gold"
  | "nordic-slate"
  | "neon-indigo"
  | "espresso"
  | "mono";

export interface ThemeInfo {
  id: ThemeVariant;
  label: string;
  labelAr: string;
  primary: string;
  number: string;
}

export const THEMES: ThemeInfo[] = [
  { id: "medonex-purple", label: "MedOneX Purple", labelAr: "بنفسجي",  primary: "#7C6FF7", number: "01" },
  { id: "ocean-teal",     label: "Ocean Teal",     labelAr: "تيل",     primary: "#0EA5A0", number: "02" },
  { id: "rose-gold",      label: "Rose Gold",      labelAr: "روز گولد", primary: "#E8698A", number: "03" },
  { id: "forest-green",   label: "Forest Green",   labelAr: "أخضر",    primary: "#22883A", number: "04" },
  { id: "midnight-blue",  label: "Midnight Blue",  labelAr: "أزرق",    primary: "#3B82F6", number: "05" },
  { id: "amber-noir",     label: "Amber Noir",     labelAr: "عنبر",    primary: "#F97316", number: "06" },
  { id: "cyber-purple",   label: "Cyber Purple",   labelAr: "نيون",    primary: "#A855F7", number: "07" },
  { id: "arctic-gray",    label: "Arctic Gray",    labelAr: "رمادي",   primary: "#0EA5E9", number: "08" },
  { id: "sakura-mint",    label: "Sakura Mint",    labelAr: "نعناعي",  primary: "#06B6A8", number: "09" },
  { id: "ruby-red",       label: "Ruby Red",       labelAr: "ياقوتي",  primary: "#E11D48", number: "10" },
  { id: "emerald-night",  label: "Emerald Night",  labelAr: "زمردي",   primary: "#059669", number: "11" },
  { id: "solar-gold",     label: "Solar Gold",     labelAr: "ذهبي",    primary: "#CA8A04", number: "12" },
  { id: "nordic-slate",   label: "Nordic Slate",   labelAr: "سليت",    primary: "#64748B", number: "13" },
  { id: "neon-indigo",    label: "Neon Indigo",    labelAr: "نيلي",    primary: "#6366F1", number: "14" },
  { id: "espresso",       label: "Espresso",       labelAr: "اسبريسو", primary: "#A0522D", number: "15" },
  { id: "mono",           label: "Mono",           labelAr: "أحادي",   primary: "#1A1A1A", number: "16" },
];
