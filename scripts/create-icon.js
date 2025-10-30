const fs = require('fs');
const path = require('path');

const size = 512;
const colors = {
  background: '#24292f',
  github: '#ffffff',
  badge: '#2ea44f',
  text: '#ffffff'
};

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#24292f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1e23;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${size}" height="${size}" rx="112" fill="url(#bgGrad)"/>
  
  <g transform="translate(256, 256)">
    <circle cx="0" cy="0" r="128" fill="${colors.github}" opacity="0.9"/>
    <circle cx="-32" cy="-32" r="24" fill="${colors.background}"/>
    <circle cx="32" cy="-32" r="24" fill="${colors.background}"/>
    <path d="M -80 -40 Q -40 -60 0 -60 Q 40 -60 80 -40" stroke="${colors.background}" stroke-width="16" fill="none" stroke-linecap="round"/>
  </g>
  
  <circle cx="392" cy="136" r="56" fill="${colors.badge}"/>
  <text x="392" y="148" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${colors.text}" text-anchor="middle">PR</text>
</svg>`;

const outputPath = path.join(__dirname, '../static/icon.svg');
fs.writeFileSync(outputPath, svg);
console.log(`Created ${outputPath}`);

const pngSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#24292f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1e23;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${size}" height="${size}" rx="112" fill="url(#bgGrad)"/>
  
  <g transform="translate(256, 256)">
    <circle cx="0" cy="0" r="128" fill="${colors.github}" opacity="0.95"/>
    <circle cx="-32" cy="-32" r="28" fill="${colors.background}"/>
    <circle cx="32" cy="-32" r="28" fill="${colors.background}"/>
    <path d="M -85 -50 Q -40 -75 0 -75 Q 40 -75 85 -50" stroke="${colors.background}" stroke-width="20" fill="none" stroke-linecap="round"/>
  </g>
  
  <circle cx="392" cy="136" r="56" fill="${colors.badge}"/>
  <text x="392" y="152" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold" fill="${colors.text}" text-anchor="middle">PR</text>
</svg>`;

const pngPath = path.join(__dirname, '../static/icon-app.svg');
fs.writeFileSync(pngPath, pngSvg);
console.log(`Created ${pngPath}`);


