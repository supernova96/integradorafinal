const { build } = require('vite');
build({ logLevel: 'error' }).catch(e => {
    console.log('--- ERROR START ---');
    console.log(e.message.replace(/\r/g, ''));
    console.log('--- ERROR END ---');
    process.exit(1);
});
