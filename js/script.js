let allData = [];
let xVar = 'temperature', yVar = 'precipitation', sizeVar = 'windSpeed', targetMonth = 1, targetDay=1, stateVar='GU';
let xScale, yScale, sizeScale;

const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const options = ['temperature', 'windDirection', 'precipitation', 'windSpeed'];

const t = 1000; // Transition duration

// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

function init() {
    d3.csv('data/weather.csv', function(d) {
        return {
            date: +d.date,
            year: +(d.date.substring(0, 4)),
            month: +(d.date.substring(4, 6)),
            day: +(d.date.substring(6)),
            temperature: +d.TAVG,
            windDirection: +d.WDF5,
            windSpeed: +d.AWND,
            precipitation: +d.PRCP,
            station: d.station,
            state: d.state
        };
    })
    .then(data => {
        allData = data;
        console.log(allData);
        setupSelector();
        updateAxes();
        updateVis();
    })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);

function setupSelector() {
    var slider = d3
        .sliderHorizontal()
        .min(d3.min(allData.map(d => d.month))) // setup the range
        .max(d3.max(allData.map(d => d.month))+1) // setup the range
        .step(1) // 1 day step
        .width(width)
        .displayValue(false)
        .on('onchange', (val) => {
            console.log(val);
            targetMonth = val; // Update the date
            updateVis(); // Refresh the chart
        });
    
    d3.select('#slider')
        .append('svg')
        .attr('width', width)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);

    var daySlider = d3
    .sliderHorizontal()
    .min(d3.min(allData.map(d => d.day))) // setup the range
    .max(d3.max(allData.map(d => d.day))) // setup the range
    .step(1) // 1 day step
    .width(width)
    .displayValue(false)
    .on('onchange', (val) => {
        console.log(val);
        targetDay = val; // Update the date
        updateVis(); // Refresh the chart
    });
    
    d3.select('#daySlider')
        .append('svg')
        .attr('width', width)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(daySlider);
    
    d3.selectAll('.variable')
        .each(function() {
            d3.select(this).selectAll('myOptions')
                .data(options)
                .enter()
                .append('option')
                .text(d => d)
                .attr("value", d => d);
        })
        .on("change", function(event) {
            const selectedId = d3.select(this).property("id");
            const selectedValue = d3.select(this).property("value");

            if (selectedId === "xVariable") {
                xVar = selectedValue;
            } else if (selectedId === "yVariable") {
                yVar = selectedValue;
            } else if (selectedId === "sizeVariable") {
                sizeVar = selectedValue;
            }

            updateAxes();
            updateVis();
        });
        d3.select('#xVariable').property('value', xVar)
        d3.select('#yVariable').property('value', yVar)
        d3.select('#sizeVariable').property('value',sizeVar)

        const stateSet = new Set(allData.map(d => d.state));
        d3.select('#stateVariable')
            .selectAll('myOptions')
            .data(stateSet)
            .enter()
            .append('option')
            .text(d => d)
            .attr("value", d => d);
        d3.select('#stateVariable').on("change", function() {
            const selectedState = d3.select(this).property("value");
            stateVar=selectedState
            updateAxes();
            updateVis();
        })
        d3.select('#stateVariable').property('value', stateVar);
    }

function updateAxes() {
    svg.selectAll('.axis').remove();
    svg.selectAll('.labels').remove();

    xScale = d3.scaleLinear()
        .domain([d3.min(allData, d => d[xVar]), d3.max(allData, d => d[xVar])])
        .range([0, width]);
    const xAxis = d3.axisBottom(xScale);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    yScale = d3.scaleLinear()
        .domain([d3.min(allData, d => d[yVar]), d3.max(allData, d => d[yVar])])
        .range([height, 0]);

    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, 0)`)
        .call(yAxis);

    sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(allData, d => d[sizeVar])])
        .range([5, 20]);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar)
        .attr('class', 'labels');

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar)
        .attr('class', 'labels');
}

function updateVis() {
    let currentData = allData.filter(d => d.month === targetMonth && d.day === targetDay && d.state === stateVar);

    svg.selectAll('.points')
        .data(currentData, d => d.date)
        .join(
            function(enter) {
                return enter
                    .append('circle')
                    .attr('class', 'points')
                    .attr('cx', d => xScale(d[xVar]))
                    .attr('cy', d => yScale(d[yVar]))
                    .attr('r', d => sizeScale(d[sizeVar]))
                    .style('opacity', .5)
                    .on('mouseover', function(event, d) {
                        d3.select(this)
                            .style("fill", "orange")
                            .style("opacity", 1);

                        d3.select('#tooltip')
                            .style("display", 'block')
                            .html(`<strong>Date: ${d.month}-${d.day}-${d.year}</strong><br/>${xVar}: ${d[xVar]}<br/>${yVar}: ${d[yVar]}`)
                            .style("left", (event.pageX + 20) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this)
                            .style("opacity", 0.5);

                        d3.select('#tooltip')
                            .style('display', 'none');
                    })
                    .attr('r', 0)
                    .transition(t)
                    .attr('r', d => sizeScale(d[sizeVar]));
            },
            function(update) {
                return update
                    .transition(t)
                    .attr('cx', d => xScale(d[xVar]))
                    .attr('cy', d => yScale(d[yVar]))
                    .attr('r', d => sizeScale(d[sizeVar]));
            },
            function(exit) {
                exit
                    .transition(t)
                    .attr('r', 0)
                    .remove();
            }
        );
}