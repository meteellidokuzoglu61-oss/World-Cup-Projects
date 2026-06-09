const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:KENDI_LOKAL_SIFREN@localhost:5432/fifa2026',
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// --- OTOMATİK TABLO OLUŞTURMA FONKSİYONU ---
async function veritabaniniHazirla() {
    try {
        const client = await pool.connect();
        console.log('Veritabanı bağlantısı başarılı, tablolar kontrol ediliyor...');

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

        // 3. Takım İstatistikleri Tablosu
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

        // 4. Fikstür Tablosu
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

        // Varsayılan yöneticiyi ekleme (Eğer tabloda hiç kullanıcı yoksa ekler)
        const adminKontrol = await client.query('SELECT * FROM public.yoneticiler');
        if (adminKontrol.rows.length === 0) {
            await client.query(`
                INSERT INTO public.yoneticiler (kullanici_adi, sifre) 
                VALUES ('Mete', '123456');
            `);
            console.log('Varsayılan yönetici hesabı (Mete) başarıyla oluşturuldu.');
        }

        console.log('Tüm tablolar hazır!');
        client.release();
    } catch (err) {
        console.error('Veritabanı hazırlanırken hata oluştu:', err.message);
    }
}

// Sunucu başlarken fonksiyonu tetikle
veritabaniniHazirla();

// --- ENDPOINT'LER ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'SELECT * FROM public.yoneticiler WHERE kullanici_adi = $1';
        const result = await pool.query(query, [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
        }
        const admin = result.rows[0];
        if (admin.sifre !== password) {
            return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
        }
        res.json({ success: true, message: 'Giriş başarılı!', yonetici: admin.kullanici_adi });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = 'INSERT INTO public.yoneticiler (kullanici_adi, sifre) VALUES ($1, $2) RETURNING *';
        await pool.query(query, [username, password]);
        res.json({ success: true, message: 'Kayıt başarıyla eklendi.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    }
});

app.get('/api/duyurular', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.duyurular ORDER BY tarih DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Duyurular getirilemedi.' });
    }
});

app.get('/api/fikstur', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.fikstur ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Fikstür listesi çekilemedi.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});