let dataByYear = {};

function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function getAllYears(data) {
  // Create array to store all years for buttons
  const allYears = [];
  const yearSet = new Set();
  data.forEach(d => {
    const date = (new Date(d.Date)).getFullYear();
    if (!yearSet.has(date)) {
      allYears.push(date);
      yearSet.add(date);
    }
  });
  allYears.reverse();

  // Create dictionary of shootings by years
  allYears.forEach(year => {
    const yearData = [];
    data.forEach(d => {
      const date = (new Date(d.Date)).getFullYear();
      if (year === date) {
        yearData.push(d);
      }
    })
    dataByYear[year] = yearData;
  });
  return allYears;
}

// Adapted from https://stackoverflow.com/questions/11149144/google-maps-get-latitude-and-longitude-having-city-name
function getCoordinates(allYears) {

  const updatedData = dataByYear;
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    allYears.forEach(year => {
      updatedData[year].forEach(shooting => {
        if (!shooting.Latitude || !shooting.Longitude) {
          const city = shooting.Location.substring(0, shooting.Location.indexOf(',')).toLowerCase();
          geocoder.geocode({'address': `${city}, us`}, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
              shooting.Latitude = results[0].geometry.location.lat();
              shooting.Longitude = results[0].geometry.location.lng();
              console.log('shooting = ', shooting);
            } else {
              console.error("Error occurred: ", status);
              dataByYear = updatedData;
            }
          });
        }
      });
    });
    resolve(updatedData);
  });
}

// Adapted from http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
// Map json file found at https://www.packtpub.com/mapt/book/web_development/9781785280085/12/ch12lvl1sec57/creating-a-map-of-the-united-states
function createMap(year) {
  const width = 1000;
  const height = 500;

  let projection = d3.geoAlbersUsa()
        .translate([width/2, height/2])
        .scale([1000]);

  let path = d3.geoPath().projection(projection);

  let svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

  d3.json('./data/us-states.json', json => {
    svg.selectAll('path')
      .data(json.features)
    	.enter()
    	.append("path")
    	.attr("d", path)
    	.style("stroke", "#fff")
    	.style("stroke-width", "1")
      .style('fill', d => {
        return rgb(213, 222, 217);
      });
  });
}

function loadYear(year) {
  d3.selectAll('svg').remove();
  createMap(year);
}

function loadMap() {
  d3.csv('./data/all-shootings.csv', data => {
    const allYears = getAllYears(data);
    const maxYear = Math.max(...allYears);
    d3.select("body").select("#buttons-div").selectAll("button")
      .data(allYears)
      .enter()
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-primary")
      .style("margin", "0.2%")
      .on("click", d => {
        loadYear(d);
      })
      .text(d => {
        return d;
      });

    getCoordinates(allYears)
      .then(updatedData => {
        console.log('resolved')
        dataByYear = updatedData;
        loadYear(maxYear);
      })
      .catch(error => {
        console.log('rejected')
      })
  });
}

window.onload = loadMap;
