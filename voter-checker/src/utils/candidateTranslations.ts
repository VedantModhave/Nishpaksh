// Candidate name translations
// Maps candidate ID or name to translations in different languages
// Format: candidate_id or candidate_name -> { en: "English Name", hi: "हिंदी नाम", mr: "मराठी नाम" }

type CandidateTranslations = {
  [key: string]: {
    en: string
    hi: string
    mr: string
  }
}

const candidateNameTranslations: CandidateTranslations = {
  // Example candidate translations
  // Add your candidate translations here using either candidate ID or name as key
  
  // Example format:
  // "Asha Suresh Koparkar": {
  //   en: "Asha Suresh Koparkar",
  //   hi: "आशा सुरेश कोपरकर",
  //   mr: "आशा सुरेश कोपरकर"
  // },
  
  // Add more candidates below:
  "Asha Suresh Koparkar": {
    en: "Asha Suresh Koparkar",
    hi: "आशा सुरेश कोपरकर",
    mr: "आशा सुरेश कोपरकर"
  },
  "Chirath Harinath Mohan": {
    en: "Chirath Harinath Mohan",
    hi: "चिरथ हरिनाथ मोहन",
    mr: "चिरथ हरिनाथ मोहन"
  },
  "Sou. Aparpali Naresh Jhare": {
    en: "Sou. Aparpali Naresh Jhare",
    hi: "सौ. अपरपाली नरेश झरे",
    mr: "सौ. अपरपाली नरेश झरे"
  },
  "Jenny Sandeep Sharma": {
    en: "Jenny Sandeep Sharma",
    hi: "जेनी सन्दीप शर्मा",
    mr: "जेनी सन्दीप शर्मा"
  },
  "Priya Sanjeevkumar": {
    en: "Priya Sanjeevkumar",
    hi: "प्रिया संजीवकुमार",
    mr: "प्रिया संजीवकुमार"
  },
  "Khan Rukhsar Anjum Mustakim": {
    en: "Khan Rukhsar Anjum Mustakim",
    hi: "खान रुखसार अंजुम मुस्ताकिम",
    mr: "खान रुखसार अंजुम मुस्ताकिम"
  }
  
  // You can add more candidates as needed
  // The key can be candidate ID, candidate name, or a combination
  // Note: For proper transliteration, you may want to use a transliteration library
  // or manually add accurate translations for each candidate
}

/**
 * Translates a candidate name based on the current language
 * @param candidateName - The original candidate name
 * @param candidateId - The candidate ID (optional, for more specific matching)
 * @param language - The target language ('en' | 'hi' | 'mr')
 * @returns The translated name, or the original name if no translation exists
 */
export function translateCandidateName(
  candidateName: string,
  candidateId?: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): string {
  // Try to find translation by candidate ID first (most specific)
  if (candidateId && candidateNameTranslations[candidateId]) {
    return candidateNameTranslations[candidateId][language] || candidateName
  }
  
  // Try to find translation by candidate name
  if (candidateNameTranslations[candidateName]) {
    return candidateNameTranslations[candidateName][language] || candidateName
  }
  
  // Try case-insensitive match
  const lowerName = candidateName.toLowerCase()
  for (const [key, translations] of Object.entries(candidateNameTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return translations[language] || candidateName
    }
  }
  
  // No translation found, return original name
  return candidateName
}

/**
 * Helper function to get all translations for a candidate
 * Useful for displaying names in multiple languages or debugging
 */
export function getCandidateTranslations(
  candidateName: string,
  candidateId?: string
): { en: string; hi: string; mr: string } | null {
  if (candidateId && candidateNameTranslations[candidateId]) {
    return candidateNameTranslations[candidateId]
  }
  
  if (candidateNameTranslations[candidateName]) {
    return candidateNameTranslations[candidateName]
  }
  
  const lowerName = candidateName.toLowerCase()
  for (const [key, translations] of Object.entries(candidateNameTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return translations
    }
  }
  
  return null
}

export default candidateNameTranslations

