import json

with open('/home/z/my-project/upload/wortschatzliste_b1_1.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

def is_word(entry):
    g = entry['german'].strip()
    if not g or len(g) > 60:
        return False
    if g[0].isupper() and ' ' in g and not any(c in g for c in ['-', '/']):
        if entry.get('article', '') == '' and any(g.startswith(p) for p in ['Ich ', 'Du ', 'Er ', 'Sie ', 'Wir ', 'Das ']):
            return False
    return True

words = [w for w in raw if is_word(w)]
print(f'Filtered: {len(raw)} -> {len(words)} words')

# Comprehensive category mapping
CATEGORIES = {
    'Gesellschaft & Leben': [
        'Familie', 'Eltern', 'Kind', 'Freund', 'Beziehung', 'Heirat', 'Geburt', 'Ehe', 'Partner',
        'Frau', 'Mann', 'Mensch', 'Leben', 'Deutsche', 'Erwachsene', 'Jugend', 'Jugendlich',
        'Verein', 'Disko', 'Tanz', 'sportlich', 'Jogging', 'Stimmung', 'Vergnügen', 'einsam',
        'Freundschaft', 'Freizeit', 'Hobby', 'Interesse', 'unterhalten', 'Gesellschaft',
        'Engagement', 'Kultur', 'Kulturschock', 'Vorurteil', 'Bürgerinitiative', 'Begegnung',
        'Phase', 'Inklusion', 'Gleich', 'Ungleich', 'Ungleichheit', 'Behinderung',
        # Turkish
        'aile', 'evli', 'bekar', 'boşanmış', 'arkadaş', 'komşu', 'doğum', 'kutlama',
        'genç', 'yetişkin', 'yalnız', 'ruh hali', 'eğlence', 'dernek', 'dans', 'toplum',
        'fahri', 'gönüllü', 'kültür', 'önyargı', 'aşama', 'yurttaş', 'özveri', 'eşit',
        'eşitsizlik', 'bütünleştirme', 'engel', 'karşılaşmak', 'spor yapmak',
        'bir ülkeye göç', 'bir ülkeden göç', 'göçmek', 'göçme',
    ],
    'Arbeit & Beruf': [
        'Arbeit', 'Beruf', 'Job', 'Stelle', 'Arbeitnehmer', 'Arbeitgeber', 'Gehalt', 'Lohn',
        'Vollzeit', 'Teilzeit', 'Bewerbung', 'Kündigung', 'Ausbildung', 'Praktikum',
        'beruflich', 'Arbeitslos', 'Rente', 'Arbeitsplatz', 'Kollege', 'Chef', 'Firma',
        'Unternehmen', 'Minijob', 'Stellenanzeige', 'Lebenslauf', 'Arbeitsamt',
        'Erwerbs', 'verdienen', 'beschäftigt', 'Branche', 'Einkommen', 'finanziell',
        'Gewerkschaft', 'verhandeln', 'Bezahlung', 'Chance', 'Tätigkeit',
        'durchsetzen', 'verbessern', 'steigen', 'sinken', 'Betrieb', 'Arbeitgeber',
        'Angebot', 'Leistung', 'Kosten', 'Preis', 'bezahlen', 'Bezahlung',
        # Turkish
        'iş', 'meslek', 'maaş', 'başvuru', 'mülakat', 'çalışan', 'işveren', 'sigorta',
        'kadrolu', 'yarım zamanlı', 'işsiz', 'emeklilik', 'sektör', 'geli', 'verim',
        'sendika', 'pazarlık', 'öğretmen', 'görev', 'faaliyet', 'fırsat', 'mali',
        'yükselmek', 'alçalmak', 'katkıda bulunmak', 'istediğini yaptırmak',
    ],
    'Kommunikation & Medien': [
        'Gespräch', 'Nachricht', 'E-Mail', 'Telefon', 'Anruf', 'Antwort', 'Frage',
        'meinen', 'Meinung', 'sagen', 'erzählen', 'Information', 'Kontakt', 'Schreiben',
        'Brief', 'Anzeige', 'erklären', 'diskutieren', 'streiten', 'ansprechen',
        'Kommunikation', 'medium', 'Medien', 'Zeitung', 'Artikel', 'Online',
        'Digitalisierung', 'KI', 'Intelligenz', 'formulieren', 'Argument',
        'Kenntnis', 'Verständnis', 'zustimmen', 'meinen', 'befürworten',
        'meinen', 'darüber', 'sicher', 'unsicher', 'nämlich', 'also', 'doch',
        'allerdings', 'jedenfalls', 'irgendwann', 'ebenfalls', 'zwar',
        # Turkish
        'iletişim', 'mesaj', 'haber', 'görüş', 'fikir', 'düşünce', 'söylemek',
        'anlatmak', 'hitap', 'gazete', 'makale', 'dijital', 'yapay zeka', 'argüman',
        'bilgi', 'anlayış', 'onaylamak', 'ifade', 'rastgele', 'isim', 'yani', 'fakat',
    ],
    'Wohnen & Immobilie': [
        'Wohnen', 'Wohnung', 'Haus', 'Miete', 'Vermieter', 'Mieter', 'Zimmer', 'Küche',
        'Möbel', 'Einwohnermeldeamt', 'Wohnsitz', 'Wohngebiet', 'Umzug', 'umziehen',
        'einrichten', 'Einrichtung', 'Gegend', 'Karton', 'Koffer', 'aufbauen',
        'Wohnheim', 'WG', 'Mietvertrag', 'Nachbarschaft', 'Nachbar', 'Bereich',
        'Auswahl', 'Atmosphäre', 'Art', 'anfassen', 'achten',
        # Turkish
        'konut', 'kira', 'ev', 'daire', 'oda', 'mutfak', 'mobilya', 'taşınmak',
        'ikamet', 'nüfus', 'bölge', 'bavul', 'kurmak', 'tür', 'atmosfer', 'seçim',
        'yöresel', 'yıllık', 'ortak', 'yakın', 'yakınlık', 'tesis', 'tezgah',
    ],
    'Reise & Verkehr': [
        'Reise', 'Flug', 'Zug', 'Bahnhof', 'Fahrkarte', 'Fahrer', 'Verkehr', 'Bus',
        'Strecke', 'Fahrplan', 'Fahrgast', 'Fernbus', 'Mietwagen', 'Station', 'Ticket',
        'Rucksack', 'Fahrt', 'Reisende', 'Verbindung', 'Abfahrt', 'Ankunft',
        'Fahrzeug', 'Umsteigen', 'pendeln', 'Anbieter', 'Strom',
        # Turkish
        'seyahat', 'uçak', 'tren', 'bilet', 'istasyon', 'güzergah', 'otobüs',
        'yolculuk', 'araç', 'tedarik', 'elektrik', 'gidip gelmek',
    ],
    'Umwelt & Konsum': [
        'Umwelt', 'Müll', 'Papier', 'Plastik', 'recycling', 'Bio', 'ökologisch',
        'Klima', 'Energie', 'Verpackung', 'umweltfreundlich', 'Produzent', 'regional',
        'verpackt', 'unverpackt', 'entsorgen', 'Wertstoff', 'Pfand', 'klimafreundlich',
        'Ressource', 'nachhaltig', 'Umweltschutz', 'Abfall', 'CO2', 'Trennung',
        'entsorgen', 'Papiermüll', 'Glas', 'Bio-', 'umwelt',
        # Turkish
        'çevre', 'ambalaj', 'geri dönüşüm', 'plastik', 'enerji', 'atık', 'kutu',
        'bölme', 'desteklemek', 'ödünç', 'bedava', 'pahalı', 'ucuz', 'kaliteli',
        'yöresel', 'tedarik', 'sürdürülebilir',
    ],
    'Bildung & Sprache': [
        'Bildung', 'Schule', 'Kurs', 'Unterricht', 'Lehrer', 'Schüler', 'Prüfung',
        'Zertifikat', 'Sprache', 'lernen', 'studieren', 'Einschreibung', 'Voraussetzung',
        'Note', 'Fach', 'Semester', 'Uni', 'bildungspolitisch', 'Förderung', 'fördern',
        'Wortschatz', 'Grammatik', 'Prüfungswortschatz', 'Schul', 'Vorteil', 'Nachteil',
        'Entscheidung', 'Erfahrung', 'Schwierigkeit', 'leicht', 'schwer', 'wertvoll',
        'betreffen', 'belastend', 'scheitern',
        # Turkish
        'eğitim', 'okul', 'kurs', 'sınav', 'belge', 'dil', 'öğrenmek', 'sertifika',
        'avantaj', 'dezavantaj', 'karar', 'deneyim', 'zorluk', 'ağır', 'rahat', 'hafif',
        'değerli', 'yükle', 'ön koşul', 'destek', 'ortalama', 'yüzyıl', 'onyıl',
    ],
    'Gesundheit & Pflege': [
        'Gesundheit', 'Krankheit', 'Arzt', 'Krankenhaus', 'Medikament', 'Versicherung',
        'Krankenkasse', 'behandeln', 'Operation', 'Gesundheitsamt', 'Rezept', 'Impfung',
        'Vorbeugung', 'gesund', 'krank', 'Gesundheitsversorgung', 'Pflege', 'pflegen',
        'Körper', 'Ernährung', 'sportlich',
        # Turkish
        'sağlık', 'hastalık', 'doktor', 'hastane', 'ilaç', 'tedavi', 'ameliyat', 'reçete',
    ],
    'Verwaltung & Recht': [
        'Behörde', 'Anmeldung', 'Formular', 'Ausweis', 'Visum', 'Aufenthalt', 'Genehmigung',
        'Stempel', 'Frist', 'Widerruf', 'Vertrag', 'gesetzlich', 'Pflicht', 'Recht',
        'erlauben', 'verbieten', 'Antrag', 'Dokument', 'Bürokratie', 'Behördengang',
        'Staat', 'staatlich', 'Gesetz', 'Regelung', 'Vorschrift', 'erteilen', 'abschaffen',
        'Widerrufsrecht', 'widerrufen', 'Leistung', 'Anbieter',
        # Turkish
        'resmi', 'hukuk', 'formül', 'belge', 'kimlik', 'vize', 'süre', 'yasa', 'izin',
        'kayıt', 'iptal', 'hak', 'yükümlülük',
    ],
    'Alltag & Leben': [
        'Einkauf', 'Geschäft', 'Supermarkt', 'alltäglich', 'alltag', 'leisten', 'teilen',
        'ausleihen', 'begegnen', 'zufällig', 'Durchschnitt', 'Jahrhundert', 'Jahrzehnt',
        'sportlich', 'unterstützen', 'Unterstützung', 'Sport', 'treiben', 'Es fällt mir',
        # Turkish
        'günlük', 'alışveriş', 'mağaza', 'market', 'yardımcı', 'bölmek', 'rahat',
    ],
}

CAT_TR_MAP = {
    'Gesellschaft & Leben': 'Toplum & Yaşam',
    'Arbeit & Beruf': 'İş & Meslek',
    'Kommunikation & Medien': 'İletişim & Medya',
    'Wohnen & Immobilie': 'Konut & Yaşam',
    'Umwelt & Konsum': 'Çevre & Tüketim',
    'Bildung & Sprache': 'Eğitim & Dil',
    'Gesundheit & Pflege': 'Sağlık',
    'Verwaltung & Recht': 'İdare & Hukuk',
    'Reise & Verkehr': 'Seyahat & Ulaşım',
    'Alltag & Leben': 'Günlük Yaşam',
    'Allgemein': 'Genel',
}

def categorize(w):
    g = w['german'].lower()
    t = w['translation'].lower()
    
    best_cat = 'Allgemein'
    best_score = 0
    
    for cat, keywords in CATEGORIES.items():
        if cat == 'Allgemein':
            continue
        score = 0
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower in g:
                score += 3
            if kw_lower in t:
                score += 2
        if score > best_score:
            best_score = score
            best_cat = cat
    
    return best_cat if best_score > 0 else 'Allgemein'

result = []
for i, w in enumerate(words):
    cat = categorize(w)
    german = w['german'].strip()
    article = w.get('article', '').strip()
    
    if article and german.startswith(article + ' '):
        german = german[len(article)+1:].strip()
    
    entry = {
        'id': f'b1w_{i+1}',
        'german': (article + ' ' + german) if article else german,
        'article': article or None,
        'plural': w.get('plural', '').strip() or None,
        'turkish': w['translation'].strip(),
        'example': w.get('example_sentence', '').strip(),
        'topic': cat,
        'topicTr': CAT_TR_MAP.get(cat, 'Genel'),
    }
    result.append(entry)

from collections import Counter
cats = Counter(e['topic'] for e in result)
print('\nKategori dağılımı:')
for c, n in cats.most_common():
    pct = round(n/len(result)*100)
    print(f'  {c:35s}: {n:3d} ({pct}%)')

with open('/home/z/my-project/src/lib/b1-exam-vocab.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f'\nSaved {len(result)} words')
