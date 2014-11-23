class StackablePromiseCommand {
    private executings: any[] = [];

    constructor(
        private $scope: any,
        private _execute: (arg: any) => Promise<any>,
        private _isEnabled?: (...args: any[]) => boolean,
        private _isVisible?: (...args: any[]) => boolean) {
    }

    execute(arg: any) {
        if (!this.isVisible(arg)
            || !this.isEnabled(arg))
            return;
        this.executings.push(arg);
        this._execute(arg)
            .then(() => {
                this.$scope.$apply(
                    () => this.executings
                        = this.executings.filter(x => x !== arg));
            })
            .catch(err => {
                console.error(err.stack);
            });
    }

    isEnabled(arg: any) {
        return this.executings.indexOf(arg) < 0
            && (this._isEnabled == null || this._isEnabled.apply(this, arguments));
    }

    isVisible(arg: any) {
        return this._isVisible == null || this._isVisible.apply(this, arguments);
    }
}

export = StackablePromiseCommand;
