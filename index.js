function getAllYears(data) {
  const allYears = [];
  const yearSet = new Set();
  data.forEach(d => {
    const date = (new Date(d.Date)).getFullYear();
    if (!yearSet.has(date)) {
      allYears.push(date);
      yearSet.add(date);
    }
  });
  return allYears;
}

// Adapted from http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
// Map json file found at https://www.packtpub.com/mapt/book/web_development/9781785280085/12/ch12lvl1sec57/creating-a-map-of-the-united-states
function createMap() {
  const width = 1000;
  const height = 600;

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
    	.style('fill', 'rgb(213,222,217)');
  });
}

function loadYear(year) {
  createMap();
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
    loadYear(maxYear);
  });
}

window.onload = loadMap;
