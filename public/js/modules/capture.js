import { config } from './config.js';

export class Capture {
    constructor() {
        this.capturedImages = [];
    }

    async countdown() {
        return new Promise(resolve => {
            let count = config.countdownSeconds;
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

        return canvas.toDataURL('image/jpeg', config.captureQuality);
    }

    async createComposite() {
        const [templateImg, ...capturedImgs] = await Promise.all([
            this.loadImage(config.templateUrl),
            ...this.capturedImages.map(src => this.loadImage(src))
        ]);

        const canvas = document.getElementById('composite-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = templateImg.width;
        canvas.height = templateImg.height;

        ctx.drawImage(templateImg, 0, 0);

        capturedImgs.forEach((img, index) => {
            const { x, y, w, h } = config.overlayCoords[index];
            ctx.drawImage(img, x, y, w, h);
        });

        return canvas.toDataURL('image/jpeg', config.captureQuality);
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    }

    reset() {
        this.capturedImages = [];
    }
}
