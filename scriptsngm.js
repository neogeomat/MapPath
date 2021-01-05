    markerList = [];
    // ngcodestart
    NominatimUrl = "https://nominatim.openstreetmap.org/";
    reverseNominatimUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2";
    map = L.map("map", {
        center: {
            lat: 37.56569,
            lng: 22.8
        },
        zoom: 16
    });
    // L.GeoIP.centerMapOnPosition(map, 15);
    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    routing = new L.Routing.control({
        waypoints: [
            L.latLng(37.56569, 22.8),
            L.latLng(37.56569, 22.7)
        ],
        routeWhileDragging: true,
        show: true,
        // geocoder: L.Control.Geocoder.nominatim()
    });
    routing.addTo(map);
    // moving ruting results outside map
    var routingControlContainer = routing.getContainer();
    var controlContainerParent = routingControlContainer.parentNode;
    controlContainerParent.removeChild(routingControlContainer);
    var itineraryDiv = document.getElementById('path-results');
    routingControlContainer.removeAttribute('class', 'leaflet-routing-container');
    itineraryDiv.appendChild(routingControlContainer);

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
    // var drawControlContainer = drawControl.getContainer();
    // var controlContainerParent = drawControlContainer.parentNode;
    // controlContainerParent.removeChild(drawControlContainer);
    // var itineraryDiv = document.getElementById('marker-list');
    // drawControlContainer.removeAttribute('class', 'leaflet-draw-container');
    // itineraryDiv.appendChild(drawControlContainer);

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

    document.querySelector('#manual-marker').addEventListener('click', function(e) {
        e.preventDefault();

        const address = document.querySelector('#manual-address').value;
        debugger;
        $.get(NominatimUrl + "search?", {
                "format": "jsonv2",
                'q': address
            },
            data => {
                console.log(data);
                debugger;
            });

    });;
    var geocoder = L.Control.geocoder({
        collapsed: false,
        defaultMarkGeocode: false
    }).on('markgeocode', function(e) {
        // debugger;
        var m = L.marker(e.geocode.center).addTo(map).bindPopup(e.geocode.html + '<br><button href="#" center = ' + e.geocode.center + ' onclick=addAddressMarker()> Add marker </button>').openPopup();
        drawnItems.temp = m;
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
        ]);
        // .addTo(map);
        map.fitBounds(poly.getBounds());
    }).addTo(map);

    function addAddressMarker() {
        map.removeLayer(drawnItems.temp);
        markerList.push(drawnItems.temp);

        updateMarkers();
        drawnItems.temp.unbindPopup()
        drawnItems.addLayer(drawnItems.temp);
        // while (geocoderControlContainer.firstchild) {
        geocoderControlContainer.removeChild(geocoderControlContainer.lastChild);
        // }
        // debugger;
    };
    // geocoder.options.geocoder.options.
    var geocoderControlContainer = geocoder.getContainer();
    var controlContainerParent = geocoderControlContainer.parentNode;
    controlContainerParent.removeChild(geocoderControlContainer);
    var itineraryDiv = document.getElementById('manual-address');
    itineraryDiv.appendChild(geocoderControlContainer);
    $(".leaflet-control-geocoder>button").remove();
    $(".leaflet-control-geocoder-form").removeClass('leaflet-control-geocoder-form');


    // nomi = L.Control.Geocoder.nominatim();
    // nomi.geocode('bhaktapur', response => console.log(response));