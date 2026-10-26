# FIFA Dünya Kupası 2026 Portalı

Fikstür, grup puan durumları, duyurular, yorumlar ve eğitim amaçlı maç olasılığı örneği içeren bir web projesi.

## Teknolojiler

- Node.js, Express ve PostgreSQL
- HTML, CSS ve JavaScript
- Flask, pandas ve scikit-learn (demo tahmin servisi)

## Yerel geliştirme

1. Node.js ve Python ortamlarını kurun.
2. Node bağımlılıklarını yükleyin: `npm install`.
3. Proje kökünde `.env` dosyası oluşturun; `DATABASE_URL` değerini yerel veritabanınıza ayarlayın.
4. Yönetici hesabını oluşturmak veya parolasını sıfırlamak için `ADMIN_USERNAME` ve `ADMIN_PASSWORD` ortam değişkenlerini ayarlayın; parola en az 12 karakter olmalıdır. Ardından `node scripts/create-admin.js` çalıştırın.
5. Sunucuyu `npm start` ile başlatın.
6. Python tahmin servisi için gerekli paketleri ayrı sanal ortamda kurun ve `python app.py` komutunu kullanın. `Takımlar.xlsx` dosyasında `team` ve `rank` sütunları bulunmalıdır.

## Güvenlik notları

- Kaynak kodunda varsayılan yönetici hesabı/parolası tutulmaz.
- Yönetici parolaları bcrypt özeti olarak saklanır. Önceden düz metin kaydedilmiş hesapların parolalarını kontrollü şekilde sıfırlayın.
- Herkese açık kayıt, yönetici tablosuna kullanıcı eklememesi için kapalıdır.
- CORS izin listesi sunucu kodunda sınırlandırılmıştır.
- Flask debug modu kapalıdır; hata yanıtları iç ayrıntıları dışarı vermez.
- Tarayıcıdaki `localStorage` kontrolü gerçek sunucu tarafı yetkilendirme değildir. Bu sürümde hassas veya ayrıcalıklı yönetim işlevlerini yayına açmayın; gerçek kullanıcı/rol sistemi ve sunucu tarafı oturum doğrulaması tamamlanmalıdır.
- Tahmin modeli yalnızca örnek niteliğindedir. Küçük, yapay eğitim verisi gerçek maç olasılıkları için güvenilir değildir.

## Durum

Bu depo üzerinde güvenlik iyileştirmeleri ayrı bir `fix/security-hardening` dalında hazırlanıyor. Canlıya almadan önce yerel testler, kimlik doğrulama/oturum tasarımı ve tüm sayfaların güvenlik incelemesi tamamlanmalıdır.
