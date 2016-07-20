RBAC Abacus
===========

**This is an in-progress project of Apigee Corporation. No support is expressed or implied.
Use at your own risk.**

Node and Browser library to calculate permissions for a given user based on multiple role
configuration.

## Installation

    npm install rbac-abacus
    
### Dependencies

* **Lodash** 4.0.0 or newer will be needed in your project.

## Usage

    const ps = httpGetPermissions();
    const permissions = new RolePermissions(ps);
    
    permissions.count; // Count of permissions loaded
    
    // Merge two RolePermissions into one
    const newPerms = permissions.merge(anotherPermissionSet);
    
    // Returns if a given path allows specific operations
    permissions.allows('/a', ['get']);


## API Models

### Operations

Allowed operations are get, put and delete, where put includes creation and
update of entities. 

    type PermissionOperation = 'get' | 'put' | 'delete';

### ResourcePermissions

A ResourcePermissions can be seen as a pair of a _path_ where the permission applies and
a set of operations that are allowed for that particular path:

    interface IResourcePermissions {
        organization: string;
        path: string;
        permissions?: PermissionOperation[];
    }

### Paths

All paths are strings representing URL fragments (no query string) where `*` is a wildcard: 

    / <- represents the root of the API
    /a/b/c
    /a/*/b
     
## Development

If you want to contribute to this project, you will need to clone it and
install dependencies:

    npm install
    npm install lodash
    npm run install:typings

Running `test` will run the linter, transpile the TypeScript code into JavaScript,
run the tests and generate the coverage report:

    npm test
