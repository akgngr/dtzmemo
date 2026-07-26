import re

filepath = '/home/z/my-project/src/components/modules/CustomWordsModule.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the file input accept attribute
content = content.replace('accept=".csv"', 'accept=".csv,.json"')

# 2. Update CSV import card title
content = content.replace(
    'CSV Dosyasından İçe Aktar',
    'Dosyadan İçe Aktar'
)

# 3. Update drop zone text
content = content.replace(
    'CSV dosyasını sürükleyin veya tıklayın',
    'CSV veya JSON dosyasını sürükleyin veya tıklayın'
)

# 4. Update format hint
content = content.replace(
    'Format: almanca,türkçe (başlık satırı isteğe bağlı)',
    'Desteklenen formatlar: CSV (almanca,türkçe) ve JSON'
)

# 5. Update file select to check for .json
old_handle_file_select = '''  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setToastMessage('Lütfen bir .csv dosyası seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setToastMessage('CSV dosyasından kelime çifti bulunamadı.');
        return;
      }
      setCsvParsedWords(parsed);
      setCsvImportName(file.name.replace(/\\.csv$/i, ''));
      setCsvImportDescription('');
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  }, []);'''

new_handle_file_select = '''  const handleFileSelect = useCallback((file: File) => {
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const words: CustomWord[] = (data.words || []).filter(
            (w: any) => typeof w.german === 'string' && typeof w.turkish === 'string' && w.german && w.turkish
          );
          if (words.length === 0) {
            setToastMessage('JSON dosyasından kelime çifti bulunamadı.');
            return;
          }
          setCsvParsedWords(words);
          setCsvImportName(data.name || file.name.replace(/\\.json$/i, ''));
          setCsvImportDescription(data.description || '');
          setShowCsvPreview(true);
        } catch {
          setToastMessage('JSON dosyası okunamadı. Lütfen formatı kontrol edin.');
        }
      };
      reader.readAsText(file);
      return;
    }
    if (!file.name.endsWith('.csv')) {
      setToastMessage('Lütfen .csv veya .json dosyası seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setToastMessage('CSV dosyasından kelime çifti bulunamadı.');
        return;
      }
      setCsvParsedWords(parsed);
      setCsvImportName(file.name.replace(/\\.csv$/i, ''));
      setCsvImportDescription('');
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  }, []);'''

content = content.replace(old_handle_file_select, new_handle_file_select)

# 6. Add helper functions after downloadCSV function
old_download_csv_end = '''function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}'''

new_download_csv_end = '''function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSampleCSV() {
  const csv = 'almanca,türkçe\\nGuten Morgen,İyi günler\\nAuf Wiedersehen,Hoşça kal\\nVielen Dank,Çok teşekkürler\\nEntschuldigung,Özür dilerim\\n';
  downloadCSV(csv, 'ornek-kelime-listesi.csv');
}

function downloadSampleJSON() {
  const json = JSON.stringify({
    name: 'Örnek Liste',
    description: 'Bu bir örnek listedir',
    words: [
      { german: 'Guten Morgen', turkish: 'İyi günler' },
      { german: 'Auf Wiedersehen', turkish: 'Hoşça kal' },
      { german: 'Vielen Dank', turkish: 'Çok teşekkürler' },
      { german: 'Entschuldigung', turkish: 'Özür dilerim' },
    ],
  }, null, 2);
  downloadJSON(json, 'ornek-kelime-listesi.json');
}'''

content = content.replace(old_download_csv_end, new_download_csv_end)

# 7. Add sample download buttons after the hidden input tag
old_input_hidden = '''                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />'''

new_input_hidden = '''                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    <div className="mt-3 flex gap-2">
                      <button onClick={downloadSampleCSV} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600">
                        <Download className="h-3.5 w-3.5" />
                        Örnek CSV İndir
                      </button>
                      <button onClick={downloadSampleJSON} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600">
                        <Download className="h-3.5 w-3.5" />
                        Örnek JSON İndir
                      </button>
                    </div>'''

content = content.replace(old_input_hidden, new_input_hidden)

# 8. Add JSON export handler after handleExportCSV
old_csv_export = '''  const handleExportCSV = () => {
    if (!selectedList || selectedList.words.length === 0) {
      setToastMessage('Dışa aktarılacak kelime yok.');
      return;
    }
    const csv = buildCSV(selectedList.words);
    const safeName = selectedList.name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\\s-_]/g, '').replace(/\\s+/g, '_');
    downloadCSV(csv, `${safeName}.csv`);
    setToastMessage(`"${selectedList.name}" CSV olarak indirildi.`);
  };'''

new_csv_export = '''  const handleExportCSV = () => {
    if (!selectedList || selectedList.words.length === 0) {
      setToastMessage('Dışa aktarılacak kelime yok.');
      return;
    }
    const csv = buildCSV(selectedList.words);
    const safeName = selectedList.name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\\s-_]/g, '').replace(/\\s+/g, '_');
    downloadCSV(csv, `${safeName}.csv`);
    setToastMessage(`"${selectedList.name}" CSV olarak indirildi.`);
  };

  const handleExportJSON = () => {
    if (!selectedList || selectedList.words.length === 0) {
      setToastMessage('Dışa aktarılacak kelime yok.');
      return;
    }
    const json = JSON.stringify(
      { name: selectedList.name, description: selectedList.description, words: selectedList.words },
      null, 2
    );
    const safeName = selectedList.name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\\s-_]/g, '').replace(/\\s+/g, '_');
    downloadJSON(json, `${safeName}.json`);
    setToastMessage(`"${selectedList.name}" JSON olarak indirildi.`);
  };'''

content = content.replace(old_csv_export, new_csv_export)

# 9. Replace the single CSV export button with CSV + JSON buttons
old_export_btn = '''                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-full rounded-xl"
                  disabled={selectedList.words.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV Olarak İndir
                </Button>'''

new_export_btn = '''                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="flex-1 rounded-xl"
                    disabled={selectedList.words.length === 0}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportJSON}
                    className="flex-1 rounded-xl"
                    disabled={selectedList.words.length === 0}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    JSON
                  </Button>
                </div>'''

content = content.replace(old_export_btn, new_export_btn)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('CustomWordsModule updated successfully')
