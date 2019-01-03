////////////////////////////////////
//////////// CONFIG ////////////////
////////////////////////////////////

const sigma = 15;
const ro = 40;
const beta = 8 / 3;
const h = 0.01;

const canvasSize = 750;

const initialState = {x: 0.1, y: 0, z: 0};

////////////////////////////////////
//////////// SETUP /////////////////
////////////////////////////////////

const canvas = document.getElementById('can');
const context = canvas.getContext("2d");

canvas.width = canvasSize;
canvas.height = canvasSize;

console.clear();
console.log('OK');

////////////////////////////////////
//////////// CODE //////////////////
////////////////////////////////////

const computeDerivation = ({x, y, z}) => {
    return {
        x: sigma * (y - x),
        y: x * (ro - z) - y,
        z: x * y - beta * z
    };
};

const coordToColor = R.pipe(
    R.add(0xFFFFFF / 2),
    R.min(0xFFFFFF),
    R.max(0),
    Math.floor,
    n => n.toString(16)
);

const log = R.tap(({x, y, z}) => console.log(`x: ${x}\ny: ${y}\nz: ${z}`));

const step = state => {
    const {x, y, z} = state;
    const v = computeDerivation(state);

    return {
        x: x + h * v.x,
        y: y + h * v.y,
        z: z + h * v.z
    };
};

const computeStep = ({points, state}) => {
    const newPoint = step(state);

    return {
        points: R.append(newPoint, points),
        state: newPoint
    };
};

const getMinMax = (prop, points) => R.pipe(
    R.pluck(prop),
    R.applySpec({
        min: a => Math.min(...a),
        max: a => Math.max(...a)
    })
)(points);

const computePositioning = prop => state => {
    const points = state.points;
    const stats = getMinMax(prop, points);
    const range = stats.max - stats.min;
    const zoom = canvasSize / range;
    const shift = - stats.min * zoom;

    return R.pipe(
        R.assocPath(['coordShift', prop], shift),
        R.assocPath(['coordZoom', prop], zoom)
    )(state);
};

const computeAutopositioning = R.pipe(
    computePositioning('x'),
    computePositioning('y'),
    computePositioning('z'),
);

const autoZoom = R.over(
    R.lensProp('coordZoom'),
    R.pipe(
        R.values,
        a => Math.min(...a)
    )
);

const drawPoint =  (zoom, shift) => (context, point) => {
    const dispX = shift.x + (zoom * point.x);
    const dispY = shift.y + (zoom * point.y);
    const dispZ = shift.z + (zoom * point.z);

    const color = coordToColor(dispZ);

    context.fillStyle = "#" + color;
    context.fill();

    context.fillRect(dispX, dispY, 1, 1);

    return context;
};

const display = ({points, coordShift, coordZoom}) => {
    R.reduce(
        drawPoint(coordZoom, coordShift),
        context,
        points
    );
};

const range = R.range(0, 100000);
const x = R.pipe(
    R.reduce(computeStep, {points: [], state: initialState}),
    computeAutopositioning,
    autoZoom,
    R.tap(display)
)(range);

/* TODO
- autozoom -> předpočítat body, zjistit min+max tak, aby se zoom přizpůsobil obsahu
*/
