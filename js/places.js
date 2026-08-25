/* ==========================================================================
   MASTER TRIP PLACE DATABASE
   BachelorX 2027

   Used by:
   - Villa map
   - Optional activities / places section on itinerary.html

   IMPORTANT:
   showOnMap       = display as a map marker
   showOnItinerary = display as a browseable optional activity/place

   Coordinates should only be added when reasonably verified.
   ========================================================================== */


const tripPlaces = [

    /* ==========================================================================
       HOME BASE
       ========================================================================== */

    {
        id: "villa-imperium",

        name: "Villa Imperium",

        category: "villa",

        area: "Sosúa",

        coordinates: [
            19.747494,
            -70.466215
        ],

        summary:
            "Our private home base for the weekend, with 14 bedrooms, resort-style spaces and professional services for the group.",

        timeNeeded: null,

        visitStyle: "Home Base",

        featured: true,

        showOnMap: true,

        showOnItinerary: false
    },


    /* ==========================================================================
       AIRPORT
       ========================================================================== */

    {
        id: "sti",

        name: "Cibao International Airport",

        shortName: "STI",

        category: "airport",

        area: "Santiago",

        coordinates: [
            19.4061,
            -70.6047
        ],

        summary:
            "Our planned group arrival and departure airport.",

        timeNeeded: null,

        visitStyle: "Airport",

        featured: true,

        showOnMap: true,

        showOnItinerary: false
    },


    /* ==========================================================================
       BEACHES
       ========================================================================== */

    {
        id: "playa-sosua",

        name: "Playa Sosúa",

        category: "beach",

        area: "Sosúa",

        coordinates: [
            19.7580,
            -70.5174
        ],

        summary:
            "One of the area's best-known beaches, popular for swimming, snorkeling and casual beachfront food and drinks.",

        timeNeeded:
            "30 min–2 hrs",

        visitStyle:
            "Easy free-time stop",

        showOnMap: true,

        showOnItinerary: true
    },


    {
        id: "playa-alicia",

        name: "Playa Alicia",

        category: "beach",

        area: "Sosúa",

        coordinates: null,

        summary:
            "A smaller Sosúa beach with clear water and an easygoing atmosphere close to town.",

        timeNeeded:
            "30 min–2 hrs",

        visitStyle:
            "Easy free-time stop",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "playa-dorada",

        name: "Playa Dorada",

        category: "beach",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "A well-known golden-sand beach in Puerto Plata's resort district with watersports and resort amenities nearby.",

        timeNeeded:
            "1–2 hrs",

        visitStyle:
            "Best paired with Puerto Plata",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "playa-costambar",

        name: "Playa Costambar",

        category: "beach",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "A laid-back beach west of central Puerto Plata that can be worked into a Puerto Plata outing.",

        timeNeeded:
            "1–2 hrs",

        visitStyle:
            "Best paired with Puerto Plata",

        showOnMap: false,

        showOnItinerary: true
    },


    /* ==========================================================================
       SOSÚA LANDMARKS
       ========================================================================== */

    {
        id: "museo-judio",

        name: "Museo Judío de Sosúa",

        category: "landmark",

        area: "Sosúa",

        coordinates: [
            19.76569,
            -70.51660
        ],

        summary:
            "A museum documenting the Jewish refugees who settled in Sosúa in the 1940s and their role in the community's development.",

        timeNeeded:
            "30–60 min",

        visitStyle:
            "Quick cultural stop",

        showOnMap: true,

        showOnItinerary: true
    },


    {
        id: "mundo-king",

        name: "Mundo King Art Museum",

        category: "landmark",

        area: "Sosúa",

        coordinates: null,

        summary:
            "An eccentric art museum and architectural landmark filled with Haitian and Dominican art and surreal sculpture.",

        timeNeeded:
            "45–90 min",

        visitStyle:
            "Quick cultural stop",

        showOnMap: false,

        showOnItinerary: true
    },


    /* ==========================================================================
       PUERTO PLATA LANDMARKS
       ========================================================================== */

    {
        id: "fortaleza-san-felipe",

        name: "Fortaleza San Felipe",

        category: "activity",

        area: "Puerto Plata",

        coordinates: [
            19.80411,
            -70.69586
        ],

        summary:
            "A 16th-century Spanish fortress and museum overlooking Puerto Plata's harbor and Atlantic coastline.",

        timeNeeded:
            "45–60 min",

        visitStyle:
            "Puerto Plata stop",

        showOnMap: true,

        showOnItinerary: true
    },


    {
        id: "independence-park",

        name: "Independence Park",

        alternateName:
            "Parque Central Independencia",

        category: "activity",

        area: "Puerto Plata",

        coordinates: [
            19.79808,
            -70.69597
        ],

        summary:
            "Puerto Plata's historic central square, surrounded by Victorian architecture, cafés and several downtown landmarks.",

        timeNeeded:
            "20–45 min",

        visitStyle:
            "Walk-through stop",

        showOnMap: true,

        showOnItinerary: true
    },


    {
        id: "paseo-dona-blanca",

        name: "Paseo de Doña Blanca",

        category: "activity",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "A vivid pink pedestrian alley in Puerto Plata's historic center and a popular quick photo stop.",

        timeNeeded:
            "10–20 min",

        visitStyle:
            "Photo stop",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "umbrella-street",

        name: "Umbrella Street",

        category: "activity",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "A colorful pedestrian street shaded by suspended umbrellas, located in Puerto Plata's historic center.",

        timeNeeded:
            "10–30 min",

        visitStyle:
            "Photo / shopping stop",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "malecon-puerto-plata",

        name: "Puerto Plata Malecón",

        alternateName:
            "Avenida General Gregorio Luperón",

        category: "activity",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "Puerto Plata's oceanfront boulevard, lined with sea views, small food stands and easy places to stop for a walk.",

        timeNeeded:
            "20–60 min",

        visitStyle:
            "Flexible walk / drive",

        showOnMap: false,

        showOnItinerary: true
    },


    /* ==========================================================================
       SHORT ACTIVITIES
       ========================================================================== */

    {
        id: "el-choco-caves",

        name: "El Choco National Park Caves",

        category: "activity",

        area: "Cabarete",

        coordinates: null,

        summary:
            "A short guided cave experience through El Choco, including limestone caverns and freshwater cave pools.",

        timeNeeded:
            "About 1.5–2 hrs",

        visitStyle:
            "activity",

        notes:
            "List the cave tour rather than the longer hiking routes.",

        showOnMap: false,

        showOnItinerary: true
    },


    /* ==========================================================================
       NIGHTLIFE — SOSÚA / PUERTO PLATA
       ========================================================================== */

    {
        id: "kviar",

        name: "Kviar Show Disco & Casino",

        category: "nightlife",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "Casino and late-night entertainment option in the Puerto Plata area.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Evening / late night",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "casino-playa-chiquita",

        name: "Casino Playa Chiquita",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Established Sosúa casino and nightlife option in the Playa Chiquita area.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Evening / late night",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "ground-zero",

        name: "Ground Zero",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Sosúa nightlife stop to consider for anyone looking to go out after scheduled group activities.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Late night",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "classico",

        name: "Classico",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Nightclub option in Sosúa for dancing and late-night drinks.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Late night",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "nyc-drink",

        name: "NYC Drink",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Casual nightlife and drinks option in Sosúa.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Evening / late night",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "blue-ice",

        name: "Blue Ice Piano Bar",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Bar option for a more relaxed evening compared with a full nightclub.",

        timeNeeded:
            "Flexible",

        visitStyle:
            "Evening",

        showOnMap: false,

        showOnItinerary: true
    },


    {
        id: "jolly-roger",

        name: "Jolly Roger Bar & Grill",

        category: "nightlife",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Casual bar-and-grill option that works for drinks, food or an informal evening stop.",

        timeNeeded:
            "1–2 hrs",

        visitStyle:
            "Casual evening",

        showOnMap: false,

        showOnItinerary: true
    },


    /* ==========================================================================
       MEDICAL — LOCAL / QUICK CARE
       ========================================================================== */

    {
        id: "centro-medico-cabarete",

        name: "Centro Médico Cabarete",

        category: "medical",

        area: "Cabarete / Sosúa Area",

        coordinates: null,

        summary:
            "Nearby medical facility to keep on the trip map for urgent medical needs.",

        medicalTier:
            "Urgent / higher-level local care",

        showOnMap: false,

        showOnItinerary: false
    },


    {
        id: "dr-quiroz",

        name: "Centro Médico Dr. Quiroz",

        category: "medical",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Local medical option for quicker evaluation of less serious issues.",

        medicalTier:
            "Local urgent care",

        showOnMap: false,

        showOnItinerary: false
    },


    {
        id: "cemedin-plaut",

        name: "CEMEDIN — Dr. Gideon Plaut",

        category: "medical",

        area: "Sosúa",

        coordinates: null,

        summary:
            "General medical clinic to keep available as a non-emergency healthcare option.",

        medicalTier:
            "General practitioner",

        showOnMap: false,

        showOnItinerary: false
    },


    {
        id: "medical-clinic-rg",

        name: "Medical Clinic RG",

        category: "medical",

        area: "Sosúa",

        coordinates: null,

        summary:
            "Local clinic option for minor injuries, wound care and routine medical concerns.",

        medicalTier:
            "Minor care",

        showOnMap: false,

        showOnItinerary: false
    },


    /* ==========================================================================
       MEDICAL — PUERTO PLATA HOSPITALS
       ========================================================================== */

    {
        id: "bournigal",

        name: "Centro Médico Dr. Bournigal",

        category: "medical",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "Larger Puerto Plata hospital option to retain on the trip map for serious medical situations.",

        medicalTier:
            "Hospital",

        showOnMap: false,

        showOnItinerary: false
    },


    {
        id: "clinica-brugal",

        name: "Clínica Brugal",

        alternateName:
            "Melosa Clínica Brugal",

        category: "medical",

        area: "Puerto Plata",

        coordinates: null,

        summary:
            "Additional Puerto Plata hospital option for situations requiring hospital-level care.",

        medicalTier:
            "Hospital",

        showOnMap: false,

        showOnItinerary: false
    }

];