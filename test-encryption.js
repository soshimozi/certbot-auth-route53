var AWS = require("aws-sdk");
//AWS.config.update({region:'us-west-1'});

var kms = new AWS.KMS({region:'us-west-1'});
var s3 = new AWS.S3({region:'us-west-1'});

const envelopeFuncs = require('./envelope-encryption');

const { encryptEnvelope, decryptEnvelope, createTenantMasterKey } = envelopeFuncs(kms);

const testEncrypt  = async () => {
    const tmk = await createTenantMasterKey(process.env.KMS_KEY_ID);
    return await encryptEnvelope(tmk.cmkId, tmk.cipherText)('this is a world');
};

const testDecrypt  = async (envelope) => {
    return await decryptEnvelope(envelope, 'utf8');
};




testEncrypt().then((e) => {
   console.log('done:', e);

   testDecrypt(e).then((result) => {
       console.log('result', result);


       s3.getObject({
           Bucket: "centeredyogadance-documents",
           Key: 'External/CA/mail.centeredyogadance.com.fullchain.pem'
       },(result,err) => {
           if(err) console.log(err);
           else console.log(result);
       });

    });

}, (err) => {

    console.log(err);

});
