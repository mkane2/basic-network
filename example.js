// to run a local server, run in console:
// python -m SimpleHTTPServer

// the variables that are easy to change.  In line 111 this graph uses d.gender to color by the F/M gender domain.  Domain should list an array of the possible values in the attribute to be used for color.  Range is an array of hex value colors listed in the same order as their values in domain
var domains = ["F", "M"];
var range = ["#A15EC0","#bebdc0"];
var stroke = "lightgray";

// the name of the svg box to draw the graph in, and tell d3 where and what size to draw it
var selector = "svg#example"
var svg_make = d3.select(".container").append("svg").attr("id", "example").attr("height", 400).attr("width", 400)

// this is to size the nodes by number of edges if you don't have degree or betweenness defined on your nodes.  You don't need this if you have something defined on your nodes to use to size them.
var sqrtScale = d3.scaleSqrt().domain([0, 100]).range([0, 30]);

// the name of the file where your data is.  It needs to be formatted as a json with {"nodes": [ {each node and its info}], "links": [ {each edge and its info} ] }
var data = "data.json"

// tell d3 to draw your data in the defined box
draw(selector, data);

// the actual function to draw the graph!
function draw(selector, data){

  // selects the div on the page for where to draw the network
  var svg = d3.select(selector),
  width = +svg.attr("width"),
  height = +svg.attr("height");

  // makes an invisible tooltip to be shown later on hover
  var tooltip = d3.select("body").append("div").attr("class", "tooltip");
  // var toggle = 0;

  d3.json(data, function(error, graph) {
        if (error) throw error;

        //set up the simulation and add forces
        // these numbers can be adjusted depending on how strong you want your gravity
        // see https://github.com/d3/d3-force or https://www.d3indepth.com/force-layout/ for how to adjust these
        var simulation = d3.forceSimulation()
                           .nodes(graph.nodes);

        var link_force =  d3.forceLink(graph.links)
                             .id(function(d) { return d.id; });

        var charge_force = d3.forceManyBody().strength(- 10);

        var center_force = d3.forceCenter(width / 2, height / 2);

        // this is the one you will most likely need to adjust.  The radius here should be the same as the radius defined below for your nodes.
        var collision = d3.forceCollide().radius(function(d) {return sqrtScale(d.EdgeCount/100) + 4});

        simulation
             .force("charge_force", charge_force)
             .force("center_force", center_force)
             .force("links",link_force)
             .force("collision", collision);

       // what the simulation should do on change
       simulation.on("tick", tickActions );

       //add encompassing group for the zoom
       var g = svg.append("g").attr("class", "everything");

       //draw lines for the links
       var link = g.append("g")
           .attr("class", "links")
           .selectAll("line")
           .data(graph.links)
           .enter().append("line")
           .attr("stroke-width", 2)
           .style("stroke", stroke)
           .style("opacity", .7);

       // make the tooltip.  You can add in tooltip.html whatever node attributes you want to display with html formatting.
       var tooltip_in = function(d) {
         tooltip.html("<h4>" + d.id + "</h4>")
           .style("left", (d3.event.pageX) + "px")
           .style("top", (d3.event.pageY - 28) + "px")
           .style("opacity", 1);
       };

       // fade out the tooltip when not hovered
       var tooltip_out = function(d) {
         tooltip.transition().duration(50) // duration is critical for mouse over.. if a user is moving the mouse fast the tooltip is not responsive
           .style("opacity", 0);
       }

       //size the nodes based on number of edges.  If you have degree in your data already, you can substitute in degree
       var radius = function(d) {
         return sqrtScale(d.EdgeCount/100) + 2
         // return d.degree // if you have degree
       }

       // draw the nodes
       var node = g.append("g")
               .attr("class", "nodes")
               .selectAll("circle")
               .data(graph.nodes)
               .enter()
               .append("circle")
               .attr("r", radius)
               .attr("fill", "black")
               .on("mouseover", tooltip_in)
               .on("mouseout", tooltip_out);

       var color_palette = d3.scaleOrdinal()
          .domain(domains)
          .range(range);
      // this is where you define the node attribute that should color your nodes.  change out d.gender for d.your_attribute
       var color = function(d,i){ return color_palette(d.gender) };

       // don't touch this, it handles changes to the graph as the simulation runs.
       function tickActions() {
           //update circle positions each tick of the simulation
              node
               .attr("cx", function(d) { return d.x; })
               .attr("cy", function(d) { return d.y; })
               .style("fill", color);

           //update link positions
           link
               .attr("x1", function(d) { return d.source.x; })
               .attr("y1", function(d) { return d.source.y; })
               .attr("x2", function(d) { return d.target.x; })
               .attr("y2", function(d) { return d.target.y; });
       }

       // If you don't need drag or zoom functionality, you can get rid of the below.  Otherwise ignore, the below doesn't need to be adjusted

       //add drag capabilities
       var drag_handler = d3.drag()
         .on("start", drag_start)
         .on("drag", drag_drag)
         .on("end", drag_end);

       drag_handler(node);

       //add zoom capabilities
       var zoom_handler = d3.zoom()
           .on("zoom", zoom_actions);

       zoom_handler(svg);

       //Drag functions
       //d is the node
       function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
           d.fx = d.x;
           d.fy = d.y;
       }

       //make sure you can't drag the circle outside the box
       function drag_drag(d) {
         d.fx = d3.event.x;
         d.fy = d3.event.y;
       }

       function drag_end(d) {
         if (!d3.event.active) simulation.alphaTarget(0);
         d.fx = null;
         d.fy = null;
       }

       //Zoom functions
       function zoom_actions(){
           g.attr("transform", d3.event.transform)
       }
       // stop here if you're getting rid of drag/zoom!
  });
};
