const fs = require('fs');
const xml2js = require('xml2js');

// Fungsi untuk membersihkan XML dari komentar
function cleanXML(xmlData) {
    // Hapus komentar XML
    return xmlData.replace(/<!--[\s\S]*?-->/g, '');
}

// Fungsi untuk membaca file XML
async function readXMLFile(filePath) {
    const xmlData = fs.readFileSync(filePath, 'utf8');
    const cleanData = cleanXML(xmlData);
    
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });
        
        parser.parseString(cleanData, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

// Fungsi utama untuk mengkonversi
async function convertQuranToJSON() {
    try {
        // Baca kedua file XML
        const [quranData, translationData] = await Promise.all([
            readXMLFile('quran-uthmani.xml'),
            readXMLFile('en.sahih.xml')
        ]);

        const quran = quranData.quran.sura;
        const translations = translationData.quran.sura;

        // Pastikan kedua array memiliki panjang yang sama
        if (!Array.isArray(quran) || !Array.isArray(translations)) {
            throw new Error('Format XML tidak sesuai');
        }

        // Gabungkan data
        const combinedQuran = quran.map((sura, index) => {
            const translationSura = translations[index];
            return {
                index: parseInt(sura.index),
                name: sura.name,
                name_en: translationSura.name,
                ayahs: Array.isArray(sura.aya) ? sura.aya.map((aya, ayaIndex) => ({
                    index: parseInt(aya.index),
                    text: aya.text,
                    translation: {
                        "en.sahih": translationSura.aya[ayaIndex].text
                    },
                    bismillah: aya.bismillah || null
                })) : [{
                    index: parseInt(sura.aya.index),
                    text: sura.aya.text,
                    translation: {
                        "en.sahih": translationSura.aya.text
                    },
                    bismillah: sura.aya.bismillah || null
                }]
            };
        });

        // Tulis ke file JSON
        fs.writeFileSync(
            'quran.json',
            JSON.stringify(combinedQuran, null, 2),
            'utf8'
        );

        console.log('Konversi selesai! File quran.json telah dibuat.');
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

// Jalankan konversi
convertQuranToJSON(); 