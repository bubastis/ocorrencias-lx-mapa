let allRecords = {};

mapboxgl.accessToken = "pk.eyJ1IjoiZWFzdDE5OTkiLCJhIjoiY2l5dW96ZXZxMDFyMzM4bXl6MDI3M2liOSJ9.zN_d4GPduMmFnsFDYuNnGw";

var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/east1999/ckf10svqy2f0u1an8rsuneco1",
    zoom: 12.56,
    center: [-9.162,38.724]
  });

function getData (){
    fetch('https://gisapps.cm-lisboa.pt/arcgisapps/rest/services/GOPI_Maps_Secure/NaMinhaRuaRead_PROD/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=id%2Cnumero%2Crequerente%2Cemail%2Clocal%2Creferencia%2Cdescricao%2Ctipo%2Carea%2Cfreg_descricao%2Cstate&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=id+DESC&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=500&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=geojson')
    .then(response => response.json())
    .then(response => {
        return allRecords = JSON.parse(JSON.stringify(response))
    })
    .then(response => {

        map.on("load", function () {

            var nav = new mapboxgl.NavigationControl();
            var scale = new mapboxgl.ScaleControl({maxWidth: 100, unit: 'metric'});
          
            map.addControl(nav, 'top-right');
            map.addControl(scale, 'bottom-right');
          
            map.addSource('lx-arcgis', {
              type: 'geojson',
              data: allRecords
            });
          
            map.addLayer({
              'id': 'lx',
              'type': 'circle',
              'source': 'lx-arcgis',
              'paint': {
                  'circle-radius': {
                    stops: [[11, 1], [16, 10]]
                  },
                  'circle-color': ["match",
                  ["get", "state"],
                  "Resolvido",
                  "#28a745",
                  "Em análise",
                  "#35aedc",
                  "Em execução",
                  "#ffc105",
                  "Registado para Resolução",
                  "#ff7907",
                  "#ffffff"
                  ],
                  'circle-stroke-color': '#202628',
                  'circle-stroke-width': 1,
                  'circle-opacity': 1
                }
            });
        })

        allRecords.features.forEach(function(el){

           var prop = el.properties;

           var listings = document.getElementById('listings');
           var listing = listings.appendChild(document.createElement('div'));

           listing.id = "listing-" + prop.id;

           if (prop.state == "Resolvido") {
                listing.className = "card resolvido";
           }
           else if (prop.state == "Em análise") {
                listing.className = "card analise";
           }
           else if (prop.state == "Em execução") {
                listing.className = "card execucao";
           }
           else if (prop.state == "Registado para Resolução") {
                listing.className = "card resolucao";
           }
           else {
               listing.className = "card";
           }    

           var ref = listing.appendChild(document.createElement('h2'));
           ref.innerHTML = 'Ocorrência nº' + prop.id;

           var freguesia = listing.appendChild(document.createElement('div'));
           freguesia.innerHTML = '<span>Freguesia</span>' + prop.freg_descricao;

           var areatipo = listing.appendChild(document.createElement('div'));
           areatipo.innerHTML = '<span>Tipo</span>' + prop.area;

           listing.addEventListener('click', function(e){

                getTo(el);
                switchActives();
                this.classList.add('active');
                createPopUp(el);
            });

        });

        map.on('click', function(e) {

            var features = map.queryRenderedFeatures(e.point, {
              layers: ['lx']
            });

            if (features.length) {
              var clickedPoint = features[0];
              getTo(clickedPoint)
              createPopUp(clickedPoint);
              switchActives();
              var listing = document.getElementById('listing-' + clickedPoint.properties.id);
              listing.classList.add('active');
              listing.scrollIntoView({behavior: 'smooth'});
            }

        });

        var picker = document.getElementById("picker");
        picker.addEventListener('change', function(e) {  

                let cards = Array.from(document.querySelectorAll(".card"));
                let cardsFiltered;
                document.getElementById("empty").textContent = "";

                if (this.value != "Filtrar") {

                    var search = this.value;
                    cards.forEach(el => {el.style.display = "block";}) // reset
                    cardsFiltered = cards.filter((item) => !item.textContent.includes(search));
                    cardsFiltered.forEach(el => {el.style.display = "none";})

                    if (this.options[this.selectedIndex].text.includes("Tipo")) {
                        map.setFilter('lx', ['==', ['get', 'area'], search]);
                    }
                    else {
                        map.setFilter('lx', ['==', ['get', 'freg_descricao'], search]);
                    }
                    if (cardsFiltered.length == 500) {
                        document.getElementById("empty").textContent = "Sem resultados 😥";    
                    }
                }
                else {
                    cards.forEach(el => {el.style.display = "block";})
                    map.setFilter('lx', null);

            }
        }); 
          
    })
}

function switchActives() {
    var activeItem = document.getElementsByClassName('active');
    if (activeItem[0]) {
      activeItem[0].classList.remove('active');
    }
}

function createPopUp(currentFeature) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) popUps[0].remove();
  
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h1>Ocorrência nº' + currentFeature.properties.id + '</h1><p>"' + currentFeature.properties.descricao + '"</p>')
      .addTo(map);

    var closeButton = document.getElementsByClassName('mapboxgl-popup-close-button');
    console.log(closeButton)
    closeButton[0].addEventListener('click', function() {
        switchActives();
    })
}

function getTo(currentFeature) {
    map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
    });
  }

getData();