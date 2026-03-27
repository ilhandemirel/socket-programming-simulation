// DOM Elementleri
const serverStatus = document.getElementById('server-status');
const clientStatus = document.getElementById('client-status');
const serverLog = document.getElementById('server-log');
const clientLog = document.getElementById('client-log');
const infoText = document.getElementById('info-text');

// Ağ Görselleştirme (Canvas)
const nodeServer = document.getElementById('node-s');
const nodeClient = document.getElementById('node-c');
const connectionTunnel = document.getElementById('connection-tunnel');
const dataPacket = document.getElementById('data-packet');

const sRadar = document.getElementById('s-radar');
const sPortBadge = document.getElementById('s-port-badge');
const badgeS = document.getElementById('badge-s');
const badgeC = document.getElementById('badge-c');
const sLabel = document.getElementById('s-label');
const cLabel = document.getElementById('c-label');
const terminalBtn = document.getElementById('terminal-btn');

let serverState = 0;
let clientState = 0;

function getTime() { const now = new Date(); return now.toTimeString().split(' ')[0]; }

function updateLog(panel, type, message) {
    const logBox = panel === 'server' ? serverLog : clientLog;
    const prefix = panel === 'server' ? '<span class="log-prefix-server">[SUNUCU]</span>' : '<span class="log-prefix-client">[İSTEMCİ]</span>';
    let colorClass = ''; if (type === 'error') colorClass = 'log-error'; if (type === 'success') colorClass = 'log-info';
    
    logBox.innerHTML += `<div class="log-entry ${colorClass}"><span style="color:#64748b">[${getTime()}]</span> ${prefix} > ${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
}

function disableButton(panel, step) {
    document.getElementById(`${panel[0]}-btn-${step}`).disabled = true;
    document.getElementById(`${panel[0]}-btn-${step}`).classList.add('active');
}
function enableButton(panel, step) {
    document.getElementById(`${panel[0]}-btn-${step}`).disabled = false;
    document.getElementById(`${panel[0]}-btn-${step}`).classList.remove('active');
}

function updateInfoBoard(text, panelHighlight = 'server') {
    infoText.innerHTML = text;
    document.getElementById('main-info').style.borderLeftColor = panelHighlight === 'server' ? 'var(--accent-server)' : 'var(--accent-client)';
}
function updateStatus(panel, statusStr) {
    const elm = panel === 'server' ? serverStatus : clientStatus;
    elm.className = 'status-indicator';
    if (statusStr === 'active') elm.classList.add('status-active');
    else if (statusStr === 'waiting') elm.classList.add('status-waiting');
    else if (statusStr === 'error') elm.classList.add('status-error');
}

// ==========================================
// BACKEND API CALLER 
// ==========================================
async function apiCall(endpoint) {
    try {
        const res = await fetch(endpoint, { method: 'POST' });
        const json = await res.json();
        if(json.status === 'error') throw new Error(json.msg);
        return json;
    } catch(err) {
        throw err;
    }
}


// ==========================================
// SUNUCU (SERVER)
// ==========================================
async function serverAction(action) {
    try {
        if (action === 'socket') {
            const res = await apiCall('/api/s/socket');
            serverState = 1;
            updateLog('server', 'normal', res.msg);
            updateInfoBoard(`<b>socket() - Dosya Tanımlayıcı (File Descriptor):</b><br>Sunucu Python Backend üzerinden ağ katmanına inebilmek için bir uç nokta (Endpoint) talep etti. İlgili AF_INET / SOCK_STREAM soketi tahsis edildi.`, 'server');
            disableButton('server', 1); enableButton('server', 2); updateStatus('server', 'active');
            
            nodeServer.classList.remove('dimmed');
            sLabel.innerHTML = 'Sunucu<br><small>Soket (FD) Tahsis Edildi</small>';

        } else if (action === 'bind_listen') {
            const res = await apiCall('/api/s/bind');
            serverState = 2;
            updateLog('server', 'normal', res.msg);
            updateInfoBoard(`<b>bind() & listen():</b><br><span class="highlight">bind()</span> ile işletim sisteminin ağ sürücüsüne mevcut sanal soketin Localhost IP'sine (127.0.0.1) ve TCP Port 8080'e kalıcı olarak (Lock) bağlanması emredildi. <span class="highlight">listen(1)</span> Kernel seviyesinde tetiklendi.<br><br><span class="highlight" style="color:#34d399;"><i class="fa-solid fa-flask"></i> KANIT ZAMANI:</span> Şimdi aşağıdaki <b>Ağ Doğrula (Netstat)</b> butonuna tıklayıp Enter'a basarsanız, Windows sisteminde 8080 nolu portun tam şu an <b>LISTENING</b> (Dinleniyor) durumuna geçtiğini hocanıza anlık olarak kanıtlayabilirsiniz!`, 'server');
            disableButton('server', 2); enableButton('server', 3);
            
            sPortBadge.classList.add('show-badge');
            sLabel.innerHTML = 'Sunucu<br><small>127.0.0.1 Pasif Dinleme</small>';
            
            // Kanıt Butonunu Görünür Yap
            if(terminalBtn) {
                terminalBtn.style.display = 'flex';
                terminalBtn.classList.add('pulse-anim'); // Opsiyonel animasyon
            }

        } else if (action === 'accept') {
            serverState = 3;
            updateLog('server', 'success', 'accept() - Thread duraksatıldı (Blocking State). 3-Way Handshake bekleniyor...');
            updateInfoBoard(`<b>accept() - Blokajlı Dinleme:</b><br>Yürütme Birimi (Thread) <span class="highlight">Blocking</span> durumuna geçirildi. HTTP İsteği arka planda asılı kaldı. Yeni bir istemci bağlanana dek Kernel bu çağrıyı bekletecek.`, 'server');
            updateStatus('server', 'waiting'); disableButton('server', 3);
            
            sRadar.classList.add('active');
            badgeS.innerText = 'Handshake Bekliyor...';
            badgeS.style.background = 'rgba(251, 191, 36, 0.9)';
            badgeS.classList.add('show-badge');

            // API'yi çağır, UI bloklanmayacak ama sunucu Thread'i bloklanacak.
            apiCall('/api/s/accept').then((res) => {
                updateLog('server', 'success', 'accept() Engelden (Block) çıktı. Bağlantı kabul edildi: ' + res.msg);
                updateStatus('server', 'active');
                sRadar.classList.remove('active');
                badgeS.innerText = 'ESTABLISHED';
                badgeS.style.background = 'rgba(52, 211, 153, 0.9)';
            }).catch(err => {
                updateLog('server', 'error', err.message);
            });

        } else if (action === 'recv') {
            if (clientState < 3) {
                updateLog('server', 'error', 'HATA: Receive Buffer (Soket Tamponu) şu an boş.');
                return;
            }
            updateLog('server', 'normal', 'recv() - Receive Buffer\'dan bayt dizisi çekiliyor...');
            disableButton('server', 4);
            
            const res = await apiCall('/api/s/recv');
            updateLog('server', 'success', `OKUNAN PAYLOAD: "${res.data}"`);
            updateInfoBoard(`<b>recv() - Tampon Okuması:</b><br>İstemciden gönderilen TCP Segmentleri <b>Soket Alım Tamponuna (Receive Buffer)</b> doldurulmuştu. Python Backend Kernel'den bu verileri çıkartıp stringe çevirdi.`, 'server');
            serverState = 4; enableButton('server', 5);
            
        } else if (action === 'send') {
            updateLog('server', 'normal', 'send() komutu çalıştırılıyor. HTML metni Encoding işleminden geçti.');
            disableButton('server', 5);
            
            // Backend'den send tetiklenir (HTML metni buffer ile iletilir)
            await apiCall('/api/s/send');
            
            dataPacket.innerHTML = '<i class="fa-solid fa-code packet-icon"></i><span class="packet-label">HTML_PAYLOAD</span>';
            dataPacket.style.opacity = '1';
            dataPacket.className = 'packet animate-down';
            
            updateInfoBoard(`<b>send() & close():</b><br>HTML dosyası Python Backend tarafından şebekeye itildi. Sunucu kanalı ardından Kernel'da <span class="highlight">close()</span> ile mühürlendi.`, 'server');
            
            setTimeout(() => {
                dataPacket.style.opacity = '0';
                updateLog('server', 'normal', 'close() -> File Descriptor (FD) işletim sistemine iade edildi.');
                updateStatus('server', ''); serverState = 5;
                
                badgeS.classList.remove('show-badge');
                sLabel.innerHTML = 'Sunucu<br><small>Graceful Close (Kapalı)</small>';
                
                enableButton('client', 4);
            }, 2000);
        }
    } catch(err) { updateLog('server', 'error', err.message); }
}

// ==========================================
// İSTEMCİ (CLIENT)
// ==========================================
async function clientAction(action) {
    try {
        if (action === 'socket') {
            const res = await apiCall('/api/c/socket');
            clientState = 1;
            updateLog('client', 'normal', res.msg);
            updateInfoBoard(`<b>socket() - TCP Nesnesi İmzası:</b><br>İstemci makine, ağa çıkış yapmak ve veri paketlemesini TCP spesifikasyonlarına göre gerçekleştirebilmek için işletim sisteminden mantıksal bir soket çıkış ucu talep etti. Sistemde Python Soketi üretildi!`, 'client');
            disableButton('client', 1); enableButton('client', 2); updateStatus('client', 'active');
            
            nodeClient.classList.remove('dimmed');
            cLabel.innerHTML = 'İstemci<br><small>FD Alındı</small>';
            
        } else if (action === 'connect') {
            if (serverState < 3) {
                updateLog('client', 'error', 'ConnectionRefusedError: Hedef adreste hiçbir Socket dinleme (listen) yapmıyor.');
                return;
            }
            updateLog('client', 'normal', 'connect(127.0.0.1, 8080) isteği Kernel\'e verildi. SYN Paketleri fırlatılıyor...');
            disableButton('client', 2);
            
            connectionTunnel.classList.add('open'); 
            
            // Buradaki apiCall, arka planda sunucunun askıda (blocking) bekleyen accept() isteğini KİLİTTEN KURTARACAK!
            const res = await apiCall('/api/c/connect');
            
            connectionTunnel.classList.add('flow-active');
            updateLog('client', 'success', res.msg);
                
            badgeC.innerText = 'ESTABLISHED';
            badgeC.style.background = 'rgba(52, 211, 153, 0.9)';
            badgeC.classList.add('show-badge');
            
            cLabel.innerHTML = 'İstemci<br><small>Bağlantı Kuruldu</small>'; 
            
            updateInfoBoard(`<b>connect() - Güvenli Tünel (TCP Session):</b><br>Ağ kartları arka planda <span class="highlight">SYN -> SYN-ACK -> ACK</span> paketlerini takas ederek iletişimi garantiledi ve Python <span class="highlight">connect()</span> satırını onayladı.<br><br><span class="highlight" style="color:#34d399;"><i class="fa-solid fa-flask"></i> KANIT ZAMANI:</span> Tünel kuruldu! Şimdi tekrar <b>Ağ Doğrula (Netstat)</b> butonuna tıklarsanız, bu sefer ekranda dinleme durumunun değiştiğini ve iki port arasında aktif bir hat (<b>ESTABLISHED</b>) açıldığını CMD üzerinden kanıtlayabilirsiniz!`, 'client');
            
            clientState = 2; enableButton('client', 3); enableButton('server', 4);
            
        } else if (action === 'send') {
            updateLog('client', 'normal', 'send() -> İstek TCP Fragmentlerine ayrılıyor.');
            disableButton('client', 3);
            
            const res = await apiCall('/api/c/send');
            
            dataPacket.innerHTML = '<i class="fa-solid fa-bolt packet-icon"></i><span class="packet-label">GET_HTML_REQUEST</span>';
            dataPacket.style.opacity = '1';
            dataPacket.className = 'packet animate-up';
            
            updateInfoBoard(`<b>send() - Tampona İtme:</b><br>İstemci "GET / HTTP/1.1" (HTTP İsteği) dizisini Python üzerinden TCP segmentlerine paketleyip sunucu hedefine enjekte etti (Payload: ${res.msg}).`, 'client');
            
            setTimeout(() => {
                dataPacket.style.opacity = '0';
                clientState = 3;
                updateLog('server', 'info', "Tünelden Kernel'a bir akış (Stream) ulaştı. recv() komutu ile işleyebilirsiniz.");
            }, 1500);
            
        } else if (action === 'recv') {
            if (serverState < 5) {
                updateLog('client', 'error', 'Hata: Okunabilecek hiçbir sekans/bayt Kernel\'da mevcut değil.');
                return;
            }
            updateLog('client', 'normal', 'recv() - TCP tamponu taranıyor...');
            disableButton('client', 4);
            
            const res = await apiCall('/api/c/recv');
            
            updateLog('client', 'success', `GELEN VERİ BOYUTU: ${res.data.length} byte.`);
            updateInfoBoard(`<b>recv() - Decode & Parse:</b><br>Sunucunun fırlattığı bayt dizisi Python tarafından başarıyla çekildi. Bu metin arayüze HTML Dom olarak basılmaya (Parse) hazır.`, 'client');
            clientState = 4; enableButton('client', 5);
            
            // Gelecek arayüzü belleğe atalım ki modal'da kullanalım
            document.getElementById('browser-content').innerHTML = res.data;
            
        } else if (action === 'close') {
            updateLog('client', 'normal', 'close() -> 4-Way Handshake kapanış süreci başladı.');
            disableButton('client', 5);
            
            await apiCall('/api/c/close');
            
            connectionTunnel.classList.remove('flow-active');
            connectionTunnel.classList.remove('open'); 
            updateStatus('client', '');
            
            badgeC.classList.remove('show-badge');
            cLabel.innerHTML = 'İstemci<br><small>Graceful Close (Kapalı)</small>';
            
            updateInfoBoard(`<b>Arayüz Çiziliyor:</b><br>İşletim sistemi soket nesnelerinin hayat döngüsü tamamen simüle edildi ve tünel yıkıldı.`, 'client');
            updateLog('client', 'success', 'Modüler HTML ekrana çizdiriliyor...');
            
            setTimeout(() => { document.getElementById('browser-modal').style.display = 'block'; }, 1000);
        }
    } catch(err) { updateLog('client', 'error', err.message); }
}

function closeModal() { document.getElementById('browser-modal').style.display = 'none'; }

async function openTerminal() {
    try {
        await apiCall('/api/util/terminal');
        updateLog('server', 'success', "Lokal Terminal (CMD) açıldı! Lütfen yeni açılan pencereyi kontrol edin.");
    } catch(err) {
        updateLog('server', 'error', "Terminal açılamadı: " + err.message);
    }
}
