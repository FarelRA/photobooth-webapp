import { config } from './modules/config.js';
import { Camera } from './modules/camera.js';
import { Capture } from './modules/capture.js';
import { Upload } from './modules/upload.js';
import { UI } from './modules/ui.js';

class PhotoboothApp {
    constructor() {
        this.camera = new Camera();
        this.capture = new Capture();
        this.upload = new Upload();
        this.ui = new UI();
        
        this.state = {
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
        document.getElementById('start-btn').addEventListener('click', () => this.startPhotobooth());
        document.getElementById('capture-btn').addEventListener('click', () => this.handleCapture());
        document.getElementById('print-btn').addEventListener('click', () => this.handlePrint());
        document.getElementById('download-btn').addEventListener('click', () => this.ui.downloadImage());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('error-close-btn').addEventListener('click', () => this.ui.hideError());

        document.querySelectorAll('.thumbnail-container').forEach((container, index) => {
            container.addEventListener('click', () => this.handleRetake(index));
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        window.addEventListener('beforeunload', () => this.camera.stop());
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (!document.getElementById('error-dialog').classList.contains('hidden')) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                this.ui.hideError();
            }
            return;
        }

        const currentPage = this.getCurrentPage();
        
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                if (currentPage === 'landing-page') this.startPhotobooth();
                else if (currentPage === 'photobooth-page') this.handleCapture();
                else if (currentPage === 'result-page') this.handlePrint();
                break;
            case 'Escape':
                e.preventDefault();
                if (currentPage === 'photobooth-page') this.goToLanding();
                else if (currentPage === 'result-page') this.goToPhotobooth();
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
                    this.ui.downloadImage();
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
        if (!this.camera.isSupported()) {
            this.ui.showError('Camera not supported in this browser.');
            document.getElementById('start-btn').disabled = true;
        }
    }

    async startPhotobooth() {
        try {
            this.ui.showPage('photobooth-page');
            await this.camera.start();
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
        this.ui.showError(message);
        this.ui.showPage('landing-page');
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

        await this.capture.countdown();
        const imageDataUrl = this.capture.captureImage();

        if (this.state.recaptureIndex !== null) {
            this.capture.capturedImages[this.state.recaptureIndex] = imageDataUrl;
            this.ui.updateSlot(this.state.recaptureIndex, imageDataUrl);
            this.state.recaptureIndex = null;
        } else {
            const index = this.capture.capturedImages.length;
            this.capture.capturedImages.push(imageDataUrl);
            this.ui.updateSlot(index, imageDataUrl);
        }

        if (this.capture.capturedImages.length === config.totalImages) {
            this.ui.updateCaptureButton(true);
            this.state.readyForResult = true;
        }

        this.state.isCapturing = false;
        document.getElementById('capture-btn').disabled = false;
    }

    async createFinalImage() {
        try {
            this.ui.showPage('result-page');

            const finalDataUrl = await this.capture.createComposite();
            this.ui.setFinalImage(finalDataUrl);

            this.camera.stop();
            await this.uploadAndShowQR(finalDataUrl);
        } catch (error) {
            this.ui.showError('Failed to create final image.');
            this.ui.showPage('photobooth-page');
        }
    }

    async uploadAndShowQR(dataUrl) {
        try {
            const data = await this.upload.uploadImage(dataUrl);
            if (data.success) {
                this.upload.showQRCode(data.qrCode);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            document.getElementById('qr-loading').classList.add('hidden');
        }
    }

    handlePrint() {
        this.ui.printImage();
        this.ui.downloadImage();
        this.restart();
    }

    goToLanding() {
        this.camera.stop();
        this.ui.showPage('landing-page');
    }

    goToPhotobooth() {
        this.ui.showPage('photobooth-page');
        if (!this.camera.stream) {
            this.startPhotobooth();
        }
    }

    restart() {
        this.camera.stop();
        this.capture.reset();
        this.state.recaptureIndex = null;
        this.state.readyForResult = false;

        this.ui.resetSlots();
        this.ui.updateCaptureButton(false);
        this.ui.setFinalImage('');
        this.upload.resetQRCode();

        this.startPhotobooth();
    }
}

new PhotoboothApp();
