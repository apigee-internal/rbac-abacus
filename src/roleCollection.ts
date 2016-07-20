import {IRole} from './role';

/***
 * Interface compatible to a Role Collection object from Apigee APIs.
 * Apigee APIs often expose collections as objects containing a single property named as the Type and
 * containing as value an array of such typoe of elements.
 */
export interface IRoleCollection {
    role: IRole[];
}
