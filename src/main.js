// Note: Leaflet and Turf.js are loaded via CDN in HTML for development
// During build, Vite automatically bundles them as ES modules

// Import CSS
import '../css/styles.css';

// Import DistanceCalculator
import DistanceCalculator from './DistanceCalculator.js';

// Import AI Prompts
import { getParameterExtractionPrompt, getComplianceCheckPrompt, AI_CONFIG, AI_API_ENDPOINT } from './ai-prompts.js';

// Global config variable
let appConfig = null;

// Global debug mode - set to true in console: window.debugMode = true
window.debugMode = false;

// --- Load configuration from config.json ---
async function loadConfig() {
    try {
        const response = await fetch('config/config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status}`);
        }
        appConfig = await response.json();
        console.log('Configuration loaded successfully:', appConfig);
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Use default values if config loading fails
        appConfig = {
            defaultSettings: {
                maxSearchDistance: 1000,
                maxFeatures: 100,
                batchSize: 1000,
                defaultServer: "bkgVerwaltungsgebiete",
                defaultLayer: "vg250:vg250_gem",
                defaultCoordinates: {
                    lat: 51.0036,
                    lon: 13.8713
                }
            }
        };
    }
}

// Global switchTab function for HTML onclick handlers
function switchTab(tabName) {
    console.log('=== switchTab() called with:', tabName);

    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-indigo-50', 'border-indigo-500', 'text-indigo-600');
        btn.classList.remove('bg-purple-50', 'border-purple-500', 'text-purple-600');
        btn.classList.remove('bg-orange-50', 'border-orange-500', 'text-orange-600');
        btn.classList.add('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        console.log('Hiding content:', content.id);
        content.classList.remove('active');
    });

    // Add active class to selected tab and content
    const activeButton = document.getElementById(`tab-${tabName}`);
    const activeContent = document.getElementById(`content-${tabName}`);

    console.log('Active button found:', !!activeButton);
    console.log('Active content found:', !!activeContent);
    console.log('Active content ID:', activeContent ? activeContent.id : 'null');

    if (activeButton && activeContent) {
        activeButton.classList.add('active');
        activeButton.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');

        // Apply consistent styling for active tab - unified purple theme
        activeButton.classList.add('bg-purple-50', 'border-purple-500', 'text-purple-600');

        console.log('Setting active on:', activeContent.id);
        activeContent.classList.add('active');
    }

    // Double-check the final state
    console.log('Final active contents:');
    document.querySelectorAll('.tab-content').forEach(content => {
        console.log(`  ${content.id}: active=${content.classList.contains('active')}`);
    });
}

// Make switchTab function globally available for HTML onclick handlers
window.switchTab = switchTab;

// --- Mapping for descriptive layer names based on your list ---
const layerNameMap = {
    // BKG Verwaltungsgebiete
    'vg250:vg250_gem': 'Gemeinden',
    'vg250:vg250_krs': 'Kreise',
    'vg250:vg250_lan': 'Bundesländer',
    'vg250:vg250_sta': 'Staaten',
    'vg250:vg250_rbz': 'Regierungsbezirke',
    'vg250:vg250_vwg': 'Verwaltungsgemeinschaften',
    'vg250:vg250_pk': 'Gemeindepunkte',
    'vg250:vg250_li': 'Grenzlinien',

    // BfN Schutzgebiete
    'bfn_sch_Schutzgebiet:Nationale_Naturmonumente': 'Nationale Naturmonumente',
    'bfn_sch_Schutzgebiet:Fauna_Flora_Habitat_Gebiete': 'Fauna-Flora-Habitat-Gebiete',
    'bfn_sch_Schutzgebiet:Vogelschutzgebiete': 'Vogelschutzgebiete',
    'bfn_sch_Schutzgebiet:Biosphaerenreservate': 'Biosphärenreservate',
    'bfn_sch_Schutzgebiet:Biosphaerenreservate_Zonierung': 'Biosphärenreservate - Zonierung',
    'bfn_sch_Schutzgebiet:Nationalparke': 'Nationalparke',
    'bfn_sch_Schutzgebiet:Naturparke': 'Naturparke',
    'bfn_sch_Schutzgebiet:Naturschutzgebiete': 'Naturschutzgebiete',
    'bfn_sch_Schutzgebiet:Landschaftsschutzgebiete': 'Landschaftsschutzgebiete',

    // DLM250 INSPIRE Landschaftsmodell (SGX Geodatenzentrum)
    'hy-p:Crossing': 'Kreuzung',
    'hy-p:DamOrWeir': 'Damm oder Wehr',
    'hy-p:Embankment': 'Uferverbauung',
    'hy-p:Falls': 'Wasserfälle',
    'hy-p:LandWaterBoundary': 'Land-Wasser-Grenze',
    'hy-p:Lock': 'Schleuse',
    'hy-p:Shore': 'Ufer',
    'hy-p:ShorelineConstruction': 'Uferbauwerke',
    'hy-p:StandingWater': 'Stehendes Gewässer',
    'hy-p:Watercourse': 'Wasserlauf',
    'hy-p:Wetland': 'Feuchtgebiet',
    'hy-n:HydroNode': 'Hydro-Knoten',
    'hy-n:WatercourseLink': 'Wasserlauf-Verbindung',
    'tn-a:AerodromeArea': 'Flugplatzbereich',
    'tn-a:AerodromeCategory': 'Flugplatz-Kategorie',
    'tn-a:AerodromeNode': 'Flugplatz-Knoten',
    'tn-a:AerodromeType': 'Flugplatz-Typ',
    'tn-a:ConditionOfAirFacility': 'Zustand von Luftfahrtanlagen',
    'tn-a:FieldElevation': 'Felderhebung',
    'elf-tn-a:AerodromeArea': 'Flugplatzbereich',
    'elf-tn-a:AerodromeNode': 'Flugplatz-Knoten',
    'elf-tn-a:FunctionalUseCategory': 'Funktionale Nutzungskategorie',
    'elf-tn-a:RunwayLine': 'Startbahnlnie',
    'elf-tn-a:TransportationUseCategory': 'Verkehrsnutzungskategorie',
    'tn-ra:DesignSpeed': 'Entwurfgeschwindigkeit',
    'tn-ra:NominalTrackGauge': 'Nennspurweite',
    'tn-ra:NumberOfTracks': 'Anzahl der Gleise',
    'tn-ra:RailwayElectrification': 'Bahnelektrifizierung',
    'tn-ra:RailwayLine': 'Bahnlinie',
    'tn-ra:RailwayLink': 'Bahn-Verbindung',
    'tn-ra:RailwayNode': 'Bahn-Knoten',
    'tn-ra:RailwayStationCode': 'Bahnhofs-Code',
    'tn-ra:RailwayStationNode': 'Bahnhofs-Knoten',
    'tn-ra:RailwayType': 'Bahntyp',
    'tn-ra:RailwayUse': 'Bahn-Nutzung',
    'elf-tn-ra:DesignSpeed': 'Entwurfgeschwindigkeit',
    'elf-tn-ra:RailwayClass': 'Bahn-Klasse',
    'elf-tn-ra:RailwayElectrification': 'Bahnelektrifizierung',
    'elf-tn-ra:RailwayLink': 'Bahn-Verbindung',
    'elf-tn-ra:RailwayStationNode': 'Bahnhofs-Knoten',
    'tn-ro:ERoad': 'E-Straße',
    'tn-ro:FormOfWay': 'Wegform',
    'tn-ro:FunctionalRoadClass': 'Funktionale Straßenklasse',
    'tn-ro:NumberOfLanes': 'Anzahl der Fahrstreifen',
    'tn-ro:Road': 'Straße',
    'tn-ro:RoadLink': 'Straßen-Verbindung',
    'tn-ro:RoadNode': 'Straßen-Knoten',
    'tn-ro:RoadServiceType': 'Straßen-Diensttyp',
    'tn-ro:RoadSurfaceCategory': 'Straßenoberflächen-Kategorie',
    'elf-tn-ro:InterchangePoint': 'Austauschpunkt',
    'elf-tn-ro:RoadLink': 'Straßen-Verbindung',
    'tn-w:ConditionOfWaterFacility': 'Zustand von Wasseranlagen',
    'tn-w:FerryCrossing': 'Fährüberfahrt',
    'tn-w:PortArea': 'Hafenbereich',
    'tn-w:PortNode': 'Hafen-Knoten',
    'elf-tn-w:FerryCrossing': 'Fährüberfahrt',
    'elf-tn-w:PortArea': 'Hafenbereich',
    'elf-tn-w:PortNode': 'Hafen-Knoten',
    'elf-tn-w:PortType': 'Hafen-Typ',
    'tn:AccessRestriction': 'Zugangsbeschränkung',
    'tn:ConditionOfFacility': 'Zustand von Anlagen',
    'tn:VerticalPosition': 'Vertikale Position',
    'au:AdministrativeBoundary': 'Verwaltungsgrenze',
    'au:AdministrativeUnit': 'Verwaltungseinheit',
    'elf-au:AdministrativeUnit': 'Verwaltungseinheit',
    'elf-au:AdministrativeUnitArea': 'Verwaltungseinheit-Gebiet',
    'ps:ProtectedSite': 'Schutzgebiet'
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired');
    console.log('window.switchTab available:', typeof window.switchTab);

    // Load configuration first
    await loadConfig();

    // Map Initialization
    const map = L.map('map').setView([51.1657, 10.4515], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Layer groups to manage map elements
    let coordinateMarker = null;
    let featuresLayer = null;
    let resultLines = null;
    let nearestPointMarkers = null;

    // DOM Elements
    const form = document.getElementById('ogc-form');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const maxSearchDistanceInput = document.getElementById('maxSearchDistance');
    const resultContainer = document.getElementById('result-container');
    const xmlOutputContainer = document.getElementById('xml-output-container');
    const xmlOutput = document.getElementById('xml-output');
    const geoserverSelect = document.getElementById('geoserver-select');
    const fetchLayersBtn = document.getElementById('fetch-layers-btn');
    const layerSelect = document.getElementById('layer-name');
    const layerLoader = document.getElementById('layer-loader');
    const maxFeaturesEnabled = document.getElementById('maxFeaturesEnabled');
    const maxFeaturesGroup = document.getElementById('maxFeaturesGroup');
    const maxFeatures = document.getElementById('maxFeatures');

    // KI Elements
    const mistralApiKeyInput = document.getElementById('mistral-api-key');
    const aiInstructionInput = document.getElementById('ai-instruction');
    const processAiInstructionBtn = document.getElementById('process-ai-instruction');
    const aiStatus = document.getElementById('ai-status');
    const aiResult = document.getElementById('ai-result');
    const aiResultContent = document.getElementById('ai-result-content');

    // Compliance Elements
    const complianceRuleInput = document.getElementById('compliance-rule');
    const autoComplianceCheck = document.getElementById('auto-compliance-check');
    const complianceResult = document.getElementById('compliance-result');
    const complianceResultContent = document.getElementById('compliance-result-content');

    // Compliance Voice Elements
    const speakComplianceBtn = document.getElementById('speak-compliance-btn');
    const voiceComplianceBtn = document.getElementById('voice-compliance-btn');

    // Global variable to store last measurement results for compliance checking
    let lastMeasurementResults = null;

    // --- Helper function to detect if this is BfN Schutzgebiete server ---
    function isBfNServer(baseUrl) {
        return baseUrl.includes('bfn.de');
    }

    // --- Helper function to detect server type ---
    function getServerType(url) {
        const option = geoserverSelect.querySelector(`option[value="${url}"]`);
        return option ? option.getAttribute('data-type') : 'json';
    }

    // --- Helper function to check if Max Features should be applied ---
    function isMaxFeaturesSupported(url) {
        // Nur für BfN Schutzgebiete und BKG Verwaltungsgebiete aktivieren
        return url.includes('bfn.de') || url.includes('sgx.geodatenzentrum.de');
    }

    // --- Fetches the list of layers (FeatureTypes) from the WFS server ---
    async function fetchLayers() {
        const baseUrl = geoserverSelect.value;
        if (!baseUrl) return;

        layerLoader.textContent = 'Lade Layer...';
        layerSelect.innerHTML = '<option value="" disabled selected>Lade...</option>';
        layerSelect.disabled = true;

        const capabilitiesUrl = new URL(baseUrl);
        capabilitiesUrl.searchParams.set('service', 'WFS');
        capabilitiesUrl.searchParams.set('version', '2.0.0');
        capabilitiesUrl.searchParams.set('request', 'GetCapabilities');

        try {
            const response = await fetch(capabilitiesUrl);
            const xmlText = await response.text();

            if (!response.ok) {
                throw new Error(`Server-Fehler: ${response.status}`);
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            const exceptionNode = xmlDoc.querySelector("ows\\:ExceptionText, ExceptionText");
            if (exceptionNode) {
                throw new Error(`Server-Fehlermeldung: ${exceptionNode.textContent.trim()}`);
            }

            const featureTypeNodes = xmlDoc.querySelectorAll("FeatureType > Name, wfs\\:FeatureType > wfs\\:Name");
            if (featureTypeNodes.length === 0) {
                throw new Error("Keine Layer (FeatureTypes) in der Server-Antwort gefunden.");
            }

            layerSelect.innerHTML = ''; // Clear previous options
            featureTypeNodes.forEach(node => {
                const technicalName = node.textContent;
                const description = layerNameMap[technicalName];
                const option = document.createElement('option');
                option.value = technicalName;
                option.textContent = description ? `${description} (${technicalName})` : technicalName;
                layerSelect.appendChild(option);
            });

            // Pre-select RailwayStationNode if this is the SGX server
            if (baseUrl.includes('sgx.geodatenzentrum.de') && layerSelect.querySelector('[value="tn-ra:RailwayStationNode"]')) {
                layerSelect.value = "tn-ra:RailwayStationNode";
                // Set default coordinates for Dresden rail stations when this layer is selected
                if (!latInput.value || !lonInput.value || (latInput.value === '51.0036' && lonInput.value === '13.8713')) {
                    latInput.value = '51.055';
                    lonInput.value = '13.701';
                    if (coordinateMarker) {
                        coordinateMarker.setLatLng([51.055, 13.701]);
                    } else {
                        coordinateMarker = L.circleMarker([51.055, 13.701], {
                            radius: 8,
                            color: '#7c3aed', // purple-600
                            fillColor: '#a855f7', // purple-500
                            fillOpacity: 0.9,
                            title: "Koordinaten-Position (Aktiv)"
                        }).addTo(map);
                    }
                    map.setView([51.055, 13.701], 13);
                }
            } else if (layerSelect.querySelector('[value="vg250:vg250_gem"]')) {
                layerSelect.value = "vg250:vg250_gem";
            } else if (layerSelect.querySelector('[value="nsg"]')) {
                layerSelect.value = "nsg";
            }

            layerLoader.textContent = `${featureTypeNodes.length} Layer gefunden.`;
        } catch (error) {
            layerLoader.textContent = `Fehler: ${error.message}`;
            layerSelect.innerHTML = '<option value="" disabled selected>-- Laden fehlgeschlagen --</option>';
        } finally {
            layerSelect.disabled = false;
        }
    }

    // --- Core distance measurement function ---
    async function measureDistances(baseUrl, layerName, lat, lon, maxSearchDistanceM) {
        console.log('=== DISTANCE MEASUREMENT START ===');
        console.log('Input coordinates - lat:', lat, 'lon:', lon);
        console.log('Layer name:', layerName, 'Base URL:', baseUrl);

        // Clear previous results to ensure clean state for new search
        resultContainer.innerHTML = '';
        xmlOutputContainer.classList.add('hidden');
        xmlOutput.value = '';
        complianceResult.classList.add('hidden'); // ← EXPLICITLY HIDE COMPLIANCE

        const coordinatePoint = turf.point([lon, lat]);
        console.log('Turf.js point created:', coordinatePoint);

        // Remove existing marker if it exists to prevent duplicates
        if (coordinateMarker) {
            map.removeLayer(coordinateMarker);
        }
        coordinateMarker = L.circleMarker([lat, lon], {
            radius: 8,
            color: '#7c3aed', // purple-600
            fillColor: '#a855f7', // purple-500
            fillOpacity: 0.9,
            title: "Koordinaten-Position (Aktiv)"
        }).addTo(map);
        map.setView([lat, lon], 13);

        // Calculate expanded bbox for search distance
        const maxSearchDistanceKm = maxSearchDistanceM / 1000;
        const latRadians = lat * Math.PI / 180;
        const latDegrees = maxSearchDistanceKm / 111.0;
        const lonDegrees = maxSearchDistanceKm / (111.0 * Math.cos(latRadians));
        const minLon = lon - lonDegrees;
        const maxLon = lon + lonDegrees;
        const minLat = lat - latDegrees;
        const maxLat = lat + latDegrees;
        const bbox = `${Math.max(-180, minLon)},${Math.max(-90, minLat)},${Math.min(180, maxLon)},${Math.min(90, maxLat)}`;
        const serverType = getServerType(baseUrl);

        console.log('Search point:', lat, lon);
        console.log('Calculated expanded BBox for search distance:', bbox);
        console.log('Search distance used:', maxSearchDistanceM, 'meters');

        const batchSize = appConfig?.defaultSettings?.batchSize || 1000;
        let startIndex = 0;
        let allFeatures = [];
        let totalProcessedFeatures = 0;
        let featuresWithDistances = [];
        let responseText = ''; // Initialize responseText outside try block

        // Show initial loading message
        showResult('loading', `Starte Abfrage vom WFS-Server mit Batch-Verarbeitung...`);

        try {
            // Continue fetching until we get less than batchSize features (indicating we're done)
            let hasMoreFeatures = true;

            while (hasMoreFeatures) {
                const wfsUrl = new URL(baseUrl);
                wfsUrl.searchParams.append('service', 'WFS');
                wfsUrl.searchParams.append('version', '2.0.0');
                wfsUrl.searchParams.append('request', 'GetFeature');
                wfsUrl.searchParams.append('typeNames', layerName);
                wfsUrl.searchParams.append('srsName', 'EPSG:4326');
                wfsUrl.searchParams.append('count', batchSize);
                wfsUrl.searchParams.append('startIndex', startIndex);

                // For BfN server, try without bbox first to get features
                if (!baseUrl.includes('bfn.de')) {
                    wfsUrl.searchParams.append('bbox', `${bbox},EPSG:4326`);
                }

                // Set output format based on server configuration with fallback logic
                if (serverType === 'json') {
                    wfsUrl.searchParams.append('outputFormat', 'application/json');
                } else {
                    // Get output format from server configuration
                    const serverConfig = Object.values(appConfig.servers).find(server => server.url === baseUrl);
                    const primaryFormat = serverConfig?.outputFormat || 'application/gml+xml; version=3.2';

                    // Try primary format first, with fallback options
                    const fallbackFormats = [
                        primaryFormat,
                        'application/gml+xml; version=3.2',
                        'text/xml; subtype=gml/3.2.1',
                        'GML32',
                        'GML3'
                    ];

                    // Use the first format that matches the primary format (to avoid duplicates)
                    const outputFormat = fallbackFormats.find(format =>
                        format === primaryFormat || !fallbackFormats.slice(0, fallbackFormats.indexOf(primaryFormat)).includes(format)
                    ) || primaryFormat;

                    wfsUrl.searchParams.append('outputFormat', outputFormat);
                }

                const batchNumber = Math.floor(startIndex / batchSize) + 1;
                showResult('loading', `Lade Batch ${batchNumber} vom Server (Features ${startIndex + 1}-${startIndex + batchSize})...`);

                // Log the complete WFS request URL for debugging
                console.log('WFS Request URL:', wfsUrl.toString());
                console.log('WFS Request Parameters:', {
                    service: wfsUrl.searchParams.get('service'),
                    version: wfsUrl.searchParams.get('version'),
                    request: wfsUrl.searchParams.get('request'),
                    typeNames: wfsUrl.searchParams.get('typeNames'),
                    srsName: wfsUrl.searchParams.get('srsName'),
                    count: wfsUrl.searchParams.get('count'),
                    startIndex: wfsUrl.searchParams.get('startIndex'),
                    bbox: wfsUrl.searchParams.get('bbox'),
                    outputFormat: wfsUrl.searchParams.get('outputFormat')
                });

                let data;

                const response = await fetch(wfsUrl);
                responseText = await response.text();
                const contentType = response.headers.get("content-type");

                if (!response.ok) {
                    showRawOutput(responseText);
                    const exceptionTextMatch = responseText.match(/<ows:ExceptionText>([\s\S]*?)<\/ows:ExceptionText>/i);
                    let detailedError = `Server-Fehler: ${response.status} ${response.statusText}`;
                    if (exceptionTextMatch && exceptionTextMatch[1]) {
                         detailedError = exceptionTextMatch[1].trim();
                    }
                    throw new Error(detailedError);
                }

                if (serverType === 'json') {
                    if (!contentType || !contentType.includes("application/json")) {
                        showRawOutput(responseText);
                        throw new Error(`Falscher Content-Type vom Server erhalten. Erwartet wurde JSON, aber bekommen: ${contentType || 'nicht vorhanden'}`);
                    }
                    data = JSON.parse(responseText);
                } else {
                    // Parse XML/GML response
                    if (!contentType || (!contentType.includes("text/xml") && !contentType.includes("application/xml") && !contentType.includes("application/gml+xml"))) {
                        showRawOutput(responseText);
                        throw new Error(`Falscher Content-Type vom Server erhalten. Erwartet wurde XML/GML, aber bekommen: ${contentType || 'nicht vorhanden'}`);
                    }

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(responseText, "application/xml");

                    // Check for parsing errors
                    const parseError = xmlDoc.querySelector("parsererror");
                    if (parseError) {
                        showRawOutput(responseText);
                        throw new Error('Fehler beim Parsen der XML-Antwort: ' + parseError.textContent);
                    }

                    // Check for OGC exceptions
                    const exceptionNode = xmlDoc.querySelector("ows\\:ExceptionText, ExceptionText");
                    if (exceptionNode) {
                        showRawOutput(responseText);
                        throw new Error(`Server-Fehlermeldung: ${exceptionNode.textContent.trim()}`);
                    }

                    data = parseGMLFeatures(xmlDoc, baseUrl);

                    if (data.features.length === 0) {
                        showRawOutput(responseText);
                    }
                }

                // Check if we got features in this batch
                if (!data.features || data.features.length === 0) {
                    hasMoreFeatures = false;
                    break;
                }

                // Add to total count
                allFeatures = allFeatures.concat(data.features);
                totalProcessedFeatures += data.features.length;

                // Process current batch for distance calculations
                const currentBatch = data.features;
                let batchFeaturesWithDistances = [];

                currentBatch.forEach(feature => {
                    const distanceResult = DistanceCalculator.calculateFeatureDistance(coordinatePoint, feature);
                    if (distanceResult !== null) {
                        const distanceInMeters = distanceResult.distance * 1000;

                        // Only include features within max search distance
                        if (distanceInMeters <= maxSearchDistanceM) {
                            batchFeaturesWithDistances.push({
                                feature: feature,
                                distance: distanceInMeters,
                                isContaining: distanceResult.isContaining,
                                name: extractFeatureName(feature.properties),
                                geometryType: feature.geometry ? feature.geometry.type : 'Unknown'
                            });
                        }
                    }
                });

                // Add batch results to total results
                featuresWithDistances = featuresWithDistances.concat(batchFeaturesWithDistances);

                // Show intermediate results and update map visualization after each batch
                if (featuresWithDistances.length > 0) {
                    const intermediateResults = getIntermediateResults(
                        featuresWithDistances,
                        maxSearchDistanceM,
                        serverType,
                        totalProcessedFeatures,
                        batchNumber,
                        null, // We don't know total batches yet
                        data.features.length
                    );
                    showResult('success', intermediateResults);

                    // Update map visualization with current results
                    updateMapVisualization(featuresWithDistances, coordinatePoint, lat, lon);

                    // Small delay to show progress
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Check if this was a full batch (if so, there might be more)
                if (data.features.length < batchSize) {
                    hasMoreFeatures = false;
                } else {
                    startIndex += batchSize;
                }
            }

            if (featuresWithDistances.length === 0) {
                throw new Error(`Keine Features innerhalb der maximalen Suchdistanz von ${maxSearchDistanceM}m gefunden.`);
            }

            // Sort by distance (containing features first with distance 0, then by distance)
            featuresWithDistances.sort((a, b) => {
                if (a.isContaining && !b.isContaining) return -1;
                if (!a.isContaining && b.isContaining) return 1;
                return a.distance - b.distance;
            });

            // Remove duplicates by name, keeping only the feature with the shortest distance
            const uniqueFeaturesMap = new Map();
            featuresWithDistances.forEach(item => {
                const name = item.name;

                // If this name doesn't exist yet, or if this feature has a shorter distance, keep it
                if (!uniqueFeaturesMap.has(name) || uniqueFeaturesMap.get(name).distance > item.distance) {
                    uniqueFeaturesMap.set(name, item);
                }
            });

            // Convert map back to array
            const deduplicatedFeatures = Array.from(uniqueFeaturesMap.values());

            // Sort again after deduplication to ensure proper order
            deduplicatedFeatures.sort((a, b) => {
                if (a.isContaining && !b.isContaining) return -1;
                if (!a.isContaining && b.isContaining) return 1;
                return a.distance - b.distance;
            });

            // Store for compliance checking
            lastMeasurementResults = deduplicatedFeatures;

            // Display final results
            displayMultipleResults(deduplicatedFeatures, maxSearchDistanceM, serverType, totalProcessedFeatures);

            // Visualize on map
            visualizeMultipleFeatures(deduplicatedFeatures, coordinatePoint, lat, lon);

            // Perform automatic compliance check if enabled
            if (autoComplianceCheck.checked) {
                await performComplianceCheck(featuresWithDistances);
            }

        } catch (error) {
            // Show raw server response for debugging
            showRawOutput(responseText);

            showResult('error', `Ein Fehler ist aufgetreten: ${error.message}`);
            console.error('Fehler bei der Abfrage:', error);

            // Add additional debugging info
            if (allFeatures.length > 0) {
                console.log('Total features processed:', totalProcessedFeatures);
                console.log('Features found within distance:', featuresWithDistances.length);
            }
        }
    }

    // --- Form submission handler ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const geoserverUrl = geoserverSelect.value;
            const layerName = layerSelect.value;
            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput.value);
            const maxSearchDistance = parseFloat(maxSearchDistanceInput.value);

            if (!geoserverUrl || !layerName || isNaN(lat) || isNaN(lon) || isNaN(maxSearchDistance) || maxSearchDistance <= 0) {
                showResult('error', 'Bitte füllen Sie alle Felder korrekt aus und wählen Sie einen Layer.');
                return;
            }

            clearMapAndResults();
            showResult('loading', 'Messe Abstände...');

            // Export functions from abstandsmessung.html that are needed
            await measureDistances(geoserverUrl, layerName, lat, lon, maxSearchDistance);
        });
    }

    // --- Event listeners ---
    fetchLayersBtn.addEventListener('click', fetchLayers);
    geoserverSelect.addEventListener('change', fetchLayers); // Auto-fetch on server change

    // Enable/disable max features input based on checkbox
    maxFeaturesEnabled.addEventListener('change', () => {
        if (maxFeaturesEnabled.checked) {
            maxFeaturesGroup.style.display = 'block';
        } else {
            maxFeaturesGroup.style.display = 'none';
        }
    });

    // === VOICE INPUT FUNCTIONALITY ===
    let autoVoiceMode = true; // Standardmäßig aktiviert für automatisch Spracherkennung nach Vorlesen
    let isRecording = false;
    let recordingTime = 0;
    let recordingInterval = null;
    let currentSpeechRecognition = null;

    async function startAudioRecording() {
        try {
            await startSpeechRecognition();
        } catch (error) {
            showAiStatus('error', error.message);
        }
    }

    function stopVoiceRecording() {
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        hideVoiceRecordingStatus();
        hideVoiceSpeakingStatus();
    }

    function startSpeechRecognition() {
        // Clear any existing error first
        showAiStatus('', '');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showAiStatus('error', 'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Chromium-basierte Browser.');
            return false;
        }

        // Check microphone permission first
        navigator.permissions.query({ name: 'microphone' }).then(permission => {
            if (permission.state === 'denied') {
                showAiStatus('error', 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff in Ihren Browsereinstellungen.');
                return false;
            }
        }).catch(() => {
            // Permission API might not be supported, continue anyway
        });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'de-DE'; // German language

        recognition.onstart = () => {
            isRecording = true;
            recordingTime = 0;

            updateVoiceRecordingStatus();

            recordingInterval = setInterval(() => {
                recordingTime++;
                document.getElementById('recording-timer').textContent = recordingTime;
            }, 1000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                // Add transcription to input field
                aiInstructionInput.value = transcript.trim();
                showAiStatus('success', `Erkannt: "${transcript.trim()}"`);

                // Always auto-evaluate after voice input (functionality removed from UI checkbox)
                setTimeout(() => {
                    processAiInstructionBtn.click();
                }, 500);
            } else {
                showAiStatus('error', 'Keine Sprache erkannt. Bitte sprechen Sie lauter und näher an Ihr Mikrofon.');
            }
        };

        recognition.onend = () => {
            stopVoiceRecording();
        };

        recognition.onerror = (event) => {
            let errorMessage = 'Spracherkennungsfehler: ';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage += 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff.';
                    break;
                case 'no-speech':
                    errorMessage += 'Keine Sprache erkannt. Bitte sprechen Sie klarer.';
                    break;
                case 'aborted':
                    errorMessage += 'Spracherkennung wurde abgebrochen.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Audioaufnahme fehlgeschlagen. Bitte prüfen Sie Ihr Mikrofon.';
                    break;
                case 'network':
                    errorMessage += 'Netzwerkfehler während der Spracherkennung.';
                    break;
                default:
                    errorMessage += event.error || 'Unbekannter Fehler aufgetreten.';
            }
            showAiStatus('error', errorMessage);
            stopVoiceRecording();
        };

        currentSpeechRecognition = recognition;

        try {
            recognition.start();
            return true;
        } catch (error) {
            showAiStatus('error', `Fehler beim Starten der Spracherkennung: ${error.message}`);
            return false;
        }
    }

    // Voice UI functions
    function updateVoiceRecordingStatus() {
        const statusDiv = document.getElementById('voice-recording-status');
        const timerSpan = document.getElementById('recording-timer');
        timerSpan.textContent = recordingTime;
        statusDiv.classList.remove('hidden');
    }

    function hideVoiceRecordingStatus() {
        const statusDiv = document.getElementById('voice-recording-status');
        statusDiv.classList.add('hidden');
        isRecording = false;
    }

    function updateVoiceSpeakingStatus() {
        const statusDiv = document.getElementById('voice-speaking-status');
        statusDiv.classList.remove('hidden');
    }

    function hideVoiceSpeakingStatus() {
        const statusDiv = document.getElementById('voice-speaking-status');
        statusDiv.classList.add('hidden');
    }



    // Text-to-speech functionality
    function speakText(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'de-DE'; // German

            utterance.onstart = () => {
                updateVoiceSpeakingStatus();
            };

            utterance.onend = () => {
                hideVoiceSpeakingStatus();
                // If auto voice mode is enabled, start listening after speaking
                if (autoVoiceMode) {
                    setTimeout(() => {
                        startSpeechRecognition();
                    }, 500); // Small delay
                }
                // If auto-evaluate mode is enabled, trigger AI processing after speaking
                const autoEvaluateCheckbox = document.getElementById('auto-evaluate-mode');
                if (autoEvaluateCheckbox && autoEvaluateCheckbox.checked) {
                    setTimeout(() => {
                        document.getElementById('process-ai-instruction').click();
                    }, 500); // Small delay to ensure speaking has stopped
                }
            };

            utterance.onerror = (event) => {
                hideVoiceSpeakingStatus();
                showAiStatus('error', 'Fehler bei der Sprachausgabe. Sprachaufzeichnung ist manuell verfügbar.');
                // Fallback: start recording even if speech failed
                if (autoVoiceMode) {
                    startSpeechRecognition();
                }
            };

            window.speechSynthesis.speak(utterance);
        } else {
            showAiStatus('error', 'Sprachausgabe wird in diesem Browser nicht unterstützt. Sprachaufzeichnung ist manuell verfügbar.');
            if (autoVoiceMode) {
                startSpeechRecognition();
            }
        }
    }

    // === Event Listeners for Voice Features ===
    document.getElementById('speak-instruction-btn').addEventListener('click', () => {
        const instructionText = aiInstructionInput.placeholder || "Geben Sie Ihre Anweisung ein.";
        speakText(instructionText);
    });

    document.getElementById('voice-instruction-btn').addEventListener('click', async () => {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            try {
                await startAudioRecording();
            } catch (error) {
                showAiStatus('error', error.message);
            }
        }
    });

    document.getElementById('stop-voice-btn').addEventListener('click', stopVoiceRecording);

    // AI Help modal
    document.getElementById('ai-help-btn').addEventListener('click', () => {
        document.getElementById('ai-help-modal').classList.remove('hidden');
    });

    document.getElementById('close-ai-help-btn').addEventListener('click', () => {
        document.getElementById('ai-help-modal').classList.add('hidden');
    });

    // Download AI result functionality
    document.getElementById('download-ai-result-btn').addEventListener('click', () => {
        const content = document.getElementById('ai-result-content').textContent;
        if (content) {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ki-analyse.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    // === COMPLIANCE VOICE INPUT FUNCTIONALITY ===

    // Generate contextual compliance question based on current search query
    function generateComplianceQuestion() {
        const searchQuery = aiInstructionInput.value.trim();
        const selectedLayer = layerSelect.value;
        const layerDescription = layerNameMap[selectedLayer] || selectedLayer;
        const coordinates = `Lat: ${latInput.value}, Lon: ${lonInput.value}`;

        if (searchQuery) {
            // Try to extract context from the search query to make a relevant question
            const lowerQuery = searchQuery.toLowerCase();
            let contextHint = '';

            if (lowerQuery.includes('schutzgebiet') || lowerQuery.includes('natur') || lowerQuery.includes('umwelt')) {
                contextHint = 'für ein Umwelt- oder Naturschutzprojekt';
            } else if (lowerQuery.includes('stadt') || lowerQuery.includes('wohn') || lowerQuery.includes('bau')) {
                contextHint = 'für ein Bau- oder Stadtentwicklungsprojekt';
            } else if (lowerQuery.includes('infrastruktur') || lowerQuery.includes('verkehr') || lowerQuery.includes('straße')) {
                contextHint = 'für ein Infrastruktur- oder Verkehrsprojekt';
            } else if (lowerQuery.includes('landwirtschaft') || lowerQuery.includes('agrar')) {
                contextHint = 'für ein landwirtschaftliches Projekt';
            } else {
                contextHint = 'für dieses geografische Objekt';
            }

            return `Bitte beschreiben Sie die Prüfvorschrift ${contextHint} zu ${layerDescription}. Zum Beispiel maximale Abstände zu bestimmten Gebieten oder Objekten.`;
        } else {
            return `Bitte beschreiben Sie eine Prüfvorschrift für das Objekt zu  ${layerDescription}. Zum Beispiel "Objekt darf nicht mehr als 1000m entfernt von einem Schutzgebiet oder Ortschaft sein."`;
        }
    }

    // Helper function to check if all search parameters are valid for auto-search
    function hasValidSearchParameters() {
        const serverUrl = geoserverSelect.value;
        const layerName = layerSelect.value;
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const maxDistance = parseFloat(maxSearchDistanceInput.value);

        return (
            serverUrl &&
            layerName &&
            !isNaN(lat) && !isNaN(lon) &&
            !isNaN(maxDistance) && maxDistance > 0
        );
    }

    // Compliance Voice Features
    async function startComplianceRecording() {
        // Clear any existing error first
        showAiStatus('', '');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showAiStatus('error', 'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Chromium-basierte Browser.');
            return false;
        }

        // Check microphone permission first
        navigator.permissions.query({ name: 'microphone' }).then(permission => {
            if (permission.state === 'denied') {
                showAiStatus('error', 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff in Ihren Browsereinstellungen.');
                return false;
            }
        }).catch(() => {
            // Permission API might not be supported, continue anyway
        });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'de-DE'; // German language

        recognition.onstart = () => {
            isRecording = true;
            recordingTime = 0;

            updateVoiceRecordingStatus();

            recordingInterval = setInterval(() => {
                recordingTime++;
                document.getElementById('recording-timer').textContent = recordingTime;
            }, 1000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                // Add transcription to compliance rule field
                complianceRuleInput.value = transcript.trim();
                showAiStatus('success', `Prüfvorschrift erkannt: "${transcript.trim()}"`);

                // Auto-trigger search if we have valid search parameters - compliance check will run automatically after search
                if (hasValidSearchParameters()) {
                    setTimeout(() => {
                        // Switch to manual tab and trigger search
                        switchTab('manual');
                        setTimeout(() => {
                            document.getElementById('ogc-form').dispatchEvent(new Event('submit'));
                        }, 100);
                    }, 1000); // Give user time to see the result
                }
            } else {
                showAiStatus('error', 'Keine Sprache erkannt. Bitte sprechen Sie lauter und näher an Ihr Mikrofon.');
            }
        };

        recognition.onend = () => {
            stopVoiceRecording();
        };

        recognition.onerror = (event) => {
            let errorMessage = 'Spracherkennungsfehler: ';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage += 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff.';
                    break;
                case 'no-speech':
                    errorMessage += 'Keine Sprache erkannt. Bitte sprechen Sie klarer.';
                    break;
                case 'aborted':
                    errorMessage += 'Spracherkennung wurde abgebrochen.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Audioaufnahme fehlgeschlagen. Bitte prüfen Sie Ihr Mikrofon.';
                    break;
                case 'network':
                    errorMessage += 'Netzwerkfehler während der Spracherkennung.';
                    break;
                default:
                    errorMessage += event.error || 'Unbekannter Fehler aufgetreten.';
            }
            showAiStatus('error', errorMessage);
            stopVoiceRecording();
        };

        currentSpeechRecognition = recognition;

        try {
            recognition.start();
            return true;
        } catch (error) {
            showAiStatus('error', `Fehler beim Starten der Spracherkennung: ${error.message}`);
            return false;
        }
    }

    // Text-to-speech for compliance questions
    function speakComplianceQuestion() {
        const question = generateComplianceQuestion();
        speakText(question);
    }

    // === Compliance Voice UI functions ===
    function updateComplianceVoiceRecordingStatus() {
        const statusDiv = document.getElementById('compliance-voice-recording-status');
        const timerSpan = document.getElementById('compliance-recording-timer');
        timerSpan.textContent = complianceRecordingTime;
        statusDiv.classList.remove('hidden');
    }

    function hideComplianceVoiceRecordingStatus() {
        const statusDiv = document.getElementById('compliance-voice-recording-status');
        statusDiv.classList.add('hidden');
        complianceRecordingTime = 0;
        isRecording = false;
    }

    function updateComplianceVoiceSpeakingStatus() {
        const statusDiv = document.getElementById('compliance-voice-speaking-status');
        statusDiv.classList.remove('hidden');
    }

    function hideComplianceVoiceSpeakingStatus() {
        const statusDiv = document.getElementById('compliance-voice-speaking-status');
        statusDiv.classList.add('hidden');
    }

    let complianceRecordingTime = 0;
    let complianceRecordingInterval = null;

    function stopComplianceVoiceRecording() {
        if (complianceRecordingInterval) {
            clearInterval(complianceRecordingInterval);
            complianceRecordingInterval = null;
        }
        hideComplianceVoiceRecordingStatus();
        hideComplianceVoiceSpeakingStatus();
    }

    // Updated Compliance Voice Functions
    async function startComplianceRecording() {
        // Clear any existing error first
        showAiStatus('', '');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showAiStatus('error', 'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Chromium-basierte Browser.');
            return false;
        }

        // Check microphone permission first
        navigator.permissions.query({ name: 'microphone' }).then(permission => {
            if (permission.state === 'denied') {
                showAiStatus('error', 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff in Ihren Browsereinstellungen.');
                return false;
            }
        }).catch(() => {
            // Permission API might not be supported, continue anyway
        });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'de-DE'; // German language

        recognition.onstart = () => {
            isRecording = true;
            complianceRecordingTime = 0;

            updateComplianceVoiceRecordingStatus();

            complianceRecordingInterval = setInterval(() => {
                complianceRecordingTime++;
                document.getElementById('compliance-recording-timer').textContent = complianceRecordingTime;
            }, 1000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                // Add transcription to compliance rule field
                complianceRuleInput.value = transcript.trim();
                showAiStatus('success', `Prüfvorschrift erkannt: "${transcript.trim()}"`);
            } else {
                showAiStatus('error', 'Keine Sprache erkannt. Bitte sprechen Sie lauter und näher an Ihr Mikrofon.');
            }
        };

        recognition.onend = () => {
            stopComplianceVoiceRecording();
        };

        recognition.onerror = (event) => {
            let errorMessage = 'Spracherkennungsfehler: ';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage += 'Mikrofonberechtigung verweigert. Bitte erlauben Sie Mikrofonzugriff.';
                    break;
                case 'no-speech':
                    errorMessage += 'Keine Sprache erkannt. Bitte sprechen Sie klarer.';
                    break;
                case 'aborted':
                    errorMessage += 'Spracherkennung wurde abgebrochen.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Audioaufnahme fehlgeschlagen. Bitte prüfen Sie Ihr Mikrofon.';
                    break;
                case 'network':
                    errorMessage += 'Netzwerkfehler während der Spracherkennung.';
                    break;
                default:
                    errorMessage += event.error || 'Unbekannter Fehler aufgetreten.';
            }
            showAiStatus('error', errorMessage);
            stopComplianceVoiceRecording();
        };

        currentSpeechRecognition = recognition;

        try {
            recognition.start();
            return true;
        } catch (error) {
            showAiStatus('error', `Fehler beim Starten der Spracherkennung: ${error.message}`);
            return false;
        }
    }

    // Updated text-to-speech for compliance questions with automatic recording start
    function speakComplianceQuestion() {
        const question = generateComplianceQuestion();

        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(question);
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'de-DE'; // German

            utterance.onstart = () => {
                updateComplianceVoiceSpeakingStatus();
            };

            utterance.onend = () => {
                hideComplianceVoiceSpeakingStatus();
                // Auto-start recording after speech ends
                setTimeout(() => {
                    startComplianceRecording();
                }, 500); // Small delay to prevent audio interference
            };

            utterance.onerror = (event) => {
                hideComplianceVoiceSpeakingStatus();
                showAiStatus('error', 'Fehler bei der Sprachausgabe. Sprachaufzeichnung ist manuell verfügbar.');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            showAiStatus('error', 'Sprachausgabe wird in diesem Browser nicht unterstützt. Sprachaufzeichnung ist manuell verfügbar.');
            // Fallback: start recording immediately
            setTimeout(() => {
                startComplianceRecording();
            }, 500);
        }
    }

    function speakTextWithComplianceStatus(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'de-DE'; // German

            utterance.onstart = () => {
                updateComplianceVoiceSpeakingStatus();
            };

            utterance.onend = () => {
                hideComplianceVoiceSpeakingStatus();
            };

            utterance.onerror = (event) => {
                hideComplianceVoiceSpeakingStatus();
                showAiStatus('error', 'Fehler bei der Sprachausgabe. Sprachaufzeichnung ist manuell verfügbar.');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            showAiStatus('error', 'Sprachausgabe wird in diesem Browser nicht unterstützt. Sprachaufzeichnung ist manuell verfügbar.');
        }
    }

    // === Event Listeners for Compliance Voice Features ===
    speakComplianceBtn.addEventListener('click', speakComplianceQuestion);

    voiceComplianceBtn.addEventListener('click', async () => {
        if (isRecording) {
            stopComplianceVoiceRecording();
        } else {
            try {
                await startComplianceRecording();
            } catch (error) {
                showAiStatus('error', error.message);
            }
        }
    });

    document.getElementById('stop-compliance-voice-btn').addEventListener('click', stopComplianceVoiceRecording);

    // Process AI instruction
    processAiInstructionBtn.addEventListener('click', async () => {
        const apiKey = mistralApiKeyInput.value.trim();
        const instruction = aiInstructionInput.value.trim();

        if (!apiKey) {
            showAiStatus('error', 'Bitte geben Sie einen OpenRouter API-Key ein.');
            return;
        }

        if (!instruction) {
            showAiStatus('error', 'Bitte geben Sie eine Anweisung ein.');
            return;
        }

        // Disable button during processing
        processAiInstructionBtn.disabled = true;
        processAiInstructionBtn.textContent = '⏳ Verarbeitung...';

        showAiStatus('loading', 'KI analysiert Ihre Anweisung...');

        try {
            const availableLayers = getAvailableLayersText();
            const prompt = getParameterExtractionPrompt(instruction, availableLayers);

            const response = await fetch(AI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: AI_CONFIG.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: AI_CONFIG.temperature,
                    max_tokens: AI_CONFIG.maxTokens.parameterExtraction
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API-Fehler: ${response.status} ${response.statusText}${errorData.error?.message ? ' - ' + errorData.error.message : ''}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();

            // Parse JSON response
            let parsedResponse;
            try {
                // Remove potential markdown code blocks
                const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
                parsedResponse = JSON.parse(cleanedResponse);
            } catch (parseError) {
                throw new Error(`Fehler beim Parsen der KI-Antwort: ${parseError.message}\n\nAntwort: ${aiResponse}`);
            }

            // Validate response structure
            if (!parsedResponse.coordinates || !Array.isArray(parsedResponse.coordinates) ||
                parsedResponse.coordinates.length !== 2 ||
                typeof parsedResponse.maxSearchDistance !== 'number' ||
                typeof parsedResponse.layerName !== 'string' ||
                typeof parsedResponse.serverUrl !== 'string') {
                throw new Error('KI-Antwort hat nicht das erwartete Format.');
            }

            // Apply extracted parameters
            await applyAiExtractedParameters(parsedResponse);

            showAiStatus('success', 'Parameter erfolgreich extrahiert und angewendet!');
            showAiResult(parsedResponse);

        } catch (error) {
            console.error('KI-Verarbeitungsfehler:', error);
            showAiStatus('error', `Fehler bei der KI-Verarbeitung: ${error.message}`);
        } finally {
            // Re-enable button
            processAiInstructionBtn.disabled = false;
            processAiInstructionBtn.innerHTML = '<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Orte suchen';
        }
    });

    // Map click handler
    map.on('click', (e) => {
        latInput.value = e.latlng.lat.toFixed(6);
        lonInput.value = e.latlng.lng.toFixed(6);

        if (coordinateMarker) {
            coordinateMarker.setLatLng(e.latlng);
        } else {
            coordinateMarker = L.circleMarker(e.latlng, {
                radius: 8,
                color: '#7c3aed', // purple-600
                fillColor: '#a855f7', // purple-500
                fillOpacity: 0.9,
                title: "Koordinaten-Position (Aktiv)"
            }).addTo(map);
        }
    });

    // Main help modal functionality
                document.getElementById('main-help-btn').addEventListener('click', () => {
        // Create or show main help modal
        let helpModal = document.getElementById('main-help-modal');
        if (!helpModal) {
            helpModal = document.createElement('div');
            helpModal.id = 'main-help-modal';
            helpModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            helpModal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-4 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-xl font-bold">OGC Abstandsmessung - Hilfe & Features</h3>
                                <p class="text-indigo-100 mt-1">Erfahren Sie mehr über die Funktionen und Möglichkeiten</p>
                            </div>
                            <button id="close-main-help-btn" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                            <div class="flex items-center gap-4">
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" id="hide-quickstart-modal" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" onchange="toggleQuickstart()">
                                    <label for="hide-quickstart-modal" class="text-sm font-medium text-indigo-100">
                                        Quickstart verstecken
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[75vh]">
                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- AI Search Assistant Tab -->
                                <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div class="flex items-center mb-3">
                                        <div class="bg-purple-100 p-2 rounded-lg mr-3">
                                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                            </svg>
                                        </div>
                                        <h4 class="font-semibold text-gray-900">Suchassistent</h4>
                                    </div>
                                    <ul class="text-sm text-gray-700 space-y-2">
                                        <li><strong>Natürlichsprachige Anfragen:</strong> "Finde Naturschutzgebiete um Dresden"</li>
                                        <li><strong>Automatische Parametererkennung:</strong> KI erkennt Server, Layer, Koordinaten</li>
                                        <li><strong>Sprachsteuerung:</strong> Voice-Input und Text-to-Speech für hands-free Bedienung</li>
                                        <li><strong>Intelligente Suchvorschläge:</strong> KI-gestützte Empfehlungen und kontextuelle Parametererkennung</li>
                                    </ul>
                                </div>

                                <!-- Manual Search Tab -->
                                <div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                    <div class="flex items-center mb-3">
                                        <div class="bg-indigo-100 p-2 rounded-lg mr-3">
                                            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                            </svg>
                                        </div>
                                        <h4 class="font-semibold text-gray-900">Manuelle Eingabe</h4>
                                    </div>
                                    <ul class="text-sm text-gray-700 space-y-2">
                                        <li><strong>OGC WFS-Dienste:</strong> BKG, BfN, INSPIRE-Server</li>
                                        <li><strong>Layer-Auswahl:</strong> FeatureTypes und geografische Layer</li>
                                        <li><strong>Koordinaten-Eingabe:</strong> Manuell oder per Kartenklick</li>
                                        <li><strong>Suchradius-Konfiguration:</strong> Performance-Optimierung</li>
                                    </ul>
                                </div>

                                <!-- Compliance Checking Tab -->
                                <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div class="flex items-center mb-3">
                                        <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5-3L9 22l-6-6 11-11z"></path>
                                            </svg>
                                        </div>
                                        <h4 class="font-semibold text-gray-900">Prüfvorschrift</h4>
                                    </div>
                                    <ul class="text-sm text-gray-700 space-y-2">
                                        <li><strong>Flexible Regeldefinition:</strong> Individuelle Compliance-Kriterien</li>
                                        <li><strong>KI-Bewertung:</strong> Automatische Analyse der Suchergebnisse</li>
                                        <li><strong>Detaillierte Berichte:</strong> Begründungen und Empfehlungen</li>
                                        <li><strong>Schwellenwert-Management:</strong> ERFÜLLT/NICHT ERFÜLLT/TEILWEISE</li>
                                        <li><strong>Sprachsteuerung:</strong> Stimme Fragen stellen und Antworten aufnehmen</li>
                                    </ul>
                                </div>

                                <!-- Map & Results Visualization -->
                                <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div class="flex items-center mb-3">
                                        <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                            </svg>
                                        </div>
                                    <h4 class="font-semibold text-gray-900">Kartendarstellung</h4>
                                </div>
                                    <ul class="text-sm text-gray-700 space-y-2">
                                        <li><strong>Interaktive Suche:</strong> Klick für Koordinaten-Positionierung</li>
                                        <li><strong>Multi-Layer-Visualisierung:</strong> Gefundene Objekte farbkodiert</li>
                                        <li><strong>Detaillierte Info-Popups:</strong> Namen, Abstände, Geometrietypen</li>
                                        <li><strong>Automatische Zoom-Anpassung:</strong> Optimale Kartenausschnitt</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="help-modal-quickstart bg-gray-50 rounded-lg p-4">
                                <h4 class="font-semibold text-gray-900 mb-2">💡 Erste Schritte</h4>
                                <ol class="text-sm text-gray-700 space-y-1">
                                    <li>1. <strong>Konfigurieren:</strong> Wählen Sie einen WFS-Server und laden Sie verfügbare Layer</li>
                                    <li>2. <strong>Koordinaten setzen:</strong> Eingabe oder Kartenauswahl Ihres Objekts</li>
                                    <li>3. <strong>Prüfvorschrift definieren:</strong> Legen Sie Compliance-Kriterien fest</li>
                                    <li>4. <strong>Messen:</strong> Starten Sie die Abstandsmessung und Compliance-Prüfung</li>
                                    <li>5. <strong>Ergebnisse analysieren:</strong> Betrachten Sie Visualisierung und KI-Bewertung</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(helpModal);

            // Add event listener to close button
            document.getElementById('close-main-help-btn').addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });

            // Close on background click
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.classList.add('hidden');
                }
            });
        }

        helpModal.classList.remove('hidden');
    });

    // Toggle function for Quickstart section
    function toggleQuickstart() {
        const checkbox = document.getElementById('hide-quickstart-modal');
        const quickstartSection = document.querySelector('.help-modal-quickstart');
        const quickstartButton = document.getElementById('quickstart-btn');

        if (checkbox.checked) {
            if (quickstartSection) quickstartSection.style.display = 'none';
            if (quickstartButton) quickstartButton.style.display = 'none';
        } else {
            if (quickstartSection) quickstartSection.style.display = 'block';
            if (quickstartButton) quickstartButton.style.display = 'block';
        }
        // Save preference in localStorage
        localStorage.setItem('hideQuickstart', checkbox.checked);
    }

    // Load quickstart preference on page load
    function loadQuickstartPreference() {
        const hideQuickstart = localStorage.getItem('hideQuickstart') === 'true';
        const checkbox = document.getElementById('hide-quickstart-modal');
        const quickstartSection = document.querySelector('.help-modal-quickstart');
        const quickstartButton = document.getElementById('quickstart-btn');

        if (checkbox) checkbox.checked = hideQuickstart;
        if (quickstartSection) quickstartSection.style.display = hideQuickstart ? 'none' : 'block';   if (quickstartSection) quickstartSection.style.display = hideQuickstart ? 'none' : 'block';
        if (quickstartButton) quickstartButton.style.display = hideQuickstart ? 'none' : 'block';        if (quickstartButton) quickstartButton.style.display = hideQuickstart ? 'none' : 'block';
    }

    // Make toggleQuickstart function globally available
    window.toggleQuickstart = toggleQuickstart;

    // Quickstart button functionality - opens simplified help modal
    document.getElementById('quickstart-btn').addEventListener('click', () => {
        // Create or show quickstart modal
        let quickstartModal = document.getElementById('quickstart-modal');
        if (!quickstartModal) {
            quickstartModal = document.createElement('div');
            quickstartModal.id = 'quickstart-modal';
            quickstartModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
            quickstartModal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold flex items-center">
                                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Schnellstart-Anleitung
                            </h3>
                            <button id="close-quickstart-btn" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[70vh]">
                        <div class="space-y-6">
                            <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                                <h4 class="font-semibold text-blue-900 mb-2">🚀 Schnellstart in 4 Schritten</h4>
                                <ol class="text-sm text-blue-800 space-y-2">
                                    <li class="flex items-start">
                                        <span class="font-bold text-blue-600 mr-2">1.</span>
                                        <span>Verwenden Sie den KI-Suchassistenten für natürlichsprachige Suchanfragen (empfohlen)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="font-bold text-blue-600 mr-2">2.</span>
                                        <span>Oder wechseln Sie zur manuellen Eingabe und konfigurieren Sie Server, Koordinaten und Suchparameter</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="font-bold text-blue-600 mr-2">3.</span>
                                        <span>Definieren Sie gegebenenfalls Compliance-Regeln im Prüfvorschrift-Tab</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="font-bold text-blue-600 mr-2">4.</span>
                                        <span>Starten Sie die Suche - Ergebnisse und Compliance-Bewertungen werden automatisch angezeigt</span>
                                    </li>
                                </ol>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-indigo-50 p-4 rounded-lg">
                                    <h5 class="font-semibold text-indigo-900 mb-2">🎯 Für Einsteiger</h5>
                                    <p class="text-sm text-indigo-800">Nutzen Sie den BKG Verwaltungsgebiete Server für einfache Tests. Dieser enthält Gemeinde- und Kreisgrenzen.</p>
                                </div>
                                <div class="bg-purple-50 p-4 rounded-lg">
                                    <h5 class="font-semibold text-purple-900 mb-2">🤖 KI-Assistent</h5>
                                    <p class="text-sm text-purple-800">Probieren Sie die KI-Assistent Tab für natürlichsprachige Anfragen aus. Sie brauchen keinen API-Key für die ersten Tests.</p>
                                </div>
                            </div>

                            <div class="bg-gray-50 border-l-4 border-gray-400 p-4">
                                <h5 class="font-semibold text-gray-900 mb-2">💡 Tipp</h5>
                                <p class="text-sm text-gray-800">Für eine bessere Performance aktivieren Sie "Max. Features aktivieren" nur bei großen Datensätzen. Der Standardwert von 1000 Features ist für die meisten Anwendungsfälle ausreichend.</p>
                            </div>

                            <div class="flex justify-between items-center pt-4 border-t">
                                <p class="text-sm text-gray-600">Benötigen Sie mehr Hilfe?</p>
                                <button
                                    id="open-full-help-btn"
                                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Vollständige Hilfe öffnen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(quickstartModal);

            // Add event listeners
            document.getElementById('close-quickstart-btn').addEventListener('click', () => {
                quickstartModal.classList.add('hidden');
            });

            document.getElementById('open-full-help-btn').addEventListener('click', () => {
                quickstartModal.classList.add('hidden');
                document.getElementById('main-help-btn').click();
            });

            // Close on background click
            quickstartModal.addEventListener('click', (e) => {
                if (e.target === quickstartModal) {
                    quickstartModal.classList.add('hidden');
                }
            });
        }

        quickstartModal.classList.remove('hidden');
    });

    // Auto-load layers on page load
fetchLayers();

    console.log('Application initialized successfully');

    // === IMPORTED FUNCTIONS from abstandsmessung.html ===

    // Placeholder functions - full implementation would be needed from original
    function getAvailableLayersText() {
        const options = layerSelect.querySelectorAll('option[value]:not([value=""])');
        const layers = Array.from(options).map(option => {
            const technicalName = option.value;
            const description = layerNameMap[technicalName] || technicalName;
            return `- ${description} (${technicalName})`;
        }).join('\n');

        return layers || 'Keine Layer verfügbar. Bitte zunächst Server auswählen und Layer laden.';
    }

    async function applyAiExtractedParameters(params) {
        try {
            // Set coordinates
            lonInput.value = params.coordinates[0];
            latInput.value = params.coordinates[1];

            // Set search distance
            maxSearchDistanceInput.value = params.maxSearchDistance;

            // Set server
            const serverOption = geoserverSelect.querySelector(`option[value="${params.serverUrl}"]`);
            if (serverOption) {
                geoserverSelect.value = params.serverUrl;

                // Load layers for the selected server
                await fetchLayers();

                // Set layer
                const layerOption = layerSelect.querySelector(`option[value="${params.layerName}"]`);
                if (layerOption) {
                    layerSelect.value = params.layerName;
                } else {
                    console.warn(`Layer ${params.layerName} nicht gefunden.`);
                }
            } else {
                console.warn(`Server ${params.serverUrl} nicht gefunden.`);
            }

            // Update map marker
            const lat = params.coordinates[1];
            const lon = params.coordinates[0];

            if (coordinateMarker) {
                coordinateMarker.setLatLng([lat, lon]);
            } else {
                coordinateMarker = L.circleMarker([lat, lon], {
                    radius: 8,
                    color: '#7c3aed', // purple-600
                    fillColor: '#a855f7', // purple-500
                    fillOpacity: 0.9,
                    title: "KI-extrahierte Koordinaten (Aktiv)"
                }).addTo(map);
            }

            map.setView([lat, lon], 13);

            // Always perform search after parameter extraction, then optionally compliance check
            setTimeout(() => {
                measureDistances(params.serverUrl, params.layerName, lat, lon, params.maxSearchDistance);
            }, 100); // Small delay to allow UI to update

        } catch (error) {
            console.error('Fehler beim Anwenden der Parameter:', error);
            throw error;
        }
    }

    function showAiStatus(type, message) {
        let className, icon;
        switch(type) {
            case 'success':
                className = 'text-green-600';
                icon = '✅';
                break;
            case 'error':
                className = 'text-red-600';
                icon = '❌';
                break;
            default:
                className = 'text-blue-600';
                icon = '⏳';
        }
        aiStatus.className = `text-sm ${className}`;
        aiStatus.innerHTML = `${icon} ${message}`;
    }

    function showAiResult(params) {
        const layerDescription = layerNameMap[params.layerName] || params.layerName;

        aiResultContent.innerHTML = `
            <div class="space-y-2">
                <p><strong>Koordinaten:</strong> ${params.coordinates[1]}°N, ${params.coordinates[0]}°E</p>
                <p><strong>Suchdistanz:</strong> ${params.maxSearchDistance}m</p>
                <p><strong>Layer:</strong> ${layerDescription}</p>
                <p><strong>Server:</strong> ${params.serverUrl}</p>
                <p><strong>Begründung:</strong> ${params.reasoning}</p>
            </div>
        `;
        aiResult.classList.remove('hidden');
    }

    function extractFeatureName(properties) {
        if (!properties) {
            console.log('No properties found');
            return "Unbekannt";
        }

        console.log('Available properties:', Object.keys(properties));
        console.log('Properties sample:', properties);

        // Prioritäre Namensfelder (wahrscheinlichste Kandidaten für saubere Namen)
        const primaryNameFields = [
            'SITE_NAME', 'siteName', 'site_name',
            'name', 'Name', 'NAME',
            'OBJNAME', 'objname', 'objName',
            'GEN', 'gen', // Für Verwaltungsgebiete
            'title', 'Title', 'TITLE',
            'bezeichnung', 'Bezeichnung', 'BEZEICHNUNG'
        ];

        // Sekundäre Namensfelder (falls primäre nicht gefunden werden)
        const secondaryNameFields = [
            'DESIGNATION', 'designation',
            'GEBIET_NAME', 'gebiet_name', 'gebietName',
            'SCHUTZGEBIET_NAME', 'schutzgebiet_name', 'schutzgebietName',
            'NATURRAUM_NAME', 'naturraum_name', 'naturraumName',
            'OBJEKT_NAME', 'objekt_name', 'objektName',
            'label', 'Label', 'LABEL'
        ];

        // Hilfsfunktion zur Validierung und Bereinigung von Namen
        function isValidName(value) {
            if (!value || typeof value !== 'string') return false;

            const cleanValue = value.trim();

            // Ausschließen wenn:
            if (cleanValue === '' ||
                cleanValue === 'null' ||
                cleanValue === 'NULL' ||
                cleanValue === 'undefined' ||
                cleanValue.length > 100 || // Zu lang für einen Namen
                cleanValue.includes('http') || // Enthält URLs
                cleanValue.includes('www.') ||
                /^\d+$/.test(cleanValue) || // Nur Zahlen
                /^[\d\s\.\-]+$/.test(cleanValue) || // Nur Zahlen, Punkte und Striche
                cleanValue.includes('2017') || // Enthält Jahreszahlen
                cleanValue.includes('2018') ||
                cleanValue.includes('2019') ||
                cleanValue.includes('2020') ||
                cleanValue.includes('2021') ||
                cleanValue.includes('2022') ||
                cleanValue.includes('2023') ||
                cleanValue.includes('2024') ||
                /\d{4}-\d{2}-\d{2}/.test(cleanValue) || // Enthält Datumsangaben
                cleanValue.includes('.00000000') || // Enthält Koordinaten-ähnliche Zahlen
                cleanValue.split(/\s+/).length > 10) { // Zu viele Wörter
                return false;
            }

            return true;
        }

        // Hilfsfunktion zur Extraktion des ersten sinnvollen Namens aus einem String
        function extractFirstValidName(text) {
            if (!text) return null;

            // Versuche häufige Muster zu erkennen
            const patterns = [
                // Zahlen am Anfang + Name (wie "3Bruchhauser Steine")
                /^(\d+)([A-Za-zÄÖÜäöüß\s\-\.]+?)(?=\d|$)/,
                // Einfach der erste Teil vor Zahlen oder URLs
                /^([A-Za-zÄÖÜäöüß\s\-\.]+?)(?=\d{4}|http|www\.|\d{10})/,
                // Name gefolgt von Zahlen
                /^([A-Za-zÄÖÜäöüß\s\-\.]{3,50})(?=\d+\.)/
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    let name = match.length > 2 ? match[2] : match[1]; // Nimm Gruppe 2 wenn verfügbar (bei erstem Pattern)
                    if (name) {
                        name = name.trim();
                        if (name.length >= 3 && name.length <= 50 &&
                            !/^\d+$/.test(name) &&
                            !name.includes('.00000')) {
                            return name;
                        }
                    }
                }
            }

            // Als Fallback: Nimm die ersten Wörter bis zu einem unerwünschten Element
            const words = text.split(/\s+/);
            let validWords = [];

            for (const word of words) {
                if (/^\d{4}/.test(word) || // Jahr
                    word.includes('http') ||
                    word.includes('.00000') ||
                    word.includes('www.') ||
                    /^\d+\.\d+$/.test(word)) { // Dezimalzahl
                    break;
                }
                validWords.push(word);
                if (validWords.length >= 5) break; // Max 5 Wörter
            }

            if (validWords.length > 0) {
                const result = validWords.join(' ').trim();
                if (result.length >= 3 && result.length <= 50) {
                    return result;
                }
            }

            return null;
        }

        // 1. Suche in primären Namensfeldern
        for (const field of primaryNameFields) {
            if (properties.hasOwnProperty(field)) {
                const value = properties[field];
                if (isValidName(value)) {
                    console.log('Found primary name field:', field, '=', value.trim());
                    return value.trim();
                } else if (typeof value === 'string' && value.length > 0) {
                    // Versuche Namen aus dem Feld zu extrahieren
                    const extractedName = extractFirstValidName(value);
                    if (extractedName) {
                        console.log('Extracted name from primary field:', field, '=', extractedName);
                        return extractedName;
                    }
                }
            }
        }

        // 2. Suche in sekundären Namensfeldern
        for (const field of secondaryNameFields) {
            if (properties.hasOwnProperty(field)) {
                const value = properties[field];
                if (isValidName(value)) {
                    console.log('Found secondary name field:', field, '=', value.trim());
                    return value.trim();
                } else if (typeof value === 'string' && value.length > 0) {
                    const extractedName = extractFirstValidName(value);
                    if (extractedName) {
                        console.log('Extracted name from secondary field:', field, '=', extractedName);
                        return extractedName;
                    }
                }
            }
        }

        // 3. Extract name from INSPIRE geographicalName structures (for INSPIRE servers)
        // Detect INSPIRE based on presence of geographicalName properties
        const hasInspireProperties = Object.keys(properties).some(key => 
            key.includes('geographicalName') || key.includes('gn:text')
        );

        if (hasInspireProperties) {
            for (const [key, value] of Object.entries(properties)) {
                // Check for nested geographicalName properties (prefixed)
                if (key.endsWith('_geographicalName') && typeof value === 'string') {
                    const nameMatch = value.match(/<gn:text>([^<]+)<\/gn:text>/);
                    if (nameMatch && isValidName(nameMatch[1])) {
                        console.log('Extracted INSPIRE geographical name from nested property:', nameMatch[1].trim());
                        return nameMatch[1].trim();
                    }
                }

                // Fallback to direct geographicalName property
                if (key === 'geographicalName' && typeof value === 'string') {
                    const nameMatch = value.match(/<gn:text>([^<]+)<\/gn:text>/);
                    if (nameMatch && isValidName(nameMatch[1])) {
                        console.log('Extracted INSPIRE geographical name:', nameMatch[1].trim());
                        return nameMatch[1].trim();
                    }
                }
            }
        }

        // 4. Fallback: Suche nach beliebigen Feldern mit "name" im Namen
        for (const [key, value] of Object.entries(properties)) {
            if (key.toLowerCase().includes('name') || key.toLowerCase().includes('bezeichnung')) {
                if (isValidName(value)) {
                    console.log('Found name-like field:', key, '=', value.trim());
                    return value.trim();
                } else if (typeof value === 'string' && value.length > 0) {
                    const extractedName = extractFirstValidName(value);
                    if (extractedName) {
                        console.log('Extracted name from name-like field:', key, '=', extractedName);
                        return extractedName;
                    }
                }
            }
        }

        // 5. Letzter Versuch: Verwende das erste sinnvolle String-Feld
        for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'string' && value.length > 0 &&
                !key.toLowerCase().includes('id') &&
                !key.toLowerCase().includes('code') &&
                !key.toLowerCase().includes('geom') &&
                !key.toLowerCase().includes('coord') &&
                !key.toLowerCase().includes('url') &&
                !key.toLowerCase().includes('link')) {

                if (isValidName(value)) {
                    console.log('Using fallback field:', key, '=', value.trim());
                    return value.trim();
                } else {
                    const extractedName = extractFirstValidName(value);
                    if (extractedName) {
                        console.log('Extracted name from fallback field:', key, '=', extractedName);
                        return extractedName;
                    }
                }
            }
        }

        console.log('No usable name field found, all properties:', properties);
        return "Unbekannt";
    }

    // --- GML Parsing Functions ---

    function parseGMLFeatures(xmlDoc, baseUrl) {
        const features = [];
        const memberNodes = xmlDoc.querySelectorAll("wfs\\:member, member, gml\\:featureMember, featureMember");

        memberNodes.forEach(member => {
            // Find geometry elements - support both direct geometry and INSPIRE net:geometry containers
            let geometryNodes = member.querySelectorAll("gml\\:Polygon, Polygon, gml\\:MultiPolygon, MultiPolygon, gml\\:LineString, LineString, gml\\:MultiLineString, MultiLineString, gml\\:MultiSurface, MultiSurface, gml\\:Point, Point, gml\\:MultiPoint, MultiPoint");

            // For INSPIRE/SGX: If no direct geometry, look inside net:geometry and hy-p:geometry containers
            if (geometryNodes.length === 0 && !isBfNServer(baseUrl)) {
                const netGeometryContainers = member.querySelectorAll("net\\:geometry, geometry, hy-p\\:geometry");
                let allGeometryNodes = [];

                netGeometryContainers.forEach(container => {
                    const geomNodes = container.querySelectorAll("gml\\:Polygon, Polygon, gml\\:MultiPolygon, MultiPolygon, gml\\:LineString, LineString, gml\\:MultiLineString, MultiLineString, gml\\:MultiSurface, MultiSurface, gml\\:Point, Point, gml\\:MultiPoint, MultiPoint");
                    Array.from(geomNodes).forEach(node => allGeometryNodes.push(node));
                });

                // Create a NodeList-like object from the array
                geometryNodes = {
                    length: allGeometryNodes.length,
                    [Symbol.iterator]: function* () {
                        for (let node of allGeometryNodes) {
                            yield node;
                        }
                    },
                    forEach: function(callback) {
                        allGeometryNodes.forEach(callback);
                    }
                };
            }

            geometryNodes.forEach(geomNode => {
                const geometry = parseGMLGeometry(geomNode, baseUrl);
                if (geometry) {
                    // Extract properties from the member node
                    const properties = parseGMLProperties(member, baseUrl);
                    features.push({
                        type: "Feature",
                        geometry: geometry,
                        properties: properties || {}
                    });
                }
            });
        });

        return { type: "FeatureCollection", features: features };
    }

    function parseGMLGeometry(geomNode, baseUrl) {
        const nodeName = geomNode.nodeName.toLowerCase();

        if (nodeName.includes('polygon')) {
            if (nodeName.includes('multipolygon')) {
                return parseGMLMultiPolygon(geomNode, baseUrl);
            } else {
                return parseGMLPolygon(geomNode, baseUrl);
            }
        } else if (nodeName.includes('linestring')) {
            if (nodeName.includes('multilinestring')) {
                return parseGMLMultiLineString(geomNode, baseUrl);
            } else {
                return parseGMLLineString(geomNode, baseUrl);
            }
        } else if (nodeName.includes('point')) {
            if (nodeName.includes('multipoint')) {
                return parseGMLMultiPoint(geomNode, baseUrl);
            } else {
                return parseGMLPoint(geomNode, baseUrl);
            }
        } else if (nodeName.includes('multisurface')) {
            return parseGMLMultiSurface(geomNode, baseUrl);
        }

        return null;
    }

    function parseGMLPolygon(polygonNode, baseUrl) {
        const coordinates = [];
        const exteriorNode = polygonNode.querySelector("gml\\:exterior, exterior");

        if (exteriorNode) {
            const ringCoords = parseGMLLinearRing(exteriorNode, baseUrl);
            if (ringCoords) {
                coordinates.push(ringCoords);
            }
        }

        // Handle interior rings (holes)
        const interiorNodes = polygonNode.querySelectorAll("gml\\:interior, interior");
        interiorNodes.forEach(interiorNode => {
            const ringCoords = parseGMLLinearRing(interiorNode, baseUrl);
            if (ringCoords) {
                coordinates.push(ringCoords);
            }
        });

        return coordinates.length > 0 ? { type: "Polygon", coordinates: coordinates } : null;
    }

    function parseGMLMultiPolygon(multiPolygonNode, baseUrl) {
        const coordinates = [];
        const polygonNodes = multiPolygonNode.querySelectorAll("gml\\:Polygon, Polygon");

        polygonNodes.forEach(polygonNode => {
            const polygon = parseGMLPolygon(polygonNode, baseUrl);
            if (polygon) {
                coordinates.push(polygon.coordinates);
            }
        });

        return coordinates.length > 0 ? { type: "MultiPolygon", coordinates: coordinates } : null;
    }

    function parseGMLLineString(lineStringNode, baseUrl) {
        const coordinates = parseGMLCoordinates(lineStringNode, baseUrl);
        return coordinates && coordinates.length > 1 ? { type: "LineString", coordinates: coordinates } : null;
    }

    function parseGMLMultiLineString(multiLineStringNode, baseUrl) {
        const coordinates = [];
        const lineStringNodes = multiLineStringNode.querySelectorAll("gml\\:LineString, LineString");

        lineStringNodes.forEach(lineStringNode => {
            const lineCoords = parseGMLCoordinates(lineStringNode, baseUrl);
            if (lineCoords && lineCoords.length > 1) {
                coordinates.push(lineCoords);
            }
        });

        return coordinates.length > 0 ? { type: "MultiLineString", coordinates: coordinates } : null;
    }

    function parseGMLMultiSurface(multiSurfaceNode, baseUrl) {
        const coordinates = [];
        // MultiSurface contains surfaceMembers, which contain Polygons
        const surfaceMemberNodes = multiSurfaceNode.querySelectorAll("gml\\:surfaceMember, surfaceMember");

        surfaceMemberNodes.forEach(surfaceMember => {
            const polygonNode = surfaceMember.querySelector("gml\\:Polygon, Polygon");
            if (polygonNode) {
                const polygon = parseGMLPolygon(polygonNode, baseUrl);
                if (polygon) {
                    coordinates.push(polygon.coordinates);
                }
            }
        });

        return coordinates.length > 0 ? { type: "MultiPolygon", coordinates: coordinates } : null;
    }

    function parseGMLLinearRing(ringContainerNode, baseUrl) {
        const linearRingNode = ringContainerNode.querySelector("gml\\:LinearRing, LinearRing");
        return linearRingNode ? parseGMLCoordinates(linearRingNode, baseUrl) : null;
    }

    function parseGMLPoint(pointNode, baseUrl) {
        const posNode = pointNode.querySelector("gml\\:pos, pos");
        if (posNode) {
            const coordText = posNode.textContent.trim();
            const values = coordText.split(/\s+/).map(v => parseFloat(v));
            if (values.length >= 2) {
                let lon, lat;
                if (isBfNServer(baseUrl)) {
                    lat = values[0];  // BfN: [lat, lon] -> swap
                    lon = values[1];
                } else {
                    lon = values[0];  // INSPIRE: [lon, lat] -> no swap
                    lat = values[1];
                }
                return { type: "Point", coordinates: [lon, lat] };
            }
        } else {
            // Fallback to coordinates parsing
            const coords = parseGMLCoordinates(pointNode, baseUrl);
            if (coords && coords.length > 0) {
                return { type: "Point", coordinates: coords[0] };
            }
        }
        return null;
    }

    function parseGMLMultiPoint(multiPointNode, baseUrl) {
        const coordinates = [];
        const pointMembers = multiPointNode.querySelectorAll("gml\\:Point, Point");
        pointMembers.forEach(pointNode => {
            const pointGeom = parseGMLPoint(pointNode, baseUrl);
            if (pointGeom) {
                coordinates.push(pointGeom.coordinates);
            }
        });
        return coordinates.length > 0 ? { type: "MultiPoint", coordinates: coordinates } : null;
    }

    function parseGMLProperties(memberNode, baseUrl) {
        const properties = {};

        if (isBfNServer(baseUrl)) {
            // Einfache/flache Extraktion für BfN (wie in main.js)
            const allChildren = memberNode.children;
            for (let i = 0; i < allChildren.length; i++) {
                const child = allChildren[i];
                const childName = child.nodeName;

                // Skip geometry elements and some system elements
                if (childName.includes('gml:') && (
                    childName.includes('Polygon') ||
                    childName.includes('MultiPolygon') ||
                    childName.includes('LineString') ||
                    childName.includes('MultiLineString') ||
                    childName.includes('Point') ||
                    childName.includes('MultiPoint') ||
                    childName.includes('MultiSurface')
                )) {
                    continue;
                }

                // Skip certain system properties, but KEEP gml:name!
                if (childName.includes('gml:id') ||
                    childName.includes('fid') ||
                    childName.includes('boundedBy')) {
                    continue;
                }

                // Extract text content or child elements
                let value;
                if (child.children.length > 0 && child.children[0].tagName) {
                    value = child.textContent.trim();
                } else {
                    value = child.textContent.trim();
                }

                // Clean up property names (remove namespaces)
                let cleanName = childName;
                if (cleanName.includes(':')) {
                    const parts = cleanName.split(':');
                    cleanName = parts[parts.length - 1];
                }

                if (value && cleanName) {
                    properties[cleanName] = value;
                }
            }
        } else {
            // Rekursive INSPIRE-Extraktion (bestehender Code)
            function extractFromElement(element, prefix = "") {
                const childNodes = element.children;

                for (let i = 0; i < childNodes.length; i++) {
                    const child = childNodes[i];
                    const childName = child.nodeName;

                    // Skip geometry elements completely - they are handled separately
                    if (childName.includes('gml:') &&
                       (childName.includes('Polygon') || childName.includes('MultiPolygon') ||
                        childName.includes('LineString') || childName.includes('MultiLineString') ||
                        childName.includes('Point') || childName.includes('MultiPoint') ||
                        childName.includes('MultiSurface'))) {
                        continue;
                    }

                    // Skip net:geometry containers - they are handled separately
                    if (childName.includes('geometry')) {
                        continue;
                    }

                    // Skip certain system properties, but KEEP gml:name!
                    if (childName.includes('gml:id') ||
                        childName.includes('fid') ||
                        childName.includes('boundedBy')) {
                        continue;
                    }

                    // Build the property name
                    let cleanName = childName;
                    if (cleanName.includes(':')) {
                        const parts = cleanName.split(':');
                        cleanName = parts[parts.length - 1];
                    }

                    const propName = prefix ? `${prefix}_${cleanName}` : cleanName;

                    // For complex INSPIRE structures like geographicalName, keep the full XML
                    if (child.children.length > 0) {
                        // First recurse into child elements
                        extractFromElement(child, propName);

                        // Then serialize the full element including nested structure
                        const serializer = new XMLSerializer();
                        properties[propName] = serializer.serializeToString(child);
                    } else {
                        // Simple text content
                        const value = child.textContent.trim();
                        if (value && propName) {
                            properties[propName] = value;
                        }
                    }
                }
            }

            // Start extraction from the member node (skip the root wfs:member)
            if (memberNode.children.length > 0) {
                extractFromElement(memberNode);
            }
        }

        return properties;
    }

    function parseGMLCoordinates(containerNode, baseUrl) {
        // Try poslist first (more common in modern GML)
        const posListNode = containerNode.querySelector("gml\\:posList, posList");
        if (posListNode) {
            const coordText = posListNode.textContent.trim();
            const values = coordText.split(/\s+/).map(v => parseFloat(v));
            const coordinates = [];

            // Server-specific coordinate handling
            for (let i = 0; i < values.length; i += 2) {
                if (i + 1 < values.length) {
                    let lon, lat;
                    if (isBfNServer(baseUrl)) {
                        lat = values[i];    // BfN: [lat, lon] -> swap to [lon, lat]
                        lon = values[i + 1];
                    } else {
                        lon = values[i];    // INSPIRE: [lon, lat] -> keep as is
                        lat = values[i + 1];
                    }
                    coordinates.push([lon, lat]);
                }
            }
            return coordinates;
        }

        // Try coordinates element (older GML)
        const coordinatesNode = containerNode.querySelector("gml\\:coordinates, coordinates");
        if (coordinatesNode) {
            const coordText = coordinatesNode.textContent.trim();
            const tupleSeperator = coordinatesNode.getAttribute('ts') || ' ';
            const decimalSeperator = coordinatesNode.getAttribute('cs') || ',';

            const tuples = coordText.split(tupleSeperator);
            return tuples.map(tuple => {
                const coords = tuple.split(decimalSeperator).map(v => parseFloat(v));
                if (coords.length >= 2) {
                    let lon, lat;
                    if (isBfNServer(baseUrl)) {
                        lat = coords[0];  // BfN: [lat, lon] -> swap to [lon, lat]
                        lon = coords[1];
                    } else {
                        lon = coords[0];  // INSPIRE: [lon, lat] -> keep as is (rare case)
                        lat = coords[1];
                    }
                    return [lon, lat];
                }
                return null;
            }).filter(coord => coord !== null);
        }

        return null;
    }

    function clearMapAndResults() {
        if (coordinateMarker) map.removeLayer(coordinateMarker);
        if (featuresLayer) map.removeLayer(featuresLayer);
        if (resultLines) map.removeLayer(resultLines);
        if (nearestPointMarkers) map.removeLayer(nearestPointMarkers);

        coordinateMarker = null;
        featuresLayer = null;
        resultLines = null;
        nearestPointMarkers = null;

        resultContainer.innerHTML = '';
        resultContainer.classList.add('hidden');
        xmlOutputContainer.classList.add('hidden');
        xmlOutput.value = '';
        complianceResult.classList.add('hidden');

        // Reset last measurement results
        lastMeasurementResults = null;
    }

    function showResult(type, message) {
        let bgColor, textColor, borderColor, icon;
        switch(type) {
            case 'success':
                bgColor = 'bg-green-100'; textColor = 'text-green-800'; borderColor = 'border-green-300';
                icon = `<svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
                break;
            case 'error':
                bgColor = 'bg-red-100'; textColor = 'text-red-800'; borderColor = 'border-red-300';
                icon = `<svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
                break;
            default: // loading
                bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; borderColor = 'border-blue-300';
                icon = `<svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        }
        resultContainer.className = `mt-6 p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor}`;
        resultContainer.innerHTML = `${icon} ${message}`;
        resultContainer.classList.remove('hidden');
    }

    function showRawOutput(responseText) {
        if (responseText && window.debugMode) {  // Show only in debug mode
            xmlOutput.value = responseText;
            xmlOutputContainer.classList.remove('hidden');
        }
    }

    function displayMultipleResults(featuresWithDistances, maxSearchDistanceM, serverType, totalFeatures) {
        const containingCount = featuresWithDistances.filter(f => f.isContaining).length;
        const nearbyCount = featuresWithDistances.filter(f => !f.isContaining).length;

        const maxFeaturesIndicator = (maxFeaturesEnabled.checked && isMaxFeaturesSupported(geoserverSelect.value)) ?
            `, Max. Features: ${maxFeatures.value}` : '';

        let resultHtml = `
            <div class="mb-4">
                <h4 class="font-bold text-lg mb-2">Ergebnisse (${featuresWithDistances.length} Features gefunden)</h4>
                <div class="text-sm text-gray-600 mb-3">
                    <strong>Max. Suchdistanz:</strong> ${maxSearchDistanceM}m<br>
                    <strong>Enthaltende Gebiete:</strong> ${containingCount}<br>
                    <strong>Nahe Gebiete:</strong> ${nearbyCount}<br>
                    <small>Datenformat: ${serverType.toUpperCase()}, ${totalFeatures} Features vom Server${maxFeaturesIndicator}</small>
                </div>
            </div>
        `;

        // Group by containing/nearby
        if (containingCount > 0) {
            resultHtml += `
                <div class="mb-4">
                    <h5 class="font-semibold text-green-700 mb-2">🟢 Enthaltende Gebiete (Abstand: 0m)</h5>
                    <div class="space-y-1">
            `;

            featuresWithDistances.filter(f => f.isContaining).forEach(item => {
                resultHtml += `
                    <div class="text-sm bg-green-50 p-2 rounded border-l-4 border-green-400">
                        <strong>${item.name}</strong><br>
                        <span class="text-gray-600">Typ: ${item.geometryType}, Abstand: 0m</span>
                    </div>
                `;
            });

            resultHtml += `
                    </div>
                </div>
            `;
        }

        if (nearbyCount > 0) {
            resultHtml += `
                <div class="mb-4">
                    <h5 class="font-semibold text-blue-700 mb-2">🔵 Nahe Gebiete</h5>
                    <div class="space-y-1">
            `;

            featuresWithDistances.filter(f => !f.isContaining).forEach(item => {
                resultHtml += `
                    <div class="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                        <strong>${item.name}</strong><br>
                        <span class="text-gray-600">Typ: ${item.geometryType}, Abstand: ${item.distance.toFixed(2)}m</span>
                    </div>
                `;
            });

            resultHtml += `
                    </div>
                </div>
            `;
        }

        showResult('success', resultHtml);
    }

    function updateMapVisualization(featuresWithDistances, coordinatePoint, lat, lon, showDistanceMarkers = false) {
        // Clear previous layers
        if (featuresLayer) map.removeLayer(featuresLayer);
        if (resultLines) map.removeLayer(resultLines);
        if (nearestPointMarkers) map.removeLayer(nearestPointMarkers);

        // Create layer groups
        featuresLayer = L.layerGroup().addTo(map);
        resultLines = L.layerGroup().addTo(map);
        nearestPointMarkers = L.layerGroup().addTo(map);

        // Different styles for containing vs nearby features
        const containingStyle = { color: "#22c55e", weight: 4, opacity: 0.8, fillOpacity: 0.3 };
        const nearbyStyle = { color: "#3b82f6", weight: 3, opacity: 0.8, fillOpacity: 0.2 };

        let bounds = L.latLngBounds([[lat, lon]]);

        featuresWithDistances.forEach(item => {
            const style = item.isContaining ? containingStyle : nearbyStyle;

            // Add feature to map
            const featureLayer = L.geoJSON(item.feature, {
                style: style,
                onEachFeature: (feature, layer) => {
                    const popupContent = `
                        <strong>${item.name}</strong><br>
                        <strong>Abstand:</strong> ${item.distance.toFixed(2)}m<br>
                        <strong>Typ:</strong> ${item.geometryType}<br>
                        <strong>Status:</strong> ${item.isContaining ? 'Enthaltend' : 'Nahe'}
                    `;
                    layer.bindPopup(popupContent);
                }
            });

            featuresLayer.addLayer(featureLayer);

            // Add to bounds
            if (featureLayer.getBounds) {
                bounds.extend(featureLayer.getBounds());
            }

            // Only add distance markers in final visualization or if explicitly requested
            if (showDistanceMarkers && !item.isContaining) {
                const nearestPoint = DistanceCalculator.getNearestPointOnFeature(coordinatePoint, item.feature);
                if (nearestPoint && nearestPoint.geometry && nearestPoint.geometry.coordinates) {
                    const nearestCoords = nearestPoint.geometry.coordinates;
                    const latNear = parseFloat(nearestCoords[1]);
                    const lonNear = parseFloat(nearestCoords[0]);

                    if (!isNaN(latNear) && !isNaN(lonNear)) {
                        // Add nearest point marker
                        const marker = L.circleMarker([latNear, lonNear], {
                            radius: 4,
                            color: '#ef4444',
                            fillColor: '#f87171',
                            fillOpacity: 0.8,
                            title: `Nächster Punkt zu ${item.name}`
                        });
                        nearestPointMarkers.addLayer(marker);

                        // Add distance line
                        const line = L.polyline([[lat, lon], [latNear, lonNear]], {
                            color: '#ef4444',
                            dashArray: '5, 10',
                            weight: 2,
                            opacity: 0.7
                        });
                        resultLines.addLayer(line);
                    }
                }
            }
        });

        // Fit map to show all features
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        }
    }

    function visualizeMultipleFeatures(featuresWithDistances, coordinatePoint, lat, lon) {
        // Final visualization - same as update but with final styling
        updateMapVisualization(featuresWithDistances, coordinatePoint, lat, lon);
    }

    // --- Compliance Check Function ---
    async function performComplianceCheck(measurementResults) {
        const apiKey = mistralApiKeyInput.value.trim();
        const complianceRule = complianceRuleInput.value.trim();

        if (!apiKey) {
            showComplianceResult('error', 'OpenRouter API-Key erforderlich für Compliance-Bewertung.');
            return;
        }

        if (!complianceRule) {
            showComplianceResult('error', 'Keine Prüfvorschrift definiert.');
            return;
        }

        showComplianceResult('loading', 'KI analysiert Compliance...');

        try {
            // Prepare measurement data for AI analysis
            const summaryData = {
                coordinates: [lonInput.value, latInput.value],
                maxSearchDistance: maxSearchDistanceInput.value,
                layerType: layerNameMap[layerSelect.value] || layerSelect.value,
                totalFeaturesFound: measurementResults.length,
                containingFeatures: measurementResults.filter(f => f.isContaining).length,
                nearbyFeatures: measurementResults.filter(f => !f.isContaining).length,
                closestDistance: measurementResults.length > 0 ? Math.min(...measurementResults.map(f => f.distance)) : null,
                featuresDetails: measurementResults.slice(0, 10).map(f => ({
                    name: f.name,
                    distance: f.distance,
                    isContaining: f.isContaining,
                    geometryType: f.geometryType
                }))
            };

            const prompt = getComplianceCheckPrompt(complianceRule, summaryData);

            const response = await fetch(AI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: AI_CONFIG.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: AI_CONFIG.temperature,
                    max_tokens: AI_CONFIG.maxTokens.complianceCheck
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API-Fehler: ${response.status} ${response.statusText}${errorData.error?.message ? ' - ' + errorData.error.message : ''}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();

            // Parse JSON response
            let complianceAssessment;
            try {
                let cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();

                // Fix common JSON formatting issues from AI responses
                // Replace unescaped newlines and control characters in string values
                cleanedResponse = cleanedResponse.replace(
                    /"(reasoning|recommendations|key_findings)":\s*"([^"]*(?:\\.[^"]*)*)"/g,
                    function(match, fieldName, content) {
                        // Escape newlines, carriage returns, tabs, and other control characters
                        const escapedContent = content
                            .replace(/\\/g, '\\\\')  // Escape backslashes first
                            .replace(/"/g, '\\"')    // Escape quotes
                            .replace(/\n/g, '\\n')   // Escape newlines
                            .replace(/\r/g, '\\r')   // Escape carriage returns
                            .replace(/\t/g, '\\t')   // Escape tabs
                            .replace(/[\x00-\x1F]/g, ''); // Remove other control characters
                        return `"${fieldName}": "${escapedContent}"`;
                    }
                );

                complianceAssessment = JSON.parse(cleanedResponse);
            } catch (parseError) {
                throw new Error(`Fehler beim Parsen der KI-Compliance-Antwort: ${parseError.message}\n\nAntwort: ${aiResponse}`);
            }

            // Validate response structure
            if (typeof complianceAssessment.compliant !== 'boolean' ||
                !['ERFÜLLT', 'VERLETZT', 'TEILWEISE_ERFÜLLT'].includes(complianceAssessment.status) ||
                typeof complianceAssessment.confidence !== 'number' ||
                typeof complianceAssessment.reasoning !== 'string') {
                throw new Error('KI-Compliance-Antwort hat nicht das erwartete Format.');
            }

            displayComplianceResult(complianceAssessment);

        } catch (error) {
            console.error('Compliance-Prüfungsfehler:', error);
            showComplianceResult('error', `Fehler bei der Compliance-Prüfung: ${error.message}`);
        }
    }

    // --- Helper functions for compliance ---
    function displayComplianceResult(assessment) {
        let statusColor, statusIcon, bgColor, borderColor;

        switch(assessment.status) {
            case 'ERFÜLLT':
                statusColor = 'text-green-700';
                statusIcon = '✅';
                bgColor = 'bg-green-50';
                borderColor = 'border-green-300';
                break;
            case 'VERLETZT':
                statusColor = 'text-red-700';
                statusIcon = '❌';
                bgColor = 'bg-red-50';
                borderColor = 'border-red-300';
                break;
            case 'TEILWEISE_ERFÜLLT':
                statusColor = 'text-yellow-700';
                statusIcon = '⚠️';
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-300';
                break;
        }

        const confidencePercent = Math.round(assessment.confidence * 100);

        // Konvertiere Markdown zu HTML
        const reasoningHtml = markdownToHtml(assessment.reasoning || '');
        const recommendationsHtml = assessment.recommendations ? markdownToHtml(assessment.recommendations) : '';
        const keyFindingsHtml = assessment.key_findings && assessment.key_findings.length > 0
            ? `<div class="space-y-2">${assessment.key_findings.map(finding => `<div class="flex items-start">
                    <span class="text-blue-500 mr-2">•</span>
                    <span>${markdownToHtml(finding)}</span>
                </div>`).join('')}</div>`
            : '';

        complianceResultContent.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="text-2xl mr-2">${statusIcon}</span>
                        <span class="font-bold ${statusColor} text-lg">${assessment.status}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        Sicherheit: ${confidencePercent}%
                    </div>
                </div>

                <div class="border-t pt-3">
                    <h5 class="font-semibold text-gray-900 mb-2">Begründung:</h5>
                    <div class="text-sm text-gray-700">
                        ${reasoningHtml ? `<p>${reasoningHtml}</p>` : assessment.reasoning}
                    </div>
                </div>

                ${assessment.recommendations ? `
                <div class="border-t pt-3">
                    <h5 class="font-semibold text-gray-900 mb-2">Empfehlungen:</h5>
                    <div class="text-sm text-gray-700">
                        ${recommendationsHtml ? `<p>${recommendationsHtml}</p>` : assessment.recommendations}
                    </div>
                </div>
                ` : ''}

                ${assessment.key_findings && assessment.key_findings.length > 0 ? `
                <div class="border-t pt-3">
                    <h5 class="font-semibold text-gray-900 mb-2">Wichtige Erkenntnisse:</h5>
                    ${keyFindingsHtml}
                </div>
                ` : ''}
            </div>
        `;

        complianceResult.className = `mt-4 p-4 rounded-lg border ${bgColor} ${borderColor}`;
        complianceResult.classList.remove('hidden');
    }

    function showComplianceResult(type, message) {
        let className;
        switch(type) {
            case 'success':
                className = 'mt-4 p-4 rounded-lg border bg-green-50 border-green-300';
                break;
            case 'error':
                className = 'mt-4 p-4 rounded-lg border bg-red-50 border-red-300';
                break;
            default:
                className = 'mt-4 p-4 rounded-lg border bg-blue-50 border-blue-300';
        }

        complianceResult.className = className;
        complianceResultContent.innerHTML = `<p class="text-sm">${message}</p>`;
        complianceResult.classList.remove('hidden');
    }

    function markdownToHtml(text) {
        if (!text) return '';

        return text
            // Headers (## Text -> <h3>Text</h3>)
            .replace(/^### (.*$)/gm, '<h3 class="font-semibold text-gray-900 mt-3 mb-2 text-base">$1</h3>')
            .replace(/^## (.*$)/gm, '<h3 class="font-semibold text-gray-900 mt-3 mb-2">$1</h3>')
            .replace(/^# (.*$)/gm, '<h2 class="font-semibold text-gray-900 mt-4 mb-2">$1</h2>')
            // Bold text (**text** -> <strong>text</strong>)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Line breaks and paragraphs
            .replace(/\n\n+/g, '</p><p class="mb-2">')
            .replace(/\n/g, '<br>')
            // Lists (basic bullet points - this is simplified)
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)+/gs, '<ul class="list-disc list-inside space-y-1">$&</ul>');
    }

    // --- Helper function for intermediate batch results ---
    function getIntermediateResults(currentResults, maxSearchDistanceM, serverType, totalFeatures, batchNumber, totalBatches, currentBatchSize) {
        const containingCount = currentResults.filter(f => f.isContaining).length;
        const nearbyCount = currentResults.filter(f => !f.isContaining).length;

        let progressText = '';
        if (totalBatches !== null) {
            // Client-side batching - we know total batches
            const processedFeatures = batchNumber * 1000;
            const progressPercent = Math.round((processedFeatures / totalFeatures) * 100);
            progressText = `<strong>Verarbeitete Features:</strong> ${processedFeatures}/${totalFeatures} (${progressPercent}%)<br>`;
        } else {
            // Server-side batching - we don't know total batches yet
            const processedFeatures = batchNumber * 1000;
            const currentBatchEnd = processedFeatures + (currentBatchSize || 0);
            progressText = `<strong>Verarbeitete Features:</strong> ${processedFeatures}+ (Batch ${batchNumber})<br>`;
        }

        let batchText = '';
        if (totalBatches !== null) {
            batchText = `Batch ${batchNumber}/${totalBatches}`;
        } else {
            batchText = `Server-Batch ${batchNumber}`;
        }

        let resultHtml = `
            <div class="mb-4">
                <h4 class="font-bold text-lg mb-2">Zwischenstand - ${batchText}</h4>
                <div class="text-sm text-gray-600 mb-3">
                    ${progressText}
                    <strong>Max. Suchdistanz:</strong> ${maxSearchDistanceM}m<br>
                    <strong>Bisher gefundene Features:</strong> ${currentResults.length}<br>
                    <strong>Enthaltende Gebiete:</strong> ${containingCount}<br>
                    <strong>Nahe Gebiete:</strong> ${nearbyCount}<br>
                    <small>Datenformat: ${serverType.toUpperCase()}</small>
                </div>
            </div>
        `;

        // Show top results so far
        if (currentResults.length > 0) {
            // Sort by distance for display (containing first, then by distance)
            const sortedResults = [...currentResults].sort((a, b) => {
                if (a.isContaining && !b.isContaining) return -1;
                if (!a.isContaining && b.isContaining) return 1;
                return a.distance - b.distance;
            });

            // Show top 5 results
            const topResults = sortedResults.slice(0, 5);

            resultHtml += `
                <div class="mb-4">
                    <h5 class="font-semibold text-blue-700 mb-2">🔍 Aktuelle Top-Ergebnisse (bisher):</h5>
                    <div class="space-y-1">
            `;

            topResults.forEach((item, index) => {
                const statusIcon = item.isContaining ? '🟢' : '🔵';
                const statusText = item.isContaining ? 'Enthaltend' : 'Nahe';
                resultHtml += `
                    <div class="text-sm bg-gray-50 p-2 rounded border-l-4 ${item.isContaining ? 'border-green-400' : 'border-blue-400'}">
                        <strong>${index + 1}. ${item.name}</strong><br>
                        <span class="text-gray-600">Typ: ${item.geometryType}, Abstand: ${item.distance.toFixed(2)}m, Status: ${statusText}</span>
                    </div>
                `;
            });

            resultHtml += `
                    </div>
                </div>
            `;
        }

        let statusMessage = '';
        if (totalBatches !== null) {
            statusMessage = '⏳ Verarbeitung läuft... Bitte warten Sie auf den Abschluss aller Batches.';
        } else {
            statusMessage = '⏳ Server-basierte Verarbeitung läuft... Lade nächste Features vom Server.';
        }

        resultHtml += `
            <div class="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                ${statusMessage}
            </div>
        `;

        return resultHtml;
    }

});
