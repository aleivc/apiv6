const data = [
    { name: "station29", time: "1", ident: "ec1", value: "1" },
    { name: "station29", time: "2", ident: "ec1", value: "2" },
    { name: "station29", time: "3", ident: "ec1", value: "9" },

    { name: "station29", time: "3", ident: "ec2", value: "3" },
    { name: "station29", time: "4", ident: "ec2", value: "4" },

    { name: "station29", time: "5", ident: "ec3", value: "3" },
    { name: "station29", time: "6", ident: "ec3", value: "4" },
];

const uniqueIdentifiers = [...new Set(data.map((item) => item.ident))];
const newData = [["deviceName", "time", ...uniqueIdentifiers]];

const valueColumns = uniqueIdentifiers.map(() => []);

data.forEach(item => {
    const { ident, value } = item;
    const identifierIndex = uniqueIdentifiers.indexOf(ident);
    valueColumns[identifierIndex].push(value);
});

valueColumns[0].forEach((value, index) => {
    const temp = [data[index].name, data[index].time, ...valueColumns.map(col => col[index])];
    newData.push(temp);
});


console.log(newData);
// out put
// [
//     [ 'deviceName', 'time', 'ec1', 'ec2', 'ec3' ],
//     [ 'station29', '1', '1', '3', '3' ],
//     [ 'station29', '2', '2', '4', '4' ],
//     [ 'station29', '9', '9', undefined, undefined ]
// ]






