const AWS = require('aws-sdk');
const route53 = new AWS.Route53();

const {Route53ZoneIteratorAsync, Route53ZonePager} = require('./Route53ZoneIterator');

String.prototype.rtrim = function (s) {
    if (s == undefined)
        s = '\\s';
    return this.replace(new RegExp("[" + s + "]$"), '');
};
String.prototype.ltrim = function (s) {
    if (s == undefined)
        s = '\\s';
    return this.replace(new RegExp("^[" + s + "]"), '');
};

Array.prototype.isEqual = function(arr) {
    if(arr.length != this.length) throw new Error("Arrays must be equal length");

    return this.every((u, i) => {
        return u === arr[i];
    })
};

async function findZoneIdForDomain(domain) {

    let zones = [];

    const target_labels = domain.rtrim('.').split('.');

    const pager = new Route53ZonePager({pageSize: 1});
    const pageIterator = new Route53ZoneIteratorAsync(pager);

    for await(let page of pageIterator) {
        for (let zone of page) {
            if(zone.Config.PrivateZone) continue;

            let candidates = zone.Name.rtrim('.').split('.');
            if(candidates.isEqual(target_labels.slice((target_labels.length - candidates.length)))) {
                zones.push({Name: zone.Name, Id: zone.Id});
            }
        }
    }

    if(zones.length == 0) throw new Error(`Unable to find a Route53 hosted zone for ${target}`);

    return zones.sort((a, b) => {
        return a.length > b.length ? 1 : a.length < b.length ? -1 : 0;
    })[0].Id;
}

const ttl = 10;

function writeRecord(zoneId, domain, value, action) {

    const params = {
        ChangeBatch: {
            Changes: [
                {
                    Action: action,
                    ResourceRecordSet: {
                        Name: domain,
                        ResourceRecords: [
                            {
                                Value: `"${value}"`
                            }
                        ],
                        TTL: ttl,
                        Type: "TXT"
                    }
                }
            ],
            Comment: `certbot-dns-route53 certificate validation ${action}`,
        },
        HostedZoneId: zoneId
    };

    return new Promise((resolve,reject) => {
        route53.changeResourceRecordSets(params, function (err, data) {
            if (err) reject(err);
            resolve(data.ChangeInfo.Id);
        });
    });
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForChange(changeId) {

    for(let i=0; i<120; i++) {

        let response = await new Promise((resolve,reject) => {

            var params = {
                Id: changeId
            };

            route53.getChange(params, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        });

        if (response.ChangeInfo.Status === "INSYNC") {
            return;
        }

        await timeout(5000);
    }

    throw new Error(`Timed out waiting for Route53 change. Current status: ${response.ChangeInfo.Status}`);
}

async function doAction(domain, value, action) {
    let zoneId = await findZoneIdForDomain(domain);
    let changeId = await writeRecord(zoneId, `_acme-challenge.${domain}`, value, action);

    await waitForChange(changeId);
    return `${action} Succeeded!`;
}


module.exports = function() {
    const action = process.env.CERTBOT_AUTH_OUTPUT ? 'DELETE' : 'UPSERT';
    doAction(process.env.CERTBOT_DOMAIN, process.env.CERTBOT_VALIDATION, action).then((result) => {
        console.log(result);
    }, (err) => {
        console.log(err.message);
    });
};


