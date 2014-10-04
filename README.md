How to build
====

1. make secret.json
```
{
  "twitter": {
    "consumer_key": "???",
    "consumer_secret": "???",
    "access_token_key": "???",
    "access_token_secret": "???"
  }
}
```
2. $ npm install -g gulp tsd
3. $ npm install
4. $ tsd reinstall -so
5. $ gulp
