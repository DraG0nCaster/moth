const WIDTH = 900;
const HEIGHT = 600;
const INDIVIDUAL_MAX_AMOUNT = 20;
const ROTATION_MAX = 50;
const CHANCE_TO_ROTATE = 0.05;
const MOVE_SPEED = 0.5;
const INDIVIDUAL_SIZE = 60;
const SIMULATION_INTERVAL = 0.001;
const RESPAWN_DELAY = 0;
const SIMULATION_DURATION = 180;
const MAX_MUTATION_RATE_CHANGE = 1;
const MUTATION_RATE_CHANGE_CHANCE = 0.2;
const STARTING_MUTATION_RATE = 0.5;
const MAX_COLOR_CHANGE = 1;
const BACKGROUND_COLOR_CHANGE = 0.05;
const DEATH_OF_OLD_AGE_IS_ENABLED = false;
const DEATH_OF_OLD_AGE_TIME_MIN = 10;
const DEATH_OF_OLD_AGE_TIME_MAX = 20;

let background_color = 0;
let background_color_change_interval = 0;
let background_color_change_direction = 1;

let avaregeColor;
let avaregeMutationRate;
let maxMutationRate;
let minMutationRate;
let induvidualsDeaths = 0;

let showAvaregeColorPlace = document.getElementById('avarege-color');
let showAvaregeMutationRatePlace = document.getElementById('avarege-mutation-rate');

let draw = SVG().addTo('#simulation').size(WIDTH, HEIGHT);
let background;
let allIndividuals = [];

let time_from_start = 0;
let simulation_ended = false;

let allData = [];
let colorData = [];
let mutationRateRange = []
let mutationRateData = []
let mutationRatestandardDeviation = []

const currentLang = document.documentElement.lang;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function inherit(inheritance, changeChance){
    let newValue = inheritance;
    if (Math.random() <= changeChance) {
        newValue = weightedRandom(inheritance);
    }
    return newValue;
}

function handleIndividualClick(individual){
    if (simulation_ended) return;

    destroyIndividual(individual);
    induvidualsDeaths++;
}

function setImageGrayScale(img, value) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;

    img.style.filter =
        `brightness(0) invert(1) brightness(${value})`;
}

function createIndividual(x, y, angle, color = getRandomFloat(0, 1), mutation_rate = STARTING_MUTATION_RATE){
    let newIndividual = draw.image('images/individualSprite.png').size(INDIVIDUAL_SIZE, INDIVIDUAL_SIZE).move(x, y);
    newIndividual.state = {
        x: x,
        y: y,
        angle: angle,
        color: color,
        mutation_rate: mutation_rate
    };
    updateIndividualTransform(newIndividual);
    newIndividual.click(function() {
        handleIndividualClick(newIndividual);
    });
    newIndividual.addClass('individual-simulation');
    setImageGrayScale(newIndividual.node, newIndividual.state.color);
    allIndividuals.push(newIndividual);
    if (DEATH_OF_OLD_AGE_IS_ENABLED){
        setTimeout(() => destroyIndividual(newIndividual), getRandomInt(DEATH_OF_OLD_AGE_TIME_MIN*1000, DEATH_OF_OLD_AGE_TIME_MAX*1000));
    }
}

function weightedRandom(peak, min=0, max=1, influence = 1) {
    let rand = 0;

    for (let i = 0; i < influence; i++) {
        rand += Math.random();
    }

    rand /= influence;

    let range = max - min;
    let peakPos = (peak - min) / range;

    let result = min + range * ((rand + peakPos) / 2);

    return Math.min(max, Math.max(min, result));
}

function updateIndividualTransform(individual){
    const cx = individual.state.x + INDIVIDUAL_SIZE / 2;
    const cy = individual.state.y + INDIVIDUAL_SIZE / 2;
    individual.untransform();
    individual.move(individual.state.x, individual.state.y);
    individual.rotate(individual.state.angle, cx, cy);
}

function moveAllIndividualsRandomly(){
    for (let i = 0; i < allIndividuals.length; i++){
        let individual = allIndividuals[i];
        const radians = individual.state.angle * Math.PI / 180;
        individual.state.x += MOVE_SPEED * Math.cos(radians);
        individual.state.y += MOVE_SPEED * Math.sin(radians);
        if (individual.state.x < -INDIVIDUAL_SIZE) individual.state.x = WIDTH;
        if (individual.state.x > WIDTH) individual.state.x = -INDIVIDUAL_SIZE;
        if (individual.state.y < -INDIVIDUAL_SIZE) individual.state.y = HEIGHT;
        if (individual.state.y > HEIGHT) individual.state.y = -INDIVIDUAL_SIZE;
        updateIndividualTransform(individual);
    }
}

function rotateAllIndividualsRandomly(){
    for (let i = 0; i < allIndividuals.length; i++){
        if (Math.random() >= CHANCE_TO_ROTATE) continue;

        let individual = allIndividuals[i];
        individual.state.angle += getRandomInt(-ROTATION_MAX, ROTATION_MAX);
        updateIndividualTransform(individual);
    }
}

function destroyIndividual(individual){
    if (simulation_ended) return;

    individual.remove();
    let index = allIndividuals.indexOf(individual);
    if (index > -1) {
        allIndividuals.splice(index, 1);
    } else {
        return; 
    }
    setTimeout(() => {
        if (allIndividuals.length === 0) return;
        
        let rangeX = WIDTH - INDIVIDUAL_SIZE; 
        let rangeY = HEIGHT - INDIVIDUAL_SIZE;
        let parent = allIndividuals[getRandomInt(0, allIndividuals.length)];
        createIndividual(getRandomInt(0, rangeX), getRandomInt(0, rangeY), getRandomInt(0, 360), inherit(parent.state.color, parent.state.mutation_rate), inherit(parent.state.mutation_rate, MUTATION_RATE_CHANGE_CHANCE));
    }, RESPAWN_DELAY);
}

function changeBackgroundColorGradual(){
    if (background_color_change_interval === "constant") {
        return;
    }
    if(background_color+BACKGROUND_COLOR_CHANGE >= 1){
        background_color_change_direction = -1;
    } else if(background_color-BACKGROUND_COLOR_CHANGE <= 0){
        background_color_change_direction = 1;
    }
    background_color += BACKGROUND_COLOR_CHANGE * background_color_change_direction;
    setImageGrayScale(background.node, background_color);
}

function changeBackgroundColorSudden(){
    if (background_color_change_interval === "constant") {
        return;
    }
    background_color = getRandomFloat(0, 1);
    setImageGrayScale(background.node, background_color);
}

function updateAvareges(){
    let totalColor = 0;
    let totalMutationRate = 0;
    for (let i = 0; i < allIndividuals.length; i++){
        totalColor += allIndividuals[i].state.color;
        totalMutationRate += allIndividuals[i].state.mutation_rate;
    }
    avaregeColor = totalColor / allIndividuals.length;
    avaregeMutationRate = totalMutationRate / allIndividuals.length;

    showAvaregeColorPlace.innerText = `Avarege Color: ${(avaregeColor*100).toFixed(2)}%`;
    showAvaregeMutationRatePlace.innerText = `Avarege Mutation Rate: ${(avaregeMutationRate*100).toFixed(2)}%`;
}   

let moveInterval;
let rotateInterval;
let changeBackgroundInterval;
let updateAvaragesInterval;
let updateTimeFromStartInterval;
let updateDataInterval;

function startSimulation(){    
    background = draw.image('images/background.png').size(WIDTH, HEIGHT).addClass('simulation-background').back();
    setImageGrayScale(background.node, background_color);
    for (let i = 0; i < INDIVIDUAL_MAX_AMOUNT; i++){
        let x = getRandomInt(0, WIDTH - INDIVIDUAL_SIZE);
        let y = getRandomInt(0, HEIGHT - INDIVIDUAL_SIZE);
        let angle = getRandomInt(0, 360);
        createIndividual(x, y, angle, getRandomFloat(0, 1), getRandomFloat(0, 1));
    }
    moveInterval = setInterval(moveAllIndividualsRandomly, SIMULATION_INTERVAL*1000);
    rotateInterval = setInterval(rotateAllIndividualsRandomly, SIMULATION_INTERVAL*1000);
    changeBackgroundInterval = setInterval(changeBackgroundColorGradual, background_color_change_interval*1000);
    updateAvaragesInterval = setInterval(updateAvareges, SIMULATION_INTERVAL*1000);
    updateTimeFromStartInterval = setInterval(updateTimeFromStart, 1000);
    updateDataInterval = setInterval(updateData, 1000);
    updateAvareges()
    updateData()
    if(SIMULATION_DURATION != "infinite"){
        setInterval(updateTimeToEnd, 1000);
        updateTimeToEnd();
        setTimeout(simulationEnd, SIMULATION_DURATION*1000);
    }
    document.querySelector("body").style.userSelect = "none";
}

function updateTimeToEnd(){
    showTimeToEndPlace = document.getElementById("time-to-end");

    if(currentLang == "ru"){
        showTimeToEndPlace.innerText = `Симуляция закончится через ${(SIMULATION_DURATION-time_from_start)} секунд`;
    }
    else{
        showTimeToEndPlace.innerText = `Simulation will end in ${(SIMULATION_DURATION-time_from_start)} seconds`;
    }
}

function simulationEnd(){
    clearInterval(moveInterval);
    clearInterval(rotateInterval);
    clearInterval(changeBackgroundInterval);
    clearInterval(updateAvaragesInterval);
    clearInterval(updateTimeFromStartInterval);
    clearInterval(updateDataInterval);

    let simulation_end_text = document.getElementById("simulation-end-text")
    if(currentLang == "ru"){
        simulation_end_text.innerText = "Симуляция закончилась."
    }
    else{
        simulation_end_text.innerText = "Simulation ended."
    }
    if(background_color < 0.5){
        simulation_end_text.style.color = "white"
    }

    simulation_ended = true;
}

function handleStartButtonClick(setColorChangeInterval){
    if(setColorChangeInterval == undefined){
        return;
    }

    if (String(setColorChangeInterval).toLowerCase == 'constant' || setColorChangeInterval == 'constant') {
        background_color_change_interval = "constant";
    }
    else if (!isNaN(parseFloat(setColorChangeInterval))) {
        if(parseFloat(setColorChangeInterval) <= 0){
            invalidInputAlert("background change interval");
            return;
        }
        background_color_change_interval = parseFloat(setColorChangeInterval);
    }
    else{
        invalidInputAlert("background change interval");
        return;
    }
    document.getElementById('simulation').classList.remove('simulation-before-start');
    document.querySelector(".simulation-before-start-content").innerHTML = "";
    startSimulation();
}

invalidInputAlert = (inputName) => {
    alert(`Invalid input for ${inputName}. Please enter a valid number bigger than 0 or 'constant'.`);
}

function updateTimeFromStart(){
    time_from_start += 1;
}

function updateData(){
    colorData.push({time: time_from_start, avarege_color_in_population: avaregeColor, background_color: background_color});

    mutationRateData.push({time: time_from_start, avarege_mutation_rate: avaregeMutationRate});

    let _maxMutationRate = 0;
    let _minMutationRate = 1;
    allIndividuals.forEach(individual => {
        if (individual.state.mutation_rate > _maxMutationRate){
            _maxMutationRate = individual.state.mutation_rate;
        }
        if(individual.state.mutation_rate < _minMutationRate){
            _minMutationRate = individual.state.mutation_rate;
        }
    })
    maxMutationRate = _maxMutationRate;
    minMutationRate = _minMutationRate;
    mutationRateRange.push({time: time_from_start, max_mutation_range: maxMutationRate, min_mutation_rate: minMutationRate});

    sum = 0;
    allIndividuals.forEach(individual => {
        sum += individual.state.mutation_rate;
    });
    const mean = sum / allIndividuals.length;

    let squaredDiffSum = 0;
    allIndividuals.forEach(individual => {
        const diff = individual.state.mutation_rate - mean;
        squaredDiffSum += diff * diff;
    });

    const variance = squaredDiffSum / allIndividuals.length;
    const standartDeviation = Math.sqrt(variance) || 0;

    mutationRatestandardDeviation.push({time: time_from_start, standart_deviation_of_mutation_rate: standartDeviation});

    chartColors.data.labels.push(time_from_start);
    chartColors.data.datasets[0].data.push(avaregeColor);
    chartColors.data.datasets[1].data.push(background_color);
    chartColors.update();

    chartMutationRate.data.labels.push(time_from_start);
    chartMutationRate.data.datasets[0].data.push(avaregeMutationRate);
    chartMutationRate.update();    
}

const chartColors = new Chart(
  document.getElementById('chartColor'),
  {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Average Color',
          data: [],
          borderWidth: 2
        },
        {
          label: 'Background Color',
          data: [],
          borderWidth: 2
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time (seconds)' } },
        y: { title: { display: true, text: 'Color Value' } }
      }
    }
  }
);

const chartMutationRate = new Chart(
  document.getElementById('chartMutationRate'),
  {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Average Mutation Rate',
          data: [],
          borderWidth: 2
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time (seconds)' } },
        y: { title: { display: true, text: 'Mutation Rate' } }
      }
    }
  }
);


function exportDataToExcel(){
    allData = [colorData, mutationRateData, mutationRateRange, mutationRatestandardDeviation];
    if (allData[0].length <= 0 || !simulation_ended){
        if(currentLang == "ru"){
            alert("нажимайте эту кнопку только после конца симуляции");
        }
        else{
            alert("press this buttons only after the end of simulation");
        }
        return;
    }

    const ws = XLSX.utils.json_to_sheet([]);

    let currentColumn = 0;

    function addInfoToTable(name, value, row, column){
        XLSX.utils.sheet_add_aoa(ws, [[name]], { origin: { r: row, c: column } });
        XLSX.utils.sheet_add_aoa(ws, [[value]], { origin: { r: row+1, c: column } });
    }

    let shownValues = [["Background color change interval", background_color_change_interval], ["Indivuduals died", induvidualsDeaths]]

    shownValues.forEach(element => {
        addInfoToTable(element[0], element[1], 0, currentColumn)
        currentColumn++;
    });

    currentColumn++;

    allData.forEach(table => {

        const formattedTable = table.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                const newKey = key.replaceAll("_", " ");
                const value = row[key];

                if (!isNaN(value) && value !== "") {
                    newRow[newKey] = Number(value);
                } else {
                    newRow[newKey] = value;
                }
            });
            return newRow;
        });

        XLSX.utils.sheet_add_json(ws, formattedTable, { origin: { r: 0, c: currentColumn } });

        const numColumns = formattedTable.length > 0 ? Object.keys(formattedTable[0]).length : 0; 
        currentColumn += Object.keys(colorData[0]).length+1;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Main page");
    XLSX.writeFile(wb, `data(changeInterval_${background_color_change_interval}).xlsx`);
}
