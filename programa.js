
const WIDTH = 800;
const HEIGHT = 500;
const MARGIN = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const SCATTER_WIDTH = 1100;
const SCATTER_HEIGHT = 300;
const SCATTER_MARGIN = {
  top: 20,
  left: 70,
  right: 20,
  bottom: 30,
};

tooltip = function (d) {
  return "Comuna: " + d.NOM_COMUNA +
  "\nRegión: " + d.REGION + "°" +
  "\nIndice de dependencia juvenil: " + d.IND_DEP_JU +
  "\nIndice de dependencia adulto mayor: " + d.IND_DEP_VE +
  "\nNúmero de hombres cada 100 mujeres: " + d.INDICE_MAS;
}

const scatter = d3.select("#linechart").append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  // .style('background-color', '#eaebdc')

scatter
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", SCATTER_WIDTH - SCATTER_MARGIN.right - SCATTER_MARGIN.left)
  .attr("height", SCATTER_HEIGHT - SCATTER_MARGIN.top - SCATTER_MARGIN.bottom);

const contenedorEjeY = scatter
  .append("g")
  .attr("transform", `translate(${SCATTER_MARGIN.left}, ${SCATTER_MARGIN.top})`);


const contenedorEjeX = scatter
  .append("g")
  .attr("transform", `translate(${SCATTER_MARGIN.left}, ${SCATTER_HEIGHT - SCATTER_MARGIN.bottom})`);

const ChartContainer = scatter
  .append("g")
  .attr("transform", `translate(${SCATTER_MARGIN.left} ${SCATTER_MARGIN.top})`)
  .attr("clip-path", "url(#clip)");



// text label for the y axis
scatter.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 10)
.attr("x", - (SCATTER_HEIGHT / 2))
.attr("dy", ".7em")
.style("text-anchor", "middle")
.attr("font-size", 13)
.attr("font-family", "Arial, Helvetica, sans-serif")
.text("N° de suicidios por Año");   


function getElementY(query) {
  return window.pageYOffset + document.querySelector(query).getBoundingClientRect().top
}

function doScrolling(element, duration) {
	var startingY = window.pageYOffset
  var elementY = getElementY(element)
  // If element is close to page's bottom then window will scroll only to some position above the element.
  var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY
	var diff = targetY - startingY
  // Easing function: easeInOutCubic
  // From: https://gist.github.com/gre/1650294
  var easing = function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 }
  var start

  if (!diff) return

	// Bootstrap our animation - it will get called right before next frame shall be rendered.
	window.requestAnimationFrame(function step(timestamp) {
    if (!start) start = timestamp
    // Elapsed miliseconds since start of scrolling.
    var time = timestamp - start
		// Get percent of completion in range [0, 1].
    var percent = Math.min(time / duration, 1)
    // Apply the easing.
    // It can cause bad-looking slow frames in browser performance tool, so be careful.
    percent = easing(percent)

    window.scrollTo(0, startingY + diff * percent)

		// Proceed with animation as long as we wanted it to.
    if (time < duration) {
      window.requestAnimationFrame(step)
    }
  })
}


async function LineChart(data, height, width, margin, fillScale) {

    // data = await data.slice().sort((a, b) => d3.descending(a.INDICE_DEP, b.INDICE_DEP));

    const escalaX = await d3.scaleLinear()
    .domain(d3.extent(data.years, d => (d.year)))
    .range([0,  width - margin.right - margin.left]);

    var escalaXvar = escalaX;

    const escalaY = await d3.scaleLinear()
    .domain([d3.min(data.years, d => (d.suicides))-7, d3.max(data.years, d => (d.suicides))])
    .range([height - margin.top - margin.bottom, 0]);

    xAxis = d3.axisBottom(escalaX)
      // .ticks(8);
      // .tickFormat(d3.format("d"));
    
    yAxis = d3.axisLeft(escalaY)
      .ticks(9)
      // .tickFormat(d3.format("d"));

    contenedorEjeX
      .transition()
      .duration(300)
      .attr("class", "axisDark")
      .call(xAxis)
      .selection()
      .selectAll("text")
      .attr("font-size", 11);

    contenedorEjeY
      .transition()
      .duration(300)
      .attr("class", "axisDark")
      .call(yAxis)
      .selection()
      .selectAll("line")
      .attr("x1", width - margin.right - margin.left)
      .attr("stroke-dasharray", "5")
      .attr("opacity", 0.5);

    const line = d3.line()
      .x(function(d, i) { return escalaXvar(d.year); }) // set the x values for the line generator
      .y(function(d) { return escalaY(d.suicides); }) // set the y values for the line generator 
    

    ChartContainer.selectAll("path")
      .remove();

    const lines = ChartContainer.append("path")
      .datum(data.years)
      .attr("class", "line") // Assign a class for styling 
      .attr("d", line); // 11. Calls the line generator 
      
    scatter.call(manejadorZoom);


    function manejadorZoom(svg) {
  
      var extent = [
        [margin.left + 10, margin.top], 
        [width - margin.right, height - margin.top]
      ];
  
      var zooming = d3.zoom()
        .scaleExtent([1, 3])
        .translateExtent(extent)
        .extent(extent)
        .on("zoom", zoomed);
  
      svg.call(zooming);
  
      function zoomed(evento) {
  
        const transformacion = evento.transform;
        escalaXvar = transformacion.rescaleX(escalaX);
  
        svg.select(".line")
          .attr("d", line);
  
        contenedorEjeX.call(xAxis.scale(escalaXvar));
      }
    }
    // const circles = contenedorBarras.selectAll("circle")
    //   .data(data.years)
    //   .join(
    //     (enter) =>
    //     enter
    //       .append("path")
    //       .attr("fill", "white")
    //       .attr("opacity", 0.75)
    //       .transition()
    //       .duration(500)
    //       .attr("cx", (d) => x(d.INDICE_MAS))
    //       .attr("cy", (d) => y(d.IND_DEP_JU))
    //       .attr("r", 10)
    //       .attr("fill", (d) => fillScale(d.INDICE_DEP))
    //       .attr("stroke", "black")
    //       .attr("stroke-width", 0.5)
    //       .selection(),
    //     (update) =>
    //       update
    //         .attr("cx", (d) => x(d.INDICE_MAS))
    //         .attr("cy", (d) => y(d.IND_DEP_JU))
    //         .attr("fill", (d) => fillScale(d.INDICE_DEP))
    //         .selection(),
    //     (exit) =>
    //       exit
    //         .remove()
    //   )


    //   circles.selectAll("title").remove();

    //   circles.append("title")
    //     .text(tooltip)
}

const Chilegraph = async (height, width, margin) => {

  const legend = d3.select("#legend")
    .append("svg")
      .attr("width", "900px")
      .attr("height", "100px")

  const svg = d3
    .select("#map")
    .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style('background-color', 'rgb(166, 212, 228)')

  const container = svg
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

  const states = container.append("g")

  const leyenda = await legend.append("g")
      .attr("transform", 'translate(50, 30)');


  const geoData = await d3.json("./data/custom.geo.json");

  const data = await d3.json("./data/data.json", function(d) {
    return d;
  });

  var selected;

  var elems = {};
  
  for (var i = 0; i < data.length; i++){
    elems[data[i]["pais"]] = data[i];
  }

  function country_exists(index, p){
    
      let properties;
      if (!p){
        properties = geoData.features[index].properties;
      }
      else {
        properties = p.properties;
      }
      let possible_names = [properties.name, properties.formal_en, properties.name_long, properties.name_sort];
      for (var i = 0; i < possible_names.length; i++){
        if (possible_names[i] in elems){
          return possible_names[i];
        }
      }
      return NaN;
  }

  function data_fill(index, p){

    let name = country_exists(index, p);
    if (name){
        return fillScale(elems[name].summary);
    }
    return "#ddd";
  }

  function get_country_suicides(index){
    let name = country_exists(index, NaN);
    if (name){
      return elems[name].summary.toFixed(2);
    }

    return "No hay información.";
  }
  
  let max = await d3.max(data, function(d) { return parseFloat(d["summary"]) });
  let min = await d3.min(data, function(d) { return parseFloat(d["summary"]) });

  const interpolator = await d3.interpolate(min, max);
  const rangos = d3.quantize(interpolator, 9);

  var categories = [];

  for (let i = 0; i < 8; i++){
    categories.push(((rangos[i] + rangos[i+1])/2).toFixed(2));
  }


  const zoom = d3.zoom()
    .scaleExtent([1, 50])
    .translateExtent([
      [0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom],
    ])
    .on("zoom", (e) => container.attr("transform", e.transform));

  svg.call(zoom)

  const geoScale = d3
    .geoMercator()
    .fitSize(
      [width - margin.left - margin.right, height - margin.top - margin.bottom], 
      geoData
    );
    
  const fillScale = await d3
    .scaleQuantize()
    .domain(d3.extent(data, (d) =>  parseFloat(d["summary"])))
    .range(d3.schemeReds[8])

  const geoPaths = d3.geoPath().projection(geoScale);

  leyenda.selectAll("mydotsleyend")
    .data(categories)
    .enter()
    .append("rect")
      .attr("x", function(d,i){ return i*width/8})
      .attr("y", 5) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("height", 10)
      .attr("width", width/8)
      .attr("fill", function(d){ return fillScale(d)})
      .attr("stroke", "black")
      .attr("stroke-width", .5)

  leyenda.selectAll("mytextleyend")
      .data(rangos)
      .enter()
      .append("text")
        .attr("x", (d, i) => i*width/8)
        .attr("y", (d, i) => -10)
        .text(function(d) {return d.toFixed(2)})
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("font-size", 13)

  function clicked(event, d) {

    if (!selected){
      let name = country_exists(NaN, d);
      if (name){
        selected = [this, d];
        d3.select(this)
        .attr("fill", "rgb(255, 255, 140)")  //0,02

        d3.select("#country_name").text(name);
        doScrolling("#country_name", 1000);
        LineChart(elems[name], SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale);
        BarChart(elems[name].rango_etario, SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale);        
      }
    }
    else {
      let name = country_exists(NaN, d);
      if (name){
        if (this == selected[0]){
          selected = NaN;
          d3.select(this)
            .attr("fill", data_fill(NaN, d))  //0,02
          return;
        }
        d3.select(selected[0])
          .attr("fill", data_fill(NaN, selected[1]))
        selected = [this, d];
        d3.select(this)
        .attr("fill", "rgb(255, 255, 140)")  //0,02

        d3.select("#country_name").text(name);
        doScrolling("#country_name", 1000);
        LineChart(elems[name], SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale);
        BarChart(elems[name].rango_etario, SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale); 
        
      }
    }    
  } 


  var comunas = states
    .selectAll("path")
    .data(geoData.features, (d) => d.properties.NAME)
    .join("path")
      .attr("d", geoPaths)
      .attr("fill", "#fff")
      .attr("fill", (d, i) => data_fill(i))
      .attr("stroke", "#777")
      .attr("stroke-width", 0.1) //0,02
      .on("mouseover", function (d, i) {
        d3.select(this).transition()
             .duration('200')
             .attr('opacity', '.8');})
      .on("mouseout", function (d, i) {
        d3.select(this).transition()
            .duration('200')
            .attr('opacity', 1);})
    .on("click", clicked)

    comunas.append("title")
    .text((d, i) => d.properties.name + "\n" + 
                  get_country_suicides(i));

    LineChart(elems["Chile"], SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale);
    BarChart(elems["Chile"].rango_etario, SCATTER_HEIGHT, SCATTER_WIDTH, SCATTER_MARGIN, fillScale);
}

var BarChartSVG = d3.select('#barchart').append("svg")
.attr("width", SCATTER_WIDTH + SCATTER_MARGIN.left + SCATTER_MARGIN.right)
.attr("height", SCATTER_HEIGHT + SCATTER_MARGIN.top + SCATTER_MARGIN.bottom)
.append("g")
.attr("transform", "translate(" + SCATTER_MARGIN.left + "," + SCATTER_MARGIN.top + ")");

var BarchartEjeX = BarChartSVG.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + SCATTER_HEIGHT + ")");

var BarchartEjeY = BarChartSVG.append("g")
.attr("class", "y axis")
.style('opacity','0')


BarChartSVG.select('.y').transition().duration(500).delay(1300).style('opacity','1');

// text label for the y axis
BarChartSVG.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 10 - SCATTER_MARGIN.left)
.attr("x", - (SCATTER_HEIGHT / 2))
.attr("dy", ".7em")
.style("text-anchor", "middle")
.attr("font-size", 13)
.attr("font-family", "Arial, Helvetica, sans-serif")
.text("N° de suicidios en el 2013");   


async function BarChart(data, height, width, margin, fillScale) {
    
  var x0 = d3.scaleBand()
  .range([0, width - margin.right - margin.left])
  .padding([0.5]);

  var x1 = d3.scaleBand();

  var y = d3.scaleLinear()
  .range([height, 0]);

  var xAxis = d3.axisBottom(x0);

  var yAxis = d3.axisLeft(y).ticks(8);

    
  var color = d3.scaleOrdinal()
  .range(["rgb(161, 27, 27)","rgb(38, 38, 110)"]);


  var categoriesNames = data.map(function(d) { return d.rango; });
  var rateNames = ["female", "male"];

  
  x0.domain(categoriesNames);
  x1.domain(rateNames).range([0, x0.bandwidth()]);
  y.domain([0, d3.max(data, function(categorie) { return d3.max(categorie.values, function(d) { return d.rate; }); })]);

  BarchartEjeX.call(xAxis).style("font-size", "13px");
  BarchartEjeY.call(yAxis)
    .selection()
    .selectAll("line")
    .attr("x1", width - margin.right - margin.left)
    .attr("stroke-dasharray", "5")
    .attr("opacity", 0.3);

  
  BarChartSVG.selectAll(".slice").remove();

  var slice = BarChartSVG.selectAll(".slice")
      .data(data)
      .enter().append("g")
      .attr("class", "slice")
      .attr("transform",function(d) { return "translate(" + x0(d.rango) + ",0)"; })
      

  slice.selectAll("rect")
      .data(function(d) { return d.values; })
      .join(
      (enter) => enter.append("rect")
        .attr("width", x1.bandwidth)
        .attr("x", function(d) { return x1(d.sex); })
        .style("fill", function(d) { return color(d.sex) })
        .attr("y", function(d) { return y(0); })
        .attr("height", function(d) { return height - y(0); })
        .selection(),
      (update) => 
      update
        .transition()
        .duration(1000)
        .attr("y", function(d) { return y(0); })
        .attr("height", function(d) { return height - y(0); })
        .selection(),
      (exit) =>
      exit
        .transition()
        .duration(500)
        .attr("y", height - margin.top - margin.bottom)
        .attr("height", 0)
        .remove()
      )

  slice.selectAll("rect")
      .transition()
      .delay(function (d) {return Math.random()*1000;})
      .duration(1000)
      .attr("y", function(d) { return y(d.rate); })
      .attr("height", function(d) { return height - y(d.rate); });

     //Legend
  var legend = BarChartSVG.selectAll(".legend")
    .data(data[0].values.map(function(d) { return d.sex; }).reverse())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; })
      .style("opacity","0");

    legend.append("rect")
      .attr("x", width - 18 - margin.left)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(d) { return color(d); });

    legend.append("text")
      .attr("x", width - 24 - margin.left)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .attr("font-family", "Arial, Helvetica, sans-serif")
      .text(function(d) {return d; });

    legend.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");


}

Chilegraph(HEIGHT, WIDTH, MARGIN)