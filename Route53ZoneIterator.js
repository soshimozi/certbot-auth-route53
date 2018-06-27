// pagedZones.js
'use strict';

const AWS = require('aws-sdk');
const route53 = new AWS.Route53();

module.exports.Route53ZonePager = class {

    constructor(options) {
        this.options = options || {};

        this.size = this.options.pageSize || 100;
        this.NextDNSName = null;
        this.NextHostedZoneId = null;
    }

    paginate () {

        let params = {
            MaxItems: this.size.toString(),
            DNSName: this.NextDNSName,
            HostedZoneId: this.NextHostedZoneId
        };


        return new Promise((resolve, reject) => {
            route53.listHostedZonesByName(params, (err, data) => {

                if (err) reject(err);

                // copy values for paging over
                this.NextDNSName = data.NextDNSName;
                this.NextHostedZoneId = data.NextHostedZoneId;

                resolve(data);
            });
        });
    }
};


module.exports.Route53ZoneIteratorAsync = class {

    constructor(paginator, options) {
        this.options = options || {};
        this.paginator = paginator;
        this.done = false;
    }

    [Symbol.asyncIterator]() {

        return {
            next: () => {
                if(this.done) return Promise.resolve({
                    done: true
                });

                return this.paginator.paginate()
                    .then((result) => {
                        this.done = !result.IsTruncated;
                        return {
                            value: result.HostedZones,
                            done: false
                        }
                    })
            }
        }
    }

};
