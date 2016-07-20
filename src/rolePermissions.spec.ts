import {RolePermissions} from './rolePermissions';
import * as testCheck from 'testcheck';
import {PermissionOperation} from './resourcePermissions';

const gen = testCheck.gen;

const methods = ['put', 'get', 'delete'] as PermissionOperation[];
const pathFragments = ['a', 'b', 'c', 'd', '*'];

const emptyPerm = (org: string) => { return { organization: org, path: '', permissions: [] as PermissionOperation[] }; };

const report = (o: any) => {
    if (!o.result) {
        console.log('Failure values:', o.fail);
    }
};

const check = (property: testCheck.Generator<boolean>, options?: testCheck.Options): testCheck.Result =>
    testCheck.check(property, { seed: 0, times: 10 });

const prop = (argGens: testCheck.Generator<any>[], propertyFn: (...args: any[]) => boolean): testCheck.Result =>
    check(testCheck.property(argGens, propertyFn));

// Generators
const genOrg = (org?: string) =>
    org ? gen.return(org) : gen.map(a => a.join(''), gen.array(gen.alphaNumChar, 1, 20));

const many = <T>(values: T[], length?: number) =>
    gen.array(gen.returnOneOf(values), 0, length ? length : values.length + 1);

const pickManyUnique = <T>(values: T[]) => {
    if (!values || values.length === 0) {
        return gen.return([]);
    }
    return gen.map(
        a => a.reduce(
            (result, item) => {
                if (result.indexOf(item) < 0) { result.push(item); }
                return result;
            },
            []
        ),
        many(values)
    );
};

const genPath = gen.map(a => '/' + a.join('/'), pickManyUnique(pathFragments));

const rawPerm = (org?: string) =>
    gen.object({
        organization: genOrg(org),
        path: genPath,
        permissions: pickManyUnique(methods)
    });

const listPerm = (org?: string) => gen.array(rawPerm(org));

describe('RolePermissions', () => {

    it('Create new', () => {
        const rp = new RolePermissions();
        expect(rp.count).toBe(0);
    });

    it('Create new from empty payload', () => {
        const rp = new RolePermissions({ resourcePermission: [] });
        expect(rp.count).toBe(0);
    });

    it('Merge to empty collections result in empty collection', () => {
        const rp1 = new RolePermissions({ resourcePermission: [] });
        const rp2 = new RolePermissions({ resourcePermission: [] });
        const rp3 = rp1.merge(rp2);
        expect(rp3.count).toBe(0);
        expect(rp3).not.toBe(rp1);
        expect(rp3).not.toBe(rp2);
    });

    it('Merge non empty with empty results in equivalent collection', () => {
        const result = prop([listPerm('abc')],
            function (x) {
                const rp1 = new RolePermissions({ resourcePermission: x });
                const rp2 = new RolePermissions({ resourcePermission: [] });

                const rp1Rp2 = rp1.merge(rp2);
                const rp2Rp1 = rp2.merge(rp1);

                return rp1Rp2.count < x.length + 1 &&
                        rp1Rp2.count === rp2Rp1.count &&
                        rp2Rp1 !== rp1 &&
                        rp2Rp1 !== rp2 &&
                        rp1Rp2 !== rp1 &&
                        rp1Rp2 !== rp2;
            }
        );
        report(result);
        expect(result.result).toBe(true);
    });

    it('Merged paths should be in one greater or equal', () => {
        const result = prop([listPerm('abc'), listPerm('abc')],
            function (l1, l2) {
                const rp1 = new RolePermissions({ resourcePermission: l1 });
                const rp2 = new RolePermissions({ resourcePermission: l2 });

                const rp3 = rp1.merge(rp2);

                return rp3.count >= rp1.count &&
                        rp3.count >= rp2.count &&
                        rp3.count <= rp1.count + rp2.count;
            }
        );
        report(result);
        expect(result.result).toBe(true);
    });

    it('Merged paths should be in one of two original sets', () => {
        const result = prop([listPerm('abc'), listPerm('abc')],
            function (l1, l2) {
                const rp1 = new RolePermissions({ resourcePermission: l1 });
                const rp2 = new RolePermissions({ resourcePermission: l2 });

                const rp3 = rp1.merge(rp2);

                const paths1 = rp1.permissions.map(p => p.path);
                const paths2 = rp2.permissions.map(p => p.path);
                const paths3 = rp3.permissions.map(p => p.path);

                // elements of paths3 should be in one or the other sets
                for (let i = 0; i < paths3.length; i ++) {
                    let p = paths3[i];
                    if (paths1.indexOf(p) < 0 && paths2.indexOf(p) < 0) { return false; }
                }

                // if it is in paths1, it should be in paths3
                for (let i = 0; i < paths1.length; i ++) {
                    let p = paths1[i];
                    if (paths3.indexOf(p) < 0) { return false; }
                }

                // if it is in paths2, it should be in paths3
                for (let i = 0; i < paths2.length; i ++) {
                    let p = paths2[i];
                    if (paths3.indexOf(p) < 0) { return false; }
                }

                return true;
            }
        );
        report(result);
        expect(result.result).toBe(true);
    });

    it('Role Permissions should be ordered by depth', () => {
        const result = prop([listPerm('abc')],
            function (l1) {
                const rp = new RolePermissions({ resourcePermission: l1 });

                if (rp.count > 0) {
                    const paths = rp.permissions.map(p => p.depth);
                    let path: number = paths[0];
                    paths.forEach(p => {
                        if (path < p) { return false; }
                        path = p;
                    });
                }
                return true;
            }
        );
        report(result);
        expect(result.result).toBe(true);
    });

    it('Allowed path and operation on empty permissions should be false', () => {
        const rp = new RolePermissions({ resourcePermission: [] });
        expect(rp.allows()).toBe(false);
        expect(rp.allows('')).toBe(false);
        expect(rp.allows('', ['get'])).toBe(false);
        expect(rp.allows('any string', ['put'])).toBe(false);
    });

    it('Allowed path and operation', () => {
        const p1 = emptyPerm('abc');
        p1.path = '/a';
        p1.permissions = ['get'];
        const rp = new RolePermissions({ resourcePermission: [p1] });
        expect(rp.allows()).toBe(false);
        expect(rp.allows('')).toBe(false);
        expect(rp.allows('', ['get'])).toBe(false);
        expect(rp.allows('a', ['get'])).toBe(false);
        expect(rp.allows('/a', ['get'])).toBe(true);
        expect(rp.allows('/a/', ['get'])).toBe(true);
        expect(rp.allows('/a/b', ['get'])).toBe(true);
        expect(rp.allows('/b', ['get'])).toBe(false);
        expect(rp.allows('/a/b', ['put'])).toBe(false);
        expect(rp.allows('/a/b', ['delete'])).toBe(false);
        expect(rp.allows('/a/b')).toBe(false);
    });

    it('More specific permission will win allowing', () => {
        const p1 = emptyPerm('abc');
        p1.path = '/a';
        p1.permissions = [];
        const p2 = emptyPerm('abc');
        p2.path = '/a/b';
        p2.permissions = ['get'];
        const rp = new RolePermissions({ resourcePermission: [p1, p2] });
        expect(rp.allows('/a', ['get'])).toBe(false);
        expect(rp.allows('/a/b', ['get'])).toBe(true);
        expect(rp.allows('/a/b/c', ['get'])).toBe(true);
    });

    it('More specific permission will win forbidding', () => {
        const p1 = emptyPerm('abc');
        p1.path = '/a';
        p1.permissions = ['get'];
        const p2 = emptyPerm('abc');
        p2.path = '/a/b';
        p2.permissions = [];
        const rp = new RolePermissions({ resourcePermission: [p1, p2] });
        expect(rp.allows('/a', ['get'])).toBe(true);
        expect(rp.allows('/a/b', ['get'])).toBe(false);
        expect(rp.allows('/a/b/c', ['get'])).toBe(false);
    });

    it('Allows Operations, GET', () => {
        const p1 = emptyPerm('abc');
        p1.path = '/a';
        p1.permissions = ['get'];
        const rp = new RolePermissions({ resourcePermission: [p1] });
        expect(rp.allowsOperations('/a').length).toBe(1);
        expect(rp.allowsOperations('/a').indexOf('get')).toBeGreaterThan(-1);
    });
});
