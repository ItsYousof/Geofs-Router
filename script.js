function generate() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;

    if (origin === '' || destination === '') {
        return;
    }

    fetch("https://raw.githubusercontent.com/ItsYousof/GeoFS-Flight-Menu/main/data/airports.json")
        .then(response => response.json())
        .then(data => {
            const airports = data.airports;
        })
        .catch(error => console.error(error));

    fetch(`https://api.flightplandatabase.com/search/plans?fromICAO=${origin}&toICAO=${destination}&limit=1`)
        .then(response => response.json())
        .then(data => {
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
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error(error));
}

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

function displayOutput(formattedNodes) {
    const div = document.createElement('div');
    div.className = 'output';
    div.innerHTML = JSON.stringify(formattedNodes, null, 2);
    document.getElementById('outputs').appendChild(div);
}
