    markerList = [];
    // ngcodestart
    NominatimUrl = "https://nominatim.openstreetmap.org/";
    reverseNominatimUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2";
    map = L.map("map", {});
    map.locate({ setView: true, maxZoom: 16 });

    function onLocationError(e) {
        alert(e.message);
    }
    map.on('locationerror', onLocationError);
    L.control.locate().addTo(map);

    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    routing = new L.Routing.control({
        routeWhileDragging: true,
        show: false,
    });
    routing.addTo(map);
    routing.on('routesfound', route => {
        // console.log(route);
        var itineraryDiv = document.getElementById('path-results');
        var g = L.geoJSON();
        g.addLayer(L.polyline(route.routes[0].coordinates));
        itineraryDiv.innerHTML = `${route.routes[0].name}<div>${JSON.stringify(g.toGeoJSON())}</div>`;
        // debugger;
    });

    function createButton(label, container) {
        var btn = L.DomUtil.create('button', '', container);
        btn.setAttribute('type', 'button');
        btn.innerHTML = label;
        return btn;
    };

    // FeatureGroup is to store editable layers
    var drawnItems = new L.geoJSON();
    map.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polyline: false,
            marker: true,
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
        // debugger;
        geocoder.options.geocoder.reverse(layer.getLatLng(), 18, response => {
            console.log(response);
            var m = layer.addTo(map).bindPopup(response[0].html + '<br><button href="#" center = ' + response[0].center + ' onclick=addAddressMarker()> Add marker </button><button href="#" center = ' + response[0].center + ' onclick=cancelAddressMarker()> Cancel </button>').openPopup();
            drawnItems.temp = m;
        });

        // markerList.push(layer);
        // drawnItems.addLayer(layer);
        updateMarkers();
    });

    function updateMarkers(forceRename) {
        let uiList = $('#marker-list');
        uiList.empty();

        markerList.forEach(function(marker, index) {
            // const position = marker.getPosition();
            const position = marker.getLatLng();
            if (forceRename) {
                // marker.setLabel(index.toString());
            }
            $.get(reverseNominatimUrl, { "lat": position.lat, "lon": position.lng }, place => {
                // console.log(place);
                $('<div>', {
                    class: 'list-group-item list-group-item-action d-flex p-0',
                    html: `<span class="float-left p-2 border-right dragger">⇅</span> 
                        <div class="float-left p-2 mr-auto">${place.name}</span></div>
                        <a href="#" class="btn btn-outline-danger btn-sm delete align-self-start mt-1 mr-1">&times;</a>
                      `,
                    data: {
                        marker: marker
                    }
                }).appendTo(uiList);
            });
        })
        drawnItems.eachLayer(l => {
            l.latLng = L.latLng(l._latlng);
            // console.log(l._latlng);
        });
        // debugger;
        // routing.setWaypoints(drawnItems.getLayers());
        routing.setWaypoints(markerList);
    }

    var geocoder = L.Control.geocoder({
        collapsed: false,
        showResultIcons: true,
        defaultMarkGeocode: false
    }).on('markgeocode', function(e) {
        // debugger;
        if (drawnItems.temp) {
            map.removeLayer(drawnItems.temp);
        }
        var m = L.marker(e.geocode.center).addTo(map).bindPopup(e.geocode.html + '<br><button href="#" center = ' + e.geocode.center + ' onclick=addAddressMarker()> Add marker </button><button href="#" center = ' + e.geocode.center + ' onclick=cancelAddressMarker()> Cancel </button>').openPopup();

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

        drawnItems.temp.unbindPopup()
        drawnItems.addLayer(drawnItems.temp);
        updateMarkers();
        geocoder._collapse();
        // debugger;
    };

    function cancelAddressMarker() {
        drawnItems.m = "";
        map.removeLayer(drawnItems.temp);
    };
    // geocoder.options.geocoder.options.
    var geocoderControlContainer = geocoder.getContainer();
    var controlContainerParent = geocoderControlContainer.parentNode;
    controlContainerParent.removeChild(geocoderControlContainer);
    var itineraryDiv = document.getElementById('manual-address');
    itineraryDiv.appendChild(geocoderControlContainer);
    $(".leaflet-control-geocoder>button").remove();
    $(".leaflet-control-geocoder-form").removeClass('leaflet-control-geocoder-form');


    $('#marker-list').on('click', '.delete', function(e) {
        e.preventDefault();
        const markerNode = $(this).closest('.list-group-item'),
            marker = markerNode.data('marker'),
            markerIndex = markerNode.index();
        // debugger;
        marker.removeFrom(map);
        // marker.setMap(null);
        markerNode.remove();
        markerList.splice(markerIndex, 1);
        updateMarkers(true);
        // removeDirections();
    }).on('mouseenter', '.list-group-item', function(e) {
        const marker = $(this).data('marker');
        if (marker) {
            // marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }).on('mouseleave', '.list-group-item', function(e) {
        const marker = $(this).data('marker');
        if (marker) {
            // marker.setAnimation(null);
        }
    });
    // initialise sortable markers
    const sortable = new Sortable.default(document.querySelectorAll('#marker-list'), {
        draggable: '.list-group-item',
        appendTo: '#marker-list',
        handle: '.dragger',
        classes: {
            'source:dragging': 'list-group-item-info'
        }
    });

    sortable.on('sortable:sorted', (event) => {

        const removed = markerList.splice(event.oldIndex, 1)[0];
        markerList.splice(event.newIndex, 0, removed)
    })

    sortable.on('sortable:start', (event) => {
        const source = $(event.dragEvent.data.originalSource),
            marker = source.data('marker');
        console.log(source)
            // setTimeout(function() { marker.setAnimation(google.maps.Animation.BOUNCE); }, 20);
    })
    sortable.on('sortable:stop', (event) => {
        const source = $(event.dragEvent.data.originalSource),
            marker = source.data('marker');

        // setTimeout(function() { marker.setAnimation(null); }, 20);

        markerList.forEach(function(marker, index) {
            // marker.setLabel(index.toString());
        })
        setTimeout(function() {
            updateMarkers();
            // removeDirections();
        }, 1)
    })

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        const currentTab = $(e.target) // newly activated tab
        drawStyle = drawingStyles[currentTab.data('draw-style')];
        stopDrawing();
    });
    updateMarkers();
    L.Marker.setBouncingOptions({
        bounceHeight: 40,
        bounceSpeed: 60
    });