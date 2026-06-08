const { Pool } = require('pg');

const pool = new Pool({
    // Kopyaladığın postgresql:// ile başlayan linki buraya yapıştır
    connectionString: "postgresql://neondb_owner:npg_ev2h8nfCiQPx@ep-morning-voice-a2xh2zf5.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: {
        rejectUnauthorized: false
    }
});

function argumanlariAl() {
    const args = process.argv.slice(2);
    const sonuclar = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const anahtar = args[i].replace('--', '');
            const deger = args[i + 1];
            sonuclar[anahtar] = deger;
        }
    }
    return sonuclar;
}

async function baslat() {
    const parametreler = argumanlariAl();
    const baslik = parametreler.baslik;
    const icerik = parametreler.icerik;
    const tip = parametreler.tip || 'info';

    if (!baslik || !icerik) {
        console.error('❌ Hata: --baslik ve --icerik girmek zorundasınız!');
        process.exit(1);
    }

    try {
        // Tablo canlı bulut veritabanında yoksa otomatik oluşturuluyor
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.duyurular (
                id SERIAL PRIMARY KEY,
                baslik VARCHAR(255) NOT NULL,
                icerik TEXT NOT NULL,
                tip VARCHAR(50) DEFAULT 'info',
                aktif BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('ℹ️ Canlı veritabanında tablo kontrol edildi.');

        const sql = 'INSERT INTO public.duyurular (baslik, icerik, tip) VALUES ($1, $2, $3) RETURNING id;';
        const sonuc = await pool.query(sql, [baslik, icerik, tip]);
        
        console.log(`✅ Duyuru NEON canlı veritabanına başarıyla eklendi! (ID: ${sonuc.rows[0].id})`);

    } catch (err) {
        console.error('❌ Hata oluştu:', err.message);
    } finally {
        await pool.end();
    }
}

baslat();