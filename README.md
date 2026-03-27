# Soket Programlama Simülasyonu (Full-Stack Python & Web)

Ağ sistemlerinin çekirdeğini (TCP/IP) öğrenmenin en görsel ve sağlam yollarından biri! Bu proje, ağ (Networking) alanındaki tüm temel operasyonları `socket()`, `bind()`, `listen()`, `accept()`, `connect()`, `recv()`, `send()` adım adım inceleyebileceğiniz **gerçek zamanlı (Real-time) ve akademik düzeyde bir tam-teşekküllü (Full-Stack) OS Simülasyonudur.**

## ✨ Projenin Öne Çıkan Özellikleri

Sadece görsel bir animasyondan ibaret olmayan bu projenin farkı; **arka planda Windows / Linux Kernel ağ yeteneklerini tam yetkiyle kullanmasıdır.** Siz butona bastığınız an, arayüz değil, asıl çalışan Python motoru işletim sisteminden port rezervasyonları yapar, buffer tahsis eder ve şifresiz tünellerle donanım aracılığıyla verilerinizi fırlatır!

*   **100% Gerçek OS Trafiği:** Arayüz (`HTML/JS`), arka planda çalışan Python `Flask` API'leri üzerinden `socket.socket(AF_INET, SOCK_STREAM)` komutunu eşzamanlı çalıştırır.
*   **Kanıt Modülü (Netstat Entegre):** Web sayfasından ayrılmadan, ağ bağlantılarını denetleyen bir CMD veya Terminal arayüzünü otomatik tetikler. Tuşa bastığınızda işletim sistemi raporlarına girerek uygulamanın gerçekten `LISTENING` veya `ESTABLISHED` durumuna geçtiğini kanıtlarsınız.
*   **Modern 'Glassmorphism' Etkileşimi:** Ağ paket parçacıkları, animasyonlu radar/sunucu eşleşmeleri, 3-Yönlü el sıkışma döngüleri. Tüm operasyonlar "bekleme blokerlarıyla" (Thread Block / Accept) birebir yaşatılarak görselleştirilmiştir.

## 🚀 Kurulum & Çalıştırma

Projenin asıl çalışma mantığını sergilemek üzere lokal işletim sisteminizde barınan Python motoru gereklidir.

**1. Arka Plan TCP Servisini (Backend) Çalıştırın:**
Klasör dizininde terminalinizi / komut isteminizi açın ve `app.py` dosyasını çalıştırın.
```bash
python app.py
```
*(Dosyanın çalışabilmesi için sisteminizde `flask` kütüphanesinin yüklü olması şarttır. Yüklü değilse `pip install flask` ile kurun.)*

**2. Arayüze Giriş Yapın:**
Terminal size uygulamanın başalatıldığı IP ve Portu basacaktır. Normal .html dosyasına çift tıklamak yerine, modern bir tarayıcı adresine şunu yazarak girmelisiniz:
```
http://127.0.0.1:5000
```

## 🛠 Kullanım Senaryosu / Demo Sıralaması

Sunum yaparken (Kanıtlama için) şu sırayı takip edebilirsiniz:

1.  **Server (Sunucu):** `socket()` butonuna basarak File Descriptor ayırın.
2.  **Server (Sunucu):** `bind() & listen()` işlemine tıklayın. Port adreslerine IP'nizi mühürleyin.
    > 💡 **Denetim Noktası 1:** Hemen altındaki *Ağ Doğrula* butonuna basıp ENTER'la geçiş yapın. Çıkan raporda 8080 portunun LISTENING (Dinleniyor) satırını akademisyenlerinizle/ekibinizle paylaşın.
3.  **Server (Sunucu):** `accept()` düğmesi ile Thread yürütmesini duraksatarak (Blocking Mode) sisteme bekleme emri verin.
4.  **Client (İstemci):** `socket()` tahsisi yaparak TCP protokol nesnenizi hazırlayın.
5.  **Client (İstemci):** Olayın yaşandığı an! `connect()` ile hedef sunucunun portuna 3-Way Handshake SYN paketlerini atıp tüneli kurun!
    > 💡 **Denetim Noktası 2:** Tekrar *Ağ Doğrula* butonuna bastığınızda bu sefer 8080'den rastgele dinamik bir porta çekilmiş `ESTABLISHED` (Tünel Açık) kaydını herkes görebilir!
6.  **Veri Transferi:** `send()` ve `recv()` tuşlarıyla Payload'u transfer edip HTML arayüzün dinamik inşa sürecini başlatarak soketleri kapatın!

---
**Mimari Stack:** HTML5, Vanilla JavaScript, CSS3 (Keyframe animasyonlar), Python 3.x, Flask, Socket, SubProcess (OS Hooks).
*(Eğitim ve üniversite akademi düzeyinize uyumlu olarak kodlanmıştır.)*
