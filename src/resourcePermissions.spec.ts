import {ResourcePermissions} from './resourcePermissions';

describe('RBAC ResourcePermissions', () => {

    it('Creating from raw', () => {
        const rp = ResourcePermissions.from({
            organization: 'abc',
            path: '/path',
        });
        expect(rp.organization).toBe('abc');
        expect(rp.path).toBe('/path');
        expect(rp.permissions).toEqual([]);
    });

    it('Depth on paths', () => {
        const raw = {
            organization: 'abc',
            path: '',
        };
        expect(ResourcePermissions.from(raw).depth).toBe(0);
        raw.path = '/a';
        expect(ResourcePermissions.from(raw).depth).toBe(2);
        raw.path = '/a/b';
        expect(ResourcePermissions.from(raw).depth).toBe(4);
        raw.path = '/a/b/c';
        expect(ResourcePermissions.from(raw).depth).toBe(6);
        raw.path = '/a/b/c/d';
        expect(ResourcePermissions.from(raw).depth).toBe(8);
    });

    it('Merge will create new instance when merged with empty or undefined', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path');
        const rp2 = rp1.merge();
        const rp3 = rp1.merge({} as ResourcePermissions);
        expect(rp1).not.toBe(rp2);
        expect(rp1).not.toBe(rp3);
    });

    it('Merge will create new instance of itself when merged with another with different org or path', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path');
        const rp2 = rp1.merge(new ResourcePermissions('abcd', '/some-path', ['get']));
        const rp3 = rp1.merge(new ResourcePermissions('abc', '/some-paths', ['put']));
        expect(rp2.organization).toEqual(rp1.organization);
        expect(rp2.path).toEqual(rp1.path);
        expect(rp2.permissions).toEqual(rp1.permissions);
        expect(rp3.organization).toEqual(rp1.organization);
        expect(rp3.path).toEqual(rp1.path);
        expect(rp3.permissions).toEqual(rp1.permissions);
    });

    it('Merge with same org and path will merge permissions', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path', ['get']);
        const rp2 = rp1.merge(new ResourcePermissions('abc', '/some-path', ['put']));
        expect(rp2.organization).toEqual(rp1.organization);
        expect(rp2.path).toEqual(rp1.path);
        expect(rp2.permissions).toEqual(['get', 'put']);
    });

    it('Merge with same org and path will merge permissions should not duplicate', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path', ['get']);
        const rp2 = rp1.merge(new ResourcePermissions('abc', '/some-path', ['get', 'put']));
        expect(rp2.organization).toEqual(rp1.organization);
        expect(rp2.path).toEqual(rp1.path);
        expect(rp2.permissions).toEqual(['get', 'put']);
    });

    it('Match path should match same string', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path');
        expect(rp1.matchPath('/some-path')).toBe(true);
        expect(rp1.matchPath('/some-path/')).toBe(true);
        expect(rp1.matchPath('/some-path/2')).toBe(true);
        expect(rp1.matchPath('/some-path2')).toBe(false);
        expect(rp1.matchPath('/some-pat/')).toBe(false);
    });

    it('Match path should match with wildcard', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path/*/123');
        expect(rp1.matchPath('/some-path/some/123')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/5')).toBe(true);
        expect(rp1.matchPath('/some-path/123')).toBe(false);
        expect(rp1.matchPath('/some-path')).toBe(false);
    });

    it('Match path should match with ending wildcard', () => {
        const rp1 = new ResourcePermissions('abc', '/some-path/*');
        expect(rp1.matchPath('/some-path/some/123')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/5')).toBe(true);
        expect(rp1.matchPath('/some-path/123')).toBe(true);
        expect(rp1.matchPath('/some-path')).toBe(false);
    });

    it('Match path should with root', () => {
        const rp1 = new ResourcePermissions('abc', '/');
        expect(rp1.matchPath('/some-path/some/123')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/')).toBe(true);
        expect(rp1.matchPath('/some-path/some/123/5')).toBe(true);
        expect(rp1.matchPath('/some-path/123')).toBe(true);
        expect(rp1.matchPath('/some-path')).toBe(true);
        expect(rp1.matchPath('/')).toBe(true);
    });

    it('Match should fail if no operation is in permissions', () => {
        const rp = new ResourcePermissions('abc', '/some-path/*/123');
        expect(rp.match('/some-path/some/123', ['get'])).toBe(false);
        expect(rp.match('/some-path/some/123', ['put'])).toBe(false);
        expect(rp.match('/some-path/some/123', ['delete'])).toBe(false);
    });
});
