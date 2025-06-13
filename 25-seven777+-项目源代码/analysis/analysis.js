// 全局配置
const margin = { top: 30, right: 30, bottom: 50, left: 60 };
const width  = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 加载 CSV 数据
d3.csv("data//restaurants_clean.csv", d3.autoType).then(data => {
  // 计算性价比字段
  data.forEach(d => d.value = d.stars / d.price_level);

  drawBoxPlot(data);
  drawViolinPlot(data);
  drawScatterPlot(data);
});

// 绘制箱线图：price_level vs stars
function drawBoxPlot(data) {
  const svg = d3.select("#boxplot")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // X：星级
  const starsList = Array.from(new Set(data.map(d => d.stars))).sort(d3.ascending);
  const x = d3.scalePoint()
    .domain(starsList)
    .range([0, width])
    .padding(0.5);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => d + "星"));

  // Y：价格等级
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.price_level))
    .nice()
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // 计算每个星级的箱线统计量
  const sumstat = d3.rollups(
    data,
    v => ({
      q1: d3.quantile(v.map(d => d.price_level).sort(d3.ascending), 0.25),
      median: d3.quantile(v.map(d => d.price_level).sort(d3.ascending), 0.5),
      q3: d3.quantile(v.map(d => d.price_level).sort(d3.ascending), 0.75),
      min: d3.min(v, d => d.price_level),
      max: d3.max(v, d => d.price_level)
    }),
    d => d.stars
  );

  // 绘制箱线
  svg.selectAll("boxes")
    .data(sumstat)
    .enter()
    .append("line") // whiskers
      .attr("x1", d => x(d[0]))
      .attr("x2", d => x(d[0]))
      .attr("y1", d => y(d[1].min))
      .attr("y2", d => y(d[1].max))
      .attr("stroke", "black");
  svg.selectAll("boxes")
    .data(sumstat)
    .enter()
    .append("rect")
      .attr("x", d => x(d[0]) - 20)
      .attr("y", d => y(d[1].q3))
      .attr("height", d => y(d[1].q1) - y(d[1].q3))
      .attr("width", 40)
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");
  // 中位线
  svg.selectAll("medianLines")
    .data(sumstat)
    .enter()
    .append("line")
      .attr("x1", d => x(d[0]) - 20)
      .attr("x2", d => x(d[0]) + 20)
      .attr("y1", d => y(d[1].median))
      .attr("y2", d => y(d[1].median))
      .attr("stroke", "black");
}

// 绘制小提琴图：cuisine vs stars
function drawViolinPlot(data) {
  const svg = d3.select("#violinplot")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // X：菜系
  const cuisines = Array.from(new Set(data.map(d => d.cuisine)));
  const x = d3.scaleBand()
    .domain(cuisines)
    .range([0, width])
    .padding(0.5);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(30)")
      .style("text-anchor", "start");

  // Y：星级
  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.stars), d3.max(data, d => d.stars)])
    .nice()
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "星"));

  // KDE 计算函数
  function kernelDensityEstimator(kernel, X) {
    return V => X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
  }
  function kernelEpanechnikov(k) {
    return v => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  }

  const yTicks = y.ticks(40);
  const maxDensity = d3.max(cuisines.map(c => {
    const values = data.filter(d => d.cuisine === c).map(d => d.stars);
    const density = kernelDensityEstimator(kernelEpanechnikov(0.5), yTicks)(values);
    return d3.max(density, d => d[1]);
  }));

  // X 轴宽度尺度
  const xNum = d3.scaleLinear()
    .range([0, x.bandwidth()])
    .domain([-maxDensity, maxDensity]);

  // 绘制每一根小提琴
  cuisines.forEach(cuisine => {
    const values = data.filter(d => d.cuisine === cuisine).map(d => d.stars);
    const density = kernelDensityEstimator(kernelEpanechnikov(0.5), yTicks)(values);

    svg.append("path")
      .datum(density)
      .attr("transform", `translate(${x(cuisine)},0)`)
      .attr("fill", "#a6cee3")
      .attr("stroke", "#1f78b4")
      .attr("d", d3.area()
        .x0(d => xNum(-d[1]))
        .x1(d => xNum(d[1]))
        .y(d => y(d[0]))
        .curve(d3.curveCatmullRom)
      );
  });
}

// 绘制散点图：性价比 vs 价格等级
function drawScatterPlot(data) {
  const svg = d3.select("#scatterplot")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // X：价格等级
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.price_level)).nice()
    .range([0, width]);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Y：性价比
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.value)).nice()
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // Tooltip 定义
  const tooltip = d3.select("#tooltip");

  // 绘制点
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.price_level))
      .attr("cy", d => y(d.value))
      .attr("r", 4)
      .style("fill", "#ff7f00")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`
          <strong>${d.name}</strong><br/>
          星级: ${d.stars} 星<br/>
          价格等级: ${d.price_level}<br/>
          菜系: ${d.cuisine}<br/>
          城市: ${d.city}, ${d.country}<br/>
          性价比: ${d.value.toFixed(2)}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top",  (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
}
