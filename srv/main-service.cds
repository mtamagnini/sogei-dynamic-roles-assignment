using dynamic_workzone_roles as my from '../db/schema';

service DynamicWorkzoneRolesService @(requires: 'authenticated-user') @(path: '/main') {

    entity MainRolesSet             as projection on my.MainRole;
    entity SubRolesSet              as projection on my.SubRole;
    entity WorkZoneGroupsSet        as projection on my.WorkZoneGroup;
    entity SubRoleGroupRelationsSet as projection on my.SubRoleGroupRelation;
    entity UsersSet                 as projection on my.User;

    type ActionResponse {
        status  : String enum {
            succeed;
            failed;
        };
        message : String;
    };

    function updateUsersLists(subRoleUUID : String)           returns ActionResponse;
    function testicolo(userId : String, subRoleUUID : String) returns ActionResponse;
}
