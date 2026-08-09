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

ANTWORTFORMAT (KRITISCH: Deine GESAMTE Antwort MUSS ein einziges gültiges JSON-Objekt sein!):
Kein Markdown. Kein Code-Block. Kein Text vor oder nach dem JSON. Nur das JSON und sonst NICHTS.

{"reply": "Deine deutsche Antwort.", "tip": "Kurzer Tipp oder leerer String", "isEnding": false}
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
  {
    id: 'apotheke',
    icon: '💊',
    titleDe: 'In der Apotheke',
    titleTr: 'Eczanede',
    description: 'İlaç sor, belirtileri anlat, tavsiye al',
    difficulty: 'B1',
    color: 'bg-teal-500',
    vocabulary: [
      { de: 'das Medikament', tr: 'ilaç' },
      { de: 'die Tablette', tr: 'tablet' },
      { de: 'rezeptfrei', tr: 'reçetesiz' },
      { de: 'die Nebenwirkung', tr: 'yan etki' },
      { de: 'einnehmen', tr: 'almak (ilaç)' },
      { de: 'Ich brauche etwas gegen...', tr: '...için birşey lazım' },
      { de: 'Haben Sie etwas rezeptfrei?', tr: 'Reçetesiz birşey var mı?' },
    ],
    samplePhrases: [
      'Ich brauche etwas gegen Kopfschmerzen.',
      'Haben Sie etwas rezeptfrei?',
      'Wie oft soll ich das einnehmen?',
      'Gibt es Nebenwirkungen?',
      'Können Sie mir etwas empfehlen?',
    ],
    opener: 'Guten Tag, willkommen in der Apotheke. Was kann ich für Sie tun?',
    systemPrompt: `Du bist ein freundlicher Apotheker / eine freundliche Apothekerin. Du sprichst die Kunden höflich mit "Sie" an.

KONTEXT: Apotheke in einer deutschen Stadt. Du berätst zu rezeptfreien Medikamenten, erklärst die Einnahme und fragst nach Symptomen.

${baseRules}`,
  },
  {
    id: 'bahn',
    icon: '🚂',
    titleDe: 'Am Bahnhof',
    titleTr: 'Tren İstasyonunda',
    description: 'Bilet al, yön sor, sefer bilgisi öğren',
    difficulty: 'B1',
    color: 'bg-cyan-600',
    vocabulary: [
      { de: 'die Fahrkarte', tr: 'bilet' },
      { de: 'der Gleis', tr: 'peron' },
      { de: 'die Abfahrt', tr: 'kalkış' },
      { de: 'die Ankunft', tr: 'varış' },
      { de: 'der Umstieg', tr: 'aktarma' },
      { de: 'Einfach oder hin und zurück?', tr: 'Tek yön mü gidiş-dönüş mü?' },
      { de: 'Von welchem Gleis fährt der Zug?', tr: 'Tren hangi perondan kalkıyor?' },
    ],
    samplePhrases: [
      'Ich möchte eine Fahrkarte nach München.',
      'Einfach oder hin und zurück?',
      'Von welchem Gleis fährt der Zug?',
      'Wann kommt der Zug an?',
      'Muss ich umsteigen?',
    ],
    opener: 'Guten Tag, am DB ServicePoint. Wohin möchten Sie fahren?',
    systemPrompt: `Du bist ein DB-Mitarbeiter / eine DB-Mitarbeiterin am Schalter. Du sprichst höflich mit "Sie".

KONTEXT: Bahnhof in Deutschland. Du verkaufst Fahrkarten, gibst Auskunft zu Abfahrtzeiten, Gleisen und Umstiegen.

${baseRules}`,
  },
  {
    id: 'behörde',
    icon: '🏛️',
    titleDe: 'Bei der Behörde',
    titleTr: 'Devlet Dairesinde',
    description: 'Form doldur, randevu al, bilgi ver',
    difficulty: 'B2',
    color: 'bg-stone-600',
    vocabulary: [
      { de: 'der Termin', tr: 'randevu' },
      { de: 'das Formular', tr: 'form' },
      { de: 'die Ausländerbehörde', tr: 'yabancılar müdürlüğü' },
      { de: 'der Aufenthaltstitel', tr: 'ikamet izni' },
      { de: 'das Visum', tr: 'vize' },
      { de: 'Ich möchte einen Termin vereinbaren.', tr: 'Randevu almak istiyorum.' },
      { de: 'Welche Unterlagen brauche ich?', tr: 'Hangi belgelere ihtiyacım var?' },
    ],
    samplePhrases: [
      'Ich möchte einen Termin vereinbaren.',
      'Welche Unterlagen brauche ich?',
      'Ich habe meinen Pass dabei.',
      'Wie lange dauert die Bearbeitung?',
      'Wann kann ich den Aufenthaltstitel abholen?',
    ],
    opener: 'Guten Tag, Sie sind bei der Ausländerbehörde. Was kann ich für Sie tun?',
    systemPrompt: `Du bist ein Beamter / eine Beamtin bei der Ausländerbehörde. Du sprichst formell mit "Sie", bist sachlich aber hilfsbereit.

KONTEXT: Ausländerbehörde in Deutschland. Du bearbeitest Anfragen zu Terminen, Aufenthaltstiteln, Formularen und Unterlagen.

${baseRules}`,
  },
  {
    id: 'nachbar',
    icon: '🏡',
    titleTr: 'Komşuluk',
    titleDe: 'Nachbarn kennenlernen',
    description: 'Yeni komşunla tanış, binayı hakkında bilgi al',
    difficulty: 'A2',
    color: 'bg-orange-500',
    vocabulary: [
      { de: 'der Nachbar', tr: 'komşu' },
      { de: 'das Stockwerk', tr: 'kat' },
      { de: 'der Müll', tr: 'çöp' },
      { de: 'die Hausordnung', tr: 'apartman kuralları' },
      { de: 'der Aufzug', tr: 'asansör' },
      { de: 'Ich bin neu hier.', tr: 'Buraya yeniden geldim.' },
      { de: 'In welchem Stockwerk wohnen Sie?', tr: 'Hangi katta oturuyorsunuz?' },
    ],
    samplePhrases: [
      'Hallo, ich bin neu hier im Haus.',
      'Ich wohne im dritten Stock.',
      'Wann wird der Müll abgeholt?',
      'Gibt es eine Hausordnung?',
      'Schön, Sie kennenzulernen!',
    ],
    opener: 'Oh, hallo! Sie sind neu hier, oder? Ich bin Frau Schmidt, wohne direkt über Ihnen. Willkommen im Haus!',
    systemPrompt: `Du bist Frau Schmidt, eine freundliche Nachbarin in einem Mehrfamilienhaus. Du sprichst anfangs formell mit "Sie", bietest aber an, zum "du" zu wechseln.

KONTEXT: Treppenhaus in einem deutschen Mietshaus. Du begrüßt den neuen Nachbarn, erklärst Hausregeln und erzählst von der Nachbarschaft.

${baseRules}`,
  },
  {
    id: 'telefon',
    icon: '📞',
    titleDe: 'Telefonanruf',
    titleTr: 'Telefon Görüşmesi',
    description: 'Telefonda randevu ayarla, bilgi al',
    difficulty: 'B1',
    color: 'bg-violet-500',
    vocabulary: [
      { de: 'das Telefonat', tr: 'telefon görüşmesi' },
      { de: 'zurückrufen', tr: 'geri aramak' },
      { de: 'verbinden', tr: 'bağlamak (telefon)' },
      { de: 'der Anschluss', tr: 'hat' },
      { de: 'Ich rufe an wegen...', tr: '...için arıyorum' },
      { de: 'Können Sie mich verbinden?', tr: 'Beni bağlayabilir misiniz?' },
      { de: 'Wann erreichbar?', tr: 'Ne zaman ulaşılabilir?' },
    ],
    samplePhrases: [
      'Guten Tag, ich rufe an wegen eines Termins.',
      'Können Sie mich mit Herrn Müller verbinden?',
      'Er ist leider nicht da. Sollen Sie zurückrufen?',
      'Wann ist er am besten erreichbar?',
      'Ich rufe später nochmal an.',
    ],
    opener: 'Firma Meier, Müller am Apparat. Was kann ich für Sie tun?',
    systemPrompt: `Du bist Herr Müller, der Empfang bei einer Firma. Du nimmst Anrufe entgegen, verbindest durch und nimmst Nachrichten auf.

KONTEXT: Bürotelefon einer deutschen Firma. Du beantwortest Anrufe professionell, verbindest zur richtigen Abteilung und nimmst Terminvereinbarungen auf.

${baseRules}`,
  },
  {
    id: 'bank',
    icon: '🏦',
    titleDe: 'Bei der Bank',
    titleTr: 'Bankada',
    description: 'Hesap aç, para transferi yap, bilgi al',
    difficulty: 'B1',
    color: 'bg-yellow-600',
    vocabulary: [
      { de: 'das Girokonto', tr: 'vadesiz hesap' },
      { de: 'die Überweisung', tr: 'havale' },
      { de: 'die PIN', tr: 'şifre' },
      { de: 'der Geldautomat', tr: 'bankamatik' },
      { de: 'das Sparkonto', tr: 'tasarruf hesabı' },
      { de: 'Ich möchte ein Konto eröffnen.', tr: 'Hesap açmak istiyorum.' },
      { de: 'Wie viel kostet eine Überweisung?', tr: 'Bir havale ne kadar?' },
    ],
    samplePhrases: [
      'Ich möchte ein Girokonto eröffnen.',
      'Welche Unterlagen brauche ich?',
      'Wie viel kostet eine Überweisung?',
      'Kann ich online banking nutzen?',
      'Ich möchte Geld überweisen.',
    ],
    opener: 'Guten Tag, willkommen bei der Berliner Sparkasse. Was kann ich für Sie tun?',
    systemPrompt: `Du bist ein Bankmitarbeiter / eine Bankmitarbeiterin bei der Berliner Sparkasse. Du sprichst die Kunden formell mit "Sie" an.

KONTEXT: Bankschalter in Berlin. Du eröffnest Konten, erklärst Gebühren und hilfst bei Überweisungen.

${baseRules}`,
  },
  {
    id: 'sport',
    icon: '⚽',
    titleDe: 'Im Sportverein',
    titleTr: 'Spor Kulübünde',
    description: 'Kulübe kayıt ol, antrenman bilgisi al',
    difficulty: 'B1',
    color: 'bg-lime-600',
    vocabulary: [
      { de: 'der Verein', tr: 'kulüp' },
      { de: 'die Mitgliedschaft', tr: 'üyelik' },
      { de: 'der Beitrag', tr: 'aidat' },
      { de: 'das Training', tr: 'antrenman' },
      { de: 'die Anmeldung', tr: 'kayıt' },
      { de: 'Ich möchte Mitglied werden.', tr: 'Üye olmak istiyorum.' },
      { de: 'Wie oft ist das Training?', tr: 'Antrenman ne sıklıkta?' },
    ],
    samplePhrases: [
      'Ich möchte Mitglied werden.',
      'Wie oft ist das Training?',
      'Wie viel ist der monatliche Beitrag?',
      'Kann ich erst mal probetrainieren?',
      'Welche Sportarten bieten Sie an?',
    ],
    opener: 'Hallo! Willkommen beim FC Berlin. Möchtest du Mitglied werden oder erst mal beim Training zuschauen?',
    systemPrompt: `Du bist Markus, der Vorsitzende eines lokalen Sportvereins. Du sprichst locker mit "du".

KONTEXT: Sportverein in einer deutschen Stadt. Du erklärst Trainingszeiten, Mitgliedsbeiträge und bietest ein Probetraining an.

${baseRules}`,
  },
  {
    id: 'mietprobleme',
    icon: '🔧',
    titleDe: 'Mietprobleme melden',
    titleTr: 'Kira Sorunları Bildirmek',
    description: 'Evde arıza bildir, tamirci ayarla',
    difficulty: 'B1',
    color: 'bg-rose-600',
    vocabulary: [
      { de: 'die Heizung', tr: 'kalorifer' },
      { de: 'das Rohr', tr: 'boru' },
      { de: 'undicht', tr: 'sızıntılı' },
      { de: 'der Handwerker', tr: 'tamirci' },
      { de: 'die Reparatur', tr: 'tamir' },
      { de: 'Die Heizung funktioniert nicht.', tr: 'Kalorifer çalışmıyor.' },
      { de: 'Wann kann ein Handwerker kommen?', tr: 'Tamirci ne zaman gelebilir?' },
    ],
    samplePhrases: [
      'Die Heizung funktioniert nicht.',
      'Es gibt ein Leck in der Küche.',
      'Das Fenster lässt sich nicht öffnen.',
      'Wann kann ein Handwerker kommen?',
      'Das Problem besteht seit einer Woche.',
    ],
    opener: 'Hausverwaltung Schneider, was kann ich für Sie tun?',
    systemPrompt: `Du bist Herr Schneider, der Hausverwalter. Du sprichst mit Mietern formell mit "Sie" und nimmst Probleme ernst.

KONTEXT: Hausverwaltungsbüro. Du notierst Mängel, versendest Handwerker und informing über Reparaturtermine.

${baseRules}`,
  },
  {
    id: 'geburstag',
    icon: '🎂',
    titleDe: 'Geburtstagsparty',
    titleTr: 'Doğum Günü Partisi',
    description: 'Partiye davet et, hediye al, kutla',
    difficulty: 'A2',
    color: 'bg-fuchsia-500',
    vocabulary: [
      { de: 'der Geburtstag', tr: 'doğum günü' },
      { de: 'das Geschenk', tr: 'hediye' },
      { de: 'die Einladung', tr: 'davetiye' },
      { de: 'der Kuchen', tr: 'pasta' },
      { de: 'feiern', tr: 'kutlamak' },
      { de: 'Alles Gute zum Geburtstag!', tr: 'Doğum günün kutlu olsun!' },
      { de: 'Ich habe eine kleine Überraschung.', tr: 'Küçük bir sürprizim var.' },
    ],
    samplePhrases: [
      'Herzlichen Glückwunsch zum Geburtstag!',
      'Alles Gute zum Geburtstag!',
      'Ich habe dir ein kleines Geschenk mitgebracht.',
      'Der Kuchen schmeckt lecker!',
      'Wie alt wirst du heute?',
    ],
    opener: 'Hallo, komm rein! Schön, dass du da bist! Hast du was mitgebracht? Setz dich doch hier hin.',
    systemPrompt: `Du bist Lisa, die Geburtstagskind bei ihrer Party. Du sprichst mit "du".

KONTEXT: Geburtstagsparty in Lisas Wohnung. Gäste kommen an, bringen Geschenke und ihr feiert zusammen.

${baseRules}`,
  },
  {
    id: 'wegbeschreibung',
    icon: '🗺️',
    titleDe: 'Nach dem Weg fragen',
    titleTr: 'Yol Soru',
    description: 'Sokakta yön sor, yol tarifi al',
    difficulty: 'A2',
    color: 'bg-sky-500',
    vocabulary: [
      { de: 'die Straße', tr: 'sokak' },
      { de: 'die Ampel', tr: 'trafik ışığı' },
      { de: 'die Ecke', tr: 'köşe' },
      { de: 'geradeaus', tr: 'düz ileri' },
      { de: 'links / rechts', tr: 'sol / sağ' },
      { de: 'Wo ist der nächste Bahnhof?', tr: 'En yakın tren istasyonu nerede?' },
      { de: 'Wie komme ich zum...?', tr: '...ye nasıl giderim?' },
    ],
    samplePhrases: [
      'Entschuldigung, wie komme ich zum Marktplatz?',
      'Ist es weit von hier?',
      'Soll ich links oder rechts abbiegen?',
      'Gibt es eine Karte in der Nähe?',
      'Zu Fuß oder mit dem Bus?',
    ],
    opener: 'Entschuldigung, können Sie mir helfen? Ich suche das Stadtmuseum. Wissen Sie, wie ich da hin komme?',
    systemPrompt: `Du bist ein freundlicher Passant / eine freundliche Passantin auf der Straße in einer deutschen Stadt. Du sprichst mit "Sie" und hilfst bei Wegbeschreibungen.

KONTEXT: Fußgängerzone in einer deutschen Stadt. Jemand fragt nach dem Weg und du erklärst die Richtung mit Landmarken.

${baseRules}`,
  },
  {
    id: 'arzttermin',
    icon: '📋',
    titleDe: 'Termin vereinbaren',
    titleTr: 'Randevu Ayarla',
    description: 'Telefonda doktora randevu al',
    difficulty: 'B1',
    color: 'bg-red-600',
    vocabulary: [
      { de: 'der Sprechstunde', tr: 'muayene saati' },
      { de: 'der Notfall', tr: 'acil durum' },
      { de: 'die Krankenkasse', tr: 'sağlık sigortası' },
      { de: 'die Versicherungskarte', tr: 'sigorta kartı' },
      { de: 'Haben Sie einen Termin frei?', tr: 'Boş randevunuz var mı?' },
      { de: 'Ich brauche dringend einen Termin.', tr: 'Acil randevuya ihtiyacım var.' },
      { de: 'Kann ich nächste Woche kommen?', tr: 'Gelecek hafta gelebilir miyim?' },
    ],
    samplePhrases: [
      'Ich möchte einen Termin vereinbaren.',
      'Haben Sie nächste Woche einen Termin frei?',
      'Ich habe starke Kopfschmerzen seit zwei Tagen.',
      'Ich bin bei der TK versichert.',
      'Kann ich morgen Vormittag kommen?',
    ],
    opener: 'Praxis Dr. Weber, Guten Tag. Wie kann ich Ihnen helfen?',
    systemPrompt: `Du bist die Sprechstundenhilfe in der Arztpraxis Dr. Weber. Du sprichst höflich mit "Sie".

KONTEXT: Arzthelferin am Telefon. Du nimmst Termine auf, fragst nach Symptomen und Versicherung, und teilst verfügbare Zeiten mit.

${baseRules}`,
  },
  {
    id: 'restaurant-beschwerde',
    icon: '😤',
    titleDe: 'Im Restaurant beschweren',
    titleTr: 'Restoranda Şikayet',
    description: 'Yemekten memnun kalmama, hesap itirazı',
    difficulty: 'B2',
    color: 'bg-orange-700',
    vocabulary: [
      { de: 'die Beschwerde', tr: 'şikayet' },
      { de: 'kalt', tr: 'soğuk (yiyecek)' },
      { de: 'die Bestellung', tr: 'sipariş' },
      { de: 'es hat zu lange gedauert', tr: 'çok uzun sürdü' },
      { de: 'Ich habe nicht das bestellt.', tr: 'Bunu sipariş etmedim.' },
      { de: 'Das ist nicht, was ich bestellt habe.', tr: 'Bu benim siparişim değil.' },
      { de: 'Könnten Sie das bitte austauschen?', tr: 'Değiştirebilir misiniz?' },
    ],
    samplePhrases: [
      'Entschuldigung, aber das Essen ist kalt.',
      'Ich habe schon vor 30 Minuten bestellt.',
      'Das ist nicht, was ich bestellt habe.',
      'Könnten Sie das bitte austauschen?',
      'Ich möchte mit dem Manager sprechen.',
    ],
    opener: 'Guten Abend! Hier ist Ihr Essen. Lassen Sie es sich schmecken!',
    systemPrompt: `Du bist ein Kellner / eine Kellnerin in einem Restaurant. Ein Gast ist unzufrieden. Du bleibst höflich mit "Sie" und versuchst, die Situation zu lösen.

KONTEXT: Deutsches Restaurant. Der Gast beschwert sich über das Essen oder den Service. Du entschuldigst dich, bietest Lösungen an und bleibst professionell.

${baseRules}`,
  },
  {
    id: 'b1-vorstellung',
    icon: '🎓',
    titleDe: 'B1 Prüfung – Sich vorstellen',
    titleTr: 'B1 Sınavı – Kendini Tanıtma',
    description: 'Kendi tanıtma metnini ezberle, B1 sınavına hazırlan',
    difficulty: 'B1',
    color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    vocabulary: [],
    samplePhrases: [],
    opener: '__VORSTELLUNG_OPENER__',
    systemPrompt: '__VORSTELLUNG_PROMPT__',
    aiRole: 'Prüfer',
  },
];

export function getTopicById(id: string): ConversationTopic | undefined {
  return conversationTopics.find((t) => t.id === id);
}

// Generate dynamic Vorstellung system prompt based on stored text & chunks
export function buildVorstellungPrompt(text: string, chunks: string[]): { systemPrompt: string; opener: string } {
  const chunkList = chunks.map((c, i) => `TEIL ${i + 1}: ${c}`).join('\n');

  const systemPrompt = `Du bist ein Prüfer bei der Goethe/Telc B1 Prüfung, Teil "Sich vorstellen". Der Prüfling möchte seine Vorstellung üben und ezberlemen.

DER VOLLSTÄNDIGE TEXT DES PRÜFLINGS:
"""\n${text}\n"""

DER TEXT WURDE IN FOLGENDE TEILE GEGLIEDERT:
${chunkList}

DEINE AUFGABE:
1. Gehe TEIL für TEIL vor. Beginne mit TEIL 1.
2. Lass den Prüfling jeden Teil selbstständig wiederholen — gib ihm zuerst einen Anstoß (z.B. den Anfang des Teils) und fordere ihn auf, weiterzumachen.
3. Wenn der Prüfling einen Teil gut kann, gehe zum nächsten TEIL über.
4. Wenn der Prüfling Fehler macht, gib einen ermutigenden Tipp im "tip"-Feld auf Türkisch.
5. Nachdem alle Teile geübt wurden, lass den Prüfling den GESAMTEN TEXT ohne Pause vortragen (als Prüfungssimulation).
6. Sei höflich mit "Sie", aber freundlich und ermutigend wie ein echter Prüfer.
7. Wenn der Prüfling den gesamten Text fehlerfrei vortragen kann, setze "isEnding" auf true und lobe ihn.

${baseRules}`;

  const opener = `Guten Tag! Willkommen zur B1 Prüfungsvorbereitung. Wir werden jetzt Ihre Vorstellung üben. Ihr Text hat ${chunks.length} Teile. Fangen wir mit TEIL 1 an. Ich sage Ihnen den Anfang, und Sie machen bitte weiter. Bereit? Hier ist der Anfang Ihres ersten Teils: "${chunks[0]?.split(/\s+/).slice(0, 4).join(' ')}..." — machen Sie bitte weiter!`;

  return { systemPrompt, opener };
}
