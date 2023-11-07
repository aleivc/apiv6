const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

require('dotenv').config()

app.use(express.json());
// format
// {
//     success: true,
//     data: {},
//     errorMessage: "error message"
// }

app.use('/api/sim', require('./controller/sim'));
app.use('/api/gps', require('./controller/gps'));
app.use('/api/sluice', require('./controller/sluice'))
app.use('/api/download', require('./controller/download'))

app.use((err, req, res, next) => {
    // 什么东西会走到这里来？
    // 1. axios 请求错误
    if (err) {
        console.log(err)
        res.status(500).send({
            success: false,
            data: [],
            errorMessage: 'server error'
        })
    }
})

// app.use('/api/shui', require('./controller/lora'))

app.listen(3005, () => {
    console.log('server listening on 3005');
})
