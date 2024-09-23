if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            console.log('Position:', position);

            map.setView([latitude, longitude], 16);

            if (markers['user']) {
                markers['user'].setLatLng([latitude, longitude]);
            } else {
                markers['user'] = L.marker([latitude, longitude]).addTo(map);
            }
        },
        (error) => {
            console.log('Geolocation error:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0, // to avoid caching
            timeout: 5000
        }
    );
} else {
    console.log("Geolocation is not supported by this browser.");
}

const map = L.map("map").setView([28.6139, 77.2090], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {  
    attribution: 'Naksha by Pulkit Garg'
}).addTo(map);

const markers = {};
