import json

with open('/home/z/my-project/src/lib/b1-exam-vocab.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lines = []
for w in data:
    lines.append('{')
    lines.append(f"  id: '{w['id']}',")
    lines.append(f"  german: {json.dumps(w['german'], ensure_ascii=False)},")
    article = json.dumps(w.get('article'), ensure_ascii=False) if w.get('article') else 'null'
    lines.append(f"  article: {article},")
    plural = json.dumps(w.get('plural'), ensure_ascii=False) if w.get('plural') else 'null'
    lines.append(f"  plural: {plural},")
    lines.append(f"  turkish: {json.dumps(w['turkish'], ensure_ascii=False)},")
    example = json.dumps(w.get('example', ''), ensure_ascii=False)
    lines.append(f"  example: {example},")
    lines.append(f"  topic: {json.dumps(w['topic'], ensure_ascii=False)},")
    lines.append(f"  topicTr: {json.dumps(w['topicTr'], ensure_ascii=False)},")
    lines.append('},')

with open('/home/z/my-project/src/lib/b1-exam-vocab-entries.ts', 'w', encoding='utf-8') as f:
    f.write('/* Auto-generated from wortschatzliste_b1_1.json — do not edit manually */\n')
    f.write("import { VocabItem } from './exam-data';\n\n")
    f.write('export const b1VocabEntries: VocabItem[] = [\n')
    f.write('\n'.join(lines))
    f.write('];\n')

print(f'Generated b1-exam-vocab-entries.ts with {len(data)} entries')
