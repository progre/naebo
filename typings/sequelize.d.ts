declare module 'sequelize' {
    class Sequelize {
        static STRING: {
            (_1234: number): any;
            BINARY: any;
        };
        static TEXT: any;
        static INTEGER: any;
        static BIGINT: {
            (_11: number): any;
        };
        static FLOAT: {
            (_11: number): any;
            (_11: number, _12: number): any;
        };
        static DECIMAL: {
            (_10: number, _2: number): any;
        };
        static DATE: any;
        static BOOLEAN: any;
        static ENUM(value1: string, value2: string): any;
        static ARRAY(text: any): any;
        static BLOB: {
            (tiny: string): any;
        };
        static UUID: any;

        constructor(...options: any[]);
        Utils: any;
        DAOValidator: any;
        Transaction: any;
        Error: any;
        ValidationError: any;
        getDialect(): any;
        getQueryInterface(): any;
        getMigrator(options?: any, force?: boolean): any;
        define(daoName: string, attributes: any, options?: any): sequelize.Model;
        model(daoName: string): any;
        isDefined(daoName: string): any;
        import(path: string): any;
        query(sql: string, callee?: any, options?: any, replacements?: any): any;
        createSchema(schema: any): any;
        showAllSchemas(): any;
        dropSchema(schema: any): any;
        dropAllSchemas(): any;
        sync(options?: any): any;
        drop(options: any): any;
        authenticate(): any;
        fn(fn: any, args: any): any;
        col(col: any): any;
        cast(val: any, type: any): any;
        literal(val: any): any;
        and(args: any): any;
        or(args: any): any;
        where(attr: any, condition: any): any;
        transaction(options?: any): any;
        transaction(options: any, callback: Function): any;
    }

    export = Sequelize;
}

declare module sequelize {
    class Model {
        sync(): any;
        drop(options?: any): any;
        schema(schema: any, options?: any): any;
        getTableName(options: any): any;
        scope(options: any): any;
        findAll(options?: any, queryOptions?: any): Promise<Instance[]>;
        find(options?: any, queryOptions?: any): any;
        aggregate(field: any, aggregateFunction: any, options?: any): any;
        count(options?: any): any;
        findAndCountAll(findOptions?: any, queryOptions?: any): any;
        max(field: any, options?: any): any;
        min(field: any, options?: any): any;
        sum(field: any, options?: any): any;
        build(values: any, options?: any): any;
        create(values: any, options?: any): Promise<Instance>;
        findOrInitialize(where: any, defaults?: any, options?: any): any;
        findOrCreate(where: any, defaults?: any, options?: any): any;
        bulkCreate(records: any, options?: any): any;
        destroy(where?: any, options?: any): any;
        update(attrValueHash: any, where: any, options?: any): any;
        describe(): any;
        dataset(): any;
    }

    class Instance {
        isNewRecord: any;
        Model: any;
        sequelize: any;
        isDeleted: any;
        values: any;
        isDirty: any;
        primaryKeyValues: any;
        getDataValue(key: any): any;
        setDataValue(key: any, value: any): any;
        get(key: any): any;
        set(key: any, value: any, options?: any): any;
        changed(key: any): any;
        previous(key: any): any;
        save(fields?: any, options?: any): any;
        reload(options?: any): any;
        validate(options?: any): any;
        updateAttributes(updates: any, options: any): any;
        destroy(options?: any): any;
        increment(fields: any, options?: any): any;
        decrement(fields: any, options?: any): any;
        equals(other: any): any;
        equalsOneOf(others: any): any;
        toJSON(): any;
    }
}
