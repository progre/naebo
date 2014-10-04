import express = require('express');
var Twitter = require('twitter');
var secret = require('../../secret.json');

export function show(req: express.Request, res: express.Response) {
    var twitter = new Twitter(secret.twitter);
    getScreenNames(twitter, req.param('screenName'), req.param('slug'))
        .then(screenNames => {
            res.json(screenNames);
        })
        .catch(e => {
            res.send(e);
        });
}

function getScreenNames(twitter: any, screenName: string, slug: string): Promise<string[]> {
    var url = 'https://api.twitter.com/1.1/lists/members.json?skip_status=1&slug=' + slug + '&owner_screen_name=' + screenName;
    return new Promise((resolve, reject) => {
        function recursion(cursor: number, screenNames: string[], callback: (screenNames: string[]) => void) {
            twitter.get(url + '&cursor=' + cursor, (json: any) => {
                if (json.statusCode === 404) {
                    reject(404);
                    return;
                }

                var names = (<any[]>json.users).map((x: any) => <string>x.screen_name);
                screenNames = screenNames.concat(names);
                var nextCursor: number = json.next_cursor;
                if (nextCursor === 0) {
                    callback(screenNames);
                    return;
                }
                recursion(nextCursor, screenNames, callback);
            });
        }
        recursion(-1, [], resolve);
    });
}

