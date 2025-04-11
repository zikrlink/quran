const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Baca file quran-metadata.json
const metadata = JSON.parse(fs.readFileSync('quran-metadata.json', 'utf8'));

// Baca file id.indonesian.xml dan bersihkan komentar
let xmlData = fs.readFileSync('id.indonesian.xml', 'utf8');
xmlData = xmlData.replace(/<!--[\s\S]*?-->/g, ''); // Hapus semua komentar XML

// Parse XML
const xmlParser = new xml2js.Parser({ explicitArray: false, trim: true });
let translations = {};

xmlParser.parseString(xmlData, (err, result) => {
    if (err) {
        console.error('Error parsing XML:', err);
        return;
    }

    // Proses terjemahan
    if (result.quran && result.quran.sura) {
        const suras = Array.isArray(result.quran.sura) ? result.quran.sura : [result.quran.sura];
        
        suras.forEach(sura => {
            const suraIndex = parseInt(sura.$.index);
            translations[suraIndex] = {};
            
            if (sura.aya) {
                const ayas = Array.isArray(sura.aya) ? sura.aya : [sura.aya];
                ayas.forEach(aya => {
                    const ayaIndex = parseInt(aya.$.index);
                    translations[suraIndex][ayaIndex] = aya.$.text;
                });
            }
        });
    }
});

// Ambil data sura
const suras = metadata.quran.suras.sura;

// Buat folder src jika belum ada
if (!fs.existsSync('src')) {
    fs.mkdirSync('src');
}

// Fungsi untuk memindahkan folder secara rekursif
function moveFolderRecursively(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const files = fs.readdirSync(source);
    
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        if (fs.lstatSync(sourcePath).isDirectory()) {
            moveFolderRecursively(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
            fs.unlinkSync(sourcePath);
        }
    });
    
    // Hapus folder sumber jika kosong
    if (fs.readdirSync(source).length === 0) {
        fs.rmdirSync(source);
    }
}

// Pindahkan semua file dari folder quran ke src
if (fs.existsSync('quran')) {
    moveFolderRecursively('quran', 'src');
}

// Proses setiap sura
suras.forEach(sura => {
    const suraIndex = parseInt(sura._index);
    const suraFolder = path.join('src', suraIndex.toString());
    
    // Buat folder sura jika belum ada
    if (!fs.existsSync(suraFolder)) {
        fs.mkdirSync(suraFolder);
    }
    
    // Buat info.json untuk sura
    const info = {
        index: suraIndex,
        name: sura._name,
        name_en: sura._tname,
        name_english: sura._ename,
        type: sura._type,
        ayas: parseInt(sura._ayas),
        rukus: parseInt(sura._rukus)
    };
    
    // Tulis ke file info.json
    const infoPath = path.join(suraFolder, 'info.json');
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf8');

    // Proses setiap ayat
    for (let ayaIndex = 1; ayaIndex <= info.ayas; ayaIndex++) {
        const ayaFolder = path.join(suraFolder, ayaIndex.toString());
        if (!fs.existsSync(ayaFolder)) {
            fs.mkdirSync(ayaFolder);
        }

        // Baca file index.json yang ada
        const indexPath = path.join(ayaFolder, 'index.json');
        let ayaData = {};
        if (fs.existsSync(indexPath)) {
            ayaData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }

        // Pastikan object translation ada
        if (!ayaData.translation) {
            ayaData.translation = {};
        }

        // Tambahkan terjemahan bahasa Indonesia ke dalam object translation
        if (translations[suraIndex] && translations[suraIndex][ayaIndex]) {
            ayaData.translation['id.indonesian'] = translations[suraIndex][ayaIndex];
        }

        // Hapus property translation_id yang lama jika ada
        if (ayaData.translation_id) {
            delete ayaData.translation_id;
        }

        // Tulis kembali ke file index.json
        fs.writeFileSync(indexPath, JSON.stringify(ayaData, null, 2), 'utf8');
    }
});

console.log('Konversi selesai!'); 