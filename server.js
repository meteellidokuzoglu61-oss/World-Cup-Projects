const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    password: 'myPassword', // Kendi şifrenle değiştir
    port: 5432,
    database: 'fifa2026'
};

let activePool;

// --- SENİN PAYLAŞTIĞIN ORİJİNAL VERİ SETİ ---
const hamFiksturVerisi = [
    { "ev": "Meksika", "dep": "Güney Afrika", "kodEv": "mx", "kodDep": "za", "tarih": "11 Haziran 2026", "tsi": "22:00", "yerel": "13:00 CST", "grup": "A Grubu", "stat": "Aztek Stadyumu, Meksiko" },
    { "ev": "Güney Kore", "dep": "Çekya", "kodEv": "kr", "kodDep": "cz", "tarih": "12 Haziran 2026", "tsi": "05:00", "yerel": "20:00 CST", "grup": "A Grubu", "stat": "Chivas Stadyumu, Zapopan" },
    { "ev": "Kanada", "dep": "Bosna-Hersek", "kodEv": "ca", "kodDep": "ba", "tarih": "12 Haziran 2026", "tsi": "22:00", "yerel": "15:00 CST", "grup": "B Grubu", "stat": "BMO Field, Toronto" },
    { "ev": "ABD", "dep": "Paraguay", "kodEv": "us", "kodDep": "py", "tarih": "13 Haziran 2026", "tsi": "04:00", "yerel": "18:00 PDT", "grup": "D Grubu", "stat": "SoFi Stadyumu, Inglewood" },
    { "ev": "Katar", "dep": "İsviçre", "kodEv": "qa", "kodDep": "ch", "tarih": "13 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "B Grubu", "stat": "Levi's Stadyumu, Santa Clara" },
    { "ev": "Brezilya", "dep": "Fas", "kodEv": "br", "kodDep": "ma", "tarih": "14 Haziran 2026", "tsi": "01:00", "yerel": "18:00 EDT", "grup": "C Grubu", "stat": "MetLife Stadyumu, East Rutherford" },
    { "ev": "Haiti", "dep": "İskoçya", "kodEv": "ht", "kodDep": "gb-sct", "tarih": "14 Haziran 2026", "tsi": "04:00", "yerel": "21:00 EDT", "grup": "C Grubu", "stat": "Gillette Stadyumu, Foxborough" },
    { "ev": "Avustralya", "dep": "Türkiye", "kodEv": "au", "kodDep": "tr", "tarih": "14 Haziran 2026", "tsi": "07:00", "yerel": "21:00 PDT", "grup": "D Grubu", "stat": "BC Place, Vancouver" },
    { "ev": "Almanya", "dep": "Curaçao", "kodEv": "de", "kodDep": "cw", "tarih": "14 Haziran 2026", "tsi": "20:00", "yerel": "12:00 CDT", "grup": "E Grubu", "stat": "NRG Stadyumu, Houston" },
    { "ev": "Hollanda", "dep": "Japonya", "kodEv": "nl", "kodDep": "jp", "tarih": "14 Haziran 2026", "tsi": "23:00", "yerel": "15:00 CDT", "grup": "F Grubu", "stat": "AT&T Stadyumu, Arlington" },
    { "ev": "Fildişi Sahili", "dep": "Ekvador", "kodEv": "ci", "kodDep": "ec", "tarih": "15 Haziran 2026", "tsi": "02:00", "yerel": "19:00 CST", "grup": "E Grubu", "stat": "Lincoln Financial Field, Philadelphia" },
    { "ev": "İsveç", "dep": "Tunus", "kodEv": "se", "kodDep": "tn", "tarih": "15 Haziran 2026", "tsi": "05:00", "yerel": "20:00 CDT", "grup": "F Grubu", "stat": "BBVA Stadyumu, Guadalupe" },
    { "ev": "İspanya", "dep": "Yeşil Burun Adaları", "kodEv": "es", "kodDep": "cv", "tarih": "15 Haziran 2026", "tsi": "19:00", "yerel": "12:00 CDT", "grup": "H Grubu", "stat": "Mercedes-Benz, Atlanta" },
    { "ev": "Belçika", "dep": "Mısır", "kodEv": "be", "kodDep": "eg", "tarih": "15 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "G Grubu", "stat": "Lumen Field, Seattle" },
    { "ev": "Suudi Arabistan", "dep": "Uruguay", "kodEv": "sa", "kodDep": "uy", "tarih": "16 Haziran 2026", "tsi": "01:00", "yerel": "18:00 CDT", "grup": "H Grubu", "stat": "Hard Rock Stadyumu, Miami" },
    { "ev": "İran", "dep": "Yeni Zelanda", "kodEv": "ir", "kodDep": "nz", "tarih": "16 Haziran 2026", "tsi": "04:00", "yerel": "18:00 PDT", "grup": "G Grubu", "stat": "SoFi Stadyumu, Inglewood" },
    { "ev": "Fransa", "dep": "Senegal", "kodEv": "fr", "kodDep": "sn", "tarih": "16 Haziran 2026", "tsi": "22:00", "yerel": "15:00 CST", "grup": "I Grubu", "stat": "MetLife Stadyumu, East Rutherford" },
    { "ev": "Irak", "dep": "Norveç", "kodEv": "iq", "kodDep": "no", "tarih": "17 Haziran 2026", "tsi": "01:00", "yerel": "18:00 EDT", "grup": "I Grubu", "stat": "Gillette Stadyumu, Foxborough" },
    { "ev": "Arjantin", "dep": "Cezayir", "kodEv": "ar", "kodDep": "dz", "tarih": "17 Haziran 2026", "tsi": "04:00", "yerel": "20:00 CDT", "grup": "J Grubu", "stat": "Arrowhead Stadyumu, Kansas City" },
    { "ev": "Avusturya", "dep": "Ürdün", "kodEv": "at", "kodDep": "jo", "tarih": "17 Haziran 2026", "tsi": "07:00", "yerel": "21:00 PDT", "grup": "J Grubu", "stat": "Levi's Stadyumu, Santa Clara" },
    { "ev": "Portekiz", "dep": "Kongo DC", "kodEv": "pt", "kodDep": "cd", "tarih": "17 Haziran 2026", "tsi": "20:00", "yerel": "12:00 CDT", "grup": "K Grubu", "stat": "NRG Stadyumu, Houston" },
    { "ev": "İngiltere", "dep": "Hırvatistan", "kodEv": "gb-eng", "kodDep": "hr", "tarih": "17 Haziran 2026", "tsi": "23:00", "yerel": "15:00 CST", "grup": "L Grubu", "stat": "AT&T Stadyumu, Arlington" },
    { "ev": "Gana", "dep": "Panama", "kodEv": "gh", "kodDep": "pa", "tarih": "18 Haziran 2026", "tsi": "02:00", "yerel": "19:00 EDT", "grup": "L Grubu", "stat": "BMO Field, Toronto" },
    { "ev": "Özbekistan", "dep": "Kolombiya", "kodEv": "uz", "kodDep": "co", "tarih": "18 Haziran 2026", "tsi": "05:00", "yerel": "20:00 CST", "grup": "K Grubu", "stat": "Aztek Stadyumu, Meksiko" },
    { "ev": "Çekya", "dep": "Güney Afrika", "kodEv": "cz", "kodDep": "za", "tarih": "18 Haziran 2026", "tsi": "19:00", "yerel": "12:00 EDT", "grup": "A Grubu", "stat": "Mercedes-Benz Stadyumu, Atlanta" },
    { "ev": "İsviçre", "dep": "Bosna-Hersek", "kodEv": "ch", "kodDep": "ba", "tarih": "18 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "B Grubu", "stat": "SoFi Stadyumu, Inglewood" },
    { "ev": "Kanada", "dep": "Katar", "kodEv": "ca", "kodDep": "qa", "tarih": "19 Haziran 2026", "tsi": "01:00", "yerel": "15:00 PDT", "grup": "B Grubu", "stat": "BC Place, Vancouver" },
    { "ev": "Meksika", "dep": "Güney Kore", "kodEv": "mx", "kodDep": "kr", "tarih": "19 Haziran 2026", "tsi": "04:00", "yerel": "19:00 EDT", "grup": "A Grubu", "stat": "Chivas Stadyumu, Zapopan" },
    { "ev": "İskoçya", "dep": "Fas", "kodEv": "gb-sct", "kodDep": "ma", "tarih": "20 Haziran 2026", "tsi": "01:00", "yerel": "18:00 EDT", "grup": "C Grubu", "stat": "Gillette Stadyumu, Foxborough" },
    { "ev": "Brezilya", "dep": "Haiti", "kodEv": "br", "kodDep": "ht", "tarih": "20 Haziran 2026", "tsi": "04:00", "yerel": "21:00 EDT", "grup": "C Grubu", "stat": "Lincoln Financial Field, Philadelphia" },
    { "ev": "Türkiye", "dep": "Paraguay", "kodEv": "tr", "kodDep": "py", "tarih": "20 Haziran 2026", "tsi": "06:00", "yerel": "20:00 PDT", "grup": "D Grubu", "stat": "Levi's Stadyumu, Santa Clara" },
    { "ev": "ABD", "dep": "Avustralya", "kodEv": "us", "kodDep": "au", "tarih": "19 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "D Grubu", "stat": "Lumen Field, Seattle" },
    { "ev": "Almanya", "dep": "Fildişi Sahili", "kodEv": "de", "kodDep": "ci", "tarih": "20 Haziran 2026", "tsi": "23:00", "yerel": "16:00 CST", "grup": "E Grubu", "stat": "BMO Field, Toronto" },
    { "ev": "Ekvador", "dep": "Curaçao", "kodEv": "ec", "kodDep": "cw", "tarih": "21 Haziran 2026", "tsi": "03:00", "yerel": "19:00 CDT", "grup": "E Grubu", "stat": "Arrowhead Stadyumu, Kansas City" },
    { "ev": "Hollanda", "dep": "İsveç", "kodEv": "nl", "kodDep": "se", "tarih": "20 Haziran 2026", "tsi": "20:00", "yerel": "12:00 CDT", "grup": "F Grubu", "stat": "NRG Stadyumu, Houston" },
    { "ev": "Tunus", "dep": "Japonya", "kodEv": "tn", "kodDep": "jp", "tarih": "21 Haziran 2026", "tsi": "07:00", "yerel": "22:00 CDT", "grup": "F Grubu", "stat": "BBVA Stadyumu, Guadalupe" },
    { "ev": "Uruguay", "dep": "Yeşil Burun Adaları", "kodEv": "uy", "kodDep": "cv", "tarih": "22 Haziran 2026", "tsi": "01:00", "yerel": "18:00 CDT", "grup": "H Grubu", "stat": "Hard Rock Stadyumu, Miami" },
    { "ev": "İspanya", "dep": "Suudi Arabistan", "kodEv": "es", "kodDep": "sa", "tarih": "21 Haziran 2026", "tsi": "19:00", "yerel": "12:00 CDT", "grup": "H Grubu", "stat": "Mercedes-Benz Stadyumu, Atlanta" },
    { "ev": "Belçika", "dep": "İran", "kodEv": "be", "kodDep": "ir", "tarih": "21 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "G Grubu", "stat": "SoFi Stadyumu, Inglewood" },
    { "ev": "Yeni Zelanda", "dep": "Mısır", "kodEv": "nz", "kodDep": "eg", "tarih": "22 Haziran 2026", "tsi": "04:00", "yerel": "18:00 PDT", "grup": "G Grubu", "stat": "BC Place, Vancouver" },
    { "ev": "Norveç", "dep": "Senegal", "kodEv": "no", "kodDep": "sn", "tarih": "23 Haziran 2026", "tsi": "03:00", "yerel": "20:00 CST", "grup": "I Grubu", "stat": "MetLife Stadyumu, East Rutherford" },
    { "ev": "Fransa", "dep": "Irak", "kodEv": "fr", "kodDep": "iq", "tarih": "23 Haziran 2026", "tsi": "00:00", "yerel": "17:00 EDT", "grup": "I Grubu", "stat": "Lincoln Financial Field, Philadelphia" },
    { "ev": "Arjantin", "dep": "Cezayir", "kodEv": "ar", "kodDep": "dz", "tarih": "22 Haziran 2026", "tsi": "20:00", "yerel": "12:00 CDT", "grup": "J Grubu", "stat": "AT&T Stadyumu, Arlington" },
    { "ev": "Ürdün", "dep": "Cezayir", "kodEv": "jo", "kodDep": "dz", "tarih": "23 Haziran 2026", "tsi": "06:00", "yerel": "12:00 PDT", "grup": "J Grubu", "stat": "Levi's Stadyumu, Santa Clara" },
    { "ev": "İngiltere", "dep": "Gana", "kodEv": "gb-eng", "kodDep": "gh", "tarih": "23 Haziran 2026", "tsi": "23:00", "yerel": "16:00 EDT", "grup": "L Grubu", "stat": "Gillette Stadyumu, Foxborough" },
    { "ev": "Panama", "dep": "Hırvatistan", "kodEv": "pa", "kodDep": "hr", "tarih": "24 Haziran 2026", "tsi": "02:00", "yerel": "19:00 EDT", "grup": "L Grubu", "stat": "BMO Field, Toronto" },
    { "ev": "Portekiz", "dep": "Özbekistan", "kodEv": "pt", "kodDep": "uz", "tarih": "23 Haziran 2026", "tsi": "20:00", "yerel": "12:00 CDT", "grup": "K Grubu", "stat": "NRG Stadyumu, Houston" },
    { "ev": "Kolombiya", "dep": "Kongo DC", "kodEv": "co", "kodDep": "cd", "tarih": "24 Haziran 2026", "tsi": "05:00", "yerel": "20:00 CST", "grup": "K Grubu", "stat": "Chivas Stadyumu, Zapopan" },
    { "ev": "İskoçya", "dep": "Brezilya", "kodEv": "gb-sct", "kodDep": "br", "tarih": "25 Haziran 2026", "tsi": "01:00", "yerel": "18:00 EDT", "grup": "C Grubu", "stat": "Hard Rock Stadyumu, Miami" },
    { "ev": "Fas", "dep": "Haiti", "kodEv": "ma", "kodDep": "ht", "tarih": "25 Haziran 2026", "tsi": "01:00", "yerel": "18:00 EDT", "grup": "C Grubu", "stat": "Mercedes-Benz Stadyumu, Atlanta" },
    { "ev": "İsviçre", "dep": "Kanada", "kodEv": "ch", "kodDep": "ca", "tarih": "24 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "B Grubu", "stat": "BC Place, Vancouver" },
    { "ev": "Bosna-Hersek", "dep": "Katar", "kodEv": "ba", "kodDep": "qa", "tarih": "24 Haziran 2026", "tsi": "22:00", "yerel": "12:00 PDT", "grup": "B Grubu", "stat": "Lumen Field, Seattle" },
    { "ev": "Çekya", "dep": "Meksika", "kodEv": "cz", "kodDep": "mx", "tarih": "25 Haziran 2026", "tsi": "04:00", "yerel": "19:00 CST", "grup": "A Grubu", "stat": "Aztek Stadyumu, Meksiko" },
    { "ev": "Güney Afrika", "dep": "Güney Kore", "kodEv": "za", "kodDep": "kr", "tarih": "25 Haziran 2026", "tsi": "04:00", "yerel": "19:00 CST", "grup": "A Grubu", "stat": "BBVA Stadyumu, Guadalupe" },
    { "ev": "Curaçao", "dep": "Fildişi Sahili", "kodEv": "cw", "kodDep": "ci", "tarih": "25 Haziran 2026", "tsi": "23:00", "yerel": "16:00 CST", "grup": "E Grubu", "stat": "Lincoln Financial Field, Philadelphia" },
    { "ev": "Ekvador", "dep": "Almanya", "kodEv": "ec", "kodDep": "de", "tarih": "25 Haziran 2026", "tsi": "23:00", "yerel": "16:00 CST", "grup": "E Grubu", "stat": "MetLife Stadyumu, East Rutherford" },
    { "ev": "Japonya", "dep": "İsveç", "kodEv": "jp", "kodDep": "se", "tarih": "26 Haziran 2026", "tsi": "02:00", "yerel": "18:00 CDT", "grup": "F Grubu", "stat": "AT&T Stadyumu, Arlington" },
    { "ev": "Tunus", "dep": "Hollanda", "kodEv": "tn", "kodDep": "nl", "tarih": "26 Haziran 2026", "tsi": "02:00", "yerel": "18:00 CDT", "grup": "F Grubu", "stat": "Arrowhead Stadyumu, Kansas City" },
    { "ev": "Türkiye", "dep": "ABD", "kodEv": "tr", "kodDep": "us", "tarih": "26 Haziran 2026", "tsi": "05:00", "yerel": "19:00 PDT", "grup": "D Grubu", "stat": "SoFi Stadyumu, Inglewood" },
    { "ev": "Paraguay", "dep": "Avustralya", "kodEv": "py", "kodDep": "au", "tarih": "26 Haziran 2026", "tsi": "05:00", "yerel": "19:00 PDT", "grup": "D Grubu", "stat": "Levi's Stadyumu, Santa Clara" },
    { "ev": "Norveç", "dep": "Fransa", "kodEv": "no", "kodDep": "fr", "tarih": "26 Haziran 2026", "tsi": "22:00", "yerel": "15:00 EDT", "grup": "I Grubu", "stat": "Gillette Stadyumu, Foxborough" },
    { "ev": "Senegal", "dep": "Irak", "kodEv": "sn", "kodDep": "iq", "tarih": "26 Haziran 2026", "tsi": "22:00", "yerel": "15:00 EDT", "grup": "I Grubu", "stat": "BMO Field, Toronto" },
    { "ev": "Mısır", "dep": "İran", "kodEv": "eg", "kodDep": "ir", "tarih": "27 Haziran 2026", "tsi": "06:00", "yerel": "20:00 PDT", "grup": "G Grubu", "stat": "Lumen Field, Seattle" },
    { "ev": "Yeni Zelanda", "dep": "Belçika", "kodEv": "nz", "kodDep": "be", "tarih": "27 Haziran 2026", "tsi": "06:00", "yerel": "20:00 PDT", "grup": "G Grubu", "stat": "BC Place, Vancouver" },
    { "ev": "Yeşil Burun Adaları", "dep": "Suudi Arabistan", "kodEv": "cv", "kodDep": "sa", "tarih": "27 Haziran 2026", "tsi": "03:00", "yerel": "19:00 CDT", "grup": "H Grubu", "stat": "NRG Stadyumu, Houston" },
    { "ev": "Uruguay", "dep": "İspanya", "kodEv": "uy", "kodDep": "es", "tarih": "27 Haziran 2026", "tsi": "03:00", "yerel": "18:00 CST", "grup": "H Grubu", "stat": "Chivas Stadyumu, Zapopan" },
    { "ev": "Panama", "dep": "İngiltere", "kodEv": "pa", "kodDep": "gb-eng", "tarih": "28 Haziran 2026", "tsi": "00:00", "yerel": "17:00 EDT", "grup": "L Grubu", "stat": "MetLife Stadyumu, East Rutherford" },
    { "ev": "Hırvatistan", "dep": "Gana", "kodEv": "hr", "kodDep": "gh", "tarih": "28 Haziran 2026", "tsi": "00:00", "yerel": "17:00 EDT", "grup": "L Grubu", "stat": "Lincoln Financial Field, Philadelphia" },
    { "ev": "Cezayir", "dep": "Avusturya", "kodEv": "dz", "kodDep": "at", "tarih": "28 Haziran 2026", "tsi": "05:00", "yerel": "21:00 CDT", "grup": "J Grubu", "stat": "Arrowhead Stadyumu, Kansas City" },
    { "ev": "Ürdün", "dep": "Arjantin", "kodEv": "jo", "kodDep": "ar", "tarih": "28 Haziran 2026", "tsi": "05:00", "yerel": "21:00 CDT", "grup": "J Grubu", "stat": "AT&T Stadyumu, Arlington" },
    { "ev": "Kolombiya", "dep": "Portekiz", "kodEv": "co", "kodDep": "pt", "tarih": "28 Haziran 2026", "tsi": "02:30", "yerel": "19:30 EDT", "grup": "K Grubu", "stat": "Hard Rock Stadyumu, Miami" },
    { "ev": "Kongo DC", "dep": "Özbekistan", "kodEv": "cd", "kodDep": "uz", "tarih": "28 Haziran 2026", "tsi": "02:30", "yerel": "19:30 EDT", "grup": "K Grubu", "stat": "Mercedes-Benz Stadyumu, Atlanta" },
    { "id": 73, "tur": "Son 32", "grup": "Son 32", "ev": "A2", "dep": "B2", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"SoFi Stadyumu, Inglewood" ,"tarih":"29 Haziran 2026","yerel":"12:00 PDT"},
    {"id":76 ,"tur":"Son 32","grup":"Son 32","ev":"C1","dep":"F2","kodEv": "un", "kodDep": "un","tsi":"20:00","stat":"NRG Stadyumu, Houston","tarih":"29 Haziran 2026","yerel":"12:00 CST"},
    { "id": 74, "tur": "Son 32", "grup": "Son 32", "ev": "E1", "dep": "A/B/C/D/F Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "23:30","stat":"Gillette Stadyumu, Foxborough" ,"tarih":"29 Haziran 2026","yerel":"16:30 EDT"},
    {"id":75 ,"tur":"Son 32","grup":"Son 32","ev":"F1","dep":"C2","kodEv": "un", "kodDep": "un","tsi":"04:00","stat":"BBVA Stadyumu, Guadalupe","tarih":"29 Haziran 2026","yerel":"19:00 CST"},
    {"id":78 ,"tur":"Son 32","grup":"Son 32","ev":"E2","dep":"I2","kodEv": "un", "kodDep": "un","tsi":"20:00","stat":"AT&T Stadyumu, Arlington","tarih":"30 Haziran 2026","yerel":"12:00 CDT"},
    { "id": 77, "tur": "Son 32", "grup": "Son 32", "ev": "I1", "dep": "C/D/F/G/H Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "00:00","stat":"MetLife Stadyumu, East Rutherford" ,"tarih":"30 Haziran 2026","yerel":"17:00 EDT"},
    { "id": 79, "tur": "Son 32", "grup": "Son 32", "ev": "A1", "dep": "C/E/F/H/I Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "04:00","stat":"Aztek Stadyumu, Meksiko" ,"tarih":"30 Haziran 2026","yerel":"19:00 CST"},
    { "id": 80, "tur": "Son 32", "grup": "Son 32", "ev": "L1", "dep": "E/H/I/J/K Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "19:00","stat":"Mercedes-Benz Stadyumu, Atlanta" ,"tarih":"30 Haziran 2026","yerel":"12:00 EDT"},
    { "id": 82, "tur": "Son 32", "grup": "Son 32", "ev": "G1", "dep": "A/E/H/I/J Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "23:00","stat":"Lumen Field, Seattle" ,"tarih":"1 Temmuz 2026","yerel":"13:00 PDT"},
    { "id": 81, "tur": "Son 32", "grup": "Son 32", "ev": "D1", "dep": "B/E/F/I/J Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "03:00","stat":"Levi's Stadyumu, Santa Clara" ,"tarih":"1 Temmuz 2026","yerel":"17:00 PDT"},
    { "id": 84, "tur": "Son 32", "grup": "Son 32", "ev": "H1", "dep": "J2", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"SoFi Stadyumu, Inglewood" ,"tarih":"2 Temmuz 2026","yerel":"12:00 PDT"},
    { "id": 83, "tur": "Son 32", "grup": "Son 32", "ev": "K1", "dep": "L2", "kodEv": "un", "kodDep": "un", "tsi": "02:00","stat":"BMO Field, Toronto" ,"tarih":"2 Temmuz 2026","yerel":"19:00 CST"},
    { "id": 85, "tur": "Son 32", "grup": "Son 32", "ev": "B1", "dep": "E/F/G/I/J Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "06:00","stat":"BC Place, Vancouver" ,"tarih":"2 Temmuz 2026","yerel":"20:00 PDT"},
    { "id": 88, "tur": "Son 32", "grup": "Son 32", "ev": "D2", "dep": "G2", "kodEv": "un", "kodDep": "un", "tsi": "21:00","stat":"AT&T Stadyumu, Arlington" ,"tarih":"3 Temmuz 2026","yerel":"13:00 CDT"},
    { "id": 86, "tur": "Son 32", "grup": "Son 32", "ev": "J1", "dep": "H2", "kodEv": "un", "kodDep": "un", "tsi": "01:00","stat":"Hard Rock Stadyumu, Miami" ,"tarih":"3 Temmuz 2026","yerel":"18:00 CST"},
    { "id": 87, "tur": "Son 32", "grup": "Son 32", "ev": "K1", "dep": "D/E/I/J/L Grubu 3.sü", "kodEv": "un", "kodDep": "un", "tsi": "04:30","stat":"Arrowhead Stadyumu, Kansas City" ,"tarih":"3 Temmuz 2026","yerel":"20:30 CDT"},
    { "id": 90, "tur": "Son 16", "grup": "Son 16", "ev": "73.Maç Kazananı", "dep": "75.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "20:00","stat":"NRG Stadyumu, Houston" ,"tarih":"4 Temmuz 2026","yerel":"12:00 CST"},
    { "id": 89, "tur": "Son 16", "grup": "Son 16", "ev": "74.Maç Kazananı", "dep": "77.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "00:00","stat":"Lincoln Financial Field, Philadelphia" ,"tarih":"4 Temmuz 2026","yerel":"17:00 EDT"},
    { "id": 91, "tur": "Son 16", "grup": "Son 16", "ev": "76.Maç Kazananı", "dep": "78.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "23:00","stat":"MetLife Stadyumu, East Rutherford" ,"tarih":"5 Temmuz 2026","yerel":"16:00 ECT"},
    { "id": 92, "tur": "Son 16", "grup": "Son 16", "ev": "79.Maç Kazananı", "dep": "80.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "03:00","stat":"Aztek Stadyumu, Meksiko" ,"tarih":"5 Temmuz 2026","yerel":"18:00 CST"},
    { "id": 93, "tur": "Son 16", "grup": "Son 16", "ev": "83.Maç Kazananı", "dep": "84.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"AT&T Stadyumu, Arlington" ,"tarih":"6 Temmuz 2026","yerel":"14:00 CST"},
    { "id": 94, "tur": "Son 16", "grup": "Son 16", "ev": "81.Maç Kazananı", "dep": "82.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "03:00","stat":"Lumen Field, Seattle" ,"tarih":"6 Temmuz 2026","yerel":"17:00 PDT"},
    { "id": 95, "tur": "Son 16", "grup": "Son 16", "ev": "86.Maç Kazananı", "dep": "88.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "19:00","stat":"Mercedes-Benz Stadyumu, Atlanta" ,"tarih":"7 Temmuz 2026","yerel":"12:00 EDT"},
    { "id": 96, "tur": "Son 16", "grup": "Son 16", "ev": "85.Maç Kazananı", "dep": "87.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "23:00","stat":"BC Place, Vancouver" ,"tarih":"7 Temmuz 2026","yerel":"13:00 PDT"},
    { "id": 97, "tur": "Çeyrek Final", "grup": "Çeyrek Final", "ev": "89.Maç Kazananı", "dep": "90.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "23:00","stat":"Gillette Stadyumu, Foxborough","yerel":"16:00 EDT" ,"tarih":"9 Temmuz 2026"},
    { "id": 98, "tur": "Çeyrek Final", "grup": "Çeyrek Final", "ev": "93.Maç Kazananı", "dep": "94.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"SoFi Stadyumu, Inglewood","yerel":"12:00 PDT","tarih":"10 Temmuz 2026" },
    { "id": 99, "tur": "Çeyrek Final", "grup": "Çeyrek Final", "ev": "91.Maç Kazananı", "dep": "92.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "00:00","stat":"Hard Rock Stadyumu, Miami","yerel":"17:00 EDT" ,"tarih":"11 Temmuz 2026"},
    { "id": 100, "tur": "Çeyrek Final", "grup": "Çeyrek Final", "ev": "95. Maç Kazananı", "dep": "96.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "04:00","stat":"Arrowhead Stadyumu, Kansas City","yerel":"20:00 CST","tarih":"11 Temmuz 2026" },
    { "id": 101, "tur": "Yarı Final", "grup": "Yarı Final", "ev": "97. Maç Kazananı", "dep": "98.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"AT&T Stadyumu, Arlington","yerel":"14:00 CST","tarih":"14 Temmuz 2026" },
    { "id": 102, "tur": "Yarı Final", "grup": "Yarı Final", "ev": "99. Maç Kazananı", "dep": "100.Maç Kazananı", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"Mercedes-Benz Stadyumu, Atlanta","yerel":"15:00 EDT","tarih":"15 Temmuz 2026" },
    { "id": 103, "tur": "Üçüncülük Maçı", "grup": "Üçüncülük Maçı", "ev": "101.Maç Kaybedeni", "dep": "102.Maç Kaybedeni", "kodEv": "un", "kodDep": "un", "tsi": "00:00","stat":"Hard Rock Stadyumu, Miami","yerel":"17:00 EDT","tarih":"18 Temmuz 2026" },
    { "id": 104, "tur": "Final", "grup": "Final", "ev": "101.Maç kazananı", "dep": "102.Maç kazananı", "kodEv": "un", "kodDep": "un", "tsi": "22:00","stat":"MetLife Stadyumu, East Rutherford","yerel":"15:00 EDT","tarih":"19 Temmuz 2026" }
];

async function sistemiBaslat() {
    const setupPool = new Pool({ ...dbConfig, database: 'postgres' });
    try {
        const dbKontrol = await setupPool.query("SELECT 1 FROM pg_database WHERE datname = 'fifa2026'");
        if (dbKontrol.rowCount === 0) {
            await setupPool.query('CREATE DATABASE fifa2026');
            console.log("⚽ 'fifa2026' veritabanı olusturuldu.");
        }
        await setupPool.end();

        activePool = new Pool(dbConfig);
        
        // --- YENİ DİNAMİK TABLO YAPISI ---
        await activePool.query(`
            CREATE TABLE IF NOT EXISTS yoneticiler (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'admin'
            );

            CREATE TABLE IF NOT EXISTS takim_istatistikleri (
                takim_adi VARCHAR(50) PRIMARY KEY,
                sira INT NOT NULL,
                form VARCHAR(20) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS fikstur (
                id INT PRIMARY KEY,
                grup VARCHAR(50) NOT NULL,
                tur VARCHAR(50) NOT NULL,
                tarih VARCHAR(50) NOT NULL,
                ev VARCHAR(100) NOT NULL,
                dep VARCHAR(100) NOT NULL,
                kod_ev VARCHAR(10) NOT NULL,
                kod_dep VARCHAR(10) NOT NULL,
                skor_ev INT DEFAULT NULL,
                skor_dep INT DEFAULT NULL,
                tsi VARCHAR(10) NOT NULL,
                yerel VARCHAR(50) NOT NULL,
                stat TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS yorumlar (
                id SERIAL PRIMARY KEY,
                mac_id TEXT NOT NULL,
                kullanici_adi VARCHAR(50) DEFAULT 'Anonim',
                yorum_metni TEXT NOT NULL,
                tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // --- ADMİN SEED ---
        const userKontrol = await activePool.query("SELECT * FROM yoneticiler WHERE email = 'admin@fifa.com'");
        if (userKontrol.rowCount === 0) {
            const hashed = await bcrypt.hash('123456', 10);
            await activePool.query(
                "INSERT INTO yoneticiler (username, email, password, role) VALUES ($1, $2, $3, $4)",
                ['Mete Elldokuz', 'admin@fifa.com', hashed, 'super_admin']
            );
            console.log("✔ Varsayılan admin (Mete) olusturuldu.");
        }

        // --- TÜM FİKSTÜRÜ DB'YE TEK SEFERDE YÜKLEME (AUTOMATED SEEDING) ---
        const fiksturKontrol = await activePool.query("SELECT COUNT(*) FROM fikstur");
        if (parseInt(fiksturKontrol.rows[0].count) === 0) {
            console.log("⏳ Büyük fikstür veritabanına işleniyor, lütfen bekleyin...");
            
            for (let i = 0; i < hamFiksturVerisi.length; i++) {
                const m = hamFiksturVerisi[i];
                // Eğer maçın kendi ID'si yoksa sıralı atıyoruz (Grup Maçları için 1-72 arası)
                const macId = m.id || (i + 1); 
                const macTuru = m.tur || 'Grup Aşaması';

                await activePool.query(`
                    INSERT INTO fikstur (id, grup, tur, tarih, ev, dep, kod_ev, kod_dep, tsi, yerel, stat, skor_ev, skor_dep)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL, NULL)
                `, [macId, m.grup, macTuru, m.tarih, m.ev, m.dep, m.kodEv, m.kodDep, m.tsi, m.yerel, m.stat]);
            }
            console.log(`✔ Toplam ${hamFiksturVerisi.length} maç veritabanına başarıyla aktarıldı.`);
        }

        console.log("✅ Veritabanı ve tüm sistem dinamik olarak hazır.");
    } catch (err) {
        console.error("❌ DB Hatası:", err.message);
    }
}

// --- API UÇ NOKTALARI (ENDPOINTS) ---

// 1. Fikstürü Getir
app.get('/api/fikstur', async (req, res) => {
    try {
        const result = await activePool.query(`
            SELECT 
                id, grup, tur, tarih, ev, dep, 
                kod_ev AS "kodEv", kod_dep AS "kodDep", 
                skor_ev AS "skorEv", skor_dep AS "skorDep", 
                tsi, yerel, stat 
            FROM fikstur 
            ORDER BY id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Fikstür verileri çekilemedi." });
    }
});

// 2. Güvenli Maç Güncelleme (ID Tabanlı)
// POST URL: http://localhost:3000/api/mac-guncelle
// BODY ÖRNEĞİ: { "id": 1, "skorEv": 3, "skorDep": 2 }
app.post('/api/mac-guncelle', async (req, res) => {
    const { id, skorEv, skorDep } = req.body;
    try {
        const result = await activePool.query(
            `UPDATE fikstur 
             SET skor_ev = $1, skor_dep = $2 
             WHERE id = $3 RETURNING *`,
            [skorEv !== undefined ? parseInt(skorEv) : null, skorDep !== undefined ? parseInt(skorDep) : null, parseInt(id)]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Belirtilen ID'ye sahip maç bulunamadı." });
        }
        res.json({ success: true, message: "Maç skoru başarıyla güncellendi.", mac: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Veritabanı güncelleme hatası." });
    }
});

// Diğer Giriş, Kayıt ve Yorum API'leri
app.post('/api/register', async (req, res) => {
    let { username, email, password } = req.body;
    try {
        email = email.trim().toLowerCase();
        username = username.trim();
        const hashed = await bcrypt.hash(password, 10);
        await activePool.query("INSERT INTO yoneticiler (username, email, password) VALUES ($1, $2, $3)", [username, email, hashed]);
        res.json({ success: true, message: "Kayıt başarılı." });
    } catch (err) {
        res.status(400).json({ success: false, message: "Hata oluştu." });
    }
});

app.post('/api/login', async (req, res) => {
    let { email, password } = req.body;
    try {
        email = email.trim().toLowerCase();
        const result = await activePool.query("SELECT * FROM yoneticiler WHERE email = $1", [email]);
        if (result.rowCount === 0) return res.status(401).json({ success: false, message: "Kullanıcı bulunamadı!" });
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) res.json({ success: true, user: { name: user.username, role: user.role } });
        else res.status(401).json({ success: false, message: "Hatalı şifre!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Sunucu hatası." });
    }
});

app.get('/api/yorumlar/:macId', async (req, res) => {
    try {
        const result = await activePool.query("SELECT * FROM yorumlar WHERE mac_id = $1 ORDER BY tarih DESC", [req.params.macId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Yorumlar yüklenemedi." }); }
});

app.post('/api/yorumlar', async (req, res) => {
    try {
        const { mac_id, kullanici_adi, yorum_metni } = req.body;
        const result = await activePool.query("INSERT INTO yorumlar (mac_id, kullanici_adi, yorum_metni) VALUES ($1, $2, $3) RETURNING *", [mac_id, kullanici_adi || 'Anonim', yorum_metni]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Yorum kaydedilemedi." }); }
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde aktif.`);
    await sistemiBaslat();
});