export class Upload {
    async uploadImage(dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('image', blob, `photostrip-${Date.now()}.jpg`);

        const response = await fetch('/upload', { method: 'POST', body: formData });
        return await response.json();
    }

    showQRCode(qrCodeDataUrl) {
        document.getElementById('qr-loading').classList.add('hidden');
        document.getElementById('qr-code').src = qrCodeDataUrl;
        document.getElementById('qr-frame').classList.remove('hidden');
    }

    resetQRCode() {
        document.getElementById('qr-loading').classList.remove('hidden');
        document.getElementById('qr-frame').classList.add('hidden');
    }
}
