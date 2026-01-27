// Main Application JavaScript
class TurboShare {
    constructor() {
        this.socket = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.files = [];
        this.currentRoom = null;
        this.isSender = false;
        this.currentFileIndex = 0;
        this.chunkSize = 16384; // 16KB chunks for fast transfer
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.connectSocket();
        this.initServiceWorker();
    }

    bindEvents() {
        // Tab Switching
        document.getElementById('sendTab').addEventListener('click', () => this.switchTab('send'));
        document.getElementById('receiveTab').addEventListener('click', () => this.switchTab('receive'));
        
        // File Selection
        document.getElementById('dropArea').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and Drop
        const dropArea = document.getElementById('dropArea');
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        dropArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Generate Room Code
        document.getElementById('generateCode').addEventListener('click', () => this.generateRoomCode());
        
        // Start Transfer
        document.getElementById('startTransfer').addEventListener('click', () => this.startTransfer());
        
        // Connect as Receiver
        document.getElementById('connectToSender').addEventListener('click', () => this.connectAsReceiver());
        
        // Modal Close
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeSuccessModal').addEventListener('click', () => this.closeModal());
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    connectSocket() {
        // Connect to signaling server (WebSocket)
        this.socket = io('wss://your-signaling-server.com', {
            transports: ['websocket'],
            upgrade: false
        });

        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
            this.updateStatus('سرور سے کنیکٹ ہو گیا');
        });

        this.socket.on('room-created', (data) => {
            this.currentRoom = data.roomId;
            document.getElementById('roomCode').value = data.roomId;
            this.generateQRCode(data.roomId);
            this.updateStatus('کمرہ بن گیا: ' + data.roomId);
        });

        this.socket.on('peer-joined', (data) => {
            this.updateStatus('دوسرا ڈیوائس کنیکٹ ہو گیا');
            this.initiatePeerConnection();
        });

        this.socket.on('offer', async (data) => {
            await this.handleOffer(data.offer);
        });

        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data.answer);
        });

        this.socket.on('ice-candidate', async (data) => {
            await this.handleIceCandidate(data.candidate);
        });

        this.socket.on('file-metadata', (data) => {
            this.prepareFileReceiving(data);
        });

        this.socket.on('transfer-complete', () => {
            this.showSuccess('ٹرانسفر مکمل ہو گیا!');
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        if (tab === 'send') {
            document.getElementById('sendTab').classList.add('active');
            document.getElementById('sendSection').classList.add('active');
        } else {
            document.getElementById('receiveTab').classList.add('active');
            document.getElementById('receiveSection').classList.add('active');
        }
    }

    handleFileSelect(event) {
        this.files = Array.from(event.target.files);
        this.displaySelectedFiles();
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        this.files = Array.from(dt.files);
        this.displaySelectedFiles();
    }

    displaySelectedFiles() {
        const container = document.getElementById('selectedFiles');
        container.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div>
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                </div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            `;
            container.appendChild(fileItem);
        });
    }

    generateRoomCode() {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        document.getElementById('roomCode').value = code;
        this.generateQRCode(code);
    }

    generateQRCode(text) {
        const qrDiv = document.getElementById('qrCode');
        qrDiv.innerHTML = '';
        QRCode.toCanvas(qrDiv, text, {
            width: 160,
            height: 160,
            color: {
                dark: '#4361ee',
                light: '#ffffff'
            }
        }, function(error) {
            if (error) console.error(error);
        });
    }

    async startTransfer() {
        if (this.files.length === 0) {
            this.showError('براہ کرم پہلے فائل منتخب کریں');
            return;
        }

        const roomCode = document.getElementById('roomCode').value;
        if (!roomCode) {
            this.showError('براہ کرم کنیکشن کوڈ درج کریں');
            return;
        }

        this.isSender = true;
        this.currentRoom = roomCode;
        this.socket.emit('create-room', { roomId: roomCode });
        
        this.showTransferStatus();
        this.updateTransferProgress(0);
        
        // Wait for receiver to connect
        this.updateStatus('دوسرے ڈیوائس کے کنیکشن کا انتظار ہے...');
    }

    async connectAsReceiver() {
        const roomCode = document.getElementById('receiverCode').value;
        if (!roomCode) {
            this.showError('براہ کرم کنیکشن کوڈ درج کریں');
            return;
        }

        this.currentRoom = roomCode;
        this.socket.emit('join-room', { roomId: roomCode });
        this.updateStatus('بھیجنے والے سے کنیکٹ ہو رہا ہے...');
    }

    async initiatePeerConnection() {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        if (this.isSender) {
            this.dataChannel = this.peerConnection.createDataChannel('fileTransfer');
            this.setupDataChannel();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    roomId: this.currentRoom,
                    candidate: event.candidate
                });
            }
        };

        if (this.isSender) {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            this.socket.emit('offer', {
                roomId: this.currentRoom,
                offer: offer
            });
        }
    }

    async handleOffer(offer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
            roomId: this.currentRoom,
            answer: answer
        });
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding ICE candidate:', e);
        }
    }

    setupDataChannel() {
        this.dataChannel.binaryType = 'arraybuffer';
        
        this.dataChannel.onopen = () => {
            this.updateStatus('کنیکشن مکمل ہو گیا');
            if (this.isSender) {
                this.sendNextFile();
            }
        };

        this.dataChannel.onmessage = (event) => {
            if (this.isSender) {
                this.handleReceiverMessage(event.data);
            } else {
                this.handleFileChunk(event.data);
            }
        };

        this.dataChannel.onclose = () => {
            this.updateStatus('کنیکشن بند ہو گیا');
        };
    }

    async sendNextFile() {
        if (this.currentFileIndex >= this.files.length) {
            this.dataChannel.send(JSON.stringify({ type: 'transfer-complete' }));
            this.showSuccess('تمام فائلیں بھیج دی گئیں');
            return;
        }

        const file = this.files[this.currentFileIndex];
        this.updateCurrentFile(file.name);
        
        // Send file metadata
        const metadata = {
            type: 'file-metadata',
            name: file.name,
            size: file.size,
            type: file.type,
            totalFiles: this.files.length,
            currentFile: this.currentFileIndex + 1
        };
        
        this.dataChannel.send(JSON.stringify(metadata));
        
        // Wait for receiver to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Send file in chunks
        const reader = new FileReader();
        let offset = 0;
        
        reader.onload = (e) => {
            if (this.dataChannel.readyState === 'open') {
                this.dataChannel.send(e.target.result);
                offset += e.target.result.byteLength;
                
                const progress = (offset / file.size) * 100;
                this.updateTransferProgress(progress);
                this.updateTransferSpeed(e.target.result.byteLength);
                
                if (offset < file.size) {
                    this.readNextChunk(file, offset, reader);
                } else {
                    this.currentFileIndex++;
                    setTimeout(() => this.sendNextFile(), 100);
                }
            }
        };
        
        this.readNextChunk(file, offset, reader);
    }

    readNextChunk(file, offset, reader) {
        const slice = file.slice(offset, offset + this.chunkSize);
        reader.readAsArrayBuffer(slice);
    }

    handleReceiverMessage(message) {
        try {
            const data = JSON.parse(message);
            if (data.type === 'chunk-received') {
                // Receiver acknowledged receiving chunk
            } else if (data.type === 'file-received') {
                this.updateStatus(`فائل موصول ہو گئی: ${data.name}`);
            }
        } catch (e) {
            // Binary data, ignore JSON parse error
        }
    }

    handleFileChunk(data) {
        if (typeof data === 'string') {
            try {
                const message = JSON.parse(data);
                if (message.type === 'file-metadata') {
                    this.prepareFileReceiving(message);
                } else if (message.type === 'transfer-complete') {
                    this.showSuccess('ٹرانسفر مکمل ہو گیا!');
                }
            } catch (e) {
                console.log('Message:', data);
            }
        } else {
            // Binary data (file chunk)
            this.processFileChunk(data);
        }
    }

    prepareFileReceiving(metadata) {
        this.receivingFile = {
            name: metadata.name,
            size: metadata.size,
            type: metadata.type,
            data: [],
            receivedSize: 0
        };
        
        this.updateStatus(`فائل موصول ہو رہی ہے: ${metadata.name}`);
        this.updateTransferProgress(0);
    }

    processFileChunk(chunk) {
        if (!this.receivingFile) return;
        
        this.receivingFile.data.push(chunk);
        this.receivingFile.receivedSize += chunk.byteLength;
        
        const progress = (this.receivingFile.receivedSize / this.receivingFile.size) * 100;
        this.updateTransferProgress(progress);
        
        if (this.receivingFile.receivedSize >= this.receivingFile.size) {
            this.saveReceivedFile();
        }
    }

    saveReceivedFile() {
        const blob = new Blob(this.receivingFile.data, { type: this.receivingFile.type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.receivingFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.updateStatus(`فائل ڈاؤن لوڈ ہو گئی: ${this.receivingFile.name}`);
        
        // Acknowledge receipt
        this.dataChannel.send(JSON.stringify({
            type: 'file-received',
            name: this.receivingFile.name
        }));
        
        this.receivingFile = null;
    }

    updateStatus(message) {
        const statusElement = document.getElementById('receiveStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateTransferProgress(percent) {
        const progressBar = document.getElementById('transferProgressBar');
        const progressText = document.getElementById('transferProgress');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percent.toFixed(1)}%`;
        }
    }

    updateCurrentFile(filename) {
        const element = document.getElementById('currentFile');
        if (element) {
            element.textContent = filename;
        }
    }

    updateTransferSpeed(bytes) {
        const speedElement = document.getElementById('transferSpeed');
        if (speedElement) {
            const mbps = (bytes * 8) / (1024 * 1024);
            speedElement.textContent = `${mbps.toFixed(2)} MB/s`;
        }
    }

    showTransferStatus() {
        const statusDiv = document.getElementById('transferStatus');
        statusDiv.style.display = 'block';
    }

    showSuccess(message) {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showError(message) {
        alert(message); // You can replace this with a better error modal
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        modal.style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registered:', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.turboShare = new TurboShare();
});

// PWA Service Worker (service-worker.js)
const CACHE_NAME = 'turbo-share-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});