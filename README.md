> **Status:** Archived — no longer maintained, kept for reference.

# Photobooth Application

A production-ready photobooth web application with automatic image upload and QR code generation.

## Features

- Capture 3 photos using device camera
- Retake individual photos
- Composite photos onto a custom template
- Auto-upload images to server
- Generate QR code for easy photo sharing
- Print or download final photostrip
- Fully responsive design
- Accessibility compliant (WCAG 2.1 AA)
- Error handling and user feedback

## Requirements

- Node.js 16+ and npm
- Modern web browser with camera support (Chrome, Firefox, Safari, Edge)
- HTTPS connection (required for camera access)
- Camera permissions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Access the application at `http://localhost:3000`

For development with auto-reload:
```bash
npm run dev
```

## File Structure

```
photobooth-webapp/
├── server/
│   └── index.js          # Express server with upload & QR generation
├── public/
│   ├── index.html        # Main HTML structure
│   ├── script.js         # Application logic
│   ├── style.css         # Styles and responsive design
│   ├── template.png      # Photostrip template
│   ├── Slot 1.png        # Placeholder images
│   ├── Slot 2.png
│   ├── Slot 3.png
│   └── manifest.json
├── uploads/              # Uploaded images (auto-created)
├── package.json
└── README.md
```

## Configuration

Edit `public/script.js` to customize:

```javascript
this.config = {
    totalImages: 3,              // Number of photos to capture
    countdownSeconds: 3,         // Countdown duration
    captureQuality: 0.92,        // JPEG quality (0-1)
    overlayCoords: [...]         // Photo positions on template
};
```

Edit `server/index.js` to change port:

```javascript
const PORT = process.env.PORT || 3000;
```

## How It Works

1. User captures 3 photos
2. Photos are composited onto template
3. Final image is automatically uploaded to server
4. QR code is generated with download link
5. User can scan QR code to download photo on their device

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- Camera access requires HTTPS in production
- Uploaded images stored in `uploads/` directory
- All processing happens server-side for uploads
- No external API dependencies

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible
- Focus indicators
- Reduced motion support

## License

Proprietary - All rights reserved

