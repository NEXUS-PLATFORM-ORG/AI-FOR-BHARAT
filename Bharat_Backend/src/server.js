import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

import find from 'find-process';

const PORT = process.env.PORT || 5000;

find('port', PORT)
    .then(function (list) {
        if (list.length) {
            console.log(`Port ${PORT} is in use by process ${list[0].pid}, attempting to kill it.`);
            process.kill(list[0].pid, 'SIGKILL');
            setTimeout(startServer, 1000);
        } else {
            startServer();
        }
    })
    .catch(function (err) {
        console.log(err.stack || err);
        startServer();
    });

function startServer() {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}