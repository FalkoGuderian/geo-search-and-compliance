# Objektsuche und Compliance Check

Eine webbasierte Anwendung zur Suche von geografischen Objekten über OGC Web Feature Services (WFS) mit KI-gestützter Unterstützung und automatischer Compliance-Prüfung.

## 🚀 Überblick

Dieses Tool ermöglicht es Benutzern, geografische Objekte über OGC Web Feature Services zu suchen und automatisch Compliance gegenüber regulatorischen Anforderungen zu prüfen, wobei auch Abstandsmessungen unterstützt werden. Benutzereingaben werden durch KI-Unterstützung für natürlichsprachliche Anfragen und automatische Parametererkennung erleichtert.

## 🌐 Live Demo

**Testen Sie das Tool online:** https://geo-search-and-compliance-check.onrender.com

Die Anwendung ist deployed und sofort benutzbar ohne lokale Installation.

### Suchassistent
<img width="741" height="683" alt="image" src="https://github.com/user-attachments/assets/e9164d18-5624-4972-80f5-7c3e08626536" />

### Manuelle Eingabe
<img width="745" height="593" alt="image" src="https://github.com/user-attachments/assets/6b09545e-1fed-4714-90f4-2b8e4e11234d" />

### Compliance-Prüfung
<img width="742" height="721" alt="image" src="https://github.com/user-attachments/assets/8b8816ec-b372-45cb-a17b-88dc1bc8d4de" />

## ✨ Funktionen

- **OGC WFS Integration**: Anbindung an verschiedene OGC WFS-Server
- **Abstandsmessung**: Automatische Berechnung von Abständen zu geografischen Objekten
- **KI-Assistent**: Natürlichsprachliche Parametererkennung über OpenRouter API
- **Compliance-Prüfung**: Automatische Bewertung gegen definierte Regulierungen
- **Sprachsteuerung**: Hands-free Bedienung mit Spracherkennung und Text-to-Speech
- **Interaktive Karte**: Visualisierung mit Leaflet.js
- **Modulare Architektur**: Einfach erweiterbar für zusätzliche OGC Dienste

## 🧪 Use Cases

| Suchanfrage | Ergebniskarte |
|-------------|---------------|
| Zeige das Straßennetz von Dresden und Umgebung | Visualisierung des Straßennetzes (RoadLink) in Dresden und Umgebung mit detaillierten Straßenverbindungen und Verkehrswegen <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/fdb3f9fb-22b7-4e82-af54-33a7535855a5" /> |
| Schienennetz in Sachsen | Anzeige des kompletten Schienennetzes (RailwayLink) in Sachsen mit erweitertem Suchradius von 150km und zentriert südlich von Dresden für vollständige Eisenbahninfrastruktur-Übersicht <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/3311ce93-9d54-4dcd-b88e-78b0ca7459b7" /> |
| Zeige alle Gemeinden in 20 km um Dresden | Darstellung aller Gemeinden (vg250:vg250_gem) im 20km-Radius um Dresden-Mitte mit Grenzvisualisierungen <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/fabb1daf-7e91-4e66-a5d0-19eb2f30fb2e" /> |
| Zeige alle Flüsse und Bäche in Dresden | Anzeige aller Fließgewässer (Watercourse) im Stadtgebiet Dresden mit Wasserkartierung <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/3581521e-91b1-45a2-bce2-857f631293a3" /> |
| Finde alle Seen im Großraum Leipzig | Zeigt alle stehenden Gewässer (StandingWater) im 50km-Radius um Leipzig <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/a0abc666-6b6e-4e35-ae58-cf5db1fedb56" />|
| Finde alle Naturschutzgebiete 10000m von der Stadtmitte Dresden entfernt | Visualisiert alle Naturschutzgebiete innerhalb 10km von Dresden-Mitte <br> <img height="250" alt="image" src="https://github.com/user-attachments/assets/dba5fda4-5b1a-47e0-a9a4-887bb67d0798" />|
| Finde alle Bahnhöfe in Freital | Anzeige aller Bahnhofs-Knoten im Stadtgebiet Freital mit interaktiven Popups und Lagebezügen <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/4435a4da-487f-428c-b6e5-cc0d2c9b65c3" />|
| Finde alle Flugplätze im Großraum Leipzig, Chemnitz und Dresden | Visualisiert alle Flugplätze (AerodromeArea) im Mehrstadtbereich mit interaktiven Lageinformationen <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/ee869e2e-9c3e-4bb4-b536-02088225943e" /> |
| Wo sind Vögel in Dresden und Umgebung geschützt | Anzeige aller Vogelschutzgebiete in Dresden und Umgebung mit detaillierten Schutzgebietsinformationen <br><img height="250" alt="image" src="https://github.com/user-attachments/assets/005d1a77-0cc5-4c9b-9eed-951b358396b2" /> |

## 🏗️ Architecture

```
geo-search-and-compliance/
├── index.html              # Main UI
├── src/
│   ├── main.js            # Main JavaScript logic
│   ├── DistanceCalculator.js # Distance calculation utilities
│   └── ai-prompts.js      # AI prompt templates and configuration
├── css/
│   └── styles.css         # Styles and Tailwind integration
├── config/
│   └── config.json        # Configuration, server URLs, layer maps
├── public/                # Static assets (currently empty)
├── LICENSE                # MIT License
├── README.md              # Documentation
├── SECURITY.md            # Security notes for API keys
├── THANKS.md             # Attribution and acknowledgments
├── package.json           # Dependencies and build scripts
├── package-lock.json      # Lockfile for exact dependency versions
├── vite.config.js         # Vite build configuration
├── .gitignore            # Git ignore files
└── todo.md               # Project todo list
```

## 🚀 Installation and Usage

### 1. Clone repository

```bash
git clone https://github.com/your-username/geo-search-and-compliance.git
cd geo-search-and-compliance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

The server starts on `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
```

The optimized version is created in the `dist/` folder.

## 🔧 Configuration

### Servers and Layers

Available servers and layers are configured in `config/config.json`. Currently supported servers:

- **BKG Administrative Areas** (`https://sgx.geodatenzentrum.de/wfs_vg250`)
  - Municipalities, districts, federal states, etc.
- **BfN Protected Areas** (`https://geodienste.bfn.de/ogc/wfs/schutzgebiet`)
  - Nature reserves, national parks, etc.
- **BKG Landscape Model DLM250 INSPIRE** (`https://sgx.geodatenzentrum.de/wfs_dlm250_inspire`)
  - Transport networks (roads, railways, air), hydrography, administrative units, protected sites

### AI Integration

An OpenRouter API key is required for AI functions. This is entered at runtime in the browser and not stored.

### Compliance Rules

Predefined check regulations are also defined in `config/config.json` and can be adjusted at runtime.

## 📚 API Examples

### WFS Query Example

```javascript
// Query all features within a BBOX
GET https://sgx.geodatenzentrum.de/wfs_vg250?
  service=WFS&
  version=2.0.0&
  request=GetFeature&
  typeNames=vg250:vg250_gem&
  bbox=13.0,50.0,14.0,51.0,EPSG:4326&
  outputFormat=application/json
```

### AI Prompt Example

```
You are an expert in GIS and OGC web services. Analyze the following user instruction and extract the required parameters for a WFS query.

User instruction: "Is the following object within 5000m distance to a nature reserve? {"type": "Point", "coordinates": [13.8713, 51.0036]}"

Available layers:
- Nature reserves (bfn_sch_Schutzgebiet:Naturschutzgebiete)
- Municipalities (vg250:vg250_gem)
// ... additional layers
```

## 🏗️ Development

### Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS (CDN)
- **Maps**: Leaflet.js
- **Geospatial**: Turf.js
- **Build Tool**: Vite
- **AI**: OpenRouter API

### Extending with new servers

1. Add the server to `config/config.json`
2. Implement specific parsers for new GML formats if necessary
3. Test the integration

### New compliance rules

Compliance rules can be defined in `config/config.json`:

```json
{
  "id": "new-rule",
  "name": "Rule name",
  "description": "Description",
  "type": "distance",
  "minDistance": 500,
  "layerTypes": ["Layer type"]
}
```

## 🚀 Deployment

### Live Demo

The application is deployed and live at: **https://geo-search-and-compliance-check.onrender.com**

### Automatic Deployment (Render.com)

This application is automatically deployed from GitHub via Render.com when changes are pushed to the main branch.

#### Render.com Configuration Files

The following configuration ensures proper deployment:

**`render.yaml`** - Defines the Render service configuration:
```yaml
services:
  - type: web
    name: geo-search-and-compliance
    runtime: static
    staticPath: dist
    headers:
      - path: assets/*.css
        name: Content-Type
        value: text/css
```

**`public/_headers`** - Sets custom HTTP headers for asset serving:
```
/assets/*.css
  Content-Type: text/css
```

#### Build Configuration

**Package.json build scripts:**
- `npm run build`: Creates optimized production build in `dist/` folder
- `npm run dev`: Starts local development server at `http://localhost:5173`

**Vite Configuration (`vite.config.js`):**
- External dependencies (Leaflet, Turf.js) loaded via CDN
- Source maps enabled for debugging
- Terser minification with console preservation
- Static asset optimization

#### Environment Setup

No environment variables required. The application loads configuration from `public/config/config.json` at runtime.

#### Deploy Steps

1. **Connect Repository**: Link GitHub repository to Render.com
2. **Service Type**: Choose "Static Site"
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. **Auto-deploy**: Enable on commit to `main` branch

The service automatically redeploys when changes are pushed to the main branch on GitHub.

### Other hosting providers

The generated files in the `dist/` folder can be deployed to any static web hoster (Netlify, Vercel, etc.).

**For Netlify/Vercel:**
```bash
npm run build
# Deploy the dist/ folder contents
```

**For GitHub Pages:**
```bash
npm run build
# Upload dist/ folder to GitHub Pages
```

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Please read [SECURITY.md](SECURITY.md) for important notes on API keys and secure configuration.

## 🙏 Attribution

Thanks to all open-source projects and data providers that make this tool possible:

- [Leaflet](https://leafletjs.com/) - Interactive maps
- [Turf.js](https://turfjs.org/) - Geospatial analyses
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [OpenStreetMap](https://www.openstreetmap.org/) - Base map data
- [BfN](https://www.bfn.de/) - Protected areas Germany
- [BKG](https://www.geodatenzentrum.de/) - Administrative areas and landscape model data Germany

A complete list of all dependencies and data sources can be found in [THANKS.md](THANKS.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a pull request

## 📞 Contact

For questions and feedback, please create an issue or contact directly.

---

## 🔍 Troubleshooting

### Common Issues

**Problem**: Map does not load
**Solution**: Check internet connection and browser CORS settings.

**Problem**: API key error
**Solution**: Ensure the OpenRouter API key is valid and active.

**Problem**: No features found
**Solution**: Check server availability and BBOX parameters.

### Debug Modes

- Enable console outputs in browser developer tools
- Raw XML responses are displayed in the UI
