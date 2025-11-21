/**
 * AI Prompts for the Geospatial Analysis Application
 * This file contains all AI prompts used in the application for better maintainability
 */

/**
 * Prompt for extracting parameters from natural language instructions
 * @param {string} instruction - The user's natural language instruction
 * @param {string} availableLayers - Text describing available layers
 * @returns {string} The formatted prompt
 */
export function getParameterExtractionPrompt(instruction, availableLayers) {
    return `Sie sind ein Experte für GIS und OGC-Webdienste. Analysieren Sie die folgende Benutzeranweisung und extrahieren Sie die benötigten Parameter für eine WFS-Abfrage.

VERFÜGBARE WFS-DIENSTE UND LAYER-DETAILS:

🔶 VERWALTUNGSGEBIETE (BKG) - https://sgx.geodatenzentrum.de/wfs_vg250
- Layer: "vg250:vg250_gem" - Gemeinden (Verwaltungsgrenzen der Gemeinden)
- Layer: "vg250:vg250_krs" - Kreise (Verwaltungsgrenzen der Kreise/Landkreise)
- Layer: "vg250:vg250_lan" - Bundesländer
- Verwendung für: Stadt-/Gemeindegrenzen, Kreisgrenzen, Rechtsgültige Verwaltungsgebiete

🟡 SCHUTZGEBIETE (BfN) - https://geodienste.bfn.de/ogc/wfs/schutzgebiet
- Layer: "bfn_sch_Schutzgebiet:Naturschutzgebiete" - Naturschutzgebiete
- Layer: "bfn_sch_Schutzgebiet:Vogelschutzgebiete" - Vogelschutzgebiete
- Layer: "bfn_sch_Schutzgebiet:Nationalparke" - Nationalparke
- Layer: "bfn_sch_Schutzgebiet:Biosphärenreservate" - Biosphärenreservate
- Verwendung für: Umwelt-/Naturschutz-Bewertungen, Genehmigungen in Schutzgebieten

🔵 LANDSCHAFTSMODELL DLM250 (INSPIRE) - https://sgx.geodatenzentrum.de/wfs_dlm250_inspire
- WASSER Layer:
  * "hy-p:StandingWater" - Stehendes Gewässer (Seen, Teiche, Stauseen)
  * "hy-p:Watercourse" - Wasserlauf (Flüsse, Bäche, Kanäle)
  * "hy-p:LandWaterBoundary" - Land-Wasser-Grenze
  * "hy-p:DamOrWeir" - Damm oder Wehr
  * "hy-p:Falls" - Wasserfälle
  * "hy-p:Shore" - Ufer
  * "hy-p:Wetland" - Feuchtgebiet
- VERKEHR Layer:
  * "tn-ra:RailwayStationNode" - Bahnhofs-Knoten (Bahnhöfe, Haltestellen)
  * "tn-ra:RailwayLink" - Bahn-Verbindung (Schienennetz, Bahnstrecken)
  * "tn-ro:RoadLink" - Straßen-Verbindung (Straßennetz)
  * "tn-ro:ERoad" - E-Straßen
- TRANSPORT/INFRASTRUKTUR:
  * "tn-w:PortArea" - Hafenbereich
  * "tn-a:AerodromeArea" - Flugplatzbereich
- BESTEHENDE OBJEKTE/VERWALTUNG:
  * "au:AdministrativeUnit" - Verwaltungseinheit
  * "au:AdministrativeBoundary" - Verwaltungsgrenze
  * "ps:ProtectedSite" - Schutzgebiet

BEISPIELE FÜR ANWENDUNGSFÄLLE:
- "Wo sind Vögel geschützt": BfN → Vogelschutzgebiete (NICHT Naturschutzgebiete!)
- "Entfernung zu Hafen": DLM250 → PortArea (nicht Schutzgebiete!)
- "Bahnhof in der Nähe": DLM250 → RailwayStationNode
- "Straße finden": DLM250 → Road
- "Naturschutzgebiet prüfen": BfN-Schutzgebiete → Naturschutzgebiete
- "Gemeindegrenze": BKG-Verwaltungsgebiete → vg250_gem
- "Seen finden": DLM250 → StandingWater

Benutzeranweisung: "${instruction}"

Bitte analysieren Sie die Anweisung und antworten Sie ausschließlich mit einem gültigen JSON-Objekt in folgendem Format:
{
    "coordinates": [longitude, latitude],
    "maxSearchDistance": number_in_meters,
    "layerName": "technical_layer_name",
    "serverUrl": "server_url",
    "reasoning": "kurze_erklärung_der_extraktion"
}

WICHTIGE AUSWAHLREGELN - BEFOLGEN SIE DIESE UNBEDINGT:
- Für SEEN/TEICHE/STAUSEEN/GEWÄSSER: IMMER DLM250 → "hy-p:StandingWater" (NICHT Naturschutzgebiete!)
- Für FLÜSSE/BÄCHE/KANÄLE: IMMER DLM250 → "hy-p:Watercourse"
- Für VÖGEL/VOGELSCHUTZ/AVIFAUNA: IMMER BfN → "bfn_sch_Schutzgebiet:Vogelschutzgebiete"
- Für HÄFEN/HAFENBEREICHE: IMMER DLM250 → "tn-w:PortArea" (NICHT Bahnhöfe!)
- Für BAHNHOFE/BAHNSTATIONEN/ZÜGE/EISENBAHNSTATIONEN: IMMER DLM250 → "tn-ra:RailwayStationNode" (NICHT Schienennetz!)
- Für SCHIENENNETZ/BAHNSTRECKEN/EISENBAHNTRASSE: IMMER DLM250 → "tn-ra:RailwayLink" (NICHT Bahnhöfe!)
- Für STRASSEN/STRASSENNETZ/VERKEHRSWEGE: IMMER DLM250 → "tn-ro:RoadLink"
- Für SCHUTZGEBIETE/NATURSCHUTZ/UMWELTZONEN: IMMER BfN → "bfn_sch_Schutzgebiet:Naturschutzgebiete" (außer Vögel!)
- Für VERWALTUNGSGEBIETE/GEMEINDEN/KREISE/STADTTEILE: IMMER BKG → "vg250:vg250_gem"
- Bei KONTEXT "VÖGEL"/"VOGEL"/"VOGELSCHUTZ"/"AVIFAUNA": LAYER "bfn_sch_Schutzgebiet:Vogelschutzgebiete"
- Bei KONTEXT "SEEN"/"GEWÄSSER"/"WASSER": LAYER "hy-p:StandingWater"
- Bei KONTEXT "HAFEN"/"PORT"/"SCHIFF"/"WASSERTRANSPORT": LAYER "tn-w:PortArea"
- Bei KONTEXT "SCHIENENNETZ"/"BAHNSTRECKE"/"EISENBAHNTRACKE"/"SCHIENE": LAYER "tn-ra:RailwayLink"

SCHLÜSSELWORT-ABBILDUNG:
- "VOGEL" → "bfn_sch_Schutzgebiet:Vogelschutzgebiete"
- "VÖGEL" → "bfn_sch_Schutzgebiet:Vogelschutzgebiete"
- "VOGELSCHUTZ" → "bfn_sch_Schutzgebiet:Vogelschutzgebiete"
- "SEE" → "hy-p:StandingWater"
- "GEWÄSSER" → "hy-p:StandingWater"
- "HAFEN" → "tn-w:PortArea"
- "BAHNHOF" → "tn-ra:RailwayStationNode"
- "BAHNSTATION" → "tn-ra:RailwayStationNode"
- "SCHIENENNETZ" → "tn-ra:RailwayLink"
- "BAHNSTRECKE" → "tn-ra:RailwayLink"
- "BAHNTRACKE" → "tn-ra:RailwayLink"
- "EISENBAHNTRASSE" → "tn-ra:RailwayLink"
- "SCHIENE" → "tn-ra:RailwayLink"
- "STRAßE" → "tn-ro:RoadLink"
- "NATURSCHUTZGEBIET" → "bfn_sch_Schutzgebiet:Naturschutzgebiete"
- "GEMEINDE" → "vg250:vg250_gem"

TECHNSICHE REGELN:
- Extrahieren Sie Koordinaten aus GeoJSON Point-Objekten oder Lat/Lon-Angaben
- Konvertieren Sie Entfernungsangaben in Meter (1km=1000m, 500m=500)
- Verwenden Sie die technischen Layer-Namen wie oben angegeben
- Bei Unsicherheiten: Priorität DLM250 für Infrastruktur, BfN für Naturschutz, BKG für Verwaltung

Antworten Sie nur mit dem JSON-Objekt, ohne zusätzlichen Text.`;
}

/**
 * Prompt for compliance checking
 * @param {string} complianceRule - The compliance rule to check against
 * @param {Object} summaryData - Summary of measurement data
 * @returns {string} The formatted prompt
 */
export function getComplianceCheckPrompt(complianceRule, summaryData) {
    return `Sie sind ein Experte für GIS-Compliance und räumliche Analysen. Bewerten Sie die folgenden Messergebnisse gegen die gegebene Prüfvorschrift.

PRÜFVORSCHRIFT:
"${complianceRule}"

MESSERGEBNISSE:
- Objektkoordinaten: ${summaryData.coordinates[1]}°N, ${summaryData.coordinates[0]}°E
- Geprüfter Layer-Typ: ${summaryData.layerType}
- Maximale Suchdistanz: ${summaryData.maxSearchDistance}m
- Gefundene Features gesamt: ${summaryData.totalFeaturesFound}
- Enthaltende Gebiete: ${summaryData.containingFeatures}
- Nahe Gebiete: ${summaryData.nearbyFeatures}
- Kürzeste Distanz: ${summaryData.closestDistance !== null ? summaryData.closestDistance.toFixed(2) + 'm' : 'N/A'}

FEATURE-DETAILS (erste 10):
${summaryData.featuresDetails.map(f =>
    `- ${f.name}: ${f.distance.toFixed(2)}m (${f.isContaining ? 'enthaltend' : 'nahe'})`
).join('\n')}

Bitte analysieren Sie diese Ergebnisse und antworten Sie ausschließlich mit einem gültigen JSON-Objekt in folgendem Format:
{
    "compliant": boolean,
    "status": "ERFÜLLT" | "VERLETZT" | "TEILWEISE_ERFÜLLT",
    "confidence": number_between_0_and_1,
    "reasoning": "detaillierte_begründung_der_bewertung",
    "recommendations": "empfehlungen_falls_nicht_compliant",
    "key_findings": ["wichtigste_erkenntnisse"]
}

Regeln für die Bewertung:
- "ERFÜLLT": Prüfvorschrift ist vollständig eingehalten
- "VERLETZT": Prüfvorschrift ist eindeutig verletzt
- "TEILWEISE_ERFÜLLT": Grenzfall oder teilweise erfüllt
- confidence: Wie sicher Sie sich bei der Bewertung sind (0.0-1.0)
- Berücksichtigen Sie sowohl enthaltende Gebiete (Abstand 0m) als auch nahe Gebiete
- Bei Schutzgebieten sind enthaltende Gebiete meist als vollständig compliant zu bewerten

Antworten Sie nur mit dem JSON-Objekt, ohne zusätzlichen Text.`;
}

/**
 * Default model configuration for AI requests
 */
export const AI_CONFIG = {
    model: 'x-ai/grok-4-fast',
    temperature: 0.1,
    maxTokens: {
        parameterExtraction: 500,
        complianceCheck: 800
    }
};

/**
 * API endpoint for AI requests
 */
export const AI_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
