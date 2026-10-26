const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '100kb' })); // Gövde boyutunu sınırla

// CORS — Sadece izin verilen kaynaklar
app.use(cors({
    origin: function (origin, callback) {
        const allowed = [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://localhost:5501',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:5501'
        ];
        // origin undefined = aynı origin (file:// veya doğrudan sunucu) → izin ver
        // Origin başlığı olmayan istekler (ör. bazı sunucu-istemci çağrıları) CORS
        // kontrolüne tabi değildir. Tarayıcı kaynaklı çapraz-origin istekleri sınırla.
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS kaynağına izin verilmiyor.'));
        }
    }
}));

// Statik dosyaları doğrudan sun (HTML, CSS, JS, JSON, Resimler)
app.use(express.static(__dirname));

// Neon Cloud PostgreSQL — Bağlantı bilgisi .env dosyasından okunur
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.warn('⚠️ DATABASE_URL .env dosyasında tanımlı değil. Veritabanı olmadan in-memory modda çalışılacak.');
}

let isDbConnected = false;
let pool = null;

try {
    pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000 // 5 saniye içinde bağlanamazsa bekletme
    });
} catch (e) {
    console.warn("⚠️ PostgreSQL havuzu başlatılamadı, in-memory modda çalışılacak.");
}

// --- IN-MEMORY YEDEK VERİ DEPOSU (VERİTABANI KESİLSE BİLE SİTE ÇÖKMEZ) ---
const mockDb = {
    // Veritabanı erişilemiyorsa yönetici girişi kapalı kalır.
    // Kaynak kodda varsayılan yönetici hesabı/parolası tutulmaz.
    yoneticiler: [],
    yorumlar: [
        { id: 1, mac_id: 'Meksika-Güney-Afrika', kullanici_adi: 'Mete', yorum_metni: 'Turnuvanın açılış maçı nefes kesecek!', tarih: new Date().toISOString() },
        { id: 2, mac_id: 'Avustralya-Türkiye', kullanici_adi: 'Mete', yorum_metni: 'Bizim Çocuklar bu maçı alır!', tarih: new Date().toISOString() }
    ],
    duyurular: [
        { id: 1, baslik: 'Turnuva Başlıyor', icerik: '2026 FIFA Dünya Kupası maç takvimi ve bilet bilgileri güncellendi.', tip: 'success', aktif: true, created_at: new Date().toISOString() },
        { id: 2, baslik: 'Yeni Eşleşmeler', icerik: 'Eleme ağacı ve gruplar sisteme işlendi. Canlı tahminleri inceleyebilirsiniz.', tip: 'info', aktif: true, created_at: new Date().toISOString() }
    ]
};

// --- OTOMATİK TABLO OLUŞTURMA ---
async function veritabaniniHazirla() {
    if (!pool) return;
    try {
        const client = await pool.connect();
        isDbConnected = true;
        console.log('✅ Veritabanı bağlantısı başarılı, tablolar kontrol ediliyor...');

        // 1. Yöneticiler Tablosu
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.yoneticiler (
                id SERIAL PRIMARY KEY,
                kullanici_adi VARCHAR(50) UNIQUE,
                sifre VARCHAR(100)
            );
        `);

        // 2. Yorumlar Tablosu
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.yorumlar (
                id SERIAL PRIMARY KEY,
                mac_id VARCHAR(100),
                kullanici_adi VARCHAR(50),
                yorum_metni TEXT,
                tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Duyurular Tablosu
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.duyurular (
                id SERIAL PRIMARY KEY,
                baslik VARCHAR(255) NOT NULL,
                icerik TEXT NOT NULL,
                tip VARCHAR(50) DEFAULT 'info',
                aktif BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 4. Takım İstatistikleri Tablosu
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.takim_istatistikleri (
                id SERIAL PRIMARY KEY,
                takim VARCHAR(100),
                bayrak_kod VARCHAR(10),
                grup VARCHAR(10),
                o INT DEFAULT 0,
                g INT DEFAULT 0,
                b INT DEFAULT 0,
                m INT DEFAULT 0,
                ag INT DEFAULT 0,
                yg INT DEFAULT 0,
                av INT DEFAULT 0,
                p INT DEFAULT 0
            );
        `);

        // 5. Fikstür Tablosu
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.fikstur (
                id INT PRIMARY KEY,
                tur VARCHAR(50),
                grup VARCHAR(50),
                ev VARCHAR(100),
                dep VARCHAR(100),
                kodEv VARCHAR(10),
                kodDep VARCHAR(10),
                tsi VARCHAR(10),
                stat VARCHAR(255),
                tarih VARCHAR(50),
                yerel VARCHAR(50)
            );
        `);

        // Varsayılan duyuru ekleme
        const duyuruKontrol = await client.query('SELECT * FROM public.duyurular LIMIT 1');
        if (duyuruKontrol.rows.length === 0) {
            await client.query(`
                INSERT INTO public.duyurular (baslik, icerik, tip) 
                VALUES ('Turnuva Başlıyor', '2026 FIFA Dünya Kupası maç takvimi ve bilet bilgileri güncellendi.', 'success'),
                       ('Yeni Eşleşmeler', 'Eleme ağacı ve gruplar sisteme işlendi. Canlı tahminleri inceleyebilirsiniz.', 'info');
            `);
        }

        console.log('✅ Tüm veritabanı tabloları hazır!');
        client.release();
    } catch (err) {
        isDbConnected = false;
        console.warn('⚠️ Canlı veritabanına bağlanılamadı, sistem In-Memory / Yerel yedek modunda kesintisiz devam ediyor:', err.message);
    }
}

veritabaniniHazirla();

// --- ENDPOINT'LER ---

// Sağlık Kontrolü
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: isDbConnected ? 'connected' : 'offline_memory_fallback',
        timestamp: new Date().toISOString()
    });
});

// 1. Giriş
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        if (isDbConnected && pool) {
            const result = await pool.query('SELECT * FROM public.yoneticiler WHERE LOWER(kullanici_adi) = LOWER($1)', [username]);
            if (result.rows.length > 0) {
                const admin = result.rows[0];
                // Parolalar bcrypt özeti olarak saklanmalıdır. Eski düz metin
                // kayıtlar bilerek kabul edilmez; kontrollü parola sıfırlaması gerekir.
                const passwordMatches = await bcrypt.compare(password, admin.sifre || '');
                if (passwordMatches) {
                    return res.json({ success: true, message: 'Giriş başarılı!', yonetici: admin.kullanici_adi });
                }
            }
        }
    } catch (err) {
        console.warn('DB login hatası, in-memory yedek kontrol ediliyor:', err.message);
    }

    // In-memory fallback kontrolü
    const mockUser = mockDb.yoneticiler.find(u => u.kullanici_adi.toLowerCase() === username.toLowerCase());
    if (mockUser && mockUser.sifre === password) {
        return res.json({ success: true, message: 'Giriş başarılı! (Yedek mod)', yonetici: mockUser.kullanici_adi });
    }

    return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
});

// 2. Kayıt
// Bu tablo yönetici hesapları içindir. Herkese açık kayıt burada kapalı tutulur;
// normal kullanıcı kaydı ayrı bir kullanıcı modeli ve rol sistemi gerektirir.
app.post('/api/register', (_req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Herkese açık kayıt şu anda kapalıdır.'
    });
});

// 3. Duyurular
app.get('/api/duyurular', async (req, res) => {
    try {
        if (isDbConnected && pool) {
            const result = await pool.query('SELECT * FROM public.duyurular WHERE aktif = TRUE ORDER BY created_at DESC');
            if (result.rows.length > 0) {
                return res.json(result.rows);
            }
        }
    } catch (err) {
        console.warn('DB duyurular hatası, fallback dönülüyor:', err.message);
    }
    return res.json(mockDb.duyurular);
});

// 4. Yorumlar (GET & POST)
app.get('/api/yorumlar', async (req, res) => {
    const { mac_id } = req.query;
    try {
        if (isDbConnected && pool) {
            let query = 'SELECT * FROM public.yorumlar';
            let params = [];
            if (mac_id) {
                query += ' WHERE mac_id = $1';
                params.push(mac_id);
            }
            query += ' ORDER BY tarih DESC';
            const result = await pool.query(query, params);
            return res.json(result.rows);
        }
    } catch (err) {
        console.warn('DB yorum çekme hatası, fallback dönülüyor:', err.message);
    }

    const filtered = mac_id ? mockDb.yorumlar.filter(y => y.mac_id === mac_id) : mockDb.yorumlar;
    return res.json(filtered);
});

app.post('/api/yorumlar', async (req, res) => {
    const { mac_id, kullanici_adi, yorum_metni } = req.body;
    if (!mac_id || !yorum_metni) {
        return res.status(400).json({ success: false, message: 'Eksik yorum bilgisi.' });
    }

    // Input validation — max uzunluk sınırı
    if (yorum_metni.length > 1000) {
        return res.status(400).json({ success: false, message: 'Yorum çok uzun (max 1000 karakter).' });
    }
    if (mac_id.length > 200) {
        return res.status(400).json({ success: false, message: 'Geçersiz maç bilgisi.' });
    }

    const yazar = kullanici_adi || 'Misafir';
    const yeniYorum = {
        id: Date.now(),
        mac_id,
        kullanici_adi: yazar,
        yorum_metni,
        tarih: new Date().toISOString()
    };

    try {
        if (isDbConnected && pool) {
            await pool.query(
                'INSERT INTO public.yorumlar (mac_id, kullanici_adi, yorum_metni) VALUES ($1, $2, $3)',
                [mac_id, yazar, yorum_metni]
            );
            return res.json({ success: true, message: 'Yorum kaydedildi.', yorum: yeniYorum });
        }
    } catch (err) {
        console.warn('DB yorum kaydetme hatası, in-memory kaydedildi:', err.message);
    }

    mockDb.yorumlar.unshift(yeniYorum);
    return res.json({ success: true, message: 'Yorum kaydedildi.', yorum: yeniYorum });
});

// 5. Fikstür
app.get('/api/fikstur', async (req, res) => {
    try {
        if (isDbConnected && pool) {
            const result = await pool.query('SELECT * FROM public.fikstur ORDER BY id ASC');
            if (result.rows.length > 0) {
                return res.json(result.rows);
            }
        }
    } catch (err) {
        console.warn('DB fikstur hatası, JSON dosyası okunuyor:', err.message);
    }

    const fiksturYolu = path.join(__dirname, 'fikstur.json');
    if (fs.existsSync(fiksturYolu)) {
        try {
            const data = JSON.parse(fs.readFileSync(fiksturYolu, 'utf-8'));
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ error: 'Fikstür JSON dosyası okunamadı.' });
        }
    }
    return res.status(404).json({ error: 'Fikstür bulunamadı.' });
});

// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FIFA 2026 Sunucusu ${PORT} portunda aktif.`);
    console.log(`🌐 Web Arayüzü: http://localhost:${PORT}`);
});