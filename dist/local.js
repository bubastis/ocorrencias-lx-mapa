let records;
let moreRecords = {};
let offset = 0;
let hover = false;

// Initialize map

const mobileWindow = window.matchMedia("(max-width: 414px)");

if (mobileWindow.matches) {
  newCenter = [-9.139, 38.720];
  newZoom = 12;
}
else {
  newCenter = [-9.16638372975865,38.74510547492159]
  newZoom = 11.85;
}

mapboxgl.accessToken = "pk.eyJ1IjoiZWFzdDE5OTkiLCJhIjoiY2l5dW96ZXZxMDFyMzM4bXl6MDI3M2liOSJ9.zN_d4GPduMmFnsFDYuNnGw";

let map = new mapboxgl.Map({
    style: "mapbox://styles/east1999/ckf10svqy2f0u1an8rsuneco1",
    container: "map",
    zoom: newZoom,
    center: newCenter
  });

// First fetch

let url = ".netlify/functions/fetch";

async function fetchData() {
  const response = await fetch(url)
  const records = await response.json();
  return records;
}

fetchData().then(records => {
  buildListCards(records);
  Object.assign(moreRecords, records)
  buildMap(moreRecords);
})

function buildMap(moreRecords) {

    if (!mobileWindow.matches) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
          trackUserLocation: true,
          showUserLocation: true,
          showAccuracyCircle: true
        }),
        'top-right');
    };

  
    map.addSource('lx-arcgis', {
      'type': 'geojson',
      'data': moreRecords
    });

    map.addLayer({
      'id': 'lx',
      'type': 'circle',
      'source': 'lx-arcgis',
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

    map.on('mouseenter', 'lx', function(e) {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'lx', function(e) {
      map.getCanvas().style.cursor = '';
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
      else {
        var popUps = document.getElementsByClassName('mapboxgl-popup');
        if (popUps[0]) {popUps[0].remove()};
        switchActives();
      }
    });
}

function buildListCards(records) {
  (document.getElementById("mais-occ") ? document.getElementById("mais-occ").remove() : "")
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
    ref.innerHTML = 'Ocorrência ' + prop.id;

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

  // Create fetch more Button

  let loadmore = document.createElement('div');
  loadmore.id = "mais-occ";
  if (mobileWindow.matches) {
    loadmore.innerText = "Mais?";
  }
  else {
    loadmore.innerText = "Mais ocorrências";
  }
  listings.appendChild(loadmore);

  // Add fetch more listener

  document.getElementById("mais-occ").addEventListener("click", () => {
    
    if(!mobileWindow.matches) {
      loadmore.innertext = "A carregar.."
    }
    else {
      loadmore.innertext = "A carregar..." 
    }
    offset += 500;
    fetch(url + '?offset=' + offset)
    .then(response => response.json())
    .then(data => {
      data.features.forEach(el => moreRecords.features.push(el))
      map.getSource("lx-arcgis").setData(moreRecords);
      buildListCards(data)
      filterCardsAndMap(data);
    })
  })
}

const picker = document.getElementById("picker");
picker.addEventListener('change', function(e) {
  filterCardsAndMap(moreRecords)
})

function filterCardsAndMap() {

  // console.log("Checking for filter") Define variables 

  let cards = Array.from(document.querySelectorAll(".card"));
  let cardsFiltered;
  document.getElementById("noresults").textContent = "";

  // Remove popups & reset scrolling on mobile

  var popUps = document.getElementsByClassName('mapboxgl-popup');
  if (popUps[0]) {popUps[0].remove()};
  switchActives();

  if (picker.value != "Filtrar") { 

    var listings = document.getElementById("listings");
    if (mobileWindow.matches) {
      listings.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // console.log("No filter. Filtering..") Filtering cards first

    var search = picker.value;
    cards.forEach(el => {el.style.display = "block";})
    cardsFiltered = cards.filter((item) => !item.textContent.includes(search));
    cardsFiltered.forEach(el => {el.style.display = "none";})

    // Preparing bounds variable

    var bounds = new mapboxgl.LngLatBounds();
    let filteredRecords = moreRecords.features;

    if (cardsFiltered.length == cards.length) { // Show no results
      document.getElementById("noresults").textContent = "Sem resultados 😥";    
    }

    if (picker.options[picker.selectedIndex].text.includes("Tipo")) {

        // console.log("Applying type filter") Type filter & bounds
        map.setFilter('lx', ['==', ['get', 'area'], search]);
        filteredRecords = moreRecords.features.filter((item) => item.properties.area.includes(search));

    }
    else {
        // console.log("Applying area filter") Area filter & bounds
        if(search.includes("Benfica") && !search.includes("Domingos")) {
          map.setFilter('lx', ['==', ['get', 'geo_freguesia_id'], "109"]); 
          filteredRecords = moreRecords.features.filter((item) => item.properties.geo_freguesia_id.includes("109"));  
        }
        else {
          map.setFilter('lx', ['==', ['get', 'freg_descricao'], search]);
          filteredRecords = moreRecords.features.filter((item) => item.properties.freg_descricao.includes(search)); 
        }
    }

    if (filteredRecords.length > 0) { // Adapt bounds
      filteredRecords.forEach (feature => bounds.extend(feature.geometry.coordinates))
      map.fitBounds(bounds, {padding: 50});
    }
  }
  else { // Full reset for position and filters

    map.setFilter('lx', null);
    if(!mobileWindow.matches) {
      map.flyTo({
        center: [-9.162,38.724],
        zoom: 12.56
      });
    }
  }
}

// Card-Map Actions

function getTo(currentFeature) { // Go to Point
  if (map.getZoom() < 15) {
    map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
    })
  }
}

function createPopUp(currentFeature) { // Create popups
  var popUps = document.getElementsByClassName('mapboxgl-popup');
  if (popUps[0]) {popUps[0].remove()};

  var popup = new mapboxgl.Popup({closeOnClick: false})
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML('<h1>Ocorrência n.º' + currentFeature.properties.id + '</h1><p>"' + currentFeature.properties.descricao + '"</p>')
    .addTo(map);

  var closeButton = document.getElementsByClassName('mapboxgl-popup-close-button');
  closeButton[0].addEventListener('click', function() {
    switchActives();
  })
}

function switchActives() { // Switch class on active cards
    var activeItem = document.getElementsByClassName('active');
    if (activeItem[0]) {
      activeItem[0].classList.remove('active');
    }
}



// Making modal

var modal = document.getElementById("modalInfo"); 
var modalButton = document.getElementById("faq"); 
var span = document.getElementsByClassName("close")[0];

modalButton.onclick = function() {
  modal.style.display = "block";
}

span.onclick = function() { 
  modal.style.display = "none";
}
window.onclick = function(event) { 
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Header as mobile reset button

if(mobileWindow.matches) {
  var heading = document.getElementById("heading");
  heading.addEventListener('click', mobileReset);

  function mobileReset() {
    var cards = document.querySelectorAll('.card');
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) {popUps[0].remove()};
    document.getElementById("picker").value = "Filtrar";
    cards.forEach(el => {el.style.display = "inline-block";})
    map.setFilter('lx', null);
    map.flyTo({
      center: [-9.139, 38.720],
      zoom: 12
    });
  }
}

// Sidebar scroll to top

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