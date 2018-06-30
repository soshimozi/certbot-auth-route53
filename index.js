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
    const { KMS } = require('aws-sdk');
    const options = require('./options');

    let region = options.region || 'us-west-1';

    let kms = new KMS({region});
    const { uploadS3WithEnvelope } = require('./s3-deploy')(kms, region);

    let fullChain = fs.readFileSync(`${process.env.RENEWED_LINEAGE}/fullchain.pem`);
    let privKey = fs.readFileSync(`${process.env.RENEWED_LINEAGE}/privkey.pem`)
    
    // todo: renewed domains may be multiple items
    await uploadS3WithEnvelope(options.destinationBucket, `External/CA/${process.env.RENEWED_DOMAINS}.fullchain.pem`, options.cmkId, fullChain.toString('utf8'));
    await uploadS3WithEnvelope(options.destinationBucket, `External/CA/${process.env.RENEWED_DOMAINS}.private.pem`, options.cmkId, privKey.toString('utf8'));
};


module.exports = {
    auth: authHook,
    deploy: deployHook
};


