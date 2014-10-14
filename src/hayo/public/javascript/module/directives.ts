export function simple(appRoot: string, name: string) {
    return () => (<ng.IDirective>{
        restrict: 'E',
        replace: true,
        templateUrl: appRoot + 'html/' + name + '.html'
    });
}
