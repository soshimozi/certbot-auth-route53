module.exports = (kms, region) => {

    const uploadS3WithEnvelope = async (bucket, key, cmkId, plainText, encoding ='utf8') => {

        const { S3 } = require('aws-sdk');
        const s3 = new S3({region});

        const { createTenantMasterKey, encryptEnvelope } = require('./envelope-encryption')(kms);
   
        let tmk = await createTenantMasterKey(cmkId)

        let envelope = await encryptEnvelope(tmk.cipherText)(plainText, encoding);
        
        let params = {
            Body: envelope.dataCipherText,
            Bucket: bucket,
            Key: key,
            ServerSideEncryption: 'AES256',
            Metadata: {
                'tdkCipherText': envelope.tdkCipherText,
                'tmkCipherText': envelope.tmkCipherText,
                'tdkIV' : envelope.tdkIVBase64,
                'dataIV': envelope.dataIVBase64,
                'hmac': envelope.hmac
            }
        }
        
        return new Promise((resolve,reject) => {
    
            s3.putObject(params, function(err, data) {
                if(err) reject(err);
                else resolve(data);
            });
        });        

    };

    const downloadS3Envelope = async (bucket, key, outputEnc='base64') => {

    };

    return {
        uploadS3WithEnvelope,
        downloadS3Envelope
    };    
};