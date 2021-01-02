    markerList = [];
    // ngcodestart

    reverseNominatimUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2";
    map = L.map("map", {
        center: {
            lat: 37.56569,
            lng: 22.8
        },
        zoom: 16
    });;
    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    // FeatureGroup is to store editable layers
    var drawnItems = new L.geoJSON();
    map.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polyline: false,
            // marker: false,
            circlemarker: false,
            circle: false,
            polygon: false,
            rectangle: false
        }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function(e) {
        var type = e.layerType;
        layer = e.layer;
        layer.label = markerList.length.toString();
        markerList.push(layer);
        updateMarkers();
        drawnItems.addLayer(layer);
    });
    // ngcodeend

    function updateMarkers(forceRename) {
        let uiList = $('#marker-list');
        uiList.empty();

        markerList.forEach(function(marker, index) {
            // const position = marker.getPosition();
            const position = marker.getLatLng();
            if (forceRename) {
                marker.setLabel(index.toString());
            }
            $.get(reverseNominatimUrl, { "lat": position.lat, "lon": position.lng }, place => {
                console.log(place)
                $('<div>', {
                    class: 'list-group-item list-group-item-action d-flex p-0',
                    html: `<span class="float-left p-2 border-right dragger">⇅</span> 
                        <div class="float-left p-2 mr-auto">Marker #${marker.label} <strong>@</strong><span class="text-muted font-italic" title="${marker.label}"> ${place.name}$</span></div>
                        <a href="#" class="btn btn-outline-danger btn-sm delete align-self-start mt-1 mr-1">&times;</a>
                      `,
                    data: {
                        marker: marker
                    }
                }).appendTo(uiList);
            });
        })
    }