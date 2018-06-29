# certbot-auth-route53

#### Requirements
- Node 10+
- CertBot
- Yarn
- AWS Account

#### Installation
yarn install


#### Running
cd bin \
certbot-auth \
  --domain [*domain to register with certbot*] \
  --email [*email to use for domain registration*] \
  --staging [*optional flag to specify using staging serviers for testing*] \
  --folder [*optional path to letsencrypt root - defaults to '${PWD}/letsencrypt'*]
