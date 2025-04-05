const fs = require('fs');
const path = require('path');

// Baca file quran-metadata.json
const metadata = JSON.parse(fs.readFileSync('quran-metadata.json', 'utf8'));

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
    const suraIndex = sura._index;
    const suraFolder = path.join('src', suraIndex);
    
    // Buat folder sura jika belum ada
    if (!fs.existsSync(suraFolder)) {
        fs.mkdirSync(suraFolder);
    }
    
    // Buat info.json untuk sura
    const info = {
        index: parseInt(sura._index),
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
});

console.log('Konversi selesai!'); 