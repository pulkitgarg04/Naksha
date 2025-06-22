const CATEGORY_META = {
    landmarks: { label: "Landmarks", color: "#f97316" },
    nature: { label: "Natural Wonders", color: "#16a34a" },
    cities: { label: "Iconic Cities", color: "#2563eb" },
    sports: { label: "Sports Venues", color: "#7c3aed" },
    film: { label: "Filming Locations", color: "#db2777" },
    history: { label: "Historic Events", color: "#dc2626" },
    food: { label: "Food Capitals", color: "#ca8a04" }
};

const placeRenderer = L.canvas({ padding: 0.5 });

const map = L.map("map", {
    zoomControl: true,
    preferCanvas: true,
    worldCopyJump: true
}).setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'Naksha by Pulkit Garg'
}).addTo(map);

const markers = {};
const placeLayer = L.layerGroup().addTo(map);
const categoryFilters = document.getElementById("categoryFilters");
const categoryToggle = document.getElementById("categoryToggle");

let places = [];
let activeCategory = "all";
let hasCenteredOnUser = false;
let filtersOpen = false;

function createMarkerIcon(color, className = "place-marker") {
    return L.divIcon({
        className: "",
        html: `<div class="${className}" style="background:${color};"></div>`,
        iconSize: [18, 18],
        popupAnchor: [0, -10]
    });
}

function getCategoryColor(category) {
    return CATEGORY_META[category]?.color || "#64748b";
}

function setFilterMessage(message) {
    categoryFilters.innerHTML = `<p class="filter-status">${message}</p>`;
}

function updateFilterToggle() {
    const label = filtersOpen ? "Hide categories" : `Show categories (${places.length})`;
    categoryToggle.querySelector("span").textContent = label;
    categoryToggle.classList.toggle("is-open", filtersOpen);
    categoryToggle.setAttribute("aria-expanded", String(filtersOpen));
    categoryFilters.classList.toggle("is-collapsed", !filtersOpen);
}

function renderFilters() {
    const options = [
        { id: "all", label: `All Places (${places.length})` },
        ...Object.entries(CATEGORY_META).map(([id, meta]) => ({
            id,
            label: meta.label
        }))
    ];

    categoryFilters.innerHTML = options
        .map(({ id, label }) => {
            const activeClass = id === activeCategory ? "active" : "";
            const color = id === "all" ? "#f59e0b" : getCategoryColor(id);
            return `<button class="filter-chip ${activeClass}" data-category="${id}" type="button" style="--chip-accent:${color};">${label}</button>`;
        })
        .join("");

    categoryFilters.querySelectorAll(".filter-chip").forEach((button) => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;
            renderFilters();
            renderMarkers();
        });
    });

    updateFilterToggle();
}

function renderPopup(place) {
    const badges = place.categories
        .map((category) => `<span class="popup-badge">${CATEGORY_META[category].label}</span>`)
        .join("");

    const sections = place.sections
        .map((section) => {
            const facts = section.facts
                .map(
                    ([label, value]) =>
                        `<div class="fact-row"><span class="fact-label">${label}:</span> ${value}</div>`
                )
                .join("");

            return `
                <section class="popup-section">
                    <h4>${section.title}</h4>
                    <div class="fact-list">${facts}</div>
                </section>
            `;
        })
        .join("");

    return `
        <article class="place-popup">
            <header class="popup-header">
                <h3>${place.name}</h3>
                <p class="popup-subtitle">${place.location}</p>
                <div class="popup-badges">${badges}</div>
                <div class="popup-section">
                    <div class="fact-row">${place.summary}</div>
                </div>
            </header>
            ${sections}
        </article>
    `;
}

function renderMarkers() {
    placeLayer.clearLayers();

    const visiblePlaces = places.filter(
        (place) => activeCategory === "all" || place.categories.includes(activeCategory)
    );

    visiblePlaces.forEach((place) => {
        const primaryCategory = place.categories[0];
        const marker = L.circleMarker(place.coords, {
            renderer: placeRenderer,
            radius: 6,
            fillColor: getCategoryColor(primaryCategory),
            fillOpacity: 0.92,
            color: "#ffffff",
            weight: 2
        })
            .bindPopup(renderPopup(place), {
                maxWidth: 340
            })
            .bindTooltip(place.name, {
                direction: "top"
            });

        marker.addTo(placeLayer);
        markers[place.id] = marker;
    });
}

function enableUserLocation() {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            if (markers.user) {
                markers.user.setLatLng([latitude, longitude]);
            } else {
                markers.user = L.marker([latitude, longitude], {
                    icon: createMarkerIcon("#0f62fe", "user-marker")
                })
                    .addTo(map)
                    .bindPopup("You are here");
            }

            if (!hasCenteredOnUser) {
                map.setView([latitude, longitude], 5);
                hasCenteredOnUser = true;
            }
        },
        (error) => {
            console.log("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}

async function loadPlaces() {
    setFilterMessage("Loading places...");
    updateFilterToggle();

    try {
        const response = await fetch("/data/places.json");

        if (!response.ok) {
            throw new Error(`Failed to load places: ${response.status}`);
        }

        places = await response.json();
        renderFilters();
        renderMarkers();
    } catch (error) {
        console.error(error);
        setFilterMessage("Could not load places data.");
    }
}

categoryToggle.addEventListener("click", () => {
    filtersOpen = !filtersOpen;
    updateFilterToggle();
});

loadPlaces();
enableUserLocation();
