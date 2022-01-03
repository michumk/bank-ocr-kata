import AccountNumberParser from './AccountNumberParser'
import fs = require('fs');

(async () => {
    if (process.argv.length !== 3) {
        console.error('Invalid number of arguments')
        return
    }

    const filePath = process.argv[2]

    if (!fs.existsSync(filePath)) {
        console.error('This file does not exist')
        return
    }

    new AccountNumberParser()
        .loadFile(filePath)
        .parseFile()
})()
