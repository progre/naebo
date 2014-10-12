export function simple(appRoot: string, name: string) {
    return () => ({
        restrict: 'E',
        replace: true,
        templateUrl: appRoot + 'html/' + name + '.html'
    });
}
