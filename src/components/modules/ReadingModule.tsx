'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  Star,
  Clock,
  RotateCcw,
  Mail,
  FileText,
  Newspaper,
  ClipboardList,
  Plus,
  Trash2,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { useAppStore } from '@/lib/store';
import type { CustomReadingExercise, CustomReadingQuestion } from '@/lib/store';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type Screen = 'topics' | 'read' | 'summary' | 'create' | 'ai-generate';

type QuestionType = 'richtig-falsch' | 'multiple-choice';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  correctAnswer: string; // 'richtig'/'falsch' for tf, 'a'/'b'/'c' for mc
  options?: { key: string; text: string }[];
}

interface ReadingExercise {
  id: string;
  level: 'A1' | 'A2' | 'B1';
  title: string;
  titleTr: string;
  category: string;
  icon: React.ElementType;
  text: string;
  questions: Question[];
}

// ── Reading Exercises Data ────────────────────────────────────────────────────

const readingExercises: ReadingExercise[] = [
  // ══════════════════════ A1 ══════════════════════
  {
    id: 'a1-email-1',
    level: 'A1',
    title: 'E-Mail: Internet-Anschluss',
    titleTr: 'E-Posta: İnternet Bağlantısı',
    category: 'İletişim',
    icon: Mail,
    text: `Von: NetCom
Gesendet: Mittwoch, 22. Mai, 12:20
An: Kim@email.de
Betreff: Auftragsbestätigung

Liebe Frau Kim,

vielen Dank für Ihren Auftrag. Wir freuen uns, dass Sie sich für NetCom entschieden haben. Im Anhang dieser E-Mail haben wir die wichtigsten Punkte Ihrer Bestellung zusammengefasst.

Die Auftragsbestätigung erhalten Sie in den nächsten Tagen per Brief. Sie enthält alle wichtigen Angaben zum Vertrag und Ihrem Internet-Anschluss sowie Ihre Zugangsdaten zu unserem Online-Service.

Bitte beachten Sie: Zur Bereitstellung sind Arbeiten an Ihrem Hausanschluss notwendig. Unser Techniker kommt am 27.07. zwischen 10:30 und 13:30 Uhr zu Ihnen.

Passt Ihnen der Termin? Dann klicken Sie bitte auf diesen Link: Termin-Zusage.

Freundliche Grüße
NetCom`,
    questions: [
      {
        id: 1,
        text: 'Frau Kim bekommt einen neuen Internet-Anschluss.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 2,
        text: 'Die Auftragsbestätigung kommt per E-Mail.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 3,
        text: 'Wie soll Frau Kim den Termin bestätigen?',
        type: 'multiple-choice',
        correctAnswer: 'a',
        options: [
          { key: 'a', text: 'auf den Link klicken' },
          { key: 'b', text: 'den Online-Service nutzen' },
          { key: 'c', text: 'einen Brief schreiben' },
        ],
      },
      {
        id: 4,
        text: 'Der Techniker kommt um 14 Uhr.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Wo findet die Arbeit statt?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: 'im Büro von NetCom' },
          { key: 'b', text: 'am Hausanschluss von Frau Kim' },
          { key: 'c', text: 'im Online-Service' },
        ],
      },
      {
        id: 6,
        text: 'Frau Kim hat den Auftrag per Telefon gemacht.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },
  {
    id: 'a1-letter-1',
    level: 'A1',
    title: 'Brief: Klassenfest',
    titleTr: 'Mektup: Sınıf Festivali',
    category: 'Eğitim',
    icon: FileText,
    text: `Liebe Familie Ivanov,

vielleicht hat Ihnen Ihr Sohn Denis schon erzählt, dass wir im nächsten Monat ein Klassenfest planen. Als Klassenlehrerin möchte ich Sie und Ihre Familie ganz herzlich einladen.

Damit es ein schöner Tag wird, brauchen wir die Hilfe von allen Familien. Die Teilnahme ist umsonst, aber alle sollen etwas zu essen oder zu trinken mitbringen. Außerdem brauchen wir Eltern, die Spiele organisieren. Es gibt sogar Preise für die Gewinner.

Können Sie mir bitte mitteilen, ob Sie an dem Fest teilnehmen? Sie können mich täglich zwischen 15 und 19 Uhr telefonisch erreichen oder per E-Mail. Oder Denis kann mir einfach in der Stunde Bescheid sagen.

Mit besten Grüßen
Silke Trautmann`,
    questions: [
      {
        id: 1,
        text: 'Frau Trautmann ist die Lehrerin von Denis.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 2,
        text: 'Die Teilnahme am Fest kostet Geld.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 3,
        text: 'Familie Ivanov soll',
        type: 'multiple-choice',
        correctAnswer: 'a',
        options: [
          { key: 'a', text: 'etwas zu essen oder trinken mitbringen' },
          { key: 'b', text: 'in der Schule anrufen' },
          { key: 'c', text: 'für das Fest bezahlen' },
        ],
      },
      {
        id: 4,
        text: 'Man kann Frau Trautmann zwischen 8 und 12 Uhr anrufen.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Wie kann Denis der Lehrerin Bescheid sagen?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'per Brief' },
          { key: 'b', text: 'am Abend telefonisch' },
          { key: 'c', text: 'in der Stunde' },
        ],
      },
      {
        id: 6,
        text: 'Es gibt Preise für die Gewinner der Spiele.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
    ],
  },
  {
    id: 'a1-notice-1',
    level: 'A1',
    title: 'Aushang: Sportverein',
    titleTr: 'Duyuru: Spor Kulübü',
    category: 'Spor & Hobi',
    icon: Newspaper,
    text: `SV Grün-Weiß — Mitglieder-Versammlung

Liebe Mitglieder,

am Samstag, den 15. Juni, findet unsere jährliche Mitglieder-Versammlung statt. Wir treffen uns um 18:00 Uhr im Vereinsheim.

Tagesordnung:
1. Begrüßung und Bericht des Vorstands
2. Finanzen und Mitgliedsbeiträge
3. Wahl des neuen Vorstands
4. Planung des Sommerfestes
5. Verschiedenes

Bitte bringen Sie Ihren Mitgliedsausweis mit. Gäste sind herzlich willkommen!

Für Getränke ist gesorgt. Wer etwas zum Essen mitbringen möchte, kann das gerne tun.

Wir freuen uns auf euch!
Der Vorstand`,
    questions: [
      {
        id: 1,
        text: 'Die Versammlung ist am Sonntag.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Die Versammlung beginnt um 18:00 Uhr.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Was steht nicht auf der Tagesordnung?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'Finanzen' },
          { key: 'b', text: 'Wahl des Vorstands' },
          { key: 'c', text: 'Trainingzeiten' },
        ],
      },
      {
        id: 4,
        text: 'Gäste dürfen nicht zur Versammlung kommen.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Man muss seinen Mitgliedsausweis mitbringen.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 6,
        text: 'Was ist kostenlos?',
        type: 'multiple-choice',
        correctAnswer: 'a',
        options: [
          { key: 'a', text: 'Getränke' },
          { key: 'b', text: 'Essen' },
          { key: 'c', text: 'der Mitgliedsbeitrag' },
        ],
      },
    ],
  },

  // ══════════════════════ A2 ══════════════════════
  {
    id: 'a2-email-1',
    level: 'A2',
    title: 'E-Mail: Praktikumsplatz',
    titleTr: 'E-Posta: Staj Yeri',
    category: 'İş & Meslek',
    icon: Mail,
    text: `Von: personal@techwave.de
An: Lukas.Schmidt@web.de
Betreff: Ihr Praktikum bei TechWave

Sehr geehrter Herr Schmidt,

vielen Dank für Ihre Bewerbung und das Gespräch am vergangenen Freitag. Wir waren sehr von Ihrem Profil beeindruckt.

Wir freuen uns, Ihnen ab dem 01. September einen Praktikumsplatz in unserer Marketing-Abteilung anbieten zu können. Das Praktikum dauert drei Monate und umfasst 20 Stunden pro Woche. Die Arbeitszeiten können flexibel gestaltet werden.

Ihr Ansprechpartner wird Frau Dr. Petersen sein. Sie erreicht sie unter der Durchwahl 030-5544-22 oder per E-Mail.

Bitte bestätigen Sie uns bis zum 15. August schriftlich, ob Sie das Praktikum antreten möchten. Bringen Sie am ersten Tag bitte Ihren Personalausweis mit.

Mit freundlichen Grüßen
Anna Müller
Personalabteilung`,
    questions: [
      {
        id: 1,
        text: 'Das Praktikum beginnt im August.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Lukas arbeitet in der Marketing-Abteilung.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Wie lange dauert das Praktikum?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: 'zwei Monate' },
          { key: 'b', text: 'drei Monate' },
          { key: 'c', text: 'sechs Monate' },
        ],
      },
      {
        id: 4,
        text: 'Lukas muss eine Zusage bis zum 15. August schicken.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 5,
        text: 'Wen muss Lukas am ersten Tag mitbringen?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'seinen Lebenslauf' },
          { key: 'b', text: 'ein Zeugnis' },
          { key: 'c', text: 'seinen Personalausweis' },
        ],
      },
      {
        id: 6,
        text: 'Die Arbeitszeiten sind festgelegt.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },
  {
    id: 'a2-notice-1',
    level: 'A2',
    title: 'Aushang: Umzugsfirma',
    titleTr: 'Duyuru: Taşıma Şirketi',
    category: 'Günlük Yaşam',
    icon: Newspaper,
    text: `SCHNELL & SICHER UMZÜGE
Ihr zuverlässiger Partner seit 2005!

Haben Sie einen Umzug geplant? Wir helfen Ihnen gerne!

Unser Angebot:
• Packservice: Wir verpacken Ihre Möbel und Gegenstände fachgerecht.
• Transport: Wir bringen alles sicher an den neuen Wohnort.
• Reinigung: Wir reinigen die alte Wohnung nach dem Auszug.

Preise:
• Studio-Wohnung (ab 30 m²): ab 350 €
• 2-Zimmer-Wohnung (ab 50 m²): ab 550 €
• 3-Zimmer-Wohnung (ab 70 m²): ab 750 €

Alle Preise inklusive MwSt. Kurzfristige Termine möglich!

Rufen Sie uns an: 0800-123-4567 (kostenlos)
oder schreiben Sie uns: info@schnell-umzug.de

Wir beraten Sie gerne kostenlos und unverbindlich!`,
    questions: [
      {
        id: 1,
        text: 'Die Firma existiert seit 2010.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Die Firma bietet Packservice an.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Was kostet ein Umzug für eine 2-Zimmer-Wohnung mindestens?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: '350 €' },
          { key: 'b', text: '550 €' },
          { key: 'c', text: '750 €' },
        ],
      },
      {
        id: 4,
        text: 'Man kann die Firma nur per E-Mail kontaktieren.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Die Beratung kostet Geld.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 6,
        text: 'Welcher Service wird NICHT angeboten?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'Packservice' },
          { key: 'b', text: 'Reinigung' },
          { key: 'c', text: 'Möbelkauf' },
        ],
      },
    ],
  },
  {
    id: 'a2-letter-1',
    level: 'A2',
    title: 'Brief: Sprachkurs',
    titleTr: 'Mektup: Dil Kursu',
    category: 'Eğitim',
    icon: FileText,
    text: `DeutschAkademie Berlin
Schönhauser Allee 125, 10119 Berlin

Sehr geehrte Frau Yılmaz,

vielen Dank für Ihre Anmeldung zum Deutschkurs B1.

Ihr Kurs beginnt am Montag, den 09. September und findet jeden Montag und Mittwoch von 18:30 bis 20:00 Uhr statt. Der Kursraum befindet sich im 3. Stock, Raum 312.

Bitte bringen Sie zum ersten Unterrichtstag mit:
– Ihr Kursbuch „Menschen B1.1" (kann auch bei uns gekauft werden, Preis: 18,90 €)
– Ein Heft und einen Stift

Der Kurs kostet insgesamt 240 € für 8 Wochen. Die Zahlung ist in zwei Raten möglich: 120 € zu Beginn und 120 € nach 4 Wochen.

Bei Fragen wenden Sie sich bitte an unser Büro (Raum 105) oder rufen Sie an: 030-4401-7788.

Wir freuen uns auf Sie!

Ihr Team der DeutschAkademie`,
    questions: [
      {
        id: 1,
        text: 'Der Kurs ist am Dienstag.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Der Kurs kostet 240 € für 8 Wochen.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Wie oft findet der Kurs pro Woche statt?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: 'einmal' },
          { key: 'b', text: 'zweimal' },
          { key: 'c', text: 'dreimal' },
        ],
      },
      {
        id: 4,
        text: 'Das Kursbuch ist im Preis enthalten.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Wann muss die zweite Rate bezahlt werden?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'nach 2 Wochen' },
          { key: 'b', text: 'nach 6 Wochen' },
          { key: 'c', text: 'nach 4 Wochen' },
        ],
      },
      {
        id: 6,
        text: 'Der Kursraum ist im Erdgeschoss.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },

  // ══════════════════════ B1 ══════════════════════
  {
    id: 'b1-article-1',
    level: 'B1',
    title: 'Artikel: Homeoffice in Deutschland',
    titleTr: 'Makale: Almanya\'da Evden Çalışma',
    category: 'Toplum',
    icon: Newspaper,
    text: `Homeoffice in Deutschland: Eine neue Arbeitskultur

Seit der Corona-Pandemie hat sich die Arbeitswelt in Deutschland stark verändert. Im Jahr 2023 arbeiteten rund 38 Prozent der Beschäftigten mindestens teilweise von zu Hause aus — vor der Pandemie waren es nur etwa 12 Prozent.

Viele Arbeitnehmer schätzen die Flexibilität: Kein Pendeln, mehr Zeit für die Familie und eine bessere Vereinbarkeit von Beruf und Privatleben. Besonders bei Eltern mit kleinen Kindern ist Homeoffice sehr beliebt.

Aber es gibt auch Nachteile. Einige Mitarbeiter fühlen sich isoliert und vermissen den Kontakt zu Kollegen. Die Grenze zwischen Arbeit und Freizeit verschwimmt, und viele arbeiten abends oder am Wochenende weiter, weil der Arbeitsplatz nur wenige Schritte entfernt ist.

Unternehmen stehen vor neuen Herausforderungen: Wie kann man die Teamarbeit organisieren? Wie lässt sich die Unternehmenskultur pflegen? Und wie geht man mit Mitarbeitern um, die im Büro produktiver sind als zu Hause?

Experten sind sich einig: Die Zukunft gehört dem hybriden Modell — einer Kombination aus Büro- und Heimarbeit.`,
    questions: [
      {
        id: 1,
        text: 'Vor der Pandemie arbeiteten mehr als 30 Prozent im Homeoffice.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Homeoffice ist besonders bei Eltern mit kleinen Kindern beliebt.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Was ist ein Nachteil des Homeoffice?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: 'man muss länger pendeln' },
          { key: 'b', text: 'man fühlt sich isoliert' },
          { key: 'c', text: 'die Arbeitszeit ist zu kurz' },
        ],
      },
      {
        id: 4,
        text: 'Im Homeoffice arbeiten die Menschen weniger.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Was empfehlen Experten für die Zukunft?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'nur noch Homeoffice' },
          { key: 'b', text: 'nur noch Büroarbeit' },
          { key: 'c', text: 'eine Kombination aus beidem' },
        ],
      },
      {
        id: 6,
        text: 'Die Grenze zwischen Arbeit und Freizeit ist im Homeoffice klarer.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },
  {
    id: 'b1-email-1',
    level: 'B1',
    title: 'E-Mail: Mietvertrag kündigen',
    titleTr: 'E-Posta: Kira Sözleşmesi Feshi',
    category: 'Günlük Yaşam',
    icon: Mail,
    text: `Von: max.mueller@gmx.de
An: verwaltung@wohnen-nord.de
Betreff: Kündigung meines Mietvertrags

Sehr geehrte Damen und Herren,

hiermit kündige ich meinen Mietvertrag für die Wohnung in der Mühlenstraße 42, 10407 Berlin, fristgerecht zum 31. Oktober 2024.

Ich ziehe aus beruflichen Gründen nach München um. Die Wohnung ist in einem guten Zustand und ich habe alle Reparaturen, die zu meinen Pflichten gehören, durchgeführt.

Die Wohnungsübergabe schlage ich für Samstag, den 26. Oktober, vor. Für eine Terminvereinbarung stehe ich Ihnen unter der Telefonnummer 0170-554-3322 zur Verfügung.

Bitte teilen Sie mir mit, wann die Kaution zurückerstattet wird und welche Unterlagen Sie dafür benötigen. Ich habe die Endreinigung bereits beauftragt.

Mit freundlichen Grüßen
Max Müller`,
    questions: [
      {
        id: 1,
        text: 'Max kündigt den Mietvertrag zum 31. Dezember.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'Max zieht nach München.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Warum kündigt Max den Mietvertrag?',
        type: 'multiple-choice',
        correctAnswer: 'a',
        options: [
          { key: 'a', text: 'berufliche Gründe' },
          { key: 'b', text: 'die Wohnung ist zu teuer' },
          { key: 'c', text: 'Nachbarschaftsprobleme' },
        ],
      },
      {
        id: 4,
        text: 'Max hat die Endreinigung noch nicht beauftragt.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Wie kann die Verwaltung Max erreichen?',
        type: 'multiple-choice',
        correctAnswer: 'b',
        options: [
          { key: 'a', text: 'per E-Mail nur' },
          { key: 'b', text: 'unter der Telefonnummer 0170-554-3322' },
          { key: 'c', text: 'per Brief' },
        ],
      },
      {
        id: 6,
        text: 'Die Wohnung ist in schlechtem Zustand.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },
  {
    id: 'b1-notice-1',
    level: 'B1',
    title: 'Artikel: Nachhaltigkeit im Alltag',
    titleTr: 'Makale: Günlük Hayatta Sürdürülebilirlik',
    category: 'Çevre',
    icon: ClipboardList,
    text: `Nachhaltigkeit im Alltag: Kleine Schritte, große Wirkung

Immer mehr Menschen in Deutschland möchten umweltbewusster leben. Doch wo anfangen? Experten empfehlen, mit kleinen Veränderungen zu beginnen.

Einer der einfachsten Schritte ist der Verzicht auf Plastiktüten. Seit 2022 dürfen in deutschen Geschäften keine kostenlosen Plastiktüten mehr ausgegeben werden. Stattdessen nutzen viele Kunden Stoffbeutel, die mehrfach verwendet werden können.

Auch beim Essen lässt sich viel tun: Regionale und saisonale Produkte haben einen kürzeren Transportweg und dadurch einen geringeren CO₂-Fußabdruck. Der Verzicht auf Fleisch an ein oder zwei Tagen pro Woche kann den ökologischen Fußabdruck einer Person um bis zu 15 Prozent reduzieren.

Im Haushalt hilft energiesparende Geräte beim Stromsparen. LED-Lampen verbrauchen beispielsweise bis zu 80 Prozent weniger Strom als herkömmliche Glühbirnen. Auch das Abschalten von Standby-Geräten macht einen Unterschied.

Der öffentliche Nahverkehr ist eine gute Alternative zum Auto. In vielen Städten gibt es jetzt auch Leihräder und E-Scooter, die kurze Strecken umweltfreundlich erledigen.

Jeder kleine Schritt zählt — gemeinsam können wir viel erreichen.`,
    questions: [
      {
        id: 1,
        text: 'In Deutschland kann man noch kostenlose Plastiktüten bekommen.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 2,
        text: 'LED-Lampen verbrauchen bis zu 80 Prozent weniger Strom.',
        type: 'richtig-falsch',
        correctAnswer: 'richtig',
      },
      {
        id: 3,
        text: 'Wie viel CO₂ kann man durch weniger Fleisch einsparen?',
        type: 'multiple-choice',
        correctAnswer: 'c',
        options: [
          { key: 'a', text: 'bis zu 5 Prozent' },
          { key: 'b', text: 'bis zu 10 Prozent' },
          { key: 'c', text: 'bis zu 15 Prozent' },
        ],
      },
      {
        id: 4,
        text: 'Regionale Produkte haben einen längeren Transportweg.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
      {
        id: 5,
        text: 'Was wird als Alternative zum Auto empfohlen?',
        type: 'multiple-choice',
        correctAnswer: 'a',
        options: [
          { key: 'a', text: 'öffentlicher Nahverkehr' },
          { key: 'b', text: 'Fahrgemeinschaft' },
          { key: 'c', text: 'nur zu Fuß gehen' },
        ],
      },
      {
        id: 6,
        text: 'Stoffbeutel können nur einmal verwendet werden.',
        type: 'richtig-falsch',
        correctAnswer: 'falsch',
      },
    ],
  },
];

// ── Level Config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { color: string; bg: string; badge: string; desc: string }> = {
  A1: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', desc: 'Başlangıç — Günlük temel metinler' },
  A2: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', desc: 'Temel — Daha uzun ve karmaşık metinler' },
  B1: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', desc: 'Orta — İş, toplum ve akademik metinler' },
};

// ── Animation ────────────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

// ── Component ────────────────────────────────────────────────────────────────

interface DraftQuestion {
  text: string;
  type: 'richtig-falsch' | 'multiple-choice';
  correctAnswer: string;
  options: { key: string; text: string }[];
}

export function ReadingModule() {
  const { saveExerciseResult, customReadingExercises, addCustomReadingExercise, deleteCustomReadingExercise } = useAppStore() as any;

  const [screen, setScreen] = useState<Screen>('topics');
  const [selectedExercise, setSelectedExercise] = useState<ReadingExercise | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    titleTr: '',
    level: 'A1' as 'A1' | 'A2' | 'B1',
    category: '',
    text: '',
  });
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<'richtig-falsch' | 'multiple-choice'>('richtig-falsch');
  const [newQAnswer, setNewQAnswer] = useState('richtig');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');

  // ── AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLevel, setAiLevel] = useState<'A1' | 'A2' | 'B1'>('A1');
  const [aiCategory, setAiCategory] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // ── Merge custom exercises with built-in
  const allExercises = useMemo(() => {
    const custom: ReadingExercise[] = (customReadingExercises || []).map((c: CustomReadingExercise) => ({
      ...c,
      icon: User,
    }));
    return [...readingExercises, ...custom];
  }, [customReadingExercises]);

  // ── Filtered exercises by level
  const filteredExercises = useMemo(() => {
    if (selectedLevel === 'all') return allExercises;
    return allExercises.filter((e) => e.level === selectedLevel);
  }, [selectedLevel, allExercises]);

  // ── Group by level for topics screen
  const grouped = useMemo(() => {
    const map = new Map<string, ReadingExercise[]>();
    for (const ex of filteredExercises) {
      const arr = map.get(ex.level) || [];
      arr.push(ex);
      map.set(ex.level, arr);
    }
    return map;
  }, [filteredExercises]);

  // ── Results after submit
  const results = useMemo(() => {
    if (!selectedExercise || !submitted) return null;
    let correct = 0;
    for (const q of selectedExercise.questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    return {
      correct,
      total: selectedExercise.questions.length,
      percentage: Math.round((correct / selectedExercise.questions.length) * 100),
    };
  }, [selectedExercise, submitted, answers]);

  // ── Handlers
  const handleStartExercise = (exercise: ReadingExercise) => {
    setSelectedExercise(exercise);
    setAnswers({});
    setSubmitted(false);
    setScreen('read');
  };

  const handleAnswer = (questionId: number, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!selectedExercise) return;
    const unanswered = selectedExercise.questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0) return;
    setSubmitted(true);

    // Save to store
    if (saveExerciseResult) {
      const correctCount = selectedExercise.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
      saveExerciseResult(
        'reading',
        correctCount,
        selectedExercise.questions.length,
        selectedExercise.category ? [selectedExercise.category] : undefined,
      );
    }
  };

  const handleRetry = () => {
    if (!selectedExercise) return;
    setAnswers({});
    setSubmitted(false);
  };

  const handleBackToTopics = () => {
    setScreen('topics');
    setSelectedExercise(null);
    setAnswers({});
    setSubmitted(false);
  };

  const allAnswered = selectedExercise
    ? selectedExercise.questions.every((q) => answers[q.id])
    : false;

  // ── Create handlers
  const handleAddQuestion = () => {
    const text = newQText.trim();
    if (!text) return;
    if (newQType === 'multiple-choice') {
      if (!newOptA.trim() || !newOptB.trim() || !newOptC.trim()) return;
    }
    const q: DraftQuestion = {
      text,
      type: newQType,
      correctAnswer: newQAnswer,
      options: newQType === 'multiple-choice'
        ? [
            { key: 'a', text: newOptA.trim() },
            { key: 'b', text: newOptB.trim() },
            { key: 'c', text: newOptC.trim() },
          ]
        : [],
    };
    setDraftQuestions((prev) => [...prev, q]);
    setNewQText('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewQAnswer('richtig');
  };

  const handleRemoveDraftQuestion = (idx: number) => {
    setDraftQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveExercise = () => {
    if (!createForm.title.trim() || !createForm.text.trim() || draftQuestions.length === 0) return;
    const exercise: CustomReadingExercise = {
      id: `custom-${Date.now()}`,
      level: createForm.level,
      title: createForm.title.trim(),
      titleTr: createForm.titleTr.trim() || createForm.title.trim(),
      category: createForm.category.trim() || 'Özel',
      text: createForm.text.trim(),
      questions: draftQuestions.map((q, i) => ({
        id: i + 1,
        text: q.text,
        type: q.type,
        correctAnswer: q.correctAnswer,
        options: q.options.length > 0 ? q.options : undefined,
      })),
      createdAt: new Date().toISOString(),
    };
    addCustomReadingExercise(exercise);
    setScreen('topics');
    setCreateForm({ title: '', titleTr: '', level: 'A1', category: '', text: '' });
    setDraftQuestions([]);
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomReadingExercise(id);
  };

  const isCustomExercise = (id: string) => id.startsWith('custom-');

  // ── AI generate handler
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const { apiKeys } = useAppStore.getState() as any;
      const zhipuKey = apiKeys?.zhipuKey || '';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: aiPrompt.trim() }],
          systemPrompt: `Sen bir Almanca dil öğretmenisin. Kullanıcının verdiği konu hakkında kısa bir Almanca okuma metni ve ${aiLevel} seviyesinde 5 adet comprehension sorusu oluştur.

KURALLAR:
- Metin ${aiLevel} seviyesinde olmalı, gerçekçi günlük dil kullanmalı
- Metin kısa olmalı (4-8 cümle)
- Soruların 3'ü richtig/falsch (true/false), 2'si çoktan seçmeli (a/b/c) olmalı
- TÜMÜ ALMANCA olarak yaz

JSON formatında döndür, BAŞKA HİÇBİR ŞEY EKLEME:
{"title":"Almanca başlık","titleTr":"Türkçe başlık","category":"Kategori","text":"Almanca metin buraya...","questions":[{"text":"Soru 1","type":"richtig-falsch","correctAnswer":"richtig"},{"text":"Soru 2","type":"richtig-falsch","correctAnswer":"falsch"},{"text":"Soru 3","type":"richtig-falsch","correctAnswer":"richtig"},{"text":"Soru 4","type":"multiple-choice","correctAnswer":"a","options":[{"key":"a","text":"A şıkkı"},{"key":"b","text":"B şıkkı"},{"key":"c","text":"C şıkkı"}]},{"text":"Soru 5","type":"multiple-choice","correctAnswer":"b","options":[{"key":"a","text":"A şıkkı"},{"key":"b","text":"B şıkkı"},{"key":"c","text":"C şıkkı"}]}]}`,
          zhipuKey,
          maxTokens: 1500,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAiError(data.error);
        return;
      }
      const reply = data.reply || '';
      let cleaned = reply.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      }
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        setAiError('Yanıt JSON formatında değil. Lütfen tekrar deneyin.');
        return;
      }
      const parsed = JSON.parse(match[0]);
      if (!parsed.text || !parsed.questions || !Array.isArray(parsed.questions)) {
        setAiError('Geçersiz yanıt formatı.');
        return;
      }
      // Fill the create form with AI result
      setCreateForm({
        title: parsed.title || 'AI Metni',
        titleTr: parsed.titleTr || '',
        level: aiLevel,
        category: aiCategory || parsed.category || 'Özel',
        text: parsed.text,
      });
      setDraftQuestions(parsed.questions.map((q: any, i: number) => ({
        text: q.text,
        type: q.type || 'richtig-falsch',
        correctAnswer: q.correctAnswer || 'richtig',
        options: q.options || [],
      })));
      setScreen('create');
    } catch (err: any) {
      setAiError(err?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, aiLevel, aiCategory]);

  // ── Render: Topics Screen
  if (screen === 'topics') {
    return (
      <motion.div key="topics" initial="initial" animate="animate" exit="exit" variants={staggerContainer} className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-sm">
          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <BookOpenText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Okuma Anlama</h2>
            </div>
            <p className="ml-[52px] text-sm text-white/80">
              Almanca metinleri okuyun, soruları cevaplayın. Seviyenize göre seçin.
            </p>
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
        </motion.div>

        {/* Add custom + AI buttons */}
        <motion.div variants={fadeInUp} className="flex gap-2">
          <Button
            onClick={() => setScreen('create')}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Kendi Metinimi Ekle
          </Button>
          <Button
            onClick={() => setScreen('ai-generate')}
            variant="outline"
            className="flex-1 rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI ile Oluştur
          </Button>
        </motion.div>

        {/* Level filter */}
        <motion.div variants={fadeInUp} className="flex gap-2">
          {[{ key: 'all', label: 'Tümü' }, { key: 'A1', label: 'A1' }, { key: 'A2', label: 'A2' }, { key: 'B1', label: 'B1' }].map((l) => (
            <button
              key={l.key}
              onClick={() => setSelectedLevel(l.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                selectedLevel === l.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {l.label}
            </button>
          ))}
        </motion.div>

        {/* Exercise list grouped by level */}
        {Array.from(grouped.entries()).map(([level, exercises]) => (
          <motion.div key={level} variants={fadeInUp} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs font-semibold', LEVEL_CONFIG[level]?.badge)}>{level}</Badge>
              <span className="text-xs text-gray-500">{LEVEL_CONFIG[level]?.desc}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {exercises.map((ex) => {
                const Icon = ex.icon;
                const custom = isCustomExercise(ex.id);
                return (
                  <motion.div
                    key={ex.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group cursor-pointer"
                  >
                    <Card className="h-full rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            onClick={() => handleStartExercise(ex)}
                            className="flex items-start gap-3 min-w-0 flex-1"
                          >
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', LEVEL_CONFIG[level]?.bg)}>
                              <Icon className={cn('h-5 w-5', LEVEL_CONFIG[level]?.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-semibold text-gray-800 leading-tight">{ex.title}</h4>
                                {custom && <Badge className="text-[9px] px-1 py-0 bg-purple-100 text-purple-600">Özel</Badge>}
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500 truncate">{ex.titleTr}</p>
                              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ex.category}</Badge>
                                <span className="flex items-center gap-0.5">
                                  <ClipboardList className="h-3 w-3" />
                                  {ex.questions.length} soru
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {custom && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCustom(ex.id); }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // ── Render: Reading Screen
  if (screen === 'read' && selectedExercise) {
    const ex = selectedExercise;
    const config = LEVEL_CONFIG[ex.level] || LEVEL_CONFIG.A1;
    const Icon = ex.icon;
    const progress = submitted
      ? 100
      : (Object.keys(answers).length / ex.questions.length) * 100;

    return (
      <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
        {/* Back button + title */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBackToTopics} className="-ml-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Metinler
          </Button>
          <Badge className={cn('text-xs font-semibold', config.badge)}>{ex.level}</Badge>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-2" />
            <span className="shrink-0 text-xs text-gray-400">
              {Object.keys(answers).length}/{ex.questions.length}
            </span>
          </div>
        )}

        {/* Reading text card */}
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
          <div className={cn('px-4 py-3 flex items-center gap-2', config.bg)}>
            <Icon className={cn('h-4 w-4', config.color)} />
            <h3 className="text-sm font-semibold text-gray-800">{ex.title}</h3>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{ex.category}</Badge>
          </div>
          <CardContent className="p-4">
            <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700 font-mono bg-gray-50 rounded-xl p-4 max-h-[45vh] overflow-y-auto">
              {ex.text}
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Sorular
          </h3>

          {ex.questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  'rounded-2xl border-0 shadow-sm overflow-hidden transition-colors',
                  submitted && userAnswer && (isCorrect ? 'ring-2 ring-emerald-300' : !isCorrect ? 'ring-2 ring-red-300' : '')
                )}>
                  <CardContent className="p-4 space-y-3">
                    {/* Question text */}
                    <div className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                        {q.text}
                      </p>
                    </div>

                    {/* Richtig/Falsch buttons */}
                    {q.type === 'richtig-falsch' && (
                      <div className="ml-8 flex gap-2">
                        {['richtig', 'falsch'].map((opt) => {
                          const selected = userAnswer === opt;
                          const showCorrect = submitted && opt === q.correctAnswer;
                          const showWrong = submitted && selected && !isCorrect;
                          return (
                            <button
                              key={opt}
                              disabled={submitted}
                              onClick={() => handleAnswer(q.id, opt)}
                              className={cn(
                                'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                                !submitted && !selected && 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                                !submitted && selected && 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300',
                                submitted && showCorrect && 'bg-emerald-100 text-emerald-700',
                                submitted && showWrong && 'bg-red-100 text-red-600',
                                submitted && !showCorrect && !showWrong && 'bg-gray-100 text-gray-400'
                              )}
                            >
                              {showCorrect && <CheckCircle2 className="h-4 w-4" />}
                              {showWrong && <XCircle className="h-4 w-4" />}
                              {opt === 'richtig' ? 'Richtig' : 'Falsch'}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple choice options */}
                    {q.type === 'multiple-choice' && q.options && (
                      <div className="ml-8 space-y-1.5">
                        {q.options.map((opt) => {
                          const selected = userAnswer === opt.key;
                          const showCorrect = submitted && opt.key === q.correctAnswer;
                          const showWrong = submitted && selected && !isCorrect;
                          return (
                            <button
                              key={opt.key}
                              disabled={submitted}
                              onClick={() => handleAnswer(q.id, opt.key)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all text-left',
                                !submitted && !selected && 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                                !submitted && selected && 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300',
                                submitted && showCorrect && 'bg-emerald-50 text-emerald-700',
                                submitted && showWrong && 'bg-red-50 text-red-600',
                                submitted && !showCorrect && !showWrong && 'bg-gray-50 text-gray-400'
                              )}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold">
                                {opt.key.toUpperCase()}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                              {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                              {showWrong && <XCircle className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Submitted feedback */}
                    {submitted && !userAnswer && (
                      <p className="ml-8 text-xs text-gray-400">Cevaplanmadı</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Submit / Summary buttons */}
        {!submitted ? (
          <div className="sticky bottom-4 z-10">
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full rounded-xl bg-indigo-600 py-6 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-lg"
              size="lg"
            >
              Cevapları Kontrol Et
            </Button>
          </div>
        ) : results ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Result card */}
            <Card className={cn(
              'rounded-2xl border-0 shadow-lg overflow-hidden',
              results.percentage >= 80 ? 'bg-emerald-50' : results.percentage >= 50 ? 'bg-amber-50' : 'bg-red-50'
            )}>
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full',
                    results.percentage >= 80 ? 'bg-emerald-100' : results.percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
                  )}>
                    {results.percentage >= 80 ? (
                      <Trophy className="h-7 w-7 text-emerald-600" />
                    ) : results.percentage >= 50 ? (
                      <Star className="h-7 w-7 text-amber-500" />
                    ) : (
                      <RotateCcw className="h-7 w-7 text-red-500" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  {results.percentage >= 80 ? 'Harika!' : results.percentage >= 50 ? 'İyi gidiyorsun!' : 'Tekrar dene!'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {results.correct} doğru / {results.total} soru
                </p>
                <div className="mt-3 text-3xl font-bold text-gray-800">{results.percentage}%</div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className="flex-1 rounded-xl">
                <RotateCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
              <Button onClick={handleBackToTopics} className="flex-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                <BookOpenText className="mr-2 h-4 w-4" />
                Diğer Metinler
              </Button>
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    );
  }

  // ── Render: AI Generate Screen
  if (screen === 'ai-generate') {
    return (
      <motion.div key="ai-generate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
        {/* Back + title */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setScreen('topics')} className="-ml-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Metinler
          </Button>
          <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold">AI Oluştur</Badge>
        </div>

        {/* AI card */}
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-white">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Yapay Zeka ile Metin Oluştur
            </h3>
            <p className="mt-1 text-xs text-white/80">
              Bir konu yazın, AI size Almanca okuma metni ve soruları hazırlasın.
            </p>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Level + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Seviye</label>
                <div className="flex gap-1.5">
                  {(['A1', 'A2', 'B1'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setAiLevel(l)}
                      className={cn(
                        'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                        aiLevel === l ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                <Input
                  placeholder="z.B. İş, Sağlık..."
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Konu *</label>
              <Textarea
                placeholder={"Örn: Bir süpermarkette alışveriş yapan birinin deneyimi, bir doktor randevusu, bir e-posta daveti..."}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="rounded-xl min-h-[100px] text-sm"
              />
            </div>

            {/* Example prompts */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1.5">Örnek konular:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Bir e-posta daveti', 'Süpermarkette alışveriş', 'Doktor randevusu', 'Bir kiralık daire arama', 'Tren bileti alma', 'Spor salonu kaydı'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAiPrompt(p)}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {aiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {aiError}
              </div>
            )}

            {/* Generate button */}
            <Button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || aiLoading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-50"
              size="lg"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Metin ve Soruları Oluştur
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Render: Create Screen
  if (screen === 'create') {
    const canSave = createForm.title.trim() && createForm.text.trim() && draftQuestions.length >= 1;

    return (
      <motion.div key="create" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
        {/* Back + title */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setScreen('topics')} className="-ml-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Metinler
          </Button>
          <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold">Yeni Metin</Badge>
        </div>

        {/* Header card */}
        <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-white">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Kendi Okuma Metnini Oluştur
            </h3>
            <p className="mt-1 text-xs text-white/80">Bir Almanca metin yazın, ardından doğru/yanlış veya çoktan seçmeli sorular ekleyin.</p>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Title fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık (Almanca) *</label>
                <Input
                  placeholder="z.B. E-Mail: Einladung"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık (Türkçe)</label>
                <Input
                  placeholder="z.B. E-Posta: Davet"
                  value={createForm.titleTr}
                  onChange={(e) => setCreateForm((p) => ({ ...p, titleTr: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* Level + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Seviye *</label>
                <div className="flex gap-1.5">
                  {(['A1', 'A2', 'B1'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCreateForm((p) => ({ ...p, level: l }))}
                      className={cn(
                        'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                        createForm.level === l
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                <Input
                  placeholder="z.B. İş, Eğitim..."
                  value={createForm.category}
                  onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Almanca Metin *</label>
              <Textarea
                placeholder="Almanca metninizi buraya yazın..."
                value={createForm.text}
                onChange={(e) => setCreateForm((p) => ({ ...p, text: e.target.value }))}
                className="rounded-xl min-h-[160px] text-sm leading-relaxed font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add question card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-500" />
                Sorular ({draftQuestions.length})
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => setNewQType('richtig-falsch')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                    newQType === 'richtig-falsch' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  Doğru/Yanlış
                </button>
                <button
                  onClick={() => { setNewQType('multiple-choice'); setNewQAnswer('a'); }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                    newQType === 'multiple-choice' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  Çoktan Seçmeli
                </button>
              </div>
            </div>

            <Separator />

            {/* Question text */}
            <Input
              placeholder="Soruyu yazın (Almanca)..."
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
              className="rounded-xl h-10"
            />

            {/* Richtig/Falsch answer selector */}
            {newQType === 'richtig-falsch' && (
              <div className="flex gap-2">
                {(['richtig', 'falsch'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setNewQAnswer(opt)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-medium transition-colors',
                      newQAnswer === opt
                        ? opt === 'richtig' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' : 'bg-red-100 text-red-600 ring-2 ring-red-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {opt === 'richtig' ? 'Richtig (Doğru)' : 'Falsch (Yanlış)'}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple choice options */}
            {newQType === 'multiple-choice' && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-500">Doğru cevabı seçmek için şıkka tıklayın:</p>
                {[
                  { key: 'a', val: newOptA, set: setNewOptA, placeholder: 'A şıkkı...' },
                  { key: 'b', val: newOptB, set: setNewOptB, placeholder: 'B şıkkı...' },
                  { key: 'c', val: newOptC, set: setNewOptC, placeholder: 'C şıkkı...' },
                ].map((opt) => (
                  <div key={opt.key} className="flex gap-2 items-center">
                    <button
                      onClick={() => setNewQAnswer(opt.key)}
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                        newQAnswer === opt.key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      {opt.key.toUpperCase()}
                    </button>
                    <Input
                      placeholder={opt.placeholder}
                      value={opt.val}
                      onChange={(e) => opt.set(e.target.value)}
                      className="rounded-lg h-9"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add question button */}
            <Button
              onClick={handleAddQuestion}
              variant="outline"
              className="w-full rounded-xl border-dashed border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Soruyu Ekle
            </Button>

            {/* Draft questions list */}
            <AnimatePresence>
              {draftQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Separator />
                  <p className="text-xs font-medium text-gray-500">Eklenen Sorular:</p>
                  {draftQuestions.map((q, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-start gap-2 rounded-xl bg-gray-50 p-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-600">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-700 font-medium">{q.text}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {q.type === 'richtig-falsch' ? 'Doğru/Yanlış' : 'Çoktan Seçmeli'}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            Cevap: <strong>{q.correctAnswer.toUpperCase()}</strong>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDraftQuestion(idx)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Save / Cancel buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setScreen('topics')}
            className="flex-1 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            İptal
          </Button>
          <Button
            onClick={handleSaveExercise}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}
