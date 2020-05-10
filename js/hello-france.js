
margin = {top: 40, right: 200, bottom: 60, left: 100};
const w = 750 - margin.left - margin.right;
const h = 600 - margin.top - margin.bottom;
let dataset = [];
let x = [];
let y = [];

//Create SVG element
let svg = d3.select("body")
            .append("svg")
                .attr("width", w + margin.left + margin.right)
                .attr("height", h + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Load the data
d3.tsv("data/france.tsv")
  .row( (d, i) => {
      return {
          codePostal: +d["Postal Code"],
          inseeCode: +d.inseecode,
          place: d.place,
          longitude: +d.x,
          latitude: +d.y,
          population: +d.population,
          density: +d.density

      };
    })
    .get( (error, rows) => {
        console.log("Loaded " + rows.length + " rows");
        if (rows.length > 0) {
            console.log("First row: ", rows[0])
            console.log("Last row: ", rows[rows.length-1])
        }

  // ---------------------------//
  //       AXIS  AND SCALE      //
  // ---------------------------//
        
        // Add X axis
        x = d3.scaleLinear()
                .domain(d3.extent(rows, (row) => row.longitude))
                .range([0, w]);

        svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0,"+ h +")")
                .call(d3.axisBottom(x));

        
        // Add X axis label
        svg.append("text")
                .attr("class", "axistitle")
                .attr("x", w+40)
                .attr("y", h+8 )
                .text("Latitude");

        // Add Y axis
        y = d3.scaleLinear()
                .domain(d3.extent(rows, (row) => row.latitude))
                .range([h, 0]);
        
        svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(y));

        // Add Y axis label
        svg.append("text")
                .attr("class", "axistitle")
                .attr("x", -40)
                .attr("y", -20 )
                .text("Longitude")

        dataset = rows;
        draw();
    })


function draw() {

  // ------------------//
  //       CIRCLES     //
  // ------------------//

    // Define the div for the tooltip
    var div = d3.select("body").append("div")	
                .attr("class", "tooltip")				
                .style("opacity", 0);   

    // Add a scale for bubble size
    var size = d3.scaleSqrt()
        .domain([0, 100000, 2500000])
        .range([0.2, 5, 30]);

    // Add a scale for stroke width
    var width_stroke = d3.scaleLinear()
        .domain([0, 200000, 2500000])
        .range([0.1, 1, 1]);

    // Add a scale for bubble color
    var color = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, 20000]);

    // Add circles
    svg.append('g')
        .selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
            .attr("cx", (d) => x(d.longitude))
            .attr("cy", (d) => y(d.latitude))
            .attr("r", (d) => size(d.population))
            .style("fill", (d) => color(d.density))
            .style("stroke", "black")
            .attr("stroke-width", (d) => width_stroke(d.population))
            .attr("fill-opacity", 0.9)

        // Trigger the functions for hover
        .on("mouseover", function(d){
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html("<b>Place</b>: " + d.place + "<br>" + "<b>Postal code</b>: " + d.codePostal)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
    
  // ------------------//
  //       LEGEND      //
  // ------------------//
    
    // 1 - Add legend for population
    var valuesToShow = [100000, 1000000, 2500000]
    var xCircle = w+50
    var xLabel = w+100
    var yCircle = 400

    svg.selectAll("legend")
        .data(valuesToShow)
        .enter()
        .append("circle")
        .attr("cx", xCircle)
        .attr("cy", function(d){ return yCircle - size(d) } )
        .attr("r", function(d){ return size(d) })
        .style("fill", "none")
        .attr("stroke", "black")

    // Add legend: segments
    svg.selectAll("legend")
        .data(valuesToShow)
        .enter()
        .append("line")
        .attr('x1', function(d){ return xCircle + size(d) } )
        .attr('x2', xLabel)
        .attr('y1', function(d){ return yCircle - size(d) } )
        .attr('y2', function(d){ return yCircle - size(d) } )
        .attr('stroke', 'black')
        .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg.selectAll("legend")
        .data(valuesToShow)
        .enter()
        .append("text")
        .attr('x', xLabel)
        .attr('y', function(d){ return yCircle - size(d) } )
        .text( function(d){ return d } )
        .style("font-size", 10)
        .attr('alignment-baseline', 'middle')

    // Add legend title "Number of inhabitants"
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", xCircle-50)
        .attr("y", yCircle - 70)
        .text("Number of inhabitants")
        .attr("text-anchor", "start")

    // 2 - Add legend for density of population
    var defs = svg.append("defs");

    var grad = defs.append('svg:linearGradient')
        .attr('id', 'grad')
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');
    
    axisScale = d3.scaleLinear()
        .domain(color.domain())
        .range([1,100]);
    
    var legendaxis = d3.axisRight(axisScale)
          .ticks(4)
          .tickSize(6);
    
    grad.selectAll('stop')
        .data(color.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: color(t) })))
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    
    svg.append('rect')
        .attr('x', xCircle)
        .attr('y', 200)
        .attr('width', 20)
        .attr('height', 100)
        .style('fill', 'url(#grad)')

    svg.append("g")
        .attr("class", "legendaxis")
        .attr("transform", "translate(" + (xCircle+20) + ",199)")
        .call(legendaxis);
    
    // Add legend title "Density (inhabitants/km2)"
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", xCircle-50)
        .attr("y", yCircle - 215)
        .text("Density (inhabitants/km2)")
        .attr("text-anchor", "start")

    // Add my name
    svg.append("text")
        .attr("class", "author")
        .attr("x", w/2 - 40)
        .attr("y", -30)
        .text("Author : Camille COCHENER")

}



