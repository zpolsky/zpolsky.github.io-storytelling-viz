let dataByYear = {};

function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function getStateName(location) {
  return location.substring(location.indexOf(',') + 2);
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
  allYears.push(-1); // used to display all data
  return allYears;
}

// Adapted from http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
// Map json file found at https://www.packtpub.com/mapt/book/web_development/9781785280085/12/ch12lvl1sec57/creating-a-map-of-the-united-states
function createMap(year, allYears) {
  const width = 1000;
  const height = 500;
  const scale = 1000;

  let projection = d3.geoAlbersUsa()
        .translate([width/2, height/2])
        .scale([scale]);

  let path = d3.geoPath().projection(projection);

  let svg = d3.select('body')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

  let tooltip = d3.select('body')
		    .append('div')
    		.attr('class', 'tooltip')
    		.style('opacity', 0);

  let summaryBox = d3.select('body')
        .append('div')
        .attr('class', 'summaryBox')
        .style('opacity', 1);

  d3.json('./data/us-states.json', json => {

    if (year === -1) {
      for (let i = 0; i < allYears.length - 1; i++) {
        const currentYear = allYears[i];
        dataByYear[currentYear].forEach(d => {
          for (let j = 0; j < json.features.length; ++j) {
            const jsonState = json.features[j].properties.name;
            const stateName = getStateName(d.Location);
            if (stateName === jsonState) {
              if (!json.features[j].properties.shootings) {
                json.features[j].properties.shootings = [d];
              } else {
                json.features[j].properties.shootings.push(d);
              }
            }
          }
        });
      };
    } else {
      dataByYear[year].forEach(d => {
        for (let j = 0; j < json.features.length; ++j) {
          const jsonState = json.features[j].properties.name;
          const stateName = getStateName(d.Location);
          if (stateName === jsonState) {
            if (!json.features[j].properties.shootings) {
              json.features[j].properties.shootings = [d];
            } else {
              json.features[j].properties.shootings.push(d);
            }
          }
        }
      });
    }

    svg.selectAll('path')
      .data(json.features)
    	.enter()
    	.append('path')
    	.attr('d', path)
    	.style('stroke', '#fff')
    	.style('stroke-width', '1')
      .style('fill', d => {
        const value = d.properties.shootings;
        if (value) {
          return rgb(200, 0, 0)
        } else {
          return rgb(213, 222, 217);
        }
      })
      .on('click', d => {
        const shootings = d.properties.shootings;
        if (shootings) {

          let stateVictims = 0;
          let stateFatalities = 0;
          let statePolice = 0;
          let stateInjured = 0;

          shootings.forEach(shooting => {
            stateVictims += shooting.Total_Victims;
            stateFatalities += shooting.Fatalities;
            statePolice += shooting.Policeman_Killed;
            stateInjured += shooting.Injured;
          });

          summaryBox.html(() => {
            let text = `
            <h4><b>${getStateName(shootings[0].Location)}</b></h4>
            <p><b>Number of shootings</b>: ${shootings.length}</p>
            <span><b>Total Victims</b>: ${stateVictims}</span>
            <ul>
              <li>Fatalities: ${stateFatalities}</li>
              <li>Police Killed: ${statePolice}</li>
              <li>Injured: ${stateInjured}</li>
            </ul>
            <span><b>Shootings</b>:</span>
            <ul>
            `;
            console.log('shootings = ', shootings);
            shootings.forEach(shooting => {
              text += `<li><em>${shooting.Title} (${(new Date(shooting.Date)).getFullYear()})</em></li>`
            });
            text += '</ul>';
            return text;
          })
          .style('left', '1000px')
          .style('top', '200px');
        } else {
          summaryBox.html('')
          .style('left', '1000px')
          .style('top', '200px');
        }
      })

    svg.selectAll('circle')
      .data(() => {
        if (year === -1) {
          const allData = [];
          for (let i = 0; i < allYears.length - 1; i++) {
            const currentYear = allYears[i];
            dataByYear[currentYear].forEach(d => {
              allData.push(d);
            });
          };
          return allData;
        } else {
          return dataByYear[year];
        }
      })
      .enter()
      .append('circle')
      .attr('cx', d => {
        return projection([d.Longitude, d.Latitude])[0];
      })
      .attr('cy', d => {
        return projection([d.Longitude, d.Latitude])[1];
      })
      .attr('r', d => {
        return Math.sqrt(d.Total_Victims) * 1.5;
      })
      .style('fill', rgb(32, 32, 32))
      .style('opacity', 0.75)
      .on('mouseover', d => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.text(`${d.Title}`)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
      })
      .on('mouseout', d => {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0);
      })
      .on('click', d => {
        summaryBox.html(
          `
          <h5><b>${d.Title} (${(new Date(d.Date)).getFullYear()})</b></h5>
          <p><b>Location</b>: ${d.Location}</p>
          <p><b>Summary</b>: ${d.Summary}</p>
          <span><b>Total Victims</b>: ${d.Total_Victims}</span>
          <ul>
            <li>Fatalities: ${d.Fatalities}</li>
            <li>Police Killed: ${d.Policeman_Killed}</li>
            <li>Injured: ${d.Injured}</li>
          </ul>
          <span><b>Shooter</b>:</span>
          <ul>
            <li>Gender: ${d.Gender}</li>
            <li>Age: ${d.Age}</li>
            <li>Race: ${d.Race}</li>
            <li>Mental Health Issues: ${d.Mental_Health_Issues}</li>
          </ul>
          `
        )
        .style('left', '1000px')
        .style('top', '200px');
      })
  });
}

function loadYear(year, allYears, maxYear) {
  d3.selectAll('svg').remove();
  d3.selectAll('div').remove();
  d3.select('body').append('div').selectAll('button')
    .data(allYears)
    .enter()
    .append('button')
    .attr('type', 'button')
    .attr('class', d => {
      return (d === year) ? 'btn btn-danger' : 'btn btn-primary';
    })
    .style('margin', '0.2%')
    .on('click', d => {
      loadYear(d, allYears, maxYear);
    })
    .text(d => {
      return (d === -1) ? 'All Years' : d;
    });
  createMap(year, allYears);
}

function fixData(data) {
  data.forEach(d => {
    d.Total_Victims = +d.Total_Victims;
    d.Fatalities = +d.Fatalities;
    d.Policeman_Killed = +d.Policeman_Killed;
    d.Injured = +d.Injured;
    if (d.Gender === 'Male') {
      d.Gender = 'M';
    }
    if (d.Mental_Health_Issues === 'unknown') {
      d.Mental_Health_Issues = 'Unknown';
    }
    if (!d.Age) {
      d.Age = 'Unknown';
    }
  });
}

function loadMap() {
  d3.csv('./data/all-shootings.csv', data => {
    fixData(data);
    const allYears = getAllYears(data);
    const maxYear = Math.max(...allYears);
    loadYear(maxYear, allYears, maxYear);
  });
}

window.onload = loadMap;
