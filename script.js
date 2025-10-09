'use strict';

class PhotoboothApp {
    constructor() {
        this.config = {
            totalImages: 3,
            countdownSeconds: 3,
            captureQuality: 0.92,
            templateUrl: 'template.png',
            overlayCoords: [
                { x: 50, y: 50, w: 533, h: 300 },
                { x: 617, y: 50, w: 533, h: 300 },
                { x: 333, y: 470, w: 533, h: 300 }
            ]
        };

        this.state = {
            stream: null,
            capturedImages: [],
            recaptureIndex: null,
            isCapturing: false,
            readyForResult: false
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.bindEvents();
        this.checkBrowserSupport();
    }

    bindEvents() {
        // Button events
        document.getElementById('start-btn').addEventListener('click', () => this.startPhotobooth());
        document.getElementById('capture-btn').addEventListener('click', () => this.handleCapture());
        document.getElementById('print-btn').addEventListener('click', () => this.printImage());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('error-close-btn').addEventListener('click', () => this.hideError());

        // Thumbnail events
        document.querySelectorAll('.thumbnail-container').forEach((container, index) => {
            container.addEventListener('click', () => this.handleRetake(index));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Handle error dialog first
        if (!document.getElementById('error-dialog').classList.contains('hidden')) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                this.hideError();
            }
            return;
        }

        const currentPage = this.getCurrentPage();
        
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                if (currentPage === 'landing-page') {
                    this.startPhotobooth();
                } else if (currentPage === 'photobooth-page') {
                    this.handleCapture();
                } else if (currentPage === 'result-page') {
                    this.printImage();
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (currentPage === 'photobooth-page') {
                    this.goToLanding();
                } else if (currentPage === 'result-page') {
                    this.goToPhotobooth();
                }
                break;
            case 'r':
            case 'R':
                if (currentPage === 'result-page') {
                    e.preventDefault();
                    this.restart();
                }
                break;
            case 'd':
            case 'D':
                if (currentPage === 'result-page') {
                    e.preventDefault();
                    this.downloadImage();
                }
                break;
            case '1':
            case '2':
            case '3':
                if (currentPage === 'photobooth-page') {
                    e.preventDefault();
                    this.handleRetake(parseInt(e.key) - 1);
                }
                break;
        }
    }

    getCurrentPage() {
        if (!document.getElementById('landing-page').classList.contains('hidden')) return 'landing-page';
        if (!document.getElementById('photobooth-page').classList.contains('hidden')) return 'photobooth-page';
        if (!document.getElementById('result-page').classList.contains('hidden')) return 'result-page';
        return null;
    }

    checkBrowserSupport() {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.showError('Camera not supported in this browser.');
            document.getElementById('start-btn').disabled = true;
        }
    }

    async startPhotobooth() {
        try {
            this.showPage('photobooth-page');
            this.state.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
                audio: false
            });
            document.getElementById('video-feed').srcObject = this.state.stream;
        } catch (error) {
            this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        let message = 'Camera access failed. ';
        if (error.name === 'NotAllowedError') {
            message += 'Please grant camera permissions.';
        } else if (error.name === 'NotFoundError') {
            message += 'No camera found.';
        } else {
            message += 'Please check your camera.';
        }
        this.showError(message);
        this.showPage('landing-page');
    }

    handleCapture() {
        if (this.state.readyForResult) {
            this.createFinalImage();
        } else if (!this.state.isCapturing) {
            this.triggerCapture();
        }
    }

    handleRetake(index) {
        const container = document.querySelectorAll('.thumbnail-container')[index];
        if (container.classList.contains('recapturable') && !this.state.isCapturing) {
            this.state.recaptureIndex = index;
            this.triggerCapture();
        }
    }

    async triggerCapture() {
        if (this.state.isCapturing) return;

        this.state.isCapturing = true;
        document.getElementById('capture-btn').disabled = true;

        await this.countdown();
        this.captureImage();

        this.state.isCapturing = false;
        document.getElementById('capture-btn').disabled = false;
    }

    async countdown() {
        return new Promise(resolve => {
            let count = this.config.countdownSeconds;
            const overlay = document.getElementById('countdown-overlay');

            overlay.textContent = count;
            overlay.classList.add('show');

            const interval = setInterval(() => {
                count--;
                overlay.textContent = count > 0 ? count : '';
                
                if (count <= 0) {
                    clearInterval(interval);
                    overlay.classList.remove('show');
                    resolve();
                }
            }, 1000);
        });
    }

    captureImage() {
        const video = document.getElementById('video-feed');
        const canvas = document.getElementById('capture-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/jpeg', this.config.captureQuality);

        if (this.state.recaptureIndex !== null) {
            this.state.capturedImages[this.state.recaptureIndex] = imageDataUrl;
            this.updateSlot(this.state.recaptureIndex, imageDataUrl);
            this.state.recaptureIndex = null;
        } else {
            const index = this.state.capturedImages.length;
            this.state.capturedImages.push(imageDataUrl);
            this.updateSlot(index, imageDataUrl);
        }

        if (this.state.capturedImages.length === this.config.totalImages) {
            document.getElementById('capture-btn').innerHTML = '<md-icon slot="icon">visibility</md-icon>Overview';
            this.state.readyForResult = true;
        }
    }

    updateSlot(index, imageDataUrl) {
        const slot = document.getElementById(`slot-${index + 1}`);
        const container = slot.parentElement;
        
        slot.src = imageDataUrl;
        slot.alt = `Captured photo ${index + 1}`;
        container.classList.add('recapturable');
    }

    async createFinalImage() {
        try {
            this.showPage('result-page');

            const [templateImg, ...capturedImgs] = await Promise.all([
                this.loadImage(this.config.templateUrl),
                ...this.state.capturedImages.map(src => this.loadImage(src))
            ]);

            const canvas = document.getElementById('composite-canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = templateImg.width;
            canvas.height = templateImg.height;

            ctx.drawImage(templateImg, 0, 0);

            capturedImgs.forEach((img, index) => {
                const { x, y, w, h } = this.config.overlayCoords[index];
                ctx.drawImage(img, x, y, w, h);
            });

            const finalDataUrl = canvas.toDataURL('image/jpeg', this.config.captureQuality);
            document.getElementById('final-image').src = finalDataUrl;

            this.stopCamera();
        } catch (error) {
            this.showError('Failed to create final image.');
            this.showPage('photobooth-page');
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    }

    printImage() {
        const finalImage = document.getElementById('final-image');
        if (!finalImage.src) {
            this.showError('No image to print.');
            return;
        }

        const widthInches = (finalImage.naturalWidth / 300).toFixed(2);
        const heightInches = (finalImage.naturalHeight / 300).toFixed(2);

        const style = document.createElement('style');
        style.textContent = `
            @media print {
                @page { size: ${widthInches}in ${heightInches}in; margin: 0; }
                * { visibility: hidden !important; }
                #final-image, 
                #final-image * { 
                    visibility: visible !important;
                }
                #final-image { 
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: contain !important;
                }
            }
        `;

        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);

        this.downloadImage();
        this.restart();
    }

    downloadImage() {
        const finalImage = document.getElementById('final-image');
        if (!finalImage.src) {
            this.showError('No image to download.');
            return;
        }

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `photostrip-${timestamp}.jpg`;
        link.href = finalImage.src;
        link.click();
    }

    goToLanding() {
        this.cleanup();
        this.showPage('landing-page');
    }

    goToPhotobooth() {
        this.showPage('photobooth-page');
        if (!this.state.stream) {
            this.startPhotobooth();
        }
    }

    restart() {
        this.cleanup();
        this.state.capturedImages = [];
        this.state.recaptureIndex = null;
        this.state.readyForResult = false;

        // Reset thumbnails
        for (let i = 1; i <= 3; i++) {
            const slot = document.getElementById(`slot-${i}`);
            const container = slot.parentElement;
            slot.src = `Slot ${i}.png`;
            slot.alt = `Photo slot ${i}`;
            container.classList.remove('recapturable');
        }

        // Reset button
        document.getElementById('capture-btn').innerHTML = '<md-icon slot="icon">camera</md-icon>Take Picture';
        document.getElementById('final-image').src = '';

        this.startPhotobooth();
    }

    stopCamera() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => track.stop());
            this.state.stream = null;
        }
    }

    cleanup() {
        this.stopCamera();
        const video = document.getElementById('video-feed');
        if (video) video.srcObject = null;
    }

    showPage(pageId) {
        ['landing-page', 'photobooth-page', 'result-page'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-dialog').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error-dialog').classList.add('hidden');
    }
}

new PhotoboothApp();
