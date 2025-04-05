const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Fungsi untuk membersihkan XML dari komentar
function cleanXML(xmlData) {
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

// Fungsi untuk membuat direktori jika belum ada
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Fungsi utama untuk mengkonversi dan membuat struktur folder
async function convertQuranToRoutes() {
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

        // Buat direktori utama
        const baseDir = 'quran';
        ensureDirectoryExists(baseDir);

        // Proses setiap surah
        quran.forEach((sura, suraIndex) => {
            const translationSura = translations[suraIndex];
            const suraDir = path.join(baseDir, sura.index);
            ensureDirectoryExists(suraDir);

            // Tulis informasi surah
            const suraInfo = {
                index: parseInt(sura.index),
                name: sura.name,
                name_en: translationSura.name
            };

            fs.writeFileSync(
                path.join(suraDir, 'info.json'),
                JSON.stringify(suraInfo, null, 2),
                'utf8'
            );

            // Proses setiap ayat
            const ayahs = Array.isArray(sura.aya) ? sura.aya : [sura.aya];
            ayahs.forEach((aya, ayaIndex) => {
                const translationAya = Array.isArray(translationSura.aya) 
                    ? translationSura.aya[ayaIndex] 
                    : translationSura.aya;

                const ayaDir = path.join(suraDir, aya.index);
                ensureDirectoryExists(ayaDir);

                const ayaData = {
                    index: parseInt(aya.index),
                    text: aya.text,
                    translation: {
                        "en.sahih": translationAya.text
                    },
                    bismillah: aya.bismillah || null
                };

                // Buat file untuk setiap ayat
                fs.writeFileSync(
                    path.join(ayaDir, 'index.json'),
                    JSON.stringify(ayaData, null, 2),
                    'utf8'
                );
            });
        });

        console.log('Konversi selesai! Struktur folder telah dibuat di direktori quran.');
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

// Jalankan konversi
convertQuranToRoutes(); 