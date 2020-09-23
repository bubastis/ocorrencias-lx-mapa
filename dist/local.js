let records;

mapboxgl.accessToken = "pk.eyJ1IjoiZWFzdDE5OTkiLCJhIjoiY2l5dW96ZXZxMDFyMzM4bXl6MDI3M2liOSJ9.zN_d4GPduMmFnsFDYuNnGw";

const mobileWindow = window.matchMedia("(max-width: 414px)");

if (mobileWindow.matches) {
  newCenter = [-9.139, 38.720];
  newZoom = 12;
}
else {
  newCenter = [-9.162,38.724]
  newZoom = 12.56;
}

var map = new mapboxgl.Map({
    style: "mapbox://styles/east1999/ckf10svqy2f0u1an8rsuneco1?optimize=true",
    container: "map",
    zoom: newZoom,
    center: newCenter
  });

async function fetchData() {
  const response = await fetch(' .netlify/functions/fetch');
  const records = await response.json();
  return records;
}

fetchData().then(records => {
  buildListCards(records);
  buildPicker(records);
  buildMap(records);
})

function buildMap(records) {

    if (!mobileWindow.matches) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
          trackUserLocation: true
        }),
        'top-right');
    };

    map.addSource('lx-arcgis', {
      type: 'geojson',
      data: records
    });

    map.addLayer({
      'id': 'lx',
      'type': 'circle',
      'source': 'lx-arcgis',
      'minzoom': 8,
      'paint': {
          'circle-radius': {
            stops: [[11, 3], [12.5, 3], [16, 10]]
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
    })

    map.on('click', function(e) {

      var features = map.queryRenderedFeatures(e.point, {layers: ['lx']});

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

    map.on('mouseenter', 'lx', function () {
      map.getCanvas().style.cursor = 'pointer';
      });
}

function buildListCards(records) {
  records.features.forEach(function(el){

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
    ref.innerHTML = 'Ocorrência n.º' + prop.id;

    var freguesia = listing.appendChild(document.createElement('div'));
    freguesia.innerHTML = '<span class="freg">' + prop.freg_descricao + '</span>';

    var areatipo = listing.appendChild(document.createElement('div'));
    areatipo.innerHTML = '<span class="tipo">' + prop.area + '</span>';

    listing.addEventListener('click', function(e){

        if(this.classList.contains('active')) {
          switchActives();
          if(document.getElementById("picker").value == "Filtrar") {
            map.flyTo({
              center: [-9.162,38.724],
              zoom: 12.56
            });
          }
          var popup = document.getElementsByClassName('mapboxgl-popup');
          if ( popup.length ) {
              popup[0].remove();
          }
        }
        else {
            getTo(el);
            switchActives();
            this.classList.add('active');
            createPopUp(el);
        }
    })
  })
}

function buildPicker(records) {

  var picker = document.getElementById("picker");
  picker.addEventListener('change', function(e) {  

    let cards = Array.from(document.querySelectorAll(".card"));
    let cardsFiltered;
    document.getElementById("empty").textContent = "";

        if (this.value != "Filtrar") {

            var search = this.value;
            if (!mobileWindow.matches) {
              cards.forEach(el => {el.style.display = "block";})
            }
            else {
              cards.forEach(el => {el.style.display = "inline-block";})
            }
            cardsFiltered = cards.filter((item) => !item.textContent.includes(search));
            cardsFiltered.forEach(el => {el.style.display = "none";})
            var bounds = new mapboxgl.LngLatBounds();
            let filteredRecords;

            if (this.options[this.selectedIndex].text.includes("Tipo")) {
                map.setFilter('lx', ['==', ['get', 'area'], search]);
                filteredRecords = records.features.filter((item) => item.properties.area.includes(search));
                if (filteredRecords.length > 0) {
                  filteredRecords.forEach (feature => bounds.extend(feature.geometry.coordinates))
                  map.fitBounds(bounds, {padding: 50});
                }
            }
            else {
                map.setFilter('lx', ['==', ['get', 'freg_descricao'], search]);
                filteredRecords = records.features.filter((item) => item.properties.freg_descricao.includes(search));
                if (filteredRecords.length > 0) {
                  filteredRecords.forEach (feature => bounds.extend(feature.geometry.coordinates))
                  map.fitBounds(bounds, {padding: 50});
                }
            }
            if (cardsFiltered.length == 500) {
                document.getElementById("empty").textContent = "Sem resultados 😥";    
            }
            var popUps = document.getElementsByClassName('mapboxgl-popup');
            if (popUps[0]) {popUps[0].remove()};
            var listings = document.getElementById("listings");
            if (mobileWindow.matches) {
              listings.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
        else {
            if (!mobileWindow.matches) {
              cards.forEach(el => {el.style.display = "block";})
            }
            else {
              cards.forEach(el => {el.style.display = "inline-block";})
            }
            
            map.setFilter('lx', null);
            map.flyTo({
              center: [-9.162,38.724],
              zoom: 12.56
            });

        }
  });
}

function getTo(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 15
  });
}

function switchActives() {
    var activeItem = document.getElementsByClassName('active');
    if (activeItem[0]) {
      activeItem[0].classList.remove('active');
    }
}

function createPopUp(currentFeature) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) {popUps[0].remove()};
  
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h1>Ocorrência n.º' + currentFeature.properties.id + '</h1><p>"' + currentFeature.properties.descricao + '"</p>')
      .addTo(map);

    var closeButton = document.getElementsByClassName('mapboxgl-popup-close-button');
    closeButton[0].addEventListener('click', function() {
        switchActives();
    })
}

// Modal

// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("modalBringer");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Mobile interactions

if(mobileWindow.matches) {
  var heading = document.getElementById("heading");
  heading.addEventListener('click', mobileReset);

  function mobileReset() {
    var cards = document.querySelectorAll('.card');
    document.getElementById("picker").value = "Filtrar";
    cards.forEach(el => {el.style.display = "inline-block";})
    map.setFilter('lx', null);
    map.flyTo({
      center: [-9.139, 38.720],
      zoom: 12
    });
  }
}
const listings = document.getElementById('listings');
const scrollToTopButton = document.getElementById('scrollTop');

const scrollFunc = () => {

  let y = window.scrollY;
  let h = window.innerHeight;
  let l = listings.scrollTop;

  if (l > h) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
};

listings.addEventListener("scroll", scrollFunc);

const scrollToTop = () => {
  const c = listings.scrollTop;
  if (c > 0) {
    window.requestAnimationFrame(scrollToTop);
    listings.scrollTo(0, c - c / 10);
  }
};

scrollToTopButton.onclick = function(e) {
  e.preventDefault();
  scrollToTop();
}  