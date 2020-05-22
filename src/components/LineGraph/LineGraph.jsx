import React, { useRef, useEffect, useState } from 'react';
import styles from './LineGraph.css';
// import JSONdata from '../../data/daily-test.json';
import { select, line, curveCardinal, axisBottom, axisRight, scaleLinear, mouse } from 'd3';
import { useCovidData } from '../../hooks/covidHooks';
import { useMobilityDataByDate } from '../../hooks/mobilityHooks';


function LineGraph() {
  
  const svgRef = useRef();
  const [property, setProperty] = useState('positive');
  const { dateData, positiveData, recoveredData, deathData } = useCovidData();
  const covidData = { date: dateData, positive: positiveData, recovered: recoveredData, death: deathData };
  // const mobilityData = useMobilityDataByDate('2020-04-30T00:00:00.000+00:00');

  const [checkedOptionsArray, setCheckedOptionsArray] = useState([]);
  const [uncheckedOptionsArray, setUncheckedOptionsArray] = useState([]);

  const handleCheckbox = ({ target }) => {
    if(!checkedOptionsArray.includes(target.value)) {
      setCheckedOptionsArray(prevState => [...prevState, target.value]);
      setUncheckedOptionsArray(uncheckedOptionsArray.filter(item => (item !== target.value)));
    }
    else {
      setCheckedOptionsArray(checkedOptionsArray.filter(item => (item !== target.value)));
      setUncheckedOptionsArray(prevState => [...prevState, target.value]);
    }
  };
  
  const checkboxOptions = (myObj) => {
    const myKeys = Object.keys(myObj);
    return myKeys.map((myKey, i) => 
      <div key={i}>
        <input type='checkbox' id={myKey} name={myKey} value={myKey} onChange={handleCheckbox} />
        <label htmlFor={myKey}>{myKey}</label>
      </div>
    );
  };
  
  function formatDate(badDate) {
    return badDate.toString().slice(5, 6) + '/' + badDate.toString().slice(6);
  }
  
  const selectOptions = (myObj) => {
    const myKeys = Object.keys(myObj);
    return myKeys.map((myKey, i) => <option key={i} value={myKey}>{myKey}</option>);
  };
  

  useEffect(() => {
    if(!dateData || !positiveData || !recoveredData || !deathData) return;

    // console.log('mobilityData:', mobilityData);

    const svg = select(svgRef.current);
    
    const xScale = scaleLinear()
      .domain([0, covidData[property].length - 1])
      .range([600, 0]);
    const yScale = scaleLinear()
      .domain([0, Math.max(...covidData['positive'])])
      .range([400, 0]);
  
    const xAxis = axisBottom(xScale)
      .ticks(covidData[property].length / 5)
      .tickFormat(index => formatDate(dateData[index]));
    const yAxis = axisRight(yScale)
      .ticks(covidData[property].length / 5);

    svg
      .select('.x-axis')
      .style('transform', 'translateY(400px)')
      .call(xAxis);

    svg
      .select('.y-axis')
      .style('transform', 'translateX(600px)')
      .call(yAxis);

    
    const myLine = line()
      .x((value, index) => xScale(index))
      .y(yScale)
      .curve(curveCardinal);

    svg.selectAll('.line').remove();

    uncheckedOptionsArray.map(item => {
      console.log('removing', `line-${item}`);
      svg
        .selectAll(`.line-${item}`)
        .remove();
    });

    checkedOptionsArray.map(item => {
      console.log('adding', `line-${item}`);
      svg
        .selectAll(`.line-${item}`)
        .data([covidData[item]])
        .join('path')
        .attr('class', `.line-${item}`)
        .attr('d', value => myLine(value))
        .attr('fill', 'none')
        .attr('stroke', 'blue');
    });


    // svg
    //   .selectAll('.line2')
    //   .data([covidData['positive']])
    //   .join('path')
    //   .attr('class', 'line2')
    //   .attr('d', value => myLine(value))
    //   .attr('fill', 'none')
    //   .attr('stroke', 'red');

    // svg
    //   .selectAll('.line3')
    //   .data([covidData['recovered']])
    //   .join('path')
    //   .attr('class', 'line3')
    //   .attr('d', value => myLine(value))
    //   .attr('fill', 'none')
    //   .attr('stroke', 'aqua');


    // Mouseover bubbles
    const mouseG = svg.append('g')
      .attr('class', 'mouse-over-effects');
    const lines = document.getElementsByClassName('line');
    console.log('lines is: ', lines);
    const mousePerLine = mouseG.selectAll('.mouse-per-line')
      .data([covidData['death']])
      .enter()
      .append('g')
      .attr('class', 'mouse-per-line');
    mousePerLine.append('circle')
      .attr('r', 4)
      .style('stroke', 'red')
      .style('fill', 'none')
      .style('stroke-width', '1px')
      .style('opacity', '0');
    mousePerLine.append('text')
      .attr('transform', 'translate(10,3)');
    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', 600) // can't catch mouse events on a g element
      .attr('height', 400)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        svg.select('.mouse-line')
          .style('opacity', '0');
        svg.selectAll('.mouse-per-line circle')
          .style('opacity', '0');
        svg.selectAll('.mouse-per-line text')
          .style('opacity', '0');
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        svg.select('.mouse-line')
          .style('opacity', '1');
        svg.selectAll('.mouse-per-line circle')
          .style('opacity', '1');
        svg.selectAll('.mouse-per-line text')
          .style('opacity', '1');
      })
      .on('mousemove', function() { // mouse moving over canvas
        const thisMouse = mouse(this);
        svg.selectAll('.mouse-per-line')
          .attr('transform', function(d, i) {
            // console.log(width/mouse[0])
            // const xDate = x.invert(mouse[0]),
            //   bisect = svg.bisector(function(d) { return d.date; }).right;
            // bisect(d.values, xDate);
            let beginning = 0;
            let end = lines[i].getTotalLength();
            console.log('getTotalLength', lines[i].getTotalLength());
            let target = null;
            let pos;
            // NOTE: Something is going wrong in here in interpreting the Y axis in mouse position
            while(true){
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              // console.log('pos:', pos);
              if((target === end || target === beginning) && pos.x !== thisMouse[0]) {
                break;
              }
              if(pos.x > thisMouse[0]) end = target;
              else if(pos.x < thisMouse[0]) beginning = target;
              else break; //position found
            }
            // svg.select(this).select('text')
            //   .text(y.invert(pos.y).toFixed(2));
            return 'translate(' + thisMouse[0] + ',' + pos.y + ')';
          });
      });

  }, [covidData, checkedOptionsArray]);

  return (   
    <div className={styles.LineGraph}>
      <div>
        <svg ref={svgRef}>
          <g className='x-axis' />
          <g className='y-axis' />
        </svg>
        <br />
        <br />
        <br />
        {checkboxOptions(covidData)}

        {/* <select value={property} onChange={({ target }) => setProperty(target.value)}>
          {selectOptions(covidData)} */}
          {/* <option value='positive'>Total Positive Cases</option>
          <option value='recovered'>Current Cases</option>
          <option value='death'>Deaths</option> */}
        {/* </select> */}
      </div>
    </div>
  );
}

export default LineGraph;