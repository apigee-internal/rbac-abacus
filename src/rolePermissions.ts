import * as _ from 'lodash';
import {IResourcePermissions, ResourcePermissions, PermissionOperation} from './resourcePermissions';

export interface IResourcePermissionsResponse {
    resourcePermission: IResourcePermissions[];
}

export interface IResourcePermissionsDictionary {
    [index: string]: ResourcePermissions;
}

export class RolePermissions {

    private _permissions: IResourcePermissionsDictionary;
    private _sortedPermissions: ResourcePermissions[];

    constructor (permissions?: IResourcePermissionsResponse | IResourcePermissionsDictionary) {
        if (_.has(permissions, 'resourcePermission')) {
            this._permissions = {} as IResourcePermissionsDictionary;

            const nps =  _.map(
                _.get(permissions, 'resourcePermission') as IResourcePermissions[],
                p => new ResourcePermissions(p.organization, p.path, p.permissions)
            ) as ResourcePermissions[];

            nps.forEach(p => {
                this._permissions[p.path] = p.merge(this._permissions[p.path]);
            });
        } else  {
            this._permissions = (permissions  || {}) as IResourcePermissionsDictionary;
        }
    }

    public get count(): number {
        return this.permissions.length;
    }

    public get permissions(): ResourcePermissions[] {
        if (!this._sortedPermissions) {
            this._sortedPermissions = _.orderBy(this._permissions, 'depth', 'desc') as ResourcePermissions[];
        }
        return this._sortedPermissions;
    }

    public merge = (other: RolePermissions): RolePermissions => {
        this._sortedPermissions = undefined;
        const copy = _.clone(this._permissions) as IResourcePermissionsDictionary;
        _.forEach(other.permissions, (p: ResourcePermissions) => {
            copy[p.path] = p.merge(copy[p.path]);
        });

        return new RolePermissions(copy);
    };

    public allows = (path?: string, ops?: PermissionOperation[]): boolean => {
        const find = this.find(path);
        return !!find && find.allows(ops);
    };

    public allowsOperations = (path?: string): PermissionOperation[] => {
        const find = this.find(path);
        return find ? find.permissions : [];
    };

    public find = (path?: string): ResourcePermissions => {
        if (path) {
            return _.find(this.permissions, (p: ResourcePermissions) => p.matchPath(path));
        }
    };

}
