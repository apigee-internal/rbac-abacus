import * as _ from 'lodash';

export type PermissionOperation = 'get' | 'put' | 'delete';

export interface IResourcePermissions {
    organization: string;
    path: string;
    permissions?: PermissionOperation[];
}

export class ResourcePermissions implements IResourcePermissions {

    private _permissions: PermissionOperation[];
    private _regex: RegExp;
    private _depth: number;

    public static from = (permissions: IResourcePermissions) => {
        return new ResourcePermissions(
            permissions.organization,
            permissions.path,
            permissions.permissions || []
        );
    };

    constructor (private org: string, private pathString: string, permissions?: PermissionOperation[]) {
        this._permissions = permissions || [];
        const end = pathString.substr(pathString.length - 1) === '/' ? '(?:[^/]+/.*|[^/]+)?$' : '(?:/.*)?$';
        this._regex = new RegExp('^' + pathString.replace(/\*/g, '[^/]+') + end);
        this._depth = (pathString.match(/\//g) || []).length + (pathString.match(/[^\/]+/g) || []).length;
    }

    public get organization(): string {
        return this.org;
    }

    public get path(): string {
        return this.pathString;
    }

    public get permissions(): PermissionOperation[] {
        return this._permissions;
    }

    public get depth(): number {
        return this._depth;
    }

    public merge = (permissions?: ResourcePermissions): ResourcePermissions => {
        if (!permissions || permissions.organization !== this.organization || permissions.path !== this.path) {
            return this.copy();
        }
        return this.copy({ permissions: _.union(this.permissions, (permissions.permissions)) });
    };

    public copy = (values: { organization?: string, path?: string, permissions?: PermissionOperation[] } = {}): ResourcePermissions => {
        return new ResourcePermissions(
            values.organization || this.organization,
            values.path || this.path,
            values. permissions || this._permissions
        );
    };

    public matchPath = (path: string): boolean => this._regex.test(path);

    public allows = (ops?: PermissionOperation[]): boolean => {
        const operations: PermissionOperation[] = (ops && ops.length > 0) ? ops : ['get', 'put', 'delete'];
        return _.intersection(operations, this.permissions).length === operations.length;
    };

    public match = (path: string, ops?: PermissionOperation[]): boolean => this.matchPath(path) && this.allows(ops);
}
