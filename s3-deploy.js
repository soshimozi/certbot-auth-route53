module.exports = (kms) => {

    const uploadS3WithEnvelope = async (bucket, key, cmkId, plainText, encoding ='utf8') => {

        const { createTenantMasterKey, encryptEnvelope } = require('./envelope-encryption');
        let tmk = await createTenantMasterKey(cmkId);
        return encryptEnvelope(cmkId, tmk.cipherText)(plainText, encoding);
    };

    const downloadS3Envelope = async (bucket, key, outputEnc='base64') => {

    };
};