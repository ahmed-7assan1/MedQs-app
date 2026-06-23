export interface EdgeTTSVoice {
  id: string;
  name: string;
  country: string;
  flag: string;
  gender: "male" | "female";
  locale: string;
}

export const EDGE_TTS_ARABIC_VOICES: EdgeTTSVoice[] = [
  // مصر (Egypt)
  { id: "ar-EG-SalmaNeural", name: "Salma", country: "مصر", flag: "🇪🇬", gender: "female", locale: "ar-EG" },
  { id: "ar-EG-ShakirNeural", name: "Shakir", country: "مصر", flag: "🇪🇬", gender: "male", locale: "ar-EG" },

  // السعودية (Saudi Arabia)
  { id: "ar-SA-ZariyahNeural", name: "Zariyah", country: "السعودية", flag: "🇸🇦", gender: "female", locale: "ar-SA" },
  { id: "ar-SA-HamedNeural", name: "Hamed", country: "السعودية", flag: "🇸🇦", gender: "male", locale: "ar-SA" },

  // الإمارات (UAE)
  { id: "ar-AE-FatimaNeural", name: "Fatima", country: "الإمارات", flag: "🇦🇪", gender: "female", locale: "ar-AE" },
  { id: "ar-AE-HamdanNeural", name: "Hamdan", country: "الإمارات", flag: "🇦🇪", gender: "male", locale: "ar-AE" },

  // البحرين (Bahrain)
  { id: "ar-BH-LailaNeural", name: "Laila", country: "البحرين", flag: "🇧🇭", gender: "female", locale: "ar-BH" },
  { id: "ar-BH-AliNeural", name: "Ali", country: "البحرين", flag: "🇧🇭", gender: "male", locale: "ar-BH" },

  // العراق (Iraq)
  { id: "ar-IQ-RanaNeural", name: "Rana", country: "العراق", flag: "🇮🇶", gender: "female", locale: "ar-IQ" },
  { id: "ar-IQ-BasselNeural", name: "Bassel", country: "العراق", flag: "🇮🇶", gender: "male", locale: "ar-IQ" },

  // الأردن (Jordan)
  { id: "ar-JO-SanaNeural", name: "Sana", country: "الأردن", flag: "🇯🇴", gender: "female", locale: "ar-JO" },
  { id: "ar-JO-TaimNeural", name: "Taim", country: "الأردن", flag: "🇯🇴", gender: "male", locale: "ar-JO" },

  // الكويت (Kuwait)
  { id: "ar-KW-NouraNeural", name: "Noura", country: "الكويت", flag: "🇰🇼", gender: "female", locale: "ar-KW" },
  { id: "ar-KW-FahedNeural", name: "Fahed", country: "الكويت", flag: "🇰🇼", gender: "male", locale: "ar-KW" },

  // لبنان (Lebanon)
  { id: "ar-LB-LaylaNeural", name: "Layla", country: "لبنان", flag: "🇱🇧", gender: "female", locale: "ar-LB" },
  { id: "ar-LB-RamiNeural", name: "Rami", country: "لبنان", flag: "🇱🇧", gender: "male", locale: "ar-LB" },

  // ليبيا (Libya)
  { id: "ar-LY-ImanNeural", name: "Iman", country: "ليبيا", flag: "🇱🇾", gender: "female", locale: "ar-LY" },
  { id: "ar-LY-OmarNeural", name: "Omar", country: "ليبيا", flag: "🇱🇾", gender: "male", locale: "ar-LY" },

  // المغرب (Morocco)
  { id: "ar-MA-MounaNeural", name: "Mouna", country: "المغرب", flag: "🇲🇦", gender: "female", locale: "ar-MA" },
  { id: "ar-MA-JamalNeural", name: "Jamal", country: "المغرب", flag: "🇲🇦", gender: "male", locale: "ar-MA" },

  // عُمان (Oman)
  { id: "ar-OM-AyshaNeural", name: "Aysha", country: "عُمان", flag: "🇴🇲", gender: "female", locale: "ar-OM" },
  { id: "ar-OM-AbdullahNeural", name: "Abdullah", country: "عُمان", flag: "🇴🇲", gender: "male", locale: "ar-OM" },

  // قطر (Qatar)
  { id: "ar-QA-AmalNeural", name: "Amal", country: "قطر", flag: "🇶🇦", gender: "female", locale: "ar-QA" },
  { id: "ar-QA-MoazNeural", name: "Moaz", country: "قطر", flag: "🇶🇦", gender: "male", locale: "ar-QA" },

  // سوريا (Syria)
  { id: "ar-SY-AmanyNeural", name: "Amany", country: "سوريا", flag: "🇸🇾", gender: "female", locale: "ar-SY" },
  { id: "ar-SY-LaithNeural", name: "Laith", country: "سوريا", flag: "🇸🇾", gender: "male", locale: "ar-SY" },

  // تونس (Tunisia)
  { id: "ar-TN-ReemNeural", name: "Reem", country: "تونس", flag: "🇹🇳", gender: "female", locale: "ar-TN" },
  { id: "ar-TN-HediNeural", name: "Hedi", country: "تونس", flag: "🇹🇳", gender: "male", locale: "ar-TN" },

  // الجزائر (Algeria)
  { id: "ar-DZ-AminaNeural", name: "Amina", country: "الجزائر", flag: "🇩🇿", gender: "female", locale: "ar-DZ" },
  { id: "ar-DZ-IsmaelNeural", name: "Ismael", country: "الجزائر", flag: "🇩🇿", gender: "male", locale: "ar-DZ" },

  // اليمن (Yemen)
  { id: "ar-YE-MaryamNeural", name: "Maryam", country: "اليمن", flag: "🇾🇪", gender: "female", locale: "ar-YE" },

  // السودان (Sudan)
  { id: "ar-SD-AmaniNeural", name: "Amani", country: "السودان", flag: "🇸🇩", gender: "female", locale: "ar-SD" },

  // فلسطين (Palestine)
  { id: "ar-PS-HindNeural", name: "Hind", country: "فلسطين", flag: "🇵🇸", gender: "female", locale: "ar-PS" },
  { id: "ar-PS-HamzaNeural", name: "Hamza", country: "فلسطين", flag: "🇵🇸", gender: "male", locale: "ar-PS" },

  // سوريا (Syria) - additional
  { id: "ar-SY-HalaNeural", name: "Hala", country: "سوريا", flag: "🇸🇾", gender: "female", locale: "ar-SY" },

  // موريتانيا (Mauritania)
  { id: "ar-MR-MinaNeural", name: "Mina", country: "موريتانيا", flag: "🇲🇷", gender: "female", locale: "ar-MR" },
  { id: "ar-MR-MokhtarNeural", name: "Mokhtar", country: "موريتانيا", flag: "🇲🇷", gender: "male", locale: "ar-MR" },
];

export const EDGE_TTS_ENGLISH_VOICES: EdgeTTSVoice[] = [
  { id: "en-US-AriaNeural", name: "Aria", country: "United States", flag: "🇺🇸", gender: "female", locale: "en-US" },
  { id: "en-US-JennyNeural", name: "Jenny", country: "United States", flag: "🇺🇸", gender: "female", locale: "en-US" },
  { id: "en-US-GuyNeural", name: "Guy", country: "United States", flag: "🇺🇸", gender: "male", locale: "en-US" },
  { id: "en-GB-SoniaNeural", name: "Sonia", country: "United Kingdom", flag: "🇬🇧", gender: "female", locale: "en-GB" },
  { id: "en-GB-RyanNeural", name: "Ryan", country: "United Kingdom", flag: "🇬🇧", gender: "male", locale: "en-GB" },
  { id: "en-AU-NatashaNeural", name: "Natasha", country: "Australia", flag: "🇦🇺", gender: "female", locale: "en-AU" },
];
