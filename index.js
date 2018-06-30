const authHook = async () => {

    const { DNSManager } = require('./dns-manager');

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

    const fs = require('fs');
    const { uploadS3WithEnvelope } = require('./s3-deploy');


    //console.log('deploy hook here:', process.env.RENEWED_DOMAINS );
    //console.log('lineage:', process.env.RENEWED_LINEAGE);

    // todo: renewed domains may be multiple items
    let fullChain = fs.readFileSync(`${process.env.RENEWED_LINEAGE}/fullchain.pem`);
    let privKey = fs.readFileSync(`${process.env.RENEWED_LINEAGE}/privkey.pem`)
    
    uploadS3WithEnvelope(process.env.DOMAIN_BUCKET, `External/CA/${process.env.RENEWED_DOMAINS}/fullchain.pem`, fullChain.toString('utf8'));
    uploadS3WithEnvelope(process.env.DOMAIN_BUCKET, `External/CA/${process.env.RENEWED_DOMAINS}/fullchain.pem`, privKey.toString('utf8'));
};


module.exports = {
    auth: authHook,
    deploy: deployHook
};


