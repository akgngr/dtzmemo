// Pre-defined conversation topics for the German speaking practice module.
// Each topic sets up a realistic scenario where the AI plays a role
// (waiter, doctor, interviewer, etc.) and the user practices responding in German.

export type ConversationDifficulty = 'A2' | 'B1' | 'B2';

export interface ConversationTopic {
  id: string;
  icon: string; // emoji
  titleDe: string;
  titleTr: string;
  description: string;
  difficulty: ConversationDifficulty;
  /** German vocabulary list for the topic — shown as hints */
  vocabulary: { de: string; tr: string }[];
  /** Sample phrases the user can try */
  samplePhrases: string[];
  /** AI's opening message — sent at conversation start */
  opener: string;
  /** Full system prompt sent to the chat model */
  systemPrompt: string;
  /** Accent color (Tailwind class) for the topic card */
  color: string;
  /** Optional: short label for the AI's role (used by voice-chat mode) */
  aiRole?: string;
}

const baseRules = `
ALLGEMEINE REGELN:
- Antworte IMMER auf Deutsch, natürlich und freundlich.
- Verwende B1-Sprache: nicht zu komplex, aber auch nicht kindisch.
- Bleibe konsequent in deiner Rolle.
- Stelle am Ende deiner Antwort EINE Frage, um das Gespräch am Laufen zu halten.
- Wenn der Lernende einen Grammatik- oder Wortschatzfehler macht, gib im "tip"-Feld einen kurzen, ermutigenden Tipp auf Türkisch (oder Deutsch, wenn es klarer ist).
- Wenn das Gespräch nach 8+ Nachrichten natürlich enden sollte, setze "isEnding" auf true.
- Schreibe kurze Antworten (1-3 Sätze). Kein Roman.
- Verwende "du" (informal) mit Freunden/Bekannten, "Sie" (formal) im Geschäft, beim Arzt, im Vorstellungsgespräch.

ANTWORTFORMAT (immer gültiges JSON, kein Markdown):
{
  "reply": "Deine deutsche Antwort.",
  "tip": "Kurzer Tipp auf Türkisch, oder leerer String wenn kein Fehler.",
  "isEnding": false
}
`.trim();

export const conversationTopics: ConversationTopic[] = [
  {
    id: 'begruessung',
    icon: '👋',
    titleDe: 'Begrüßung & Vorstellung',
    titleTr: 'Selamlaşma & Tanışma',
    description: 'Yeni biriyle tanış, kendini tanıt',
    difficulty: 'A2',
    color: 'bg-emerald-500',
    vocabulary: [
      { de: 'heißen', tr: 'adı ... olmak' },
      { de: 'kommen aus', tr: '...den gelmek' },
      { de: 'wohnen', tr: 'yaşamak' },
      { de: 'arbeiten als', tr: '...olarak çalışmak' },
      { de: 'kennenlernen', tr: 'tanışmak' },
      { de: 'schön, dich zu treffen', tr: 'seninle tanışmak güzel' },
    ],
    samplePhrases: [
      'Hallo, ich heiße...',
      'Ich komme aus der Türkei.',
      'Ich wohne in Berlin.',
      'Ich arbeite als Ingenieur.',
      'Schön, dich kennenzulernen!',
    ],
    opener: 'Hallo! Schön, dich kennenzulernen. Ich bin Anna. Wie heißt du und woher kommst du?',
    systemPrompt: `Du bist Anna, eine freundliche Kollegin auf der Arbeit. Du triffst zum ersten Mal eine neue Kollegin / einen neuen Kollegen und stellst dich vor.

KONTEXT: Büro-Einführungstag, Mittagspause in der Kantine.

${baseRules}`,
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    titleDe: 'Im Restaurant',
    titleTr: 'Restoranda',
    description: 'Sipariş ver, yemek önerisi iste, hesap öde',
    difficulty: 'B1',
    color: 'bg-amber-500',
    vocabulary: [
      { de: 'die Speisekarte', tr: 'menü' },
      { de: 'empfehlen', tr: 'önermek' },
      { de: 'bestellen', tr: 'sipariş vermek' },
      { de: 'die Rechnung', tr: 'hesap' },
      { de: 'das Trinkgeld', tr: 'bahşiş' },
      { de: 'Ich hätte gern...', tr: '...alacağım, lütfen' },
      { de: 'Kann ich zahlen, bitte?', tr: 'Ödeyebilir miyim, lütfen?' },
    ],
    samplePhrases: [
      'Die Speisekarte, bitte.',
      'Was empfehlen Sie?',
      'Ich hätte gern ein Schnitzel.',
      'Kann ich die Rechnung haben, bitte?',
      'Das schmeckt sehr gut!',
    ],
    opener: 'Guten Abend! Willkommen im Restaurant Sonnenblume. Haben Sie reserviert? Was darf ich Ihnen bringen?',
    systemPrompt: `Du bist ein freundlicher Kellner / eine freundliche Kellnerin im Restaurant "Sonnenblume". Du bedienst höflich mit "Sie".

KONTEXT: Deutsches Restaurant, Abendessen. Du nimmst die Bestellung auf, empfiehlst Gerichte und bringst am Ende die Rechnung.

${baseRules}`,
  },
  {
    id: 'einkaufen',
    icon: '🛍️',
    titleDe: 'Einkaufen',
    titleTr: 'Alışveriş',
    description: 'Mağazada kıyafet dene, fiyat sor',
    difficulty: 'B1',
    color: 'bg-pink-500',
    vocabulary: [
      { de: 'die Größe', tr: 'beden' },
      { de: 'anprobieren', tr: 'denemek (kıyafet)' },
      { de: 'kosten', tr: 'mal olmak, fiyatı ...' },
      { de: 'umtauschen', tr: 'değiştirmek (ürün)' },
      { de: 'die Kasse', tr: 'kasa' },
      { de: 'Kann ich das anprobieren?', tr: 'Bunu deneyebilir miyim?' },
      { de: 'Wie viel kostet das?', tr: 'Bu ne kadar?' },
    ],
    samplePhrases: [
      'Ich suche einen Pullover.',
      'Haben Sie das in Größe M?',
      'Kann ich das anprobieren?',
      'Wie viel kostet das?',
      'Ich nehme es.',
    ],
    opener: 'Hallo, kann ich Ihnen helfen? Suchen Sie etwas Bestimmtes?',
    systemPrompt: `Du bist ein hilfsbereiter Verkäufer / eine hilfsbereite Verkäuferin in einem Bekleidungsgeschäft. Du sprichst die Kunden höflich mit "Sie" an.

KONTEXT: Modegeschäft in einer Einkaufsstraße. Du hilfst bei der Größenauswahl, empfiehlst Kleidung und gehst zur Kasse.

${baseRules}`,
  },
  {
    id: 'reisen',
    icon: '✈️',
    titleDe: 'Reisen & Hotel',
    titleTr: 'Seyahat & Otel',
    description: 'Otele giriş yap, bilgi al',
    difficulty: 'B1',
    color: 'bg-blue-500',
    vocabulary: [
      { de: 'reservieren', tr: 'rezerve etmek' },
      { de: 'das Einzelzimmer', tr: 'tek kişilik oda' },
      { de: 'das Doppelzimmer', tr: 'çift kişilik oda' },
      { de: 'das Frühstück', tr: 'kahvaltı' },
      { de: 'die Bushaltestelle', tr: 'otobüs durağı' },
      { de: 'die Fahrkarte', tr: 'bilet' },
      { de: 'Ich habe reserviert.', tr: 'Rezervasyonum var.' },
    ],
    samplePhrases: [
      'Ich habe ein Zimmer reserviert.',
      'Haben Sie noch ein Zimmer frei?',
      'Ist das Frühstück inklusive?',
      'Wo ist die nächste Bushaltestelle?',
      'Wann gibt es Frühstück?',
    ],
    opener: 'Guten Tag! Willkommen im Hotel Berlin. Wie kann ich Ihnen helfen? Haben Sie reserviert?',
    systemPrompt: `Du bist ein freundlicher Rezeptionist / eine freundliche Rezeptionistin im Hotel "Berlin". Du sprichst die Gäste höflich mit "Sie" an.

KONTEXT: Hotelrezeption, Check-in. Du nimmst Gäste auf, erklärst das Frühstück, gibst Auskünfte zur Umgebung.

${baseRules}`,
  },
  {
    id: 'arzt',
    icon: '🩺',
    titleDe: 'Beim Arzt',
    titleTr: 'Doktorda',
    description: 'Hastalığını anlat, reçete al',
    difficulty: 'B1',
    color: 'bg-red-500',
    vocabulary: [
      { de: 'die Schmerzen', tr: 'ağrılar' },
      { de: 'das Fieber', tr: 'ateş' },
      { de: 'verschreiben', tr: 'reçete yazmak' },
      { de: 'der Termin', tr: 'randevu' },
      { de: 'das Rezept', tr: 'reçete' },
      { de: 'Mir tut ... weh', tr: '...im ağrıyor' },
      { de: 'Ich bin seit ... krank', tr: '...dir beri hastayım' },
    ],
    samplePhrases: [
      'Mir tut der Kopf weh.',
      'Ich habe seit drei Tagen Fieber.',
      'Können Sie mir ein Rezept verschreiben?',
      'Wann soll ich wieder kommen?',
      'Ich fühle mich nicht gut.',
    ],
    opener: 'Guten Tag. Was fehlt Ihnen? Wo haben Sie Schmerzen und seit wann?',
    systemPrompt: `Du bist ein erfahrener Arzt / eine erfahrene Ärztin in einer Hausarztpraxis. Du sprichst Patienten ruhig und professionell mit "Sie" an.

KONTEXT: Arztpraxis, Sprechstunde. Du fragst nach Symptomen, gibst Ratschläge und verschreibst bei Bedarf ein Rezept.

${baseRules}`,
  },
  {
    id: 'smalltalk',
    icon: '💬',
    titleDe: 'Small Talk & Hobbys',
    titleTr: 'Sohbet & Hobiler',
    description: 'Partide sohbet et, hobilerinden bahset',
    difficulty: 'A2',
    color: 'bg-purple-500',
    vocabulary: [
      { de: 'die Hobbys', tr: 'hobiler' },
      { de: 'gern machen', tr: 'hoşlanarak yapmak' },
      { de: 'am Wochenende', tr: 'hafta sonu' },
      { de: 'sich interessieren für', tr: '...ilgilenmek' },
      { de: 'treffen', tr: 'buluşmak' },
      { de: 'Ich spiele gern...', tr: '...oynamayı severim' },
      { de: 'Was machst du gern?', tr: 'Ne yapmaktan hoşlanırsın?' },
    ],
    samplePhrases: [
      'Was machst du gern in deiner Freizeit?',
      'Ich spiele gern Fußball.',
      'Am Wochenende treffe ich Freunde.',
      'Ich interessiere mich für Musik.',
      'Hast du am Wochenende etwas vor?',
    ],
    opener: 'Hi! Hier ist ja ganz schön viel los, oder? Ich bin übrigens Tom. Was machst du gern in deiner Freizeit?',
    systemPrompt: `Du bist Tom, ein freundlicher Bekannter auf einer Party. Du sprichst locker mit "du" und führst eine entspannte Smalltalk-Unterhaltung über Hobbys, Wochenende und Interessen.

KONTEXT: Hausparty am Samstagabend. Du lernst jemanden neu kennen und unterhältst dich über Freizeit, Hobbys und Pläne.

${baseRules}`,
  },
  {
    id: 'beruf',
    icon: '💼',
    titleDe: 'Vorstellungsgespräch',
    titleTr: 'İş Görüşmesi',
    description: 'İş görüşmesinde soruları cevapla',
    difficulty: 'B2',
    color: 'bg-slate-600',
    vocabulary: [
      { de: 'der Beruf', tr: 'meslek' },
      { de: 'die Erfahrung', tr: 'deneyim' },
      { de: 'die Stärken', tr: 'güçlü yönler' },
      { de: 'sich bewerben', tr: 'başvurmak' },
      { de: 'seit ... arbeiten', tr: '...dir çalışmak' },
      { de: 'verantwortlich für', tr: '...den sorumlu' },
      { de: 'Warum möchten Sie bei uns arbeiten?', tr: 'Neden bizimle çalışmak istiyorsunuz?' },
    ],
    samplePhrases: [
      'Ich arbeite seit fünf Jahren als...',
      'Meine Stärken sind...',
      'Ich möchte mich weiterentwickeln.',
      'In meiner jetzigen Position bin ich verantwortlich für...',
      'Ich bewerbe mich, weil...',
    ],
    opener: 'Guten Tag, schön, dass Sie da sind. Erzählen Sie doch kurz etwas über sich und Ihre berufliche Erfahrung.',
    systemPrompt: `Du bist Frau Müller, eine professionelle HR-Managerin in einem mittelständischen Unternehmen. Du führst ein Vorstellungsgespräch und sprichst die Bewerberin / den Bewerber formell mit "Sie" an.

KONTEXT: Vorstellungsgespräch in einem Unternehmen. Du stellst typische Fragen: Vorstellung, Erfahrung, Stärken, Motivation. Nach 6-8 Fragen kannst du das Gespräch abschließen.

${baseRules}`,
  },
  {
    id: 'wohnung',
    icon: '🏠',
    titleDe: 'Wohnungssuche',
    titleTr: 'Ev Arama',
    description: 'Ev ilanı hakkında bilgi al, görüntüleme ayarla',
    difficulty: 'B1',
    color: 'bg-indigo-500',
    vocabulary: [
      { de: 'die Wohnung', tr: 'daire' },
      { de: 'die Miete', tr: 'kira' },
      { de: 'die Kaution', tr: 'depozito' },
      { de: 'das Zimmer', tr: 'oda' },
      { de: 'ansehen', tr: 'görmek (ev)' },
      { de: 'Wie viel ist die Miete?', tr: 'Kira ne kadar?' },
      { de: 'Wann kann ich die Wohnung ansehen?', tr: 'Evi ne zaman görebilirim?' },
    ],
    samplePhrases: [
      'Ich rufe wegen der Wohnung an.',
      'Wie viel ist die Miete?',
      'Wie viele Zimmer hat die Wohnung?',
      'Ist die Kaution hoch?',
      'Wann kann ich die Wohnung ansehen?',
    ],
    opener: 'Hallo, hier ist Müller. Sie haben sich für die Wohnung interessiert? Was möchten Sie wissen?',
    systemPrompt: `Du bist Herr Müller, ein Vermieter, der eine Wohnung zu vermieten hat. Du sprichst mit potenziellen Mietern freundlich mit "Sie".

KONTEXT: Telefonat über eine Wohnungsanzeige. Du beantwortest Fragen zur Miete, Zimmeranzahl, Lage und machst bei Bedarf einen Besichtigungstermin aus.

${baseRules}`,
  },
];

export function getTopicById(id: string): ConversationTopic | undefined {
  return conversationTopics.find((t) => t.id === id);
}
