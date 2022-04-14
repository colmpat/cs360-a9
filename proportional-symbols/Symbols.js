const draw = async () => {
    let data,
        json,
        centroids;

    try {
        // state data
        data = await d3.csv('expensive-states.csv', d => {
            return {
                rank: +d.costRank,
                state: d.State,
                housingCost: +d.housingCost
            }
        })

        // geoJSON data
        json = await d3.json('us-states.json')

        // Lat/Long data for state centroids
        centroids = await d3.csv('centroids.csv', d => {
            return {
                state: d.state,
                coordinates: [+d.long, +d.lat]
            }
        });
    } catch (e) {
        console.log("error fetching csv", e)
    }

    //Width and height
    let w = 960,
        h = 500;

    let sizeScale = d3.scaleQuantize()
    .domain(d3.extent(data.map(d => d.housingCost)))
    .range([5, 10, 15, 20])

    //Define map projection
    let projection = d3.geoAlbersUsa()
        .translate([w / 2, h / 2])
        .scale([800]);

    //Define path generator
    let path = d3.geoPath()
        .projection(projection);

    //Create SVG element
    let svg = d3.select("body")
        .append("svg")
        .attr('class', 'map')
        .attr("viewbox", `0 0 ${w} ${h}`);

    for(let i = 0; i < data.length; i++) {
        //Grab state name
        var dataState = data[i].name;

        //Grab data value, and convert from string to float
        var dataValue = data[i].housingCost;

        //Find the corresponding state inside the GeoJSON
        for (var j = 0; j < json.features.length; j++) {

            var jsonState = json.features[j].properties.name;

            if (dataState == jsonState) {

                //Copy the data value into the JSON
                json.features[j].properties.value = dataValue;

                //Stop looking through the JSON
                break;
            }
        }
    }

    // state outlines
    svg.selectAll('path')
        .data(json.features)
        .attr('transform', 'translate(' + 15 + ',' + 10 + ')')
        .enter()    
        .append('path')
        .attr('d', path)
        .attr('fill', '#eee')
        .attr('stroke', '#121212')
        .attr('stroke-linejoin', 'round')

    // centroids
    svg.selectAll('.dot')
        .attr('transform', 'translate(' + 15 + ',' + 10 + ')')
        .data(centroids)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => projection(d.coordinates)[0])
        .attr('cy', d => projection(d.coordinates)[1])
        .attr('r', d => sizeScale(getCostById(d.state)))

    let legendSize = d3.legendSize()
    .scale(sizeScale)
    .shape('circle')
    .shapePadding(10)
    .labelOffset(10)
    .labelFormat(d3.format('.0r'))
    .title("Housing Cost per State")

    svg.append("g")
    .attr("class", "legendSize")
    .attr("transform", "translate(40, 40)")
    .call(legendSize)

    function getCostById(state) {
        let stateData = data.find(d => d.state == state);
        return stateData.housingCost;
    }
}

draw()