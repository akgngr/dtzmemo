export interface WordPair {
  id: string;
  german: string;
  turkish: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  nameTr: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { id: "giris", name: "Begrüßung", nameTr: "Giriş Kalıpları", icon: "Handshake", color: "emerald" },
  { id: "yardim-isteme", name: "Um Hilfe bitten", nameTr: "Yardım İsteme", icon: "HandHelping", color: "amber" },
  { id: "yardim-etme", name: "Jemandem helfen", nameTr: "Birine Yardım", icon: "HandHelping", color: "amber" },
  { id: "durum", name: "Situation ausdrücken", nameTr: "Durum İfade Etme", icon: "MessageSquare", color: "teal" },
  { id: "davet", name: "Einladung", nameTr: "Davet", icon: "Mail", color: "rose" },
  { id: "davet-kabul", name: "Einladung annehmen", nameTr: "Davet Kabul", icon: "CheckCircle", color: "green" },
  { id: "davet-red", name: "Einladung ablehnen", nameTr: "Davet Reddetme/Özür", icon: "X", color: "red" },
  { id: "tesekkur", name: "Dankeschön", nameTr: "Teşekkür", icon: "Heart", color: "pink" },
  { id: "gelisme", name: "Entwicklung", nameTr: "Gelişme Cümleleri", icon: "ArrowRight", color: "lime" },
  { id: "sikayet", name: "Beschwerde", nameTr: "Şikayet", icon: "AlertTriangle", color: "red" },
  { id: "gorev", name: "Aufgabe erinnern", nameTr: "Görev Hatırlatma", icon: "Bell", color: "orange" },
  { id: "garanti", name: "Garantie", nameTr: "Garanti", icon: "Shield", color: "cyan" },
  { id: "bilgi-isteme", name: "Information einholen", nameTr: "Bilgi İsteme", icon: "Search", color: "teal" },
  { id: "hizli-cozum", name: "Schnelle Lösung", nameTr: "Hızlı Çözüm", icon: "Zap", color: "yellow" },
  { id: "bilgi-verme", name: "Information geben", nameTr: "Bilgi Verme", icon: "Megaphone", color: "fuchsia" },
  { id: "tebrik", name: "Glückwunsch", nameTr: "Tebrik", icon: "PartyPopper", color: "yellow" },
  { id: "tamir", name: "Reparatur", nameTr: "Tamir/Tamirci", icon: "Wrench", color: "stone" },
  { id: "yeni-urun", name: "Neues Produkt", nameTr: "Yeni Ürün/Para İsteme", icon: "Package", color: "purple" },
  { id: "yardimci-olmazsa", name: "Ohne Hilfe", nameTr: "Yardımcı Olunmazsa", icon: "AlertTriangle", color: "red" },
  { id: "feshetme", name: "Kündigung", nameTr: "Feshetme/Teyit", icon: "FileX", color: "slate" },
  { id: "irtibat", name: "Kontakt", nameTr: "İrtibat", icon: "Phone", color: "cyan" },
  { id: "hastalik", name: "Krankheit", nameTr: "Hastalık", icon: "Thermometer", color: "orange" },
  { id: "talep", name: "Anforderung", nameTr: "Talep", icon: "ClipboardList", color: "violet" },
  { id: "termin", name: "Termin", nameTr: "Termin", icon: "Calendar", color: "violet" },
  { id: "odeme", name: "Bezahlung", nameTr: "Ödeme", icon: "CreditCard", color: "lime" },
  { id: "sure", name: "Dauer", nameTr: "Süre", icon: "Clock", color: "sky" },
  { id: "cevap-bekleme", name: "Antwort erwarten", nameTr: "Cevap Bekleme", icon: "Clock", color: "sky" },
  { id: "hediye", name: "Geschenk", nameTr: "Hediye", icon: "Gift", color: "pink" },
  { id: "soru-sorma", name: "Fragen stellen", nameTr: "Soru Sorma", icon: "HelpCircle", color: "teal" },
  { id: "maymuncuk", name: "Universalsätze", nameTr: "Maymuncuk Cümleler", icon: "Key", color: "emerald" },
  { id: "bildbeschreibung", name: "Bildbeschreibung", nameTr: "Bildbeschreibung", icon: "Image", color: "purple" },
  { id: "deneyim", name: "Erfahrung", nameTr: "Deneyim/Kişisel", icon: "Brain", color: "emerald" },
  { id: "diger", name: "Sonstige", nameTr: "Diğer", icon: "MessageSquare", color: "slate" },
];

export const wordPairs: WordPair[] = [
  // ═══════════════ 1. Giriş Kalıpları ═══════════════
  { id: "g1", german: "Zuerst möchte ich Ihnen einen Schönen Tag wünschen. Wie geht es?", turkish: "Öncelikle size güzel bir gün diliyorum. Nasılsınız?", category: "giris" },
  { id: "g2", german: "Ich hoffe, dass alles bei Ihnen gut läuft.", turkish: "Umarım her şey sizin için iyidir.", category: "giris" },
  { id: "g3", german: "Wir haben uns so lange nicht gesehen.", turkish: "Uzun zamandır görüşmedik.", category: "giris" },
  { id: "g4", german: "Ich habe mich gefreut, wieder von dir zu hören.", turkish: "Senden tekrar haber almak beni mutlu etti.", category: "giris" },
  { id: "g5", german: "Ich habe eine gute Nachricht für dich.", turkish: "Sana iyi bir haberim var.", category: "giris" },
  { id: "g6", german: "Hast du schon gehört, was passiert ist?", turkish: "Olup bitenleri duydun mu?", category: "giris" },
  { id: "g7", german: "Ich schreibe Ihnen diese Nachricht, weil ich gehört habe, dass...", turkish: "Size bu mesajı yazıyorum, çünkü ... duydum.", category: "giris" },
  { id: "g8", german: "Ich schreibe Ihnen diese E-Mail, weil ich gehört habe, dass Sie krank sind.", turkish: "Size bu e-postayı yazıyorum, çünkü hastalandığınızı duydum.", category: "giris" },
  { id: "g9", german: "Ich schreibe, um Ihnen meine Antwort zu sagen.", turkish: "Yanıtımı vermek için yazıyorum.", category: "giris" },
  { id: "g10", german: "Ich habe angerufen, aber leider konnte ich Sie nicht erreichen.", turkish: "Aradım, ama ne yazık ki ulaşamadım.", category: "giris" },
  { id: "g11", german: "Ich erreiche bei der Firma telefonisch niemanden, deshalb schreibe ich Ihnen diese E-Mail.", turkish: "Şirkette telefonla kimseye ulaşamadım, bu yüzden size bu e-postayı yazıyorum.", category: "giris" },
  { id: "g12", german: "Ich schreibe an dich, weil ich deine Hilfe brauche.", turkish: "Sana yardımına ihtiyacım olduğu için yazıyorum.", category: "giris" },
  { id: "g13", german: "Ich schreibe Ihnen diesen Brief, weil ich Sie leider informieren möchte, dass ich meinen Vertrag bei Ihnen kündigen werde.", turkish: "Size bu mektubu yazıyorum, çünkü ne yazık ki sizinle olan sözleşmemi feshedeceğimi bildirmek istiyorum.", category: "giris" },
  { id: "g14", german: "Ich schreibe Ihnen, weil ich diese Woche nicht in den Unterricht kommen kann.", turkish: "Size yazıyorum, çünkü bu hafta derse gelemeyeceğim.", category: "giris" },
  { id: "g15", german: "Zuerst sind meine Frau und ich auf der Suche nach einer Tagesmutter, deshalb schreibe ich Ihnen.", turkish: "Öncelikle eşim ve ben bir gündüz bakıcısı arıyoruz, bu yüzden size yazıyorum.", category: "giris" },
  { id: "g16", german: "Ich wende mich an Sie, weil ich ein paar Fragen habe.", turkish: "Size başvuruyorum, çünkü birkaç sorum var.", category: "giris" },
  { id: "g17", german: "In der Zeitung habe ich gelesen, dass...", turkish: "Gazetede ... okudum.", category: "giris" },
  { id: "g18", german: "Ich wende mich an Sie, weil ich gehört habe, dass...", turkish: "Size başvuruyorum, çünkü ... duydum.", category: "giris" },
  { id: "g19", german: "Ich schreibe Ihnen diesen Brief, weil ich in meiner Tageszeitung Ihre Anzeige gesehen habe, die mich interessiert.", turkish: "Size bu mektubu yazıyorum, çünkü gazetemde ilanınızı gördüm ve ilgimi çekti.", category: "giris" },
  { id: "g20", german: "Ich möchte dir etwas erzählen.", turkish: "Sana bir şey anlatmak istiyorum.", category: "giris" },
  { id: "g21", german: "Ich möchte mich entschuldigen.", turkish: "Özür dilemek istiyorum.", category: "giris" },
  { id: "g22", german: "Leider muss ich Ihnen sagen, dass es ein Problem in meinem Haus gibt.", turkish: "Ne yazık ki size evimde bir sorun olduğunu söylemeliyim.", category: "giris" },
  { id: "g23", german: "Ich möchte sagen, dass es ein Problem in meinem Haus gibt.", turkish: "Evimde bir sorun olduğunu söylemek istiyorum.", category: "giris" },
  { id: "g24", german: "Ich schreibe Ihnen, weil ich ein Problem habe.", turkish: "Size yazıyorum, çünkü bir sorunum var.", category: "giris" },

  // ═══════════════ 2. Yardım İsteme ═══════════════
  { id: "yi1", german: "Ich bitte Sie um Hilfe, deshalb schreibe ich Ihnen diese Nachricht.", turkish: "Yardımınızı istiyorum, bu yüzden size bu mesajı yazıyorum.", category: "yardim-isteme" },
  { id: "yi2", german: "Können Sie mir bitte einen Gefallen tun?", turkish: "Bana bir iyilik yapabilir misiniz?", category: "yardim-isteme" },
  { id: "yi3", german: "Kann ich dich um einen Gefallen bitten?", turkish: "Senden bir iyilik isteyebilir miyim?", category: "yardim-isteme" },
  { id: "yi4", german: "Ich habe eine Bitte an Sie.", turkish: "Size bir ricam var.", category: "yardim-isteme" },
  { id: "yi5", german: "Wenn es kein Problem für Sie ist, könnte ich...", turkish: "Sizin için sorun değilse, ben ... yapabilir miyim?", category: "yardim-isteme" },
  { id: "yi6", german: "Ich brauche Hilfe, um das Problem zu lösen.", turkish: "Sorunu çözmek için yardıma ihtiyacım var.", category: "yardim-isteme" },
  { id: "yi7", german: "Ich brauche Ihre Hilfe für ca. 5 Stunden.", turkish: "Yaklaşık 5 saat boyunca yardımınıza ihtiyacım var.", category: "yardim-isteme" },
  { id: "yi8", german: "Hiermit möchte ich Sie höflichst darum bitten, dass Sie mir helfen können.", turkish: "Bunu yaparak sizden kibar bir şekilde yardım edebilirseniz rica ediyorum.", category: "yardim-isteme" },
  { id: "yi9", german: "Haben Sie etwas Zeit für mich?", turkish: "Benim için biraz zamanınız var mı?", category: "yardim-isteme" },
  { id: "yi10", german: "Wenn es Ihnen keine Mühe macht.", turkish: "Eğer size zahmet olmazsa.", category: "yardim-isteme" },

  // ═══════════════ 3. Birine Yardım ═══════════════
  { id: "ye1", german: "Du hast mir eine E-Mail geschrieben und mich um einen Gefallen gebeten.", turkish: "Bana bir e-posta yazdın ve bir iyilik istedin.", category: "yardim-etme" },
  { id: "ye2", german: "Kann ich dir helfen?", turkish: "Sana yardım edebilir miyim?", category: "yardim-etme" },
  { id: "ye3", german: "Ich kann Ihnen helfen.", turkish: "Size yardım edebilirim.", category: "yardim-etme" },
  { id: "ye4", german: "Kann ich etwas für Sie tun?", turkish: "Size bir şey yapabilir miyim?", category: "yardim-etme" },
  { id: "ye5", german: "Kann ich Ihnen weiterhelfen?", turkish: "Size daha fazla yardım edebilir miyim?", category: "yardim-etme" },

  // ═══════════════ 4. Durum İfade Etme ═══════════════
  { id: "d1", german: "Ich habe in meiner Wohnung ein Problem mit der Heizung.", turkish: "Dairemde ısıtma sistemiyle ilgili bir sorun var.", category: "durum" },
  { id: "d2", german: "Ich habe die Bücher im Internet bestellt.", turkish: "Kitapları internetten sipariş ettim.", category: "durum" },
  { id: "d3", german: "Ich habe die Werkzeuge online bestellt.", turkish: "Aletleri çevrimiçi sipariş ettim.", category: "durum" },
  { id: "d4", german: "Vor zwei Wochen habe ich im Internet einen Fotoapparat bei Ihnen bestellt.", turkish: "İki hafta önce internetten sizden bir fotoğraf makinesi sipariş ettim.", category: "durum" },
  { id: "d5", german: "Der Fotoapparat hat plötzlich nicht mehr funktioniert.", turkish: "Fotoğraf makinesi aniden çalışmaz oldu.", category: "durum" },
  { id: "d6", german: "Ich habe noch Garantie und möchte Sie bitten, den Fotoapparat zu reparieren.", turkish: "Hala garantim var ve sizden fotoğraf makinesini tamir etmenizi istiyorum.", category: "durum" },

  // ═══════════════ 5. Davet ═══════════════
  { id: "da1", german: "Wir werden eine Party geben.", turkish: "Bir parti vereceğiz.", category: "davet" },
  { id: "da2", german: "Ich möchte eine Party machen.", turkish: "Bir parti düzenlemek istiyorum.", category: "davet" },
  { id: "da3", german: "Wir feiern unseren Hochzeitstag.", turkish: "Evlenme yıldönümümüzü kutluyoruz.", category: "davet" },
  { id: "da4", german: "Ich möchte dich zu meinem Geburtstag einladen.", turkish: "Seni doğum günüme davet etmek istiyorum.", category: "davet" },
  { id: "da5", german: "Ich möchte euch alle zum Geburtstag einladen.", turkish: "Hepinizi doğum günüme davet etmek istiyorum.", category: "davet" },
  { id: "da6", german: "Gemeinsam mit unseren Freunden wollen wir feiern.", turkish: "Arkadaşlarımızla birlikte kutlamak istiyoruz.", category: "davet" },
  { id: "da7", german: "Wir würden uns sehr freuen, wenn du kommen könntest.", turkish: "Gelirsen çok mutlu oluruz.", category: "davet" },
  { id: "da8", german: "Wir feiern meinen Geburtstag.", turkish: "Doğum günümü kutluyoruz.", category: "davet" },
  { id: "da9", german: "Es wäre toll, wenn du kommen könntest.", turkish: "Gelirsen harika olur.", category: "davet" },
  { id: "da10", german: "Wir würden uns aber über deine Teilnahme sehr freuen.", turkish: "Katılımınızdan dolayı çok mutlu oluruz.", category: "davet" },
  { id: "da11", german: "Ich feiere meinen Geburtstag am 12. Mai.", turkish: "Doğum günümü 12 Mayıs'ta kutluyorum.", category: "davet" },
  { id: "da12", german: "Ich organisiere eine Party im Restaurant Kebaphaus in der Königstraße 10.", turkish: "Kral Caddesi 10 numaradaki Kebap Evi restoranında bir parti organize ediyorum.", category: "davet" },
  { id: "da13", german: "Ich habe mich sehr darüber gefreut.", turkish: "Bundan çok mutlu oldum.", category: "davet" },

  // ═══════════════ 6. Davet Kabul ═══════════════
  { id: "dk1", german: "Gerade habe ich Ihre Einladung bekommen und möchte Ihnen damit mitteilen, dass ich mich sehr darüber freue.", turkish: "Davetinizi yeni aldım ve bundan dolayı çok mutlu olduğumu bildirmek istiyorum.", category: "davet-kabul" },
  { id: "dk2", german: "Vielen Dank für die Einladung zu eurer Party. Ich komme gern.", turkish: "Partinize davet ettiğiniz için teşekkürler. Memnuniyetle gelirim.", category: "davet-kabul" },
  { id: "dk3", german: "Darf ich meine Frau mitbringen?", turkish: "Eşimi getirebilir miyim?", category: "davet-kabul" },
  { id: "dk4", german: "Darf ich meine Kinder mitbringen?", turkish: "Çocuklarımı getirebilir miyim?", category: "davet-kabul" },
  { id: "dk5", german: "Was kann ich für dich mitbringen?", turkish: "Sana ne getirebilirim?", category: "davet-kabul" },
  { id: "dk6", german: "Ich kann einen Kuchen backen, wenn du willst.", turkish: "İstersen bir pasta yapabilirim.", category: "davet-kabul" },
  { id: "dk7", german: "Ich bedanke mich bei dir für deine Einladung zum 40. Geburtstag.", turkish: "40. doğum günü davetin için teşekkür ederim.", category: "davet-kabul" },

  // ═══════════════ 7. Davet Reddetme/Özür ═══════════════
  { id: "dr1", german: "Ich möchte mich bei Ihnen entschuldigen, weil ich nicht zu Ihrer Hochzeit gekommen bin.", turkish: "Düğününüze gelemediğim için sizden özür dilemek istiyorum.", category: "davet-red" },
  { id: "dr2", german: "Ich entschuldige mich dafür, ich werde am 01.01.2023 nicht zu Ihrer Geburtstagfeier kommen können.", turkish: "Özür dilerim, 01.01.2023 tarihinde doğum günü partinize gelemeyeceğim.", category: "davet-red" },
  { id: "dr3", german: "Ich entschuldige mich dafür, ich werde am 01.01.2023 nicht zu Ihrer Hochzeit kommen können.", turkish: "Özür dilerim, 01.01.2023 tarihinde düğününüze gelemeyeceğim.", category: "davet-red" },
  { id: "dr4", german: "Ich wäre gern dabei, aber ich kann leider nicht kommen.", turkish: "Orada olmak isterdim, ama ne yazık ki gelemeyeceğim.", category: "davet-red" },
  { id: "dr5", german: "Ich habe leider einen anderen Termin.", turkish: "Ne yazık ki başka bir randevum var.", category: "davet-red" },
  { id: "dr6", german: "Ich warte auf eine Einladung zum Vorstellungsgespräch.", turkish: "Mülakat daveti bekliyorum.", category: "davet-red" },
  { id: "dr7", german: "Ich bin krank und bitte Sie, dass Sie mich entschuldigen.", turkish: "Hastayım ve sizden beni affetmenizi istiyorum.", category: "davet-red" },
  { id: "dr8", german: "Ich würde liebend gern, aber ich habe leider keine Zeit.", turkish: "Çok isterdim, ama ne yazık ki zamanım yok.", category: "davet-red" },
  { id: "dr9", german: "Ich bin immer ziemlich beschäftigt.", turkish: "Her zaman oldukça meşgulüm.", category: "davet-red" },
  { id: "dr10", german: "Ich mache viele Überstunden.", turkish: "Çok fazla mesai yapıyorum.", category: "davet-red" },
  { id: "dr11", german: "An diesem Termin bin ich verreist.", turkish: "Bu tarihte seyahatte olacağım.", category: "davet-red" },
  { id: "dr12", german: "An diesem Termin muss ich arbeiten.", turkish: "Bu tarihte çalışmam gerekiyor.", category: "davet-red" },
  { id: "dr13", german: "An diesem Termin habe ich einen wichtigen Termin.", turkish: "Bu tarihte önemli bir randevum var.", category: "davet-red" },
  { id: "dr14", german: "Meine Mutter ist krank und braucht meine Hilfe. Ich muss jeden Nachmittag nach der Arbeit um sie kümmern.", turkish: "Annem hasta ve yardımına ihtiyacı var. İşten sonra her öğleden sonra ona bakmam gerekiyor.", category: "davet-red" },

  // ═══════════════ 8. Teşekkür ═══════════════
  { id: "t1", german: "Vielen Dank für Ihre Antwort.", turkish: "Yanıtınız için teşekkür ederim.", category: "tesekkur" },
  { id: "t2", german: "Vielen Dank für Ihren Brief.", turkish: "Mektubunuz için teşekkür ederim.", category: "tesekkur" },
  { id: "t3", german: "Vielen Dank für Ihre freundliche Einladung.", turkish: "Kibar davetiniz için teşekkür ederim.", category: "tesekkur" },
  { id: "t4", german: "Vielen Dank für Ihre Unterstützung.", turkish: "Desteğiniz için teşekkür ederim.", category: "tesekkur" },
  { id: "t5", german: "Vielen Dank für Ihr Verständnis.", turkish: "Anlayışınız için teşekkür ederim.", category: "tesekkur" },
  { id: "t6", german: "Vielen Dank für Ihre Bemühungen.", turkish: "Çabalarınız için teşekkür ederim.", category: "tesekkur" },
  { id: "t7", german: "Sie waren mir eine große Hilfe.", turkish: "Bana büyük yardımınız dokundu.", category: "tesekkur" },
  { id: "t8", german: "Vielen Dank für Ihre Hilfe in dieser Angelegenheit.", turkish: "Bu konudaki yardımınız için teşekkür ederim.", category: "tesekkur" },
  { id: "t9", german: "Ich danke Ihnen im Voraus.", turkish: "Şimdiden teşekkür ederim.", category: "tesekkur" },
  { id: "t10", german: "Ich kann Ihnen nicht genug danken.", turkish: "Size teşekkür etmekte yetersiz kalıyorum.", category: "tesekkur" },

  // ═══════════════ 9. Gelişme Cümleleri ═══════════════
  { id: "ge1", german: "Die Party findet am 01. Mai ab 18.00 Uhr statt.", turkish: "Parti 01 Mayıs saat 18:00'da başlayacak.", category: "gelisme" },
  { id: "ge2", german: "Bitte sagen Sie mir Bescheid bis zum 01. Mai, ob Sie kommen können.", turkish: "Lütfen 01 Mayıs'a kadar geleceğinizi bana bildirin.", category: "gelisme" },
  { id: "ge3", german: "Sie müssen nichts mitbringen, weil ich schon alles besorgt habe.", turkish: "Hiçbir şey getirmenize gerek yok, çünkü her şeyi ben hallettim.", category: "gelisme" },
  { id: "ge4", german: "Ich kann z.B. Süßigkeiten mitbringen oder einen Kuchen backen.", turkish: "Örneğin, şekerleme getirebilirim veya bir pasta yapabilirim.", category: "gelisme" },

  // ═══════════════ 10. Şikayet ═══════════════
  { id: "si1", german: "Hiermit möchte ich mich über Ihr Angebot beschweren.", turkish: "Bunu yaparak teklifiniz hakkında şikayette bulunmak istiyorum.", category: "sikayet" },
  { id: "si2", german: "Hiermit möchte ich mich über Ihre Wohnung beschweren.", turkish: "Bunu yaparak daireniz hakkında şikayette bulunmak istiyorum.", category: "sikayet" },
  { id: "si3", german: "Leider bin ich sehr unzufrieden mit Ihrer Wohnung.", turkish: "Ne yazık ki dairenizden çok memnun değilim.", category: "sikayet" },
  { id: "si4", german: "So können wir nicht weitermachen.", turkish: "Bu şekilde devam edemeyiz.", category: "sikayet" },
  { id: "si5", german: "Daher bitte ich Sie um die umgehende Erstattung von 30% der Gebühr.", turkish: "Bu nedenle, ücretin %30'unun derhal iadesini talep ediyorum.", category: "sikayet" },
  { id: "si6", german: "Bitte überweisen Sie die Gebühr auf mein Konto mit der Nummer IBAN DE bei der Sparkasse.", turkish: "Lütfen ücreti IBAN DE numaralı Sparkasse hesabıma havale edin.", category: "sikayet" },
  { id: "si7", german: "Über eine baldige und positive Antwort von Ihnen würde ich mich freuen.", turkish: "Sizden yakında ve olumlu bir yanıt almak beni mutlu edecek.", category: "sikayet" },
  { id: "si8", german: "Ich werde die folgenden Punkte erledigen.", turkish: "Aşağıdaki maddeleri halledeceğim.", category: "sikayet" },
  { id: "si9", german: "Mach dir keine Sorgen. Ich werde die folgenden Punkte erledigen.", turkish: "Endişelenme. Aşağıdaki maddeleri halledeceğim.", category: "sikayet" },
  { id: "si10", german: "Wir haben noch Probleme zu lösen.", turkish: "Çözülmesi gereken sorunlarımız var.", category: "sikayet" },

  // ═══════════════ 11. Görev Hatırlatma ═══════════════
  { id: "go1", german: "Es gibt drei Regeln, die der Vermieter beachten sollte.", turkish: "Ev sahibinin uyması gereken üç kural var.", category: "gorev" },
  { id: "go2", german: "Es gibt zwei Regeln, die der Chef beachten sollte.", turkish: "Patronun uyması gereken iki kural var.", category: "gorev" },
  { id: "go3", german: "Es gibt Rechte, die ein Mieter haben muss.", turkish: "Bir kiracının sahip olması gereken haklar var.", category: "gorev" },
  { id: "go4", german: "Was denken Sie darüber?", turkish: "Bunlar hakkında ne düşünüyorsunuz?", category: "gorev" },
  { id: "go5", german: "Was ist Ihre Meinung in dieser Angelegenheit?", turkish: "Bu konudaki görüşünüz nedir?", category: "gorev" },
  { id: "go6", german: "Was ist Ihr Standpunkt dazu?", turkish: "Buna ilişkin duruşunuz nedir?", category: "gorev" },
  { id: "go7", german: "Wie sehen Sie diese Sache?", turkish: "Bu duruma nasıl bakıyorsunuz?", category: "gorev" },

  // ═══════════════ 12. Garanti ═══════════════
  { id: "ga1", german: "Ich habe noch mindestens für 18 Monate Garantie, weil die Waschmaschine erst 6 Monate alt ist.", turkish: "Çamaşır makinesi henüz 6 aylık olduğu için en az 18 ay daha garantim var.", category: "garanti" },
  { id: "ga2", german: "Das bedeutet, Sie können mir helfen und das Problem lösen.", turkish: "Bu, bana yardım edebileceğiniz ve sorunu çözebileceğiniz anlamına gelir.", category: "garanti" },
  { id: "ga3", german: "Ich möchte auch wissen, ob die Reparatur etwas kostet.", turkish: "Tamirin bir maliyeti olup olmadığını da bilmek istiyorum.", category: "garanti" },
  { id: "ga4", german: "Ich habe noch Garantie und möchte Sie bitten, den Fotoapparat zu reparieren.", turkish: "Hala garantim var ve sizden fotoğraf makinesini tamir etmenizi istiyorum.", category: "garanti" },
  { id: "ga5", german: "Wenn eine Reparatur nicht möglich ist, schicken Sie mir als Ersatz einen neuen Fotoapparat.", turkish: "Eğer tamir edilemezse, yerini alması için yeni bir fotoğraf makinesi gönderin.", category: "garanti" },

  // ═══════════════ 13. Bilgi İsteme ═══════════════
  { id: "bi1", german: "Ich würde gern wissen, wie das funktioniert.", turkish: "Bunun nasıl çalıştığını bilmek isterdim.", category: "bilgi-isteme" },
  { id: "bi2", german: "Kannst du mir bitte auch sagen, wie das geht?", turkish: "Bana bunun nasıl yapıldığını da söyleyebilir misin?", category: "bilgi-isteme" },
  { id: "bi3", german: "Ich habe ein paar Fragen an Sie.", turkish: "Size birkaç sorum var.", category: "bilgi-isteme" },
  { id: "bi4", german: "Bitte informieren Sie mich so bald wie möglich.", turkish: "Lütfen beni mümkün olduğunca çabuk bilgilendirin.", category: "bilgi-isteme" },
  { id: "bi5", german: "Ich möchte wissen, was Sie über mein Angebot denken.", turkish: "Teklifim hakkında ne düşündüğünüzü bilmek istiyorum.", category: "bilgi-isteme" },
  { id: "bi6", german: "Bitte melden Sie mir Bescheid, ob Sie kommen können.", turkish: "Lütfen geleceğinizi bana bildirin.", category: "bilgi-isteme" },
  { id: "bi7", german: "Bitte sagen Sie mir bald Bescheid, ob Sie kommen können.", turkish: "Lütfen geleceğinizi bana çabuk bildirin.", category: "bilgi-isteme" },
  { id: "bi8", german: "Ich würde gern wissen, ob Sie diesem Problem besorgen sind.", turkish: "Bu sorunla ilgilenip ilgilenmediğinizi bilmek isterdim.", category: "bilgi-isteme" },
  { id: "bi9", german: "Wir würden uns sehr freuen, wenn Sie uns ausführlichere Informationen senden könnten.", turkish: "Daha detaylı bilgi gönderebilirseniz çok mutlu oluruz.", category: "bilgi-isteme" },
  { id: "bi10", german: "Ich würde gern wissen, welche Unterlagen ich zum Termin mitbringen soll.", turkish: "Randevuya hangi belgeleri getirmem gerektiğini bilmek isterdim.", category: "bilgi-isteme" },
  { id: "bi11", german: "Bitte senden Sie mir alle Informationen per E-Mail.", turkish: "Lütfen tüm bilgileri e-posta ile gönderin.", category: "bilgi-isteme" },
  { id: "bi12", german: "Schicken Sie mir die Datei per E-Mail.", turkish: "Dosyayı e-posta ile gönderin.", category: "bilgi-isteme" },
  { id: "bi13", german: "Ich brauche eine Auskunft bezüglich der Preise.", turkish: "Fiyatlar hakkında bilgi almak istiyorum.", category: "bilgi-isteme" },
  { id: "bi14", german: "Ich brauche Informationen über Preise.", turkish: "Fiyatlar hakkında bilgiye ihtiyacım var.", category: "bilgi-isteme" },

  // ═══════════════ 14. Hızlı Çözüm ═══════════════
  { id: "hc1", german: "Ich wäre Ihnen äußerst dankbar, wenn Sie diese Angelegenheit so schnell wie möglich prüfen könnten.", turkish: "Bu konuyu mümkün olduğunca çabuk inceleyebilirseniz size çok minnettar kalırım.", category: "hizli-cozum" },
  { id: "hc2", german: "Bitte sagen Sie mir Bescheid, ob Sie mir helfen können.", turkish: "Lütfen bana yardım edip edemeyeceğinizi bildirin.", category: "hizli-cozum" },
  { id: "hc3", german: "Wenn Sie keine Zeit haben, muss ich schnell eine andere Person fragen.", turkish: "Zamanınız yoksa, başka birini çabuk sormam gerekecek.", category: "hizli-cozum" },

  // ═══════════════ 15. Bilgi Verme ═══════════════
  { id: "bv1", german: "Ich freue mich, dir zu berichten, dass ich bestanden habe.", turkish: "Sana geçtiğimi bildirmekten mutluluk duyuyorum.", category: "bilgi-verme" },
  { id: "bv2", german: "Leider muss ich dir berichten, dass der Termin abgesagt wurde.", turkish: "Ne yazık ki sana randevunun iptal edildiğini bildirmek zorundayım.", category: "bilgi-verme" },

  // ═══════════════ 16. Tebrik ═══════════════
  { id: "teb1", german: "Herzlichen Glückwunsch zum Geburtstag!", turkish: "Doğum günün için tebrikler!", category: "tebrik" },
  { id: "teb2", german: "Ich wünsche dir viel Erfolg bei der Prüfung.", turkish: "Sınavda başarılar diliyorum.", category: "tebrik" },

  // ═══════════════ 17. Tamir/Tamirci ═══════════════
  { id: "tam1", german: "Ich habe einen Vorschlag: Könnten Sie bitte einen Techniker zu mir schicken?", turkish: "Bir önerim var: Bana bir teknisyen gönderebilir misiniz?", category: "tamir" },
  { id: "tam2", german: "Jemand muss meinen Anschluss kontrollieren.", turkish: "Birisi bağlantımı kontrol etmelidir.", category: "tamir" },
  { id: "tam3", german: "Ich bitte Sie, dass Sie meine Waschmaschine reparieren.", turkish: "Çamaşır makinemi tamir etmenizi istiyorum.", category: "tamir" },
  { id: "tam4", german: "Könnten Sie dafür bitte einen Handwerker zu mir nach Hause schicken?", turkish: "Bunun için lütfen evime bir usta gönderebilir misiniz?", category: "tamir" },
  { id: "tam5", german: "Wenn der Handwerker die Waschmaschine nicht reparieren kann, würde ich gern eine neue bekommen.", turkish: "Eğer usta çamaşır makinesini tamir edemezse, yeni bir tane almak isterim.", category: "tamir" },

  // ═══════════════ 18. Yeni Ürün/Para İsteme ═══════════════
  { id: "yn1", german: "Ich bitte Sie, mir eine neue Maschine zu senden oder das Geld auf mein Konto zu überweisen.", turkish: "Bana yeni bir makine göndermenizi veya ödediğim parayı hesabıma iade etmenizi istiyorum.", category: "yeni-urun" },
  { id: "yn2", german: "Könnten Sie den Fernseher reparieren lassen oder einen neuen schicken?", turkish: "Televizyonu tamir ettirebilir misiniz yoksa yeni bir tane gönderebilir misiniz?", category: "yeni-urun" },

  // ═══════════════ 19. Yardımcı Olunmazsa ═══════════════
  { id: "yo1", german: "Bitte geben Sie mir eine Lösung. Wenn Sie mir nicht helfen können, werde ich den Vertrag leider kündigen.", turkish: "Lütfen bana bir çözüm sunun. Eğer bana yardım edemezseniz, ne yazık ki sözleşmeyi feshedeceğim.", category: "yardimci-olmazsa" },
  { id: "yo2", german: "Ich bitte Sie, die gekaufte Ware so schnell wie möglich zu wechseln.", turkish: "Satın alınan malı mümkün olduğunca çabuk değiştirmenizi istiyorum.", category: "yardimci-olmazsa" },
  { id: "yo3", german: "Wenn die Maschine bis Freitag nicht gewechselt wird, melde ich den Fall bei der Verbraucherzentrale.", turkish: "Eğer makine Cuma gününe kadar değiştirilmezse, durumu Tüketici Merkezine bildireceğim.", category: "yardimci-olmazsa" },
  { id: "yo4", german: "Ich freue mich auf eine positive Antwort von Ihnen. Wenn Sie mir nicht antworten, werde ich mich bei der Verbraucherzentrale beschweren.", turkish: "Sizden olumlu bir yanıt almayı umuyorum. Eğer yanıt vermezseniz, Tüketici Merkezine şikayette bulunacağım.", category: "yardimci-olmazsa" },

  // ═══════════════ 20. Feshetme/Teyit ═══════════════
  { id: "fe1", german: "Ich möchte meinen Vertrag zum nächsten möglichen Termin kündigen.", turkish: "Sözleşmemi mümkün olan en yakın tarihte feshetmek istiyorum.", category: "feshetme" },
  { id: "fe2", german: "Bitte senden Sie mir eine schriftliche Kündigungsbestätigung.", turkish: "Lütfen bana yazılı bir fesih onayı gönderin.", category: "feshetme" },
  { id: "fe3", german: "Bitte senden Sie mir eine Bestätigung. Das ist wichtig, damit ich sicher bin, dass alles in Ordnung ist.", turkish: "Lütfen bana bir onay gönderin. Bu, her şeyin düzgün olduğunu bilmem için önemli.", category: "feshetme" },

  // ═══════════════ 21. İrtibat ═══════════════
  { id: "ir1", german: "Bitte kontaktieren Sie mich. Meine Telefonnummer ist 012345.", turkish: "Lütfen benimle iletişime geçin. Telefon numaram 012345.", category: "irtibat" },
  { id: "ir2", german: "Die Fragen können Sie mich immer erreichen. Meine Telefonnummer ist 12344.", turkish: "Sorularınız için her zaman benimle iletişime geçebilirsiniz. Telefon numaram 12344.", category: "irtibat" },
  { id: "ir3", german: "Sie können mich direkt anrufen. Ich denke, das ist am einfachsten. Meine Telefonnummer lautet 12344.", turkish: "Beni doğrudan arayabilirsiniz. Bence bu en kolay yol. Telefon numaram 12344.", category: "irtibat" },
  { id: "ir4", german: "Sie können mich täglich ab 18 Uhr abends erreichen, weil ich arbeite.", turkish: "Çalıştığım için her gün akşam 18:00'dan sonra benimle iletişime geçebilirsiniz.", category: "irtibat" },
  { id: "ir5", german: "Sie erreichen uns von Montag bis Freitag zwischen 08.30 und 18.00 Uhr unter folgender Nummer 12345.", turkish: "Pazartesiden Cumaya 08:30 ile 18:00 arasında aşağıdaki numaradan bize ulaşabilirsiniz: 12345.", category: "irtibat" },
  { id: "ir6", german: "Am Wochenende bin ich jederzeit erreichbar. Ich habe aber eine neue Nummer. Sie lautet 12344.", turkish: "Hafta sonları her zaman ulaşılabilirim. Ancak yeni bir numaram var. Numara 12344.", category: "irtibat" },
  { id: "ir7", german: "Sie können mich jederzeit per E-Mail erreichen.", turkish: "Beni her zaman e-posta ile ulaşabilirsiniz.", category: "irtibat" },
  { id: "ir8", german: "Sie können mich jederzeit unter dieser Nummer erreichen.", turkish: "Beni her zaman bu numaradan ulaşabilirsiniz.", category: "irtibat" },
  { id: "ir9", german: "Wenn Sie noch Fragen haben, können Sie mich anrufen.", turkish: "Eğer hala sorularınız varsa, beni arayabilirsiniz.", category: "irtibat" },
  { id: "ir10", german: "Falls Sie noch Fragen haben, können Sie sich bei mir melden.", turkish: "Eğer hala sorularınız varsa, benimle iletişime geçebilirsiniz.", category: "irtibat" },
  { id: "ir11", german: "Schreiben Sie mir bitte schnell oder rufen Sie mich an.", turkish: "Lütfen bana çabuk yazın veya beni arayın.", category: "irtibat" },
  { id: "ir12", german: "Ich bin in der Woche ab 16 Uhr erreichbar und am Wochenende jederzeit.", turkish: "Hafta içi 16:00'dan sonra ve hafta sonları her zaman ulaşılabilirim.", category: "irtibat" },
  { id: "ir13", german: "Sie können mich unter der Mobilnummer 011111 oder unter meiner E-Mail-Adresse erreichen.", turkish: "Beni 011111 numaralı cep telefonumdan veya e-posta adresimden ulaşabilirsiniz.", category: "irtibat" },
  { id: "ir14", german: "Ich schreibe dir meine Nummer für alle Fälle.", turkish: "Her ihtimale karşı numaramı yazıyorum.", category: "irtibat" },

  // ═══════════════ 22. Hastalık ═══════════════
  { id: "ha1", german: "Mein Sohn ist krank und kann deswegen diese Woche die Schule nicht mehr besuchen.", turkish: "Oğlum hasta ve bu yüzden bu hafta okula gidemiyor.", category: "hastalik" },
  { id: "ha2", german: "Hiermit teile ich Ihnen mit, dass mein Sohn Ali aus gesundheitlichen Gründen diese Woche nicht in die Schule kommen kann.", turkish: "Bunu yaparak, oğlum Ali'nin sağlık nedenleriyle bu hafta okula gelemeyeceğini bildirmek istiyorum.", category: "hastalik" },
  { id: "ha3", german: "Gestern waren wir beim Arzt. Er hat Erkältung und hohes Fieber, darum muss er mindestens diese Woche im Bett bleiben.", turkish: "Dün doktorda idik. Soğuk algınlığı ve yüksek ateşi var, bu yüzden bu hafta en azından yatakta kalmalı.", category: "hastalik" },
  { id: "ha4", german: "Wahrscheinlich kann er erst am Montag wieder in die Schule kommen.", turkish: "Muhtemelen ancak Pazartesi günü okula dönebilir.", category: "hastalik" },
  { id: "ha5", german: "Ich hoffe, dass er in drei Tagen wieder zur Schule zurückkommen kann.", turkish: "Umarım üç gün içinde okula dönebilir.", category: "hastalik" },
  { id: "ha6", german: "Ich habe Erkältung. Der Arzt hat mich bis Ende der Woche krankgeschrieben.", turkish: "Soğuk algınlığım var. Doktor beni hafta sonuna kadar rapor etti.", category: "hastalik" },
  { id: "ha7", german: "Ich habe gehört, du hast eine Erkältung.", turkish: "Soğuk algınlığın olduğunu duydum.", category: "hastalik" },
  { id: "ha8", german: "Im Anhang finden Sie die Krankenschreibung vom Arzt.", turkish: "Ekte doktorun raporunu bulabilirsiniz.", category: "hastalik" },
  { id: "ha9", german: "Ich muss mindestens fünfzehn Tage zu Hause bleiben.", turkish: "En az on beş gün evde kalmalıyım.", category: "hastalik" },
  { id: "ha10", german: "Könnten Sie uns die Hausaufgaben per E-Mail senden?", turkish: "Bize ev ödevlerini e-posta ile gönderebilir misiniz?", category: "hastalik" },
  { id: "ha11", german: "Mein Arzt hat mich für zwei Wochen krankgeschrieben, aber ich fühle mich schon viel besser.", turkish: "Doktor beni iki hafta boyunca rapor etti, ama kendimi çok daha iyi hissediyorum.", category: "hastalik" },

  // ═══════════════ 23. Talep ═══════════════
  { id: "talep1", german: "Würdest du so nett und könntest ein paar meiner Aufgaben übernehmen?", turkish: "Kibar olabilir misin ve birkaç görevimi üstlenebilir misin?", category: "talep" },
  { id: "talep2", german: "Zuerst sollte Büromaterial bestellt werden.", turkish: "Öncelikle ofis malzemeleri sipariş edilmeli.", category: "talep" },
  { id: "talep3", german: "Der nächste wichtige Punkt ist: Die Rechnungen müssen erledigt werden.", turkish: "Bir sonraki önemli nokta: Faturalar halledilmeli.", category: "talep" },
  { id: "talep4", german: "Es wäre toll, wenn du bitte auch die Pflanze auf dem Schreibtisch gießen könntest.", turkish: "Harika olurdu eğer masa üzerindeki bitkiyi de sulayabilirsen.", category: "talep" },

  // ═══════════════ 24. Termin ═══════════════
  { id: "ter1", german: "Können Sie mir einen Termin dafür geben?", turkish: "Bana bunun için bir randevu verebilir misiniz?", category: "termin" },
  { id: "ter2", german: "Wann würde es Ihnen passen?", turkish: "Sizin için ne zaman uygun olur?", category: "termin" },
  { id: "ter3", german: "Könnten Sie mir bitte sagen, wann Sie mir einen Termin vereinbaren könnten?", turkish: "Bana ne zaman randevu verebileceğinizi söyleyebilir misiniz?", category: "termin" },
  { id: "ter4", german: "Ich würde gern zu dir zum Besuch kommen, deshalb möchte ich wissen, ob du am Samstag Nachmittag Zeit hast.", turkish: "Seni ziyarete gelmek isterdim, bu yüzden Cumartesi öğleden sonra zamanın olup olmadığını bilmek istiyorum.", category: "termin" },
  { id: "ter5", german: "Könnten wir bitte einen Termin vereinbaren?", turkish: "Bir randevu ayarlayabilir miyiz?", category: "termin" },
  { id: "ter6", german: "Die beste Zeit ist für mich zwischen 12 Uhr und 18 Uhr, egal welcher Wochentag.", turkish: "Benim için en iyi zaman 12:00 ile 18:00 arasında, haftanın hangi günü olursa olsun.", category: "termin" },
  { id: "ter7", german: "Ich hoffe, dass Sie mir so schnell wie möglich antworten.", turkish: "Umarım bana mümkün olduğunca çabuk yanıt verirsiniz.", category: "termin" },
  { id: "ter8", german: "Ich bin nächste Woche in Stuttgart und wollte fragen, ob wir uns treffen könnten.", turkish: "Gelecek hafta Stuttgart'ta olacağım ve buluşup buluşamayacağımızı sormak istiyorum.", category: "termin" },
  { id: "ter9", german: "Es tut mir leid, dass ich den Termin absagen muss, weil mein Vater im Krankenhaus ist.", turkish: "Babam hastanede olduğu için randevuyu iptal etmek zorundayım, özür dilerim.", category: "termin" },
  { id: "ter10", german: "Es wäre sehr nett von Ihnen, wenn Sie mir einen neuen Termin ausmachen würden.", turkish: "Bana yeni bir randevu ayarlarsanız çok kibar olursunuz.", category: "termin" },
  { id: "ter11", german: "Ab 01.01.2023 habe ich immer Zeit und werde Ihnen zur Verfügung stehen.", turkish: "01.01.2023 tarihinden itibaren her zaman zamanım olacak ve hizmetinizde olacağım.", category: "termin" },

  // ═══════════════ 25. Ödeme ═══════════════
  { id: "od1", german: "Wie soll ich für die Vermietung bezahlen?", turkish: "Kiralama için nasıl ödeme yapmalıyım?", category: "odeme" },
  { id: "od2", german: "Ich habe eine Kreditkarte und könnte das Geld online überweisen.", turkish: "Kredi kartım var ve parayı çevrimiçi olarak gönderebilirim.", category: "odeme" },
  { id: "od3", german: "Wenn Sie möchten, komme ich zu Ihrem Geschäft und bezahle bar.", turkish: "İsterseniz, mağazanıza gelip nakit ödeme yapabilirim.", category: "odeme" },
  { id: "od4", german: "Könnten Sie uns bitte sagen, wie viel Sie für die Stunde berechnen?", turkish: "Bize saat başına ne kadar ücret aldığınızı söyleyebilir misiniz?", category: "odeme" },

  // ═══════════════ 26. Süre ═══════════════
  { id: "su1", german: "Ich weiß nicht genau, wie lange alles dauert.", turkish: "Her şeyin ne kadar süreceğini tam olarak bilmiyorum.", category: "sure" },
  { id: "su2", german: "Könnten Sie mir bitte sagen, wie lange der Kurs insgesamt dauert?", turkish: "Kursun toplamda ne kadar süreceğini bana söyleyebilir misiniz?", category: "sure" },

  // ═══════════════ 27. Cevap Bekleme ═══════════════
  { id: "cb1", german: "Ich würde mich freuen, bald von Ihnen zu hören.", turkish: "Sizden yakında haber almak beni mutlu edecek.", category: "cevap-bekleme" },
  { id: "cb2", german: "Schreib mir bitte bald zurück.", turkish: "Lütfen bana yakında geri yaz.", category: "cevap-bekleme" },
  { id: "cb3", german: "Ich freue mich auf Ihre Antwort.", turkish: "Yanıtınızı bekliyorum.", category: "cevap-bekleme" },
  { id: "cb4", german: "Ich warte auf eine Einladung zum Vorstellungsgespräch.", turkish: "Mülakat daveti bekliyorum.", category: "cevap-bekleme" },
  { id: "cb5", german: "Könnten Sie mir bitte so schnell wie möglich eine Information geben?", turkish: "Bana mümkün olduğunca çabuk bilgi verebilir misiniz?", category: "cevap-bekleme" },
  { id: "cb6", german: "Ich warte auf Ihre positive Antwort.", turkish: "Olumlu yanıtınızı bekliyorum.", category: "cevap-bekleme" },
  { id: "cb7", german: "Es wäre sehr nett von Ihnen, wenn Sie mir eine baldige Antwort schicken könnten.", turkish: "Bana yakında bir yanıt gönderebilirseniz çok kibar olursunuz.", category: "cevap-bekleme" },

  // ═══════════════ 28. Hediye ═══════════════
  { id: "he1", german: "Ich möchte euch gern etwas schenken. Habt ihr schon eine Uhr für die Küche?", turkish: "Size bir şey hediye etmek istiyorum. Mutfak için bir saatiniz var mı?", category: "hediye" },
  { id: "he2", german: "Meiner Meinung nach ist es sehr wichtig, jemanden ein Geschenk zu geben, damit man jemanden glücklich macht.", turkish: "Bence birine hediye vermek, birini mutlu etmek için çok önemli.", category: "hediye" },

  // ═══════════════ 29. Soru Sorma ═══════════════
  { id: "ss1", german: "Wenn Sie mir erlauben, möchte ich Ihnen einige Fragen stellen.", turkish: "İzin verirseniz, size birkaç soru sormak istiyorum.", category: "soru-sorma" },
  { id: "ss2", german: "Ich möchte noch ein paar Fragen: Wo findet Ihr Unterricht statt?", turkish: "Birkaç sorum daha var: Dersiniz nerede yapılıyor?", category: "soru-sorma" },
  { id: "ss3", german: "Ich möchte wissen, wie viel der Unterricht kostet.", turkish: "Dersin ne kadar tuttuğunu bilmek istiyorum.", category: "soru-sorma" },
  { id: "ss4", german: "Könnten Sie mir bitte sagen, wann der Unterricht beginnt?", turkish: "Dersin ne zaman başlayacağını bana söyleyebilir misiniz?", category: "soru-sorma" },
  { id: "ss5", german: "Die wichtigste Frage ist, wie viel das pro Stunde kostet.", turkish: "En önemli soru, saat başına ne kadar tuttuğu.", category: "soru-sorma" },
  { id: "ss6", german: "Ich möchte gern einen Computerkurs machen, aber ich habe noch ein Paar Fragen.", turkish: "Bilgisayar kursuna katılmak istiyorum, ama hala birkaç sorum var.", category: "soru-sorma" },
  { id: "ss7", german: "An welchen Tagen ist der Kurs und um wie viel Uhr?", turkish: "Kurs hangi günler ve saat kaçta?", category: "soru-sorma" },
  { id: "ss8", german: "Hätten Sie etwas dagegen, wenn ich meine Frau mitbringe?", turkish: "Eşimi getirsem sakıncası olur mu?", category: "soru-sorma" },

  // ═══════════════ 30. Maymuncuk Cümleler ═══════════════
  { id: "m1", german: "Dieses Thema wird unsere Zukunft prägen.", turkish: "Bu konu geleceğimizi şekillendirecek.", category: "maymuncuk" },
  { id: "m2", german: "Dieses Bild erinnerte mich an den Wert der Bildung.", turkish: "Bu resim bana eğitimin değerini hatırlattı.", category: "maymuncuk" },
  { id: "m3", german: "Dieses Bild erinnerte mich an meine Kindheit.", turkish: "Bu resim bana çocukluğumu hatırlattı.", category: "maymuncuk" },
  { id: "m4", german: "Die Frau auf dem Bild erinnerte mich an meine Mutter.", turkish: "Resimdeki kadın bana annemi hatırlattı.", category: "maymuncuk" },
  { id: "m5", german: "Ich war früher gegen diese Meinung.", turkish: "Eskiden bu düşünceye karşıydım.", category: "maymuncuk" },
  { id: "m6", german: "Jetzt unterstütze ich diese Meinung.", turkish: "Şimdi bu fikri destekliyorum.", category: "maymuncuk" },
  { id: "m7", german: "Als Lehrer unterstütze ich die Bildung.", turkish: "Bir öğretmen olarak, eğitimi destekliyorum.", category: "maymuncuk" },
  { id: "m8", german: "Als Person mit Gewissen unterstütze ich den Schutz von Tieren.", turkish: "Vicdan sahibi biri olarak hayvanların korunmasını destekliyorum.", category: "maymuncuk" },

  // ═══════════════ 31. Bildbeschreibung ═══════════════
  { id: "bd1", german: "Auf dem Bild sehe ich eine Frau.", turkish: "Resimde bir kadın görüyorum.", category: "bildbeschreibung" },
  { id: "bd2", german: "Ich denke, dass das Foto Sport thematisiert.", turkish: "Bence fotoğraf spor gibi bir konuyu ele alıyor.", category: "bildbeschreibung" },
  { id: "bd3", german: "In meinem Heimatland ist das ganz anders.", turkish: "Benim ülkemde bu durum tamamen farklı.", category: "bildbeschreibung" },
  { id: "bd4", german: "Ich finde, dass in Deutschland mehr Menschen Fahrrad fahren als in der Türkei.", turkish: "Bence Almanya'da Türkiye'ye göre daha fazla insan bisiklet sürüyor.", category: "bildbeschreibung" },
  { id: "bd5", german: "Das Foto wurde drinnen aufgenommen und zeigt eine Situation im Büro.", turkish: "Fotoğraf içeride çekilmiş ve bir ofis sahnesini gösteriyor.", category: "bildbeschreibung" },
  { id: "bd6", german: "Das Foto wurde draußen aufgenommen und zeigt eine Situation im Park.", turkish: "Fotoğraf dışarıda çekilmiş ve bir park sahnesini gösteriyor.", category: "bildbeschreibung" },
  { id: "bd7", german: "Ich denke, dass es Sommer ist, weil sie Sommerkleidung tragen.", turkish: "Bence yaz, çünkü yazlık kıyafetler giyiyorlar.", category: "bildbeschreibung" },
  { id: "bd8", german: "Ich denke, dass es Winter ist, weil er Winterkleidung trägt.", turkish: "Bence kış, çünkü o kışlık kıyafetler giyiyor.", category: "bildbeschreibung" },
  { id: "bd9", german: "Sie sehen nicht nur glücklich, sondern auch zufrieden aus.", turkish: "Sadece mutlu değil, aynı zamanda memnun görünüyorlar.", category: "bildbeschreibung" },
  { id: "bd10", german: "Sie sehen nicht nur müde, sondern auch gestresst aus.", turkish: "Sadece yorgun değil, aynı zamanda stresli görünüyorlar.", category: "bildbeschreibung" },
  { id: "bd11", german: "Im Hintergrund sehe ich viele Bäume.", turkish: "Arka planda birçok ağaç görüyorum.", category: "bildbeschreibung" },
  { id: "bd12", german: "Dieses Foto gefällt mir, weil ich Sport mag.", turkish: "Bu fotoğrafı beğeniyorum, çünkü spor yapmayı seviyorum.", category: "bildbeschreibung" },
  { id: "bd13", german: "Dieses Foto gefällt mir nicht, weil es mich traurig macht.", turkish: "Bu fotoğrafı beğenmiyorum, çünkü beni üzüyor.", category: "bildbeschreibung" },
  { id: "bd14", german: "Die Atmosphäre wirkt ruhig und freundlich.", turkish: "Atmosfer sakin ve dostane görünüyor.", category: "bildbeschreibung" },
  { id: "bd15", german: "Wahrscheinlich ist das Foto mittags aufgenommen worden.", turkish: "Fotoğraf muhtemelen öğle vakti çekilmiş.", category: "bildbeschreibung" },
  { id: "bd16", german: "Meiner Meinung nach ist dieses Thema sehr wichtig, weil Sport die Menschen vom Stress befreien kann.", turkish: "Bence bu konu çok önemli, çünkü spor insanları stresten kurtarabilir.", category: "bildbeschreibung" },
  { id: "bd17", german: "Es scheint, dass das Wetter schlechter wird, weil der Himmel ganz grau ist.", turkish: "Hava kötüleşiyor gibi görünüyor, çünkü gökyüzü tamamen gri.", category: "bildbeschreibung" },
  { id: "bd18", german: "Es scheint, dass das Wetter besser wird, weil die Sonne scheint.", turkish: "Hava iyileşiyor gibi görünüyor, çünkü güneş parlıyor.", category: "bildbeschreibung" },

  // ═══════════════ 32. Deneyim/Kişisel ═══════════════
  { id: "de1", german: "Ich lese gern Bücher.", turkish: "Kitap okumayı severim.", category: "deneyim" },
  { id: "de2", german: "Ich denke, es ist wichtig, Bücher zu lesen.", turkish: "Kitap okumanın önemli olduğunu düşünüyorum.", category: "deneyim" },
  { id: "de3", german: "Ich mache gerne Sport.", turkish: "Spor yapmayı severim.", category: "deneyim" },
  { id: "de4", german: "Ich denke, es ist wichtig, Sport zu treiben.", turkish: "Spor yapmanın önemli olduğunu düşünüyorum.", category: "deneyim" },
  { id: "de5", german: "Ich koche gern.", turkish: "Yemek yapmayı severim.", category: "deneyim" },
  { id: "de6", german: "Ich liebe Tiere.", turkish: "Hayvanları severim.", category: "deneyim" },
  { id: "de7", german: "Mein Onkel ist auch Arzt.", turkish: "Dayım da doktordur.", category: "deneyim" },
  { id: "de8", german: "Ich bin stolz auf meinen Onkel.", turkish: "Dayıma gurur duyuyorum.", category: "deneyim" },
  { id: "de9", german: "Ich interessiere mich für diesen Beruf.", turkish: "Bu mesleğe ilgi duyuyorum.", category: "deneyim" },
  { id: "de10", german: "Ich möchte, dass mein Kind in Zukunft Arzt wird.", turkish: "Çocuğumun gelecekte doktor olmasını istiyorum.", category: "deneyim" },
  { id: "de11", german: "Meine Wohnung sieht so ähnlich aus wie auf dem Foto.", turkish: "Dairem fotoğraftakine benziyor.", category: "deneyim" },
  { id: "de12", german: "In der Nähe von meinem Haus gibt es einen Spielplatz.", turkish: "Evimin yakınında bir oyun alanı var.", category: "deneyim" },
  { id: "de13", german: "Corona erinnerte uns an den Wert der Gesundheit.", turkish: "Corona bize sağlığın değerini hatırlattı.", category: "deneyim" },
  { id: "de14", german: "Heutzutage kann man im Internet alles bestellen.", turkish: "Günümüzde internetten her şey sipariş edebilirsiniz.", category: "deneyim" },
  { id: "de15", german: "Ich kenne diese Situation sehr gut.", turkish: "Bu durumu çok iyi biliyorum.", category: "deneyim" },
  { id: "de16", german: "Dieses Foto erinnert mich an die Zeit, als ich Fußball spielte.", turkish: "Bu fotoğraf bana futbol oynadığım zamanları hatırlatıyor.", category: "deneyim" },
  { id: "de17", german: "In meinem Land gibt es nur sehr wenige Sportmöglichkeiten.", turkish: "Ülkemde çok az spor olanağı var.", category: "deneyim" },
  { id: "de18", german: "Das deutsche Gesundheitssystem ist besser als in der Türkei.", turkish: "Alman sağlık sistemi Türkiye'dekinden daha iyidir.", category: "deneyim" },
  { id: "de19", german: "Das deutsche Bildungssystem ist besser als in der Türkei.", turkish: "Alman eğitim sistemi Türkiye'dekinden daha iyidir.", category: "deneyim" },
  { id: "de20", german: "Wenn ich Zeit habe, fahre ich Fahrrad.", turkish: "Zamanım olduğunda bisiklete binerim.", category: "deneyim" },
  { id: "de21", german: "Ich gehe einmal die Woche ins Fitness-Studio.", turkish: "Haftada bir kez spor salonuna gidiyorum.", category: "deneyim" },
  { id: "de22", german: "In meiner Freizeit lese ich gerne Bücher.", turkish: "Boş zamanlarımda kitap okumayı severim.", category: "deneyim" },
  { id: "de23", german: "Als ich ein Kind war, habe ich Fußball gespielt.", turkish: "Çocukken futbol oynadım.", category: "deneyim" },
  { id: "de24", german: "Das Foto gefällt mir, weil es mich an meine Heimat erinnert.", turkish: "Fotoğrafı beğendim, çünkü bana vatanımı hatırlatıyor.", category: "deneyim" },
  { id: "de25", german: "Das Bild gefällt mir sehr, weil ich mich für Gesundheit interessiere.", turkish: "Resmi çok beğendim, çünkü sağlıkla ilgileniyorum.", category: "deneyim" },
  { id: "de26", german: "Ich höre gern Musik.", turkish: "Müzik dinlemeyi severim.", category: "deneyim" },
  { id: "de27", german: "Ich bin immer ziemlich beschäftigt.", turkish: "Her zaman oldukça meşgulüm.", category: "deneyim" },
  { id: "de28", german: "Es ist schön, dass Familien die gleichen Interessen haben.", turkish: "Ailelerin aynı ilgi alanlarına sahip olması güzel.", category: "deneyim" },
];

export function getWordsByCategory(categoryId: string): WordPair[] {
  return wordPairs.filter((w) => w.category === categoryId);
}

export function getRandomWords(count: number, category?: string): WordPair[] {
  const pool = category ? wordPairs.filter((w) => w.category === category) : wordPairs;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
