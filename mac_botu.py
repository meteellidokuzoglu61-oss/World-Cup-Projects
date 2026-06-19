import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Arka planda sessizce çalışır
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Gönderdiğin linki doğrudan buraya tanımlıyoruz
anasayfa_url = "https://www.flashscore.com.tr/mac/futbol/cek-cumhuriyeti-6LHwBDGU/guney-afrika-W2ijYvlr/?mid=8nrACRTs"

# Doğrudan istatistik sekmesini açması için linki manipüle ediyoruz
mac_url = anasayfa_url.replace("?mid=", "#/mac-ozeti/mac-istatistikleri?mid=")

try:
    print("🌐 Flashscore TR maç sayfasına bağlanılıyor...")
    driver.get(mac_url)
    time.sleep(5)  # Sayfanın yüklenmesi için bekleme süresi

    mac_verisi = {
        "evSut": 0, "depSut": 0,
        "evIsabet": 0, "depIsabet": 0,
        "evTop": 0, "depTop": 0,
        "evPas": 0, "depPas": 0,
        "evFaul": 0, "depFaul": 0
    }

    print("🔍 Sayfa metni taranıyor...")
    tum_metin = driver.find_element(By.TAG_NAME, "body").text
    satirlar = tum_metin.split("\n")
    
    # Türkçe Flashscore arayüzündeki tam karşılıklar
    terimler = {
        "toplam şutlar": "Sut",
        "şutlar": "Sut",
        "isabetli şutlar": "Isabet",
        "topla oynama": "Top",
        "toplam paslar": "Pas",
        "paslar": "Pas",
        "fauller": "Faul"
    }

    for i in range(len(satirlar)):
        satir_temiz = satirlar[i].strip().lower()
        if satir_temiz in terimler:
            anahtar = terimler[satir_temiz]
            try:
                # Üst satır ev sahibi, alt satır deplasman verisidir
                ev_deger = satirlar[i-1].replace("%", "").replace(",", "").replace(".", "").strip()
                dep_deger = satirlar[i+1].replace("%", "").replace(",", "").replace(".", "").strip()
                
                mac_verisi[f"ev{anahtar}"] = int(ev_deger)
                mac_verisi[f"dep{anahtar}"] = int(dep_deger)
            except:
                pass

    print("\n🎉 Maç Verileri Başarıyla JSON'a Dönüştürüldü:")
    print(json.dumps(mac_verisi, indent=4, ensure_ascii=False))

except Exception as e:
    print("❌ Bir hata meydana geldi:", e)

finally:
    driver.quit()
    print("\n🤖 Tarayıcı kapatıldı.")