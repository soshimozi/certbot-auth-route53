const { DNSManager } = require('./DNSManager');

const manager = new DNSManager();

let changeId;

//changeId = await manager.deleteTXT(process.env.CERTBOT_DOMAIN, process.env.CERTBOT_VALIDATION);
manager.upsertTXT("www.centeredyogadance.com", "This is a test").then((changeId) => {
    manager.waitForChange(changeId).then(() => {
        console.log('change is here!')
    });

    manager.deleteTXT("www.centeredyogadance.com", "This is a test").then((changeId) => {
        manager.waitForChange(changeId).then(() => {
            console.log('delete is done!')
        });

    });
});

