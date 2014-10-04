export var onURLChanged = ['$http', '$rootScope', ($http: ng.IHttpService, $rootScope: any) => {
    var activeAccess: ng.IPromise<void>;
    return (url: string) => {
        var m = new RegExp('https://twitter.com/(.+)/lists/(.+)').exec(url);
        if (m == null)
            return;
        $rootScope.loadState = 'loading';
        var currentAccess = $http.get<string>('/m2l/api/1/lists/' + m[1] + '/' + m[2])
            .then(res => {
                if (currentAccess !== activeAccess) {
                    return;
                }
                $rootScope.loadState = 'loaded';
                $rootScope.users = res.data;

                $rootScope.tweetSet = tryMakeTweetSet($rootScope.users, $rootScope.text);
            })
            .catch(reason => {
                if (currentAccess !== activeAccess) {
                    return;
                }
                $rootScope.loadState = 'failed';
                $rootScope.users = [];
                $rootScope.tweetSet = [];
            });
        activeAccess = currentAccess;
    }
}];

export var onTextChanged = ['$rootScope', ($rootScope: any) => {
    return (text: string) => {
        $rootScope.text = text;
        $rootScope.tweetSet = tryMakeTweetSet($rootScope.users, text);
    };
}];

function tryMakeTweetSet(users: string[], text: string) {
    if (users == null || users.length <= 0 || text == null || text.length <= 0) {
        return [];
    }
    return makeMinimumTweetSet(users, text, '(続く)');
}

function makeMinimumTweetSet(users: string[], message: string, joinMessage: string) {
    var minLength = Number.MAX_VALUE;
    var tweetSet: string[] = [];
    for (var i = 20; i < 140; i++) {
        var tSet = makeTweetSet(users, message, joinMessage, i);
        if (minLength > tSet.length) {
            tweetSet = tSet;
            minLength = tSet.length;
        } else if (minLength < tSet.length) {
            break;
        }
    }
    return tweetSet.map((x, index) => ({ index: index, text: x }));
}

function makeTweetSet(users: string[], message: string, joinMessage: string, textArea: number) {
    var usersSet = splitUsers(users, 140 - textArea);
    var messageSet = splitMessage(message, joinMessage, textArea);
    var tweetSet: string[] = [];
    usersSet.forEach(users => {
        messageSet.forEach(message => {
            tweetSet.push(users + message);
        });
    });
    return tweetSet;
}

function splitUsers(users: string[], usersArea: number) {
    var usersSet: string[] = [];
    users.reduce((prev, current) => {
        var newUsers = prev + '@' + current + ' ';
        if (newUsers.length > usersArea) {
            usersSet.push(prev);
            newUsers = '.@' + current + ' ';
        }
        return newUsers;
    }, '.');
    return usersSet;
}

function splitMessage(message: string, joinMessage: string, textArea: number) {
    var messageSet = splitByNum(message, textArea - joinMessage.length);
    mergeLastMessage(messageSet, joinMessage.length);
    return messageSet.map((x, index) => {
        if (index === messageSet.length - 1)
            return x;
        return x + joinMessage;
    });
}

function mergeLastMessage(messageSet: string[], joinMessageLength: number) {
    var len = messageSet.length;
    if (len > 1 && messageSet[len - 1].length <= joinMessageLength) {
        messageSet[len - 2] += messageSet.pop();
    }
}

function splitByNum(str: string, num: number) {
    var index = 0;
    var list: string[] = [];
    for (; ;) {
        var a = str.substring(index, index += num);
        list.push(a);
        if (str.length <= index) {
            break;
        }
    }
    return list;
}