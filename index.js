const { DNSManager } = require('./dns-manager');

const authHook = async () => {

    const remove = process.env.CERTBOT_AUTH_OUTPUT ? true : false;
    const manager = new DNSManager();

    let changeId;
    if(remove) {
        changeId = await manager.deleteTXT(process.env.CERTBOT_DOMAIN, process.env.CERTBOT_VALIDATION);
    } else {
        changeId = await manager.upsertTXT(process.env.CERTBOT_DOMAIN, process.env.CERTBOT_VALIDATION);
    }

    await manager.waitForChange(changeId);

};

const deployHook = async () => {

};


module.exports = {
    auth: authHook,
    deploy: deployHook
};


