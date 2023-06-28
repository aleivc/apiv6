// line by line parse data output: lng, lat, timestamp
const fs = require('fs')
const readline = require('readline')
const moment = require('moment')
const turf = require('@turf/turf')

// Set the desired date and time components
const year = 2023;
const month = 6; // Note: months are zero-based, so 5 represents June
const day = 15;
const format = 'YYYY-MM-DDTHHmmss.SS';

const rule = {
    lng: 3,
    lat: 2
}

function convertUtc(time) {
    const [first, second] = [time.slice(0, 2), time.slice(2)]
    debugger;
    const nTime = parseFloat(first) + 8;
    if(nTime < 10) {
        return `0${nTime}${second}`
    }
    return `${nTime}${second}`;
}

function convertLngLat(type, num) {
    const dd = num.slice(0, rule[type]);
    const mm = num.slice(rule[type]);
    return (parseInt(dd) + parseFloat(mm) / 60);
}

function getTurnAngle(startHeading, endHeading) {
    let turnAngle = endHeading - startHeading;
    if (turnAngle < -180) turnAngle += 360;
    if (turnAngle > 180) turnAngle -= 360;
    return turnAngle;
}

/**
 * 值播机 和 拖拉机 轨迹数据解析
 */
void (async () => {
    // const files = fs.readdirSync('./NavData/')

    const files = [
        // '2023-05-19.log'
        // '2023-06-14.log'
        '2023-06-15.log'
        // 'test.log'
    ]

    files.forEach((fileName, index) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(`./../public/NavData/${fileName}`),
            crlfDelay: Infinity
        })

        // 需要的数据格式
        // const temp = {
        //     points: [
        //         [121, 30],
        //         [121, 30]
        //     ],
        //     lowerTimestamps: [],
        //     我真的需要这个normalTimestamps 吗? 它只用于显示进度条, 实际上我不需要那种格式, 需要可阅读的格式
        //     normalTimestamps: [],
        //     duration: 1234,
        //     attrs : [
        //         {
        //             // 坐标
        //             point: [],
        //             // 进图条展示的时间戳
        //             timestamp: 1,
        //             // 动画要用的时间戳, 数值更小
        //             lowerStamp: 1,
        //             // 角度
        //             heading: 1,
        //             // 周长
        //             perimeter: 123,
        //             // 面积
        //             area: 23,
        //             // 速度
        //             speed: 34
        //         }
        //     ]
        // }

        const points = []
        const speeds = []
        const lowerTimestamps = []
        const normalTimestamps = []
        const attrs = [];
        let minSpeed = 0;
        let maxSpeed = 0;

        let prevLine = {
            // 从任意数开始, 尽量小
            lowerTimestamp: 1,
            // 第一个点的朝向,任意弧度
            heading: 10,
            // 第一个点的速度, 0
            speed: 0
        };

        rl.on('line', (l) => {
            if(l.startsWith('$GNGGA')){
                l = l.split(',');

                if(l.length > 4 && l[4] !== null && l[4].toString().startsWith('121') && l[4].toString() !== '0') {
                    const timestamp = moment(`${year}-${month}-${day}T${convertUtc(l[1])}`, format).valueOf();

                    const lnglat = [convertLngLat('lng', l[4]), convertLngLat('lat', l[2])]
                    points.push(lnglat)

                    // 第一个
                    if(!prevLine.point) {
                        prevLine['point'] = lnglat;
                        prevLine['normalTimestamp'] = timestamp;
                        prevLine['readableTimestamp'] = moment(timestamp).format('HH:mm:ss:SS');
                        return;
                    }

                    // normalTimestamp
                    normalTimestamps.push(timestamp);

                    // lowerTimestamp
                    let diff = timestamp - prevLine.normalTimestamp;
                    let lowerTimestamp = parseFloat((parseFloat(prevLine.lowerTimestamp) + (diff / 1000)).toFixed(3))

                    lowerTimestamps.push(lowerTimestamp);

                    // heading
                    let angle = Math.floor(turf.rhumbBearing(prevLine.point, lnglat))
                    let heading = prevLine.heading + getTurnAngle(prevLine.heading, angle);

                    // speed
                    let distance = turf.rhumbDistance(lnglat, prevLine.point);
                    let time = lowerTimestamp - prevLine.lowerTimestamp;
                    let speed = parseFloat(((distance / time) * 1000).toFixed(3))
                    if(speed > maxSpeed) {
                        maxSpeed = speed
                    }

                    if(speed < minSpeed) {
                        minSpeed = speed
                    }
                    speeds.push(speed);

                    const currentLine = {
                        point: lnglat,
                        normalTimestamp: timestamp,
                        readableTimestamp: moment(timestamp).format('HH:mm:ss:SS'),
                        lowerTimestamp,
                        heading,
                        speed
                    }

                    attrs.push(currentLine);

                    prevLine = currentLine;
                }
            }
        })

        rl.once('close', () => {
            const start = moment(normalTimestamps[0]);
            const end = moment(normalTimestamps[normalTimestamps.length - 1]);

            const diff = moment.duration(end.diff(start))
            const duration = `${diff.hours()}:${diff.minutes()}:${diff.seconds()}`
            fs.writeFileSync(`./output/${fileName}.json`, JSON.stringify({points, lowerTimestamps, normalTimestamps, attrs, duration}));

            // fs.writeFileSync(`./output/${fileName}.json`, JSON.stringify({speeds}));
            console.log(`min: ${minSpeed}, max: ${maxSpeed}`)
            console.log(`${fileName} Used ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
        })
    })
})();
