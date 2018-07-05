const crypto = require('crypto');
const ALGO = 'AES-256-CBC';

const IV_LENGTH = 16; // For AES, this is always 16
const KEY_LENGTH = 32; // (32 characters, or 256 bytes)

module.exports = (kms) => {

    const encrypt = (keyBase64) => (plainText, plainTextEnc = 'utf8') => {

        const Iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGO, Buffer.from(keyBase64, 'base64'), Iv);

        let cipherText = cipher.update(plainText, plainTextEnc, 'base64');
        cipherText += cipher.final('base64');   

        return { cipherText, Iv };
    };

    const decrypt = (keyBase64, ivBase64) => (cipherText, cipherTextEnc = 'utf8') => {
        const decipher = crypto.createCipheriv(ALGO, Buffer.from(keyBase64, 'base64'), Buffer.from(ivBase64, 'base64'));
        return (Buffer.concat([decipher.update(cipherText, cipherTextEnc), decipher.final()])).toString('base64');
    };

    const createTenantMasterKey = async (cmkId) => {
        const { KeyId, CiphertextBlob, Plaintext, abc } = await kms.generateDataKey({
            KeyId: cmkId,
            KeySpec: 'AES_256',
        }).promise();
        return {
            plainText: Plaintext.toString('base64'),
            cipherText: CiphertextBlob.toString('base64'),
            cmkId: KeyId,
            createdAt: (new Date()).toISOString(),
        };
    };

    const decryptTenantMasterKey = async (cipherTextBase64) => {

        try {
            const result = await kms.decrypt({
                CiphertextBlob: Buffer.from(cipherTextBase64, 'base64'),
            }).promise();
            return {
                cmkId: result.KeyId,
                plainText: result.Plaintext.toString('base64'),
            };
        }
        catch(error) {
            console.error(error);
        }
    };

    const createDataKey = async (tmkPlainText) => {

        let Plaintext = crypto.randomBytes(KEY_LENGTH);

        const { cipherText, Iv } = encrypt(tmkPlainText)(Plaintext.toString('base64'));
        return {
            Plaintext,
            cipherText,
            Iv,
            createdAt: (new Date()).toISOString()
        };

    };

    const encryptEnvelope = (tmkCipherText) => async (dataPlainText, inputEnc = 'utf8') => {
        
        const tmkPlainTextBase64 = await decryptTenantMasterKey(tmkCipherText);

        const tdk = await createDataKey(tmkPlainTextBase64.plainText);

        const { cipherText, Iv } = encrypt(tdk.Plaintext)(dataPlainText, inputEnc);

        const hmac = crypto.createHmac('SHA256', tmkPlainTextBase64.plainText);
        hmac.update(cipherText);
        hmac.update(Iv.toString('base64'));

        return {
            tmkCipherText,
            tdkCipherText: tdk.cipherText,
            tdkIV: tdk.Iv,
            tdkIVBase64: tdk.Iv.toString('base64'),
            dataCipherText : cipherText,
            dataIV: Iv,
            dataIVBase64: Iv.toString('base64'),
            hmac: hmac.digest('base64'),
            createdAt: (new Date()).toISOString()
        };
    };

    const decryptEnvelope = async (envelope, outputEnc = 'base64') => {
        const {
            tmkCipherText,
            tdkCipherText,
            dataCipherText,
        } = envelope;
        const tmk = await decryptTenantMasterKey(tmkCipherText);
        const tdk = decrypt(tmk.plainText)(tdkCipherText);
        const dataPlainText = (Buffer.from((decrypt(tdk)(dataCipherText)), 'base64')).toString(outputEnc);
        return {
            cmkId: tmk.cmkId,
            dataPlainText,
            decryptedAt: (new Date()).toISOString(),
        };
    };

    return {
        encrypt,
        decrypt,
        createTenantMasterKey,
        decryptTenantMasterKey,
        createDataKey,
        encryptEnvelope,
        decryptEnvelope,
    };
};