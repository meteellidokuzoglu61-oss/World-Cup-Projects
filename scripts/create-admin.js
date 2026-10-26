require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const username = process.env.ADMIN_USERNAME?.trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!connectionString) throw new Error('DATABASE_URL tanımlı değil.');
    if (!username || username.length < 3 || username.length > 50) {
        throw new Error('ADMIN_USERNAME 3-50 karakter arasında olmalı.');
    }
    if (!password || password.length < 12) {
        throw new Error('ADMIN_PASSWORD en az 12 karakter olmalı.');
    }

    const pool = new Pool({ connectionString });
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.yoneticiler (
                id SERIAL PRIMARY KEY,
                kullanici_adi VARCHAR(50) UNIQUE NOT NULL,
                sifre VARCHAR(100) NOT NULL
            );
        `);

        const passwordHash = await bcrypt.hash(password, 12);
        await pool.query(
            `INSERT INTO public.yoneticiler (kullanici_adi, sifre)
             VALUES ($1, $2)
             ON CONFLICT (kullanici_adi)
             DO UPDATE SET sifre = EXCLUDED.sifre`,
            [username, passwordHash]
        );

        console.log(`Yönetici hesabı güvenli parola özetiyle oluşturuldu/güncellendi: ${username}`);
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('Yönetici hesabı hazırlanamadı:', error.message);
    process.exitCode = 1;
});
