let DPT = document.getElementById('origin');
let DST = document.getElementById('destination');
let originAirport;
let map;
let originMarker, destinationMarker;
let waypointMarkers = [];
let originLatLon, destinationLatLon;
let airportsData = {};
let polyline;

// Initialize the other map container
const routesContainer = document.getElementById('map2');

// ----------------------------------------------------------------------------------
let savedRoutes = localStorage.setItem("route", JSON.stringify([]));
document.addEventListener('DOMContentLoaded', (event) => {
    initializeLocalStorage();
});

// ----------------------------------------------------------------------------------
function initializeLocalStorage() {
    if (localStorage.getItem("routes") === null) {
        localStorage.setItem("routes", JSON.stringify([]));
    }
}

// ----------------------------------------------------------------------------------
// Load airports data
function generate() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    if (origin === '' || destination === '') {
        return;
    }

    originAirport = origin;

    fetch("https://raw.githubusercontent.com/ItsYousof/GeoFS-Flight-Menu/main/data/airports.json")
        .then(response => response.json())
        .then(data => {
            const airports = data.airports;
        })
        .catch(error => console.error(error));

    fetch(`https://api.flightplandatabase.com/search/plans?fromICAO=${origin}&toICAO=${destination}&limit=1`)
        .then(response => response.json())
        .then(data => {
            showAnalysis(data);
            for (let index = 0; index < data.length; index++) {
                fetch(`https://api.flightplandatabase.com/plan/${data[index].id}`)
                    .then(response => response.json())
                    .then(data => {
                        let route = data.route.nodes;
                        let formattedNodes = [];
                        
                        route.forEach((node, i) => {
                            const isFirst = (i === 0);
                            const isLast = (i === route.length - 1);
                            formattedNodes.push(formatNode(node, isFirst, isLast));
                        });

                        displayOutput(formattedNodes);
                        displayMap(formattedNodes);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error(error));
}
// ----------------------------------------------------------------------------------
function showAnalysis(data) {
    let totalDistance = 0;
    let maxAltitude = 0;
    let fromName;
    let toName;
    let notes;

    totalDistance = data[0].distance;
    maxAltitude = data[0].maxAltitude;
    fromName = data[0].fromName;
    toName = data[0].toName;
    notes = data[0].notes;

    document.getElementById('analyze').value = `Total Distance: ${totalDistance} km\nMax Altitude: ${maxAltitude} ft\nFrom: ${fromName}\nTo: ${toName}\n${notes}`;
}
// --------------------------------------------------------------------------------
function formatNode(node, isFirst, isLast) {
    let formattedNode = {
        ident: node.ident,
        type: node.type,
        lat: node.lat,
        lon: node.lon,
        alt: node.alt,
        spd: ""
    };

    if (isFirst) {
        formattedNode.type = "DPT";
    }
    if (isLast && formattedNode.type !== "DPT") {
        formattedNode.type = "DST";
    } 

    if (formattedNode.type === "VOR") {
        formattedNode.type = "FIX";
    } else if (formattedNode.type === "LATLON") {
        formattedNode.type = "FIX";
    } else if (formattedNode.type === "RNP") {
        formattedNode.type = "FIX";
    }

    return formattedNode;
}
// ----------------------------------------------------------------------------------
function displayMap(formattedNodes) {
    document.getElementById('map').style.display = 'flex';
    const map = L.map('map').setView([formattedNodes[0].lat, formattedNodes[0].lon], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    const latlngs = formattedNodes.map(node => [node.lat, node.lon]);

    const polyline = L.polyline(latlngs, {color: 'blue'}).addTo(map);
    map.fitBounds(polyline.getBounds());
}

// ----------------------------------------------------------------------------------
function displayOutput(formattedNodes) {
    document.getElementById('route').innerHTML = formattedNodes.map(node => JSON.stringify(node, null, 2));

    // Add route to local storage
    storeRouteInLocalStorage(formattedNodes);

    const downloadsDiv = document.getElementById('download');

    const button = document.createElement('a');
    button.href = '#';
    button.innerHTML = 'Download';
    button.onclick = function() {
        const routes = JSON.parse(localStorage.getItem("routes"));
        const json = JSON.stringify(routes, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'route.json';
        link.click();
    };

    downloadsDiv.appendChild(button);
}
// ----------------------------------------------------------------------------------
function showRouteSuggestions() {
    let origin = "KDFW";
    let destination = "KLAX";

    if (origin === '' || destination === '') {
        return;
    }

    fetch(`https://api.flightplandatabase.com/search/plans?fromICAO=${origin}&toICAO=${destination}&limit=5`)
        .then(response => response.json())
        .then(data => {
            for (let index = 0; index < data.length; index++) {
                let routeId = data[index].id;
                fetch(`https://api.flightplandatabase.com/plan/${routeId}`)
                    .then(response => response.json())
                    .then(data => {
                        let route = data.route.nodes;
                        let formattedNodes = [];

                        route.forEach((node, i) => {
                            const isFirst = (i === 0);
                            const isLast = (i === route.length - 1);
                            formattedNodes.push(formatNode(node, isFirst, isLast));
                        });

                        formattedNodes.forEach((i) => {
                            displaySuggestions(formattedNodes[i]);
                        })
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error(error));
}

function displaySuggestions(route) {
    const routesContainer = document.getElementById('routes-container');
    routesContainer.innerHTML = '';
    for (let index = 0; index < route.length; index++) {
        const routeDiv = document.createElement('div');
        routeDiv.classList.add('route');
        routeDiv.innerHTML = `
            <textarea>
                ${JSON.stringify(route[index], null, 2)}
            </textarea>
        `;
        routesContainer.appendChild(routeDiv);
    }
}

// ----------------------------------------------------------------------------------
function storeRouteInLocalStorage(route) {
    const routes = JSON.parse(localStorage.getItem("routes"));
    routes.push(route);
    localStorage.setItem("routes", JSON.stringify(routes));
}

// ----------------------------------------------------------------------------------
function deleteRoute(index) {
    const routes = JSON.parse(localStorage.getItem("routes"));
    routes.splice(index, 1);
    localStorage.setItem("routes", JSON.stringify(routes));
    displayStoredRoutes();
}

function downloadRoute(index) {
    const routes = JSON.parse(localStorage.getItem("routes"));
    const json = JSON.stringify(routes[index], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route${index + 1}.json`;
    link.click();
}

function displayStoredRoutes() {
    const routesContainer = document.getElementById('stored-routes');
    routesContainer.innerHTML = '';
    const routes = JSON.parse(localStorage.getItem("routes"));
    routes.forEach((route, index) => {
        const routeDiv = document.createElement('div');
        routeDiv.className = 'route';
        routeDiv.innerHTML = `<p class="route-number">Route ${index + 1}</p><p class="route-info">${JSON.stringify(route, null, 2)}</p>
        <button onclick="deleteRoute(${index})" class="btn">Delete</button>
        <button onclick="downloadRoute(${index})" class="btn">Download</button>
        `;
        routesContainer.appendChild(routeDiv);
    });
}

// ----------------------------------------------------------------------------------

// Initialize the map container
const mapContainer = document.getElementById('map');

// ----------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const rdoYes = document.getElementById('yes');
    const rdoNo = document.getElementById('no');

    rdoNo.addEventListener('change', function() {
        mapContainer.style.display = 'none';
        routesContainer.style.display = 'flex';

        displayStoredRoutes();
    });

    rdoYes.addEventListener('change', function() {
        mapContainer.style.display = 'flex';
        routesContainer.style.display = 'none';
    });

});

// ----------------------------------------------------------------------------------
function downloadStored() {
    const routes = JSON.parse(localStorage.getItem("routes"));
    const json = JSON.stringify(routes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'routes.json';
    link.click();

}

// ----------------------------------------------------------------------------------
function startGeofs() {
    if (originAirport === '') {
        alert('No route selected');
        return;
    }
    
    fetch('https://raw.githubusercontent.com/ItsYousof/GeoFS-Flight-Menu/main/data/airports.json')
        .then(response => response.json())
        .then(data => {
            const airports = data;
            
            if (!(originAirport in airports)) {
                alert('Origin airport not found');
                return;
            } else {
                let latlon = airports[originAirport];
                window.open(`https://www.geo-fs.com/geofs.php?a=4&la=${latlon[0]}&lo=${latlon[1]}&al=0&h=0&l=0&n=0&v=0`, '_blank');
            }
        })
        .catch(error => console.error('Error fetching the airports data:', error));
}
// ----------------------------------------------------------------------------------
function displayCredits() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block';
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const popup = document.getElementById('popup');
        popup.style.display = 'none';
    }
})