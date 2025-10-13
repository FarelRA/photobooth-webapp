export class UI {
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

    updateSlot(index, imageDataUrl) {
        const slot = document.getElementById(`slot-${index + 1}`);
        const container = slot.parentElement;
        
        slot.src = imageDataUrl;
        slot.alt = `Captured photo ${index + 1}`;
        container.classList.add('recapturable');
    }

    resetSlots() {
        for (let i = 1; i <= 3; i++) {
            const slot = document.getElementById(`slot-${i}`);
            const container = slot.parentElement;
            slot.src = `Slot ${i}.png`;
            slot.alt = `Photo slot ${i}`;
            container.classList.remove('recapturable');
        }
    }

    updateCaptureButton(isReady) {
        const btn = document.getElementById('capture-btn');
        btn.innerHTML = isReady 
            ? '<md-icon slot="icon">visibility</md-icon>Overview'
            : '<md-icon slot="icon">camera</md-icon>Take Picture';
    }

    setFinalImage(dataUrl) {
        document.getElementById('final-image').src = dataUrl;
    }

    printImage() {
        const finalImage = document.getElementById('final-image');
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
    }

    downloadImage() {
        const finalImage = document.getElementById('final-image');
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `photostrip-${timestamp}.jpg`;
        link.href = finalImage.src;
        link.click();
    }
}
