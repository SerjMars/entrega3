// Definimos lso valores iniciales de nuestro espacio de visualización
graf = d3.select('#graf') //Se utiliza el id "graf" para relacionar este .js con el .html
ancho_total = graf.style('width').slice(0,-2)
alto_total = ancho_total * 0.5625
margins = {top: 30, left:50, right: 50, bottom: 30}

ancho = ancho_total - margins.left - margins.right
alto = alto_total - margins.top - margins.bottom



//Construimos el espacio de visualización
svg = graf.append('svg')
            .style('width',`${ancho_total}px`)
            .style('height',`${alto_total}px`)

//Espacio "dentro" de SVG en donde se va a dibujar el gráfico
//Y al que podremos agregarle elementos
g = svg.append('g')
        .attr('transform', `translate(${margins.left}, ${margins.top})`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

fontsize = alto * 0.2
fondoAnio = g.append('text') //Indicamos que vamos a mostrar un texto
                .attr('x', ancho / 2) //Con la 'x' indicamos la posición en horizontal de donde empezaremos a mostrar el texto
                .attr('y', alto / 10 + fontsize/2) //Con la 'y' indicamos la posición en vertical de donde empezaremos a mostrar el texto
                .attr('text-anchor', 'middle') //Indicamos cómo se va extendiendo el texto (del medio a los lados)
                .attr('font-family', 'Antic Slab')
                .attr('font-size', `${fontsize}px`)
                .attr('fill', '#cccccc')
                .text('2009')

//Agregamos (append) un rectángulo a "g"
g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', ancho)
    .attr('height',alto)
    .attr('stroke', 'black')
    .attr('fill', 'none')

g.append('clipPath')
  .attr('id', 'clip')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', ancho)
    .attr('height', alto)

//Diseñamos los títulos de Ejes
//g.append('rect')
//    .attr('x', 0)
//    .attr('y', alto/2)
//    .attr('width', 40)
//    .attr('height', 500)
//    .attr('stroke', '#black')
//    .attr('fill', '#eeeee1')

//Escaladores. Para autoajuste de lo que creamos en el gráfico
x = d3.scaleLog().range([0, ancho]) //Aquí indicamos que el valor de 'x' se va a encontrar entre 0 y el ancho
y = d3.scaleLog().range([alto, 0]) //Aquí indicamos que 'y' se mueve entre el valor de 'alto' y 0
r = d3.scaleLinear().range([10, 100]) //El valor del radio se mueve entre 10 y 100

color = d3.scaleOrdinal().range(d3.schemeCategory10) //Indicamos que hay una escala ordinal y seleccionamos el conjunto de colores "Accent"

//Definimos las variables globales
datos = []
years = []
iyear = 0
maxy = 0
miny = 1000
sector = 'todos'
play = true

var interval

sectorSelect = d3.select('#sector')
botonPausa = d3.select('#pause')
slider = d3.select('#slider')

//Importamos los datos
d3.csv('scholarships00.csv').then((data) => {
    data.forEach((d) => {
        d.sch_dollars   = +d.sch_dollars
        d.sch_fte       = +d.sch_fte
        d.sch_headcount = +d.sch_headcount
        d.academic_year = +d.academic_year
    })
        //'new Set(d3.map)' lo que hace es devolver un conjunto sin indexar de los datos únicos, en este caso de la columna 'year'
        years = Array.from(new Set(d3.map(data, d => d.academic_year)))

        //eliminamos con un filtro registros cuyo "Scholarship Dollars" y "Scholarship FTE" sean <= a 0
        data = data.filter((d) => {
            return (d.sch_dollars > 0) && (d.sch_fte > 0)
        })
        datos = data

        slider.attr('min', 0)
              .attr('max', years.length-1)
        slider.node().value = 0

        //Indicamos el dominio para el escalador de color
        color.domain(d3.map(data, d => d.tap_sector_group))

        //Indicamos el dominio del eje X, del eje Y y de los radios, respectivamente
        x.domain([d3.min(data, d => d.sch_dollars),
                  d3.max(data, d => d.sch_dollars)])
        y.domain([d3.min(data, d => d.sch_fte),
                  d3.max(data, d => d.sch_fte)])
        r.domain([d3.min(data, d => d.sch_headcount),
                  d3.max(data, d => d.sch_headcount)])

        //Configuramos los Ejes
        ejeX = d3.axisBottom(x)
                 .ticks(10)
                 .tickFormat(d => d3.format(',d')(d))
        ejeXG = d3.axisBottom(x)
                  .ticks(10)
                  .tickFormat('')
                  .tickSize(-alto)

        ejeY = d3.axisLeft(y)
                 .ticks(10)
                 .tickFormat(d => d3.format(',d')(d))
        ejeYG = d3.axisLeft(y)
                  .ticks(10)
                  .tickFormat('')
                  .tickSize(-ancho)

        //Dibujamos los Ejes
        g.append('g')
         .call(ejeX)
         .attr('transform', `translate(0, ${alto})`)
        g.append('g')
         .call(ejeY)

        g.append('g')
         .attr('class', 'ejes')
         .call(ejeXG)
         .attr('transform', `translate(0,${alto})`)
        g.append('g')
         .attr('class', 'ejes')
         .call(ejeYG)

        sectorSelect.append('option')
                  .attr('value', 'todos')
                  .text('Todos')
        color.domain().forEach(d => {
            sectorSelect.append('option')
                      .attr('value', d)
                      .text(d)
        })

        //Diseñamos la leyenda
        g.append('rect')
          .attr('x', ancho -1300)
          .attr('y', alto -725)
          .attr('width', 200)
          .attr('height', 275)
          .attr('stroke', 'black')
          .attr('fill', '#fefff3')

        color.domain().forEach((d, i) => {
            g.append('rect')
              .attr('x', ancho -1295)
              .attr('y', alto -720 + i*35)
              .attr('width', 20)
              .attr('height', 20)
              .attr('fill', color(d))

            g.append('text')
              .attr('x', ancho - 1265)
              .attr('y', alto - 704 + i*35)
              .attr('fill', 'black')
              .text(d[0].toUpperCase() + d.slice(1))
        })

        frame()
        interval = d3.interval(() => delta(1), 1000)
})



function frame() {
    academic_year = years[iyear]
    data = d3.filter(datos, d => d.academic_year == academic_year)
    data = d3.filter(data, d => {
        if (sector == 'todos')
            return true  
        else
            return d.tap_sector_group == sector
    })

    slider.node().value = iyear
    render (data)
}

function render(data) {
    fondoAnio.text(years[iyear])

    p = g.selectAll('circle')
         .data(data, d => d.tap_college_name)

    p.enter()
        .append('circle')
            .attr('r', 0)
            .attr('cx', d => x(d.sch_dollars))
            .attr('cy', d => y(d.sch_fte))
            .attr('stroke', 'black')
            .attr('fill', '#005500')
            .attr('clip-path', 'url(#clip)')
            .attr('fill-opacity', 0.70)
        .merge(p)
            .transition().duration(300)
            .attr('cx', d => x(d.sch_dollars))
            .attr('cy', d => y(d.sch_fte))
            .attr('r', d => r(d.sch_headcount))
            .attr('fill', d => color(d.tap_sector_group))

    p.exit()
        .transition().duration(300)
        .attr('r', 0)
        .attr('fill', '#ff0000')
        .remove()
}

//Funciòn "Delta" aplicada a los controles, con la cual
//avanzaremos o regresaremos una cantidad de años específicada en código
function delta(d) {
    iyear += d
    if (iyear < 0) iyear = 0
    if (iyear > years.length-1) iyear = years.length-1
    frame()
}

sectorSelect.on('change', () => {
    sector = sectorSelect.node().value
    frame()
})

botonPausa.on('click', () => {
    play = !play
    if (play) {
        botonPausa
            .classed('btn-danger', true)
            .classed('btn-success', false)
            .html('<i class="fas fa-pause"></i>')
            interval = d3.interval(() => delta(1), 1000)
    }
    else {
        botonPausa
            .classed('btn-danger', false)
            .classed('btn-success', true)
            .html('<i class="fas fa-play"></i>')
        interval.stop()
    }

})

slider.on('input', () => {
    iyear = +slider.node().value
    frame()
})

slider.on('mousedown', () => {
    if (play) interval.stop()
})

slider.on('mouseup', () => {
    if (play) interval = d3.interval(() => delta(1), 300)
})
