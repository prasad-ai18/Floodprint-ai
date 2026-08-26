import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi';

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Branding & Navigation
    'brand.title': 'FLOODPRINT',
    'brand.subtitle': 'AI EVIDENCE PLATFORM',
    'nav.dashboard': 'Dashboard',
    'nav.upload': 'Upload Evidence',
    'nav.chat': 'AI Assistant',
    'nav.map': 'GIS Map',
    'nav.library': 'Evidence Library',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.signout': 'Sign Out',
    'nav.signin': 'Sign In',
    'nav.signup': 'Create Account',

    // Dashboard
    'dash.hero.title': 'Turn messy environmental evidence into clear, verifiable intelligence.',
    'dash.hero.subtitle': 'Upload photos, videos, voice recordings, documents or dispatch notes. Floodprint extracts locations, cross-references meteorological radar, and delivers human-understandable findings.',
    'dash.btn.upload': '+ Upload Evidence',
    'dash.btn.ask': 'Open AI Assistant',
    'dash.ask.placeholder': 'Ask Floodprint anything about your evidence...',
    'dash.ask.btn': 'Ask AI',
    'dash.recent.title': 'Recent Evidence',
    'dash.recent.empty': 'Your evidence workspace is empty.',
    'dash.recent.empty.btn': 'Upload Your First Evidence',
    'dash.metrics.dossiers': 'Evidence Dossiers',
    'dash.metrics.gis': 'GIS Mapped Points',
    'dash.metrics.verified': 'Verified Credible',
    'dash.metrics.hub': 'Active Focus: Chittoor, AP',

    // Upload Page
    'upload.title': 'Upload Evidence',
    'upload.subtitle': 'Images, videos, audio recordings, field notes, documents and dispatch text.',
    'upload.tab.image': '1. Photos / Imagery',
    'upload.tab.video': '2. Video Evidence',
    'upload.tab.audio': '3. Voice / Audio Statement',
    'upload.tab.document': '4. Documents & Field Notes',
    'upload.location.title': 'Spatial Telemetry & Location Pin',
    'upload.time.title': 'Temporal Alignment & Clock Delta',
    'upload.time.label': 'Incident Occurrence Time',
    'upload.claim.title': 'Claim Title & Submitter Narrative',
    'upload.claim.name': 'Case Investigation Title',
    'upload.claim.desc': 'Witness Narrative / Context Observations',
    'upload.submit.btn': 'Submit & Synthesize Multi-Signal Evidence',

    // AI Assistant
    'chat.title': 'Floodprint AI Assistant',
    'chat.subtitle': 'Interactively query, summarize, and cross-reference disaster evidence across Gemini Vision, radar archives, and GIS layers.',
    'chat.input.placeholder': 'Ask anything about your disaster evidence...',
    'chat.prompt.summarize': 'Summarize this evidence',
    'chat.prompt.where': 'Where did this event happen?',
    'chat.prompt.when': 'When did it happen?',
    'chat.prompt.claims': 'What evidence supports the claim?',
    'chat.prompt.locations': 'Extract all locations',
    'chat.prompt.dates': 'Extract all dates',
    'chat.prompt.inconsistencies': 'Identify contradictions',
    'chat.prompt.simple': 'Explain this in simple language',
    'chat.prompt.map': 'Show this location on the map',
    'chat.prompt.weather': 'Compare with environmental weather data',

    // GIS Map
    'map.title': 'GIS Spatial Intelligence Command',
    'map.search.placeholder': 'Search India, state, district, city, mandal or coordinates (e.g. Chittoor)...',
    'map.quick.chittoor': 'Chittoor District',
    'map.quick.chittoorCity': 'Chittoor City',
    'map.quick.tirupati': 'Tirupati',
    'map.quick.ap': 'Andhra Pradesh',
    'map.quick.india': 'India',
    'map.coords': 'Coordinates',
    'map.weather': 'Weather Radar',

    // Common
    'common.location': 'Location',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.weather': 'Weather',
    'common.results': 'Results',
    'common.confidence': 'Confidence Score',
    'common.summary': 'Executive Summary',
    'common.viewMap': 'View on Map',
    'common.askAi': 'Ask AI',
    'common.dossier': 'Dossier',
  },

  te: {
    // తెలుగు (Telugu)
    'brand.title': 'ఫ్లడ్‌ప్రింట్ (FLOODPRINT)',
    'brand.subtitle': 'AI సాక్ష్య నిర్ధారణ ప్లాట్‌ఫారమ్',
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.upload': 'సాక్ష్యం అప్‌లోడ్ చేయండి',
    'nav.chat': 'AI అసిస్టెంట్',
    'nav.map': 'GIS మ్యాప్',
    'nav.library': 'సాక్ష్యాల లైబ్రరీ',
    'nav.profile': 'ప్రొఫైల్',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.signout': 'లాగ్ అవుట్',
    'nav.signin': 'సైన్ ఇన్',
    'nav.signup': 'ఖాతా తెరవండి',

    'dash.hero.title': 'వరద మరియు విపత్తు సాక్ష్యాలను స్పష్టమైన, ధృవీకరించదగిన సమాచారంగా మార్చండి.',
    'dash.hero.subtitle': 'ఫోటోలు, వీడియోలు, వాయిస్ రికార్డింగ్‌లు, డాక్యుమెంట్‌లను అప్‌లోడ్ చేయండి. ఫ్లడ్‌ప్రింట్ లొకేషన్‌లను సంగ్రహించి, వాతావరణ రాడార్‌తో సరిపోల్చి ఫలితాలను అందిస్తుంది.',
    'dash.btn.upload': '+ సాక్ష్యం అప్‌లోడ్ చేయండి',
    'dash.btn.ask': 'AI అసిస్టెంట్‌ని తెరవండి',
    'dash.ask.placeholder': 'మీ సాక్ష్యం గురించి ఏదైనా ప్రశ్న అడగండి...',
    'dash.ask.btn': 'AI ని అడగండి',
    'dash.recent.title': 'ఇటీవలి సాక్ష్యాలు',
    'dash.recent.empty': 'మీ సాక్ష్యాల జాబితా ఖాళీగా ఉంది.',
    'dash.recent.empty.btn': 'మొదటి సాక్ష్యాన్ని అప్‌లోడ్ చేయండి',
    'dash.metrics.dossiers': 'నమోదైన సాక్ష్యాలు',
    'dash.metrics.gis': 'మ్యాప్ పాయింట్లు',
    'dash.metrics.verified': 'ధృవీకరించబడినవి',
    'dash.metrics.hub': 'కేంద్రం: చిత్తూరు, ఆంధ్రప్రదేశ్',

    'upload.title': 'సాక్ష్యం అప్‌లోడ్ చేయండి',
    'upload.subtitle': 'చిత్రాలు, వీడియోలు, ఆడియో, పత్రాలు మరియు గమనికలు.',
    'upload.tab.image': '1. ఫోటోలు',
    'upload.tab.video': '2. వీడియోలు',
    'upload.tab.audio': '3. వాయిస్ స్టేట్‌మెంట్',
    'upload.tab.document': '4. పత్రాలు / నోట్స్',
    'upload.location.title': 'లొకేషన్ మరియు జియో-టెలిమెట్రీ',
    'upload.time.title': 'సమయం మరియు తేదీ',
    'upload.time.label': 'సంఘటన జరిగిన సమయం',
    'upload.claim.title': 'కేసు శీర్షిక మరియు వివరాలు',
    'upload.claim.name': 'కేసు శీర్షిక',
    'upload.claim.desc': 'ప్రత్యక్ష సాక్షి వివరాలు',
    'upload.submit.btn': 'సాక్ష్యాన్ని ధృవీకరించండి',

    'chat.title': 'ఫ్లడ్‌ప్రింట్ AI అసిస్టెంట్',
    'chat.subtitle': 'మీ సాక్ష్యాలు మరియు వాతావరణ డేటా ఆధారంగా ప్రశ్నలు అడగండి.',
    'chat.input.placeholder': 'సాక్ష్యం గురించి ఏదైనా ప్రశ్న అడగండి...',
    'chat.prompt.summarize': 'ఈ సాక్ష్యాన్ని క్లుప్తీకరించండి',
    'chat.prompt.where': 'ఈ సంఘటన ఎక్కడ జరిగింది?',
    'chat.prompt.when': 'ఇది ఎప్పుడు జరిగింది?',
    'chat.prompt.claims': 'ఏ సాక్ష్యాలు ఈ వాదనను సమర్థిస్తున్నాయి?',
    'chat.prompt.locations': 'అన్ని ప్రాంతాలను గుర్తించండి',
    'chat.prompt.dates': 'అన్ని తేదీలను సంగ్రహించండి',
    'chat.prompt.inconsistencies': 'తేడాలు లేదా వ్యత్యాసాలను గుర్తించండి',
    'chat.prompt.simple': 'సరళమైన భాషలో వివరించండి',
    'chat.prompt.map': 'మ్యాప్‌లో ఈ ప్రాంతాన్ని చూపించండి',
    'chat.prompt.weather': 'వాతావరణ వివరాలతో పోల్చండి',

    'map.title': 'GIS మ్యాప్ కమాండ్ సెంటర్',
    'map.search.placeholder': 'భారతదేశం, రాష్ట్రం, జిల్లా, నగరం (ఉదా: చిత్తూరు) శోధించండి...',
    'map.quick.chittoor': 'చిత్తూరు జిల్లా',
    'map.quick.chittoorCity': 'చిత్తూరు నగరం',
    'map.quick.tirupati': 'తిరుపతి',
    'map.quick.ap': 'ఆంధ్రప్రదేశ్',
    'map.quick.india': 'భారతదేశం',
    'map.coords': 'కోఆర్డినేట్లు',
    'map.weather': 'వాతావరణ రాడార్',

    'common.location': 'ప్రాంతం',
    'common.date': 'తేదీ',
    'common.time': 'సమయం',
    'common.weather': 'వాతావరణం',
    'common.results': 'ఫలితాలు',
    'common.confidence': 'విశ్వసనీయత స్కోరు',
    'common.summary': 'సారాంశం',
    'common.viewMap': 'మ్యాప్‌లో చూడండి',
    'common.askAi': 'AI ని అడగండి',
    'common.dossier': 'వివరాల నివేదిక',
  },

  hi: {
    // हिन्दी (Hindi)
    'brand.title': 'फ्लडप्रिंट (FLOODPRINT)',
    'brand.subtitle': 'AI साक्ष्य सत्यापन मंच',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.upload': 'साक्ष्य अपलोड करें',
    'nav.chat': 'AI सहायक',
    'nav.map': 'GIS मानचित्र',
    'nav.library': 'साक्ष्य लाइब्रेरी',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.signout': 'लॉग आउट',
    'nav.signin': 'साइन इन',
    'nav.signup': 'खाता बनाएं',

    'dash.hero.title': 'आपदा साक्ष्यों को स्पष्ट, सत्यापन योग्य बुद्धिमत्ता में बदलें।',
    'dash.hero.subtitle': 'तस्वीरें, वीडियो, वॉयस रिकॉर्डिंग, दस्तावेज़ अपलोड करें। फ्लडप्रिंट स्थानों को निकालता है, मौसम रडार से मिलान करता है और सरल परिणाम देता है।',
    'dash.btn.upload': '+ साक्ष्य अपलोड करें',
    'dash.btn.ask': 'AI सहायक खोलें',
    'dash.ask.placeholder': 'अपने साक्ष्य के बारे में कुछ भी पूछें...',
    'dash.ask.btn': 'AI से पूछें',
    'dash.recent.title': 'हालिया साक्ष्य',
    'dash.recent.empty': 'आपका साक्ष्य कार्यक्षेत्र खाली है।',
    'dash.recent.empty.btn': 'पहला साक्ष्य अपलोड करें',
    'dash.metrics.dossiers': 'दर्ज साक्ष्य',
    'dash.metrics.gis': 'मानचित्र बिंदु',
    'dash.metrics.verified': 'सत्यापित विश्वसनीय',
    'dash.metrics.hub': 'सक्रिय केंद्र: चित्तूर, आंध्र प्रदेश',

    'upload.title': 'साक्ष्य अपलोड करें',
    'upload.subtitle': 'चित्र, वीडियो, ऑडियो, दस्तावेज़ और नोट्स।',
    'upload.tab.image': '1. तस्वीरें',
    'upload.tab.video': '2. वीडियो',
    'upload.tab.audio': '3. वॉयस बयान',
    'upload.tab.document': '4. दस्तावेज़ / नोट्स',
    'upload.location.title': 'स्थान और भू-टेलीमेट्री',
    'upload.time.title': 'समय और तारीख',
    'upload.time.label': 'घटना का समय',
    'upload.claim.title': 'केस शीर्षक और विवरण',
    'upload.claim.name': 'केस शीर्षक',
    'upload.claim.desc': 'प्रत्यक्षदर्शी विवरण',
    'upload.submit.btn': 'साक्ष्य सत्यापित करें',

    'chat.title': 'फ्लडप्रिंट AI सहायक',
    'chat.subtitle': 'अपने साक्ष्यों और मौसम डेटा के आधार पर प्रश्न पूछें।',
    'chat.input.placeholder': 'साक्ष्य के बारे में कुछ भी पूछें...',
    'chat.prompt.summarize': 'इस साक्ष्य का संक्षेप करें',
    'chat.prompt.where': 'यह घटना कहाँ हुई थी?',
    'chat.prompt.when': 'यह कब हुआ?',
    'chat.prompt.claims': 'कौन से साक्ष्य इस दावे का समर्थन करते हैं?',
    'chat.prompt.locations': 'सभी स्थानों की पहचान करें',
    'chat.prompt.dates': 'सभी तारीखें निकालें',
    'chat.prompt.inconsistencies': 'विसंगतियों की पहचान करें',
    'chat.prompt.simple': 'सरल भाषा में समझाएं',
    'chat.prompt.map': 'मानचित्र पर यह स्थान दिखाएं',
    'chat.prompt.weather': 'मौसम के आंकड़ों से तुलना करें',

    'map.title': 'GIS मानचित्र कमांड सेंटर',
    'map.search.placeholder': 'भारत, राज्य, जिला, शहर (उदा: चित्तूर) खोजें...',
    'map.quick.chittoor': 'चित्तूर जिला',
    'map.quick.chittoorCity': 'चित्तूर शहर',
    'map.quick.tirupati': 'तिरुपति',
    'map.quick.ap': 'आंध्र प्रदेश',
    'map.quick.india': 'भारत',
    'map.coords': 'निर्देशांक',
    'map.weather': 'मौसम रडार',

    'common.location': 'स्थान',
    'common.date': 'तारीख',
    'common.time': 'समय',
    'common.weather': 'मौसम',
    'common.results': 'परिणाम',
    'common.confidence': 'विश्वास स्कोर',
    'common.summary': 'सारांश',
    'common.viewMap': 'मानचित्र पर देखें',
    'common.askAi': 'AI से पूछें',
    'common.dossier': 'विवरण रिपोर्ट',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (localStorage.getItem('floodprint_lang') as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('floodprint_lang', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
