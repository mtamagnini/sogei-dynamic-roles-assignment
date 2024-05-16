using dynamic_workzone_roles as my from '../db/schema';

service DynamicWorkzoneRolesService{

    entity MainRolesSet as projection on my.MainRole;
    entity SubRolesSet  as projection on my.SubRole;

    type ActionResponse{
        status : String enum{
            succeed;
            failed;
        };
        message: String;
    };

    action updateUsersLists(userId: String, mainRole: String, subRole: String) returns ActionResponse;
}