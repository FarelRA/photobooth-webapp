export class Camera {
    constructor() {
        this.stream = null;
    }

    async start() {
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
            audio: false
        });
        document.getElementById('video-feed').srcObject = this.stream;
        return this.stream;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        const video = document.getElementById('video-feed');
        if (video) video.srcObject = null;
    }

    isSupported() {
        return !!navigator.mediaDevices?.getUserMedia;
    }
}
