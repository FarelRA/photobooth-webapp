# Photobooth Application

A production-ready photobooth web application built with Material 3 design components.

## Features

- Capture 3 photos using device camera
- Retake individual photos
- Composite photos onto a custom template
- Print or download final photostrip
- Fully responsive design
- Accessibility compliant (WCAG 2.1 AA)
- Error handling and user feedback

## Requirements

- Modern web browser with camera support (Chrome, Firefox, Safari, Edge)
- HTTPS connection (required for camera access)
- Camera permissions

## Setup

1. Place all files in a web server directory
2. Ensure `template.png` and slot placeholder images are present
3. Access via HTTPS (required for camera API)

## File Structure

```
WebApp/
├── index.html          # Main HTML structure
├── script.js           # Application logic
├── style.css           # Styles and responsive design
├── template.png        # Photostrip template
├── Slot 1.png          # Placeholder images
├── Slot 2.png
└── Slot 3.png
```

## Configuration

Edit `script.js` to customize:

```javascript
this.config = {
    totalImages: 3,              // Number of photos to capture
    countdownSeconds: 3,         // Countdown duration
    captureQuality: 0.92,        // JPEG quality (0-1)
    overlayCoords: [...]         // Photo positions on template
};
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- Camera access requires HTTPS
- No data is transmitted to external servers
- All processing happens client-side
- Images are stored temporarily in memory only

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible
- Focus indicators
- Reduced motion support

## License

Proprietary - All rights reserved
