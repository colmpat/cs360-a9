const fetchCSV = async () => {
    let path = './PopulationEstimates.csv'
    return await d3.csv(path, d => {
        d['1990'] = +d['1990'];
        d['2000'] = +d['2000'];
        d['2010'] = +d['2010'];
        d['2020'] = +d['2020'];
        return d
    })
}

const draw = async () => {
    let data;

    try {
        data = await fetchCSV();
    } catch (e) {
        console.log("error fetching csv", e)
    }

    //Width and height
    let w = 900,
        h = 500;
    
    let colorScale = d3.scaleQuantize()
    .domain(d3.extent(data.map(d => d['2020'])))
    .range([
        'rgb(254,229,217)',
        'rgb(252,174,145)',
        'rgb(251,106,74)',
        'rgb(222,45,38)',
        'rgb(165,15,21)'
    ])

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

    //Load in GeoJSON data
    let json = await d3.json("./us-states.json")

    for(let i = 0; i < data.length; i++) {
        //Grab state name
        var dataState = data[i].name;

        //Grab data value, and convert from string to float
        var dataValue = data[i]['2020'];

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

    svg.selectAll('path')
        .data(json.features)
        .attr('transform', 'translate(' + 15 + ',' + 10 + ')')
        .enter()    
        .append('path')
        .attr('d', path)
        .attr('fill', d => {
            let v = d.properties.value;

            return v ? colorScale(v) : '#eee';
        })
        .attr('stroke', '#121212')
        .attr('stroke-linejoin', 'round')

        var legend = d3.legendColor()
        .labelFormat(d3.format(".4s"))
        .title("Population by State in 2020")
        .scale(colorScale)

        
        svg.append("g")
        .attr("class", "legendQuant")
        .attr("transform", "translate(20,20)")
        .call(legend)

}

draw()