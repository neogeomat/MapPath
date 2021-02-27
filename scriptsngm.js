    markerList = [];
    L.Marker.setBouncingOptions({
        bounceHeight: 40,
        bounceSpeed: 60
    });
    // ngcodestart
    NominatimUrl = "https://nominatim.openstreetmap.org/";
    reverseNominatimUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2";
    map = L.map("map", {
        closePopupOnClick: true
    });
    map.locate({ setView: true, maxZoom: 16 });
    map.on('click', e => {
        if (typeof(drawnItems.temp) != 'undefined') {
            // console.log(e);
            map.removeLayer(drawnItems.temp);
        }
    });

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
        // routeWhileDragging: true,
        show: false,
        waypoints: [null],
        // autoRoute: false
    }).on('routingerror', function(e) { alert(e) });
    // routing.onAdd(function(map) { this.setWaypoints(null) });
    routing.addTo(map);


    function createButton(label, container) {
        var btn = L.DomUtil.create('button', '', container);
        btn.setAttribute('type', 'button');
        btn.innerHTML = label;
        return btn;
    }
    routing._plan.on('waypointschanged', function(e) {
        if (routing.getWaypoints().length == markerList.length) {
            let changedWaypointIndex = e.waypoints.findIndex((m, index) => (m._latlng != m.latLng));
            // let changedWaypointIndex = e.waypoints.findIndex((m, index) => (!m._latlng));
            if (changedWaypointIndex >= 0) {
                let layer = routing.getWaypoints()[changedWaypointIndex];
                layer = L.marker(layer.latLng);
                layer.latLng = layer._latlng;
                if (layer.latLng) {
                    layer.label = changedWaypointIndex;
                    geocoder.options.geocoder.reverse(layer.latLng, 18, response => {
                        console.log(response[0]);
                        let result;
                        if (response[0]) {
                            result = response[0];
                        } else {
                            result = {
                                html: "No response",
                                center: layer.getLatLng()
                            }
                        }
                        layer.html = result.html;
                        markerList[changedWaypointIndex] = layer;
                        routing.spliceWaypoints(changedWaypointIndex, 1, layer);
                        updateMarkers();
                    });
                }

                // debugger;
            }
        } else if (routing.getWaypoints().length > markerList.length) {
            let newWaypoints = routing.getWaypoints().filter((w, index) => !w._latlng);
            let layer = newWaypoints[0];

            if (layer.latLng) {
                let newIndex = routing.getWaypoints().indexOf(layer);
                layer.label = markerList.length.toString();
                // debugger;
                geocoder.options.geocoder.reverse(layer.latLng, 18, response => {
                    // console.log(response[0]);
                    let result;
                    if (response[0]) {
                        result = response[0];
                    } else {
                        result = {
                            html: "No response",
                            center: layer.getLatLng()
                        }
                    }
                    var m = L.marker(layer.latLng).addTo(map).bindPopup(result.html + '<br><button href="#" center = ' + result.center + ' onclick=addAddressMarker(["routeDrag",' + newIndex + '])> Add marker </button><button href="#" center = ' + result.center + ' onclick=cancelAddressMarker(' + newIndex + ')> Cancel </button>').openPopup();
                    m.html = result.html;
                    m.latLng = L.latLng(m._latlng);
                    drawnItems.temp = m;
                });
                updateMarkers();
            }
        }
    });
    // FeatureGroup is to store editable layers
    var drawnItems = new L.geoJSON();
    map.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            edit: false
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
        let layer = e.layer;
        layer.label = markerList.length.toString();
        // debugger;
        geocoder.options.geocoder.reverse(layer.getLatLng(), 18, response => {
            // console.log(response[0]);
            let result;
            if (response[0]) {
                result = response[0];
            } else {
                result = {
                    html: "No response",
                    center: layer.getLatLng()
                }
            }
            // debugger;
            var m = L.marker(layer.getLatLng(), {
                closeOnClick: false
            }).addTo(map).bindPopup(result.html + '<br><button href="#" center = ' + result.center + ' onclick=addAddressMarker()> Add marker </button><button href="#" center = ' + result.center + ' onclick=cancelAddressMarker()> Cancel </button>').openPopup();
            m.html = result.html;
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

            $('<div>', {
                class: 'list-group-item list-group-item-action d-flex p-0',
                html: `<span class="float-left p-2 border-right dragger">⇅</span> 
                        <div class="float-left p-2 mr-auto">${marker.html}</span></div>
                        <a href="#" class="btn btn-outline-danger btn-sm delete align-self-start mt-1 mr-1">&times;</a>
                      `,
                data: {
                    marker: marker
                }
            }).appendTo(uiList);

        })
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
        var m = L.marker(e.geocode.center).addTo(map).bindPopup(e.geocode.name + '<br><button href="#" center = ' + e.geocode.center + ' onclick=addAddressMarker()> Add marker </button><button href="#" center = ' + e.geocode.center + ' onclick=cancelAddressMarker()> Cancel </button>').openPopup();
        m.html = e.geocode.name;
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

    function addAddressMarker(index) {
        map.removeLayer(drawnItems.temp);
        if (!index) {
            index = markerList.length;
        } else if (index[0] == 'routeDrag') {
            markerList.splice(index[1], 0, drawnItems.temp);
            routing.getPlan().getWaypoints()[index[1]] = drawnItems.temp;
            // debugger;
        }
        if (typeof(index) == 'number') {
            drawnItems.temp.unbindPopup()
            drawnItems.addLayer(drawnItems.temp);

            geocoder._collapse();
            // debugger;
            // drawnItems.getLayers()[index].latLng = drawnItems.temp._latlng;
            drawnItems.temp.latLng = drawnItems.temp._latlng;

            markerList.splice(index, 0, drawnItems.temp);
            if (markerList.length == 2) {
                routing.setWaypoints(markerList);
                routing.route();
                map.removeLayer(drawnItems);
            } else {
                routing.spliceWaypoints(index, 0, drawnItems.temp);
            }
        }

        updateMarkers();
    };

    function cancelAddressMarker(index) {
        drawnItems.m = "";
        routing.spliceWaypoints(index, 1);
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
        routing.spliceWaypoints(markerIndex, 1); // this must be before splicing from markerlist
        markerList.splice(markerIndex, 1);
        if (marker) {
            // marker.setAnimation(null);
            // marker.stopBouncing();
            if (map.hasLayer(cm)) {
                map.removeLayer(cm);
            }
        }
        updateMarkers(true);

        // removeDirections();
    }).on('mouseenter', '.delete', function(e) {
        e.preventDefault();
        // debugger;
        const markerNode = $(this).closest('.list-group-item'),
            marker = markerNode.data('marker'),
            markerIndex = markerNode.index();

        if (marker) {
            // marker.setAnimation(google.maps.Animation.BOUNCE);
            // marker.bounce();
            cm = L.circleMarker(marker.getLatLng(), { color: 'red' }).addTo(map);
            map.panTo(cm.getLatLng());
            // debugger;
        }
    }).on('mouseleave', '.delete', function(e) {
        e.preventDefault();
        const markerNode = $(this).closest('.list-group-item'),
            marker = markerNode.data('marker'),
            markerIndex = markerNode.index();

        if (marker) {
            // marker.setAnimation(null);
            // marker.stopBouncing();
            if (map.hasLayer(cm)) {
                map.removeLayer(cm);
            }
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
        // console.log(source)
        // setTimeout(function() { marker.setAnimation(google.maps.Animation.BOUNCE); }, 20);
    })
    sortable.on('sortable:stop', (event) => {
        const source = $(event.dragEvent.data.originalSource),
            marker = source.data('marker');

        // setTimeout(function() { marker.setAnimation(null); }, 20);

        markerList.forEach(function(marker, index) {
            marker.label = index.toString();
        })
        setTimeout(function() {
            updateMarkers();
            routing.setWaypoints(markerList);
            // removeDirections();
        }, 1)
    })

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        const currentTab = $(e.target) // newly activated tab
        drawStyle = drawingStyles[currentTab.data('draw-style')];
        stopDrawing();
    });
    updateMarkers();