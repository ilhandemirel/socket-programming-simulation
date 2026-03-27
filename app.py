import os
import socket
import logging
from flask import Flask, jsonify, request, send_from_directory

SOCKETS = {
    's_sock': None,   
    'c_sock': None,   
    'conn_sock': None 
}

app = Flask(__name__, static_folder='.', static_url_path='')

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


# ==========================================
# SUNUCU (SERVER) API 
# ==========================================

@app.route('/api/s/socket', methods=['POST'])
def s_socket():
    try:
        print("\n\033[96m[SUNUCU -> OS]\033[0m socket(AF_INET, SOCK_STREAM) fonksiyonu cagrildi. İşletim sisteminden File Descriptor (FD) ayirtildi.")
        SOCKETS['s_sock'] = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        SOCKETS['s_sock'].setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return jsonify({"status": "ok", "msg": "Sunucu (Server) uç noktası işletim sisteminden yaratıldı."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/s/bind', methods=['POST'])
def s_bind():
    try:
        print("\033[96m[SUNUCU -> OS]\033[0m bind('127.0.0.1', 8080) kilitleniyor...")
        SOCKETS['s_sock'].bind(('127.0.0.1', 8080))
        print("\033[96m[SUNUCU -> OS]\033[0m listen(1) aktif edildi. Sistem 8080 portunu dinliyor (Netstat uzerinde LISTENING gorulecek).")
        SOCKETS['s_sock'].listen(1)
        return jsonify({"status": "ok", "msg": "Port 8080 Kernel seviyesinde kilitlendi (bind) ve dinlemeye geçirildi."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/s/accept', methods=['POST'])
def s_accept():
    try:
        print("\033[96m[SUNUCU -> API]\033[0m accept() cagrildi. Python kodu (Thread) Istemci gelene kadar (BLOCKING) durumunda bekletiliyor.")
        conn, addr = SOCKETS['s_sock'].accept()
        SOCKETS['conn_sock'] = conn
        print(f"\033[96m[SUNUCU -> OS]\033[0m HEDEF KABUL EDILDI! Yeni baglanti (Bağlantı Soketi): {addr[0]}:{addr[1]}")
        return jsonify({"status": "ok", "msg": f"İstemciden {addr} bağlantısı kucaklandı (TCP 3-Way bitti)."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/s/recv', methods=['POST'])
def s_recv():
    try:
        print("\033[96m[SUNUCU -> OS]\033[0m recv(1024) ile Kernel tamponundan veri okunuyor...")
        data = SOCKETS['conn_sock'].recv(1024)
        metin = data.decode('utf-8')
        print(f"\033[96m[SUNUCU -> OKUNAN DATA]\033[0m {metin}")
        return jsonify({"status": "ok", "msg": "TCP Receive Buffer'ından veri okundu.", "data": metin})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/s/send', methods=['POST'])
def s_send():
    try:
        payload = """
        <div style="font-family: sans-serif; text-align: center; color: #10b981; margin-top: 30px;">
           <h1>🎉 Tünel Dışından Selamlar!</h1>
           <p>Eğitici Soket Programlama tamamlandı!</p>
           <p>Bu veriler şu anda arka planda çalışan işletim sistemi TCP soketi üzerinden iletildi.</p>
        </div>
        """
        print("\033[96m[SUNUCU -> OS]\033[0m sendall() fonksiyonuna Payload yollaniyor... (Veriler byte halinde gonderilecek)")
        SOCKETS['conn_sock'].sendall(payload.encode('utf-8'))
        
        print("\033[96m[SUNUCU -> OS]\033[0m Baglanti tüneli close() edilerek kapatildi.")
        SOCKETS['conn_sock'].close()
        
        if SOCKETS['s_sock']:
            SOCKETS['s_sock'].close()
        
        return jsonify({"status": "ok", "msg": "Payload şebekeye itildi (send)."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500


# ==========================================
# İSTEMCİ (CLIENT) API 
# ==========================================

@app.route('/api/c/socket', methods=['POST'])
def c_socket():
    try:
        print("\n\033[95m[ISTEMCI -> OS]\033[0m socket() Istemci uzerinde yaratiliyor...")
        SOCKETS['c_sock'] = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        return jsonify({"status": "ok", "msg": "İstemci FD nesnesi reserve edildi."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/c/connect', methods=['POST'])
def c_connect():
    try:
        print("\033[95m[ISTEMCI -> OS]\033[0m connect('127.0.0.1', 8080) TCP SYN paketi firlatildi! 3'lu el sikisma (Handshake) gerceklesiyor...")
        SOCKETS['c_sock'].connect(('127.0.0.1', 8080))
        print("\033[95m[ISTEMCI -> BILGI]\033[0m ESTABLISHED (Baglanti Kuruldu)! Tünel acik! (Netstat'ta gorulebilir).")
        return jsonify({"status": "ok", "msg": "Bağlantı tüneli (Established) başarıyla kuruldu."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/c/send', methods=['POST'])
def c_send():
    try:
        print("\033[95m[ISTEMCI -> OS]\033[0m sendall() ile 'GET / HTTP/1.1' (HTTP İsteği) byte dizisi sebekeye itiliyor...")
        SOCKETS['c_sock'].sendall("GET / HTTP/1.1".encode('utf-8'))
        return jsonify({"status": "ok", "msg": "İstek paketi TCP segmentlerine ayrılıp işletim sistemine yollatıldı."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/c/recv', methods=['POST'])
def c_recv():
    try:
        print("\033[95m[ISTEMCI -> OS]\033[0m recv(4096) ile Kernel tamponundaki veriler toplanip decode ediliyor...")
        data = SOCKETS['c_sock'].recv(4096)
        metin = data.decode('utf-8')
        return jsonify({"status": "ok", "msg": "Sunucunun fırlattığı HTML paketleri alındı.", "data": metin})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/c/close', methods=['POST'])
def c_close():
    try:
        print("\033[95m[ISTEMCI -> OS]\033[0m close() TCP 4-Way kapanis sekansi baslatildi.")
        SOCKETS['c_sock'].close()
        return jsonify({"status": "ok", "msg": "İstemci tüneli Graceful Close ile yıktı."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/api/util/terminal', methods=['POST'])
def open_terminal():
    try:
        import tempfile
        bat_content = """@echo off
title Akademik Port Denetleyici (Netstat)
color 0A
cls
echo.
echo   ==============================================
echo   ]]] AG TRAFIGI DENETIM PANELI [[[
echo   ==============================================
echo.  
echo   > Calistirilacak komut: netstat -an ^| findstr 8080
echo.
echo Lutfen sistemi teyit etmek icin klavyeden ENTER tusuna basin...
pause >nul
echo.
echo [SONUCLAR TARANIYOR...]
netstat -an | findstr 8080
echo.
echo [ISLEM BITTI. CIKMAK VEYA YENIDEN TARAMAK ICIN PENCEREYI KAPATINIZ]
pause >nul
"""
        bat_path = os.path.join(tempfile.gettempdir(), "denetim.bat")
        with open(bat_path, "w", encoding='utf-8') as f:
            f.write(bat_content)
            
        os.system(f'start cmd.exe /c "{bat_path}"')
        return jsonify({"status": "ok", "msg": "Terminal başlatıldı."})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

if __name__ == '__main__':
    print("---------------------------------------------------------")
    print("   [ SOKET MOTORU ILE WEB SUNUCUSU BASLATILDI ]   ")
    print("---------------------------------------------------------")
    print(" >>> Arkada gerceklestirilen butun TCP cagrilarini buraya logluyorum! <<< ")
    print(" >>> Arayuzu tazelemek (F5) veya girmek icin: http://127.0.0.1:5000 ")
    print("---------------------------------------------------------")
    app.run(port=5000, debug=False, threaded=True)
