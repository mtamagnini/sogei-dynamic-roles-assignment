namespace dynamic_workzone_roles;

entity MainRole{
    key id              : UUID;
        name            : String;
        subRoles        : Association to many SubRole on subRoles.mainRole = $self;
}

entity SubRole{
    key id              : UUID;
        name            : String;
        mainRole        : Association to MainRole;
        groups          : Association to many SubRoleGroupRelation on groups.subRole = $self;
}

entity WorkZoneGroup{
    key id              : UUID;
        workZoneId      : String;
        subRoles        : Association to many SubRoleGroupRelation on subRoles.workZoneGroup = $self;
}

entity SubRoleGroupRelation{
    key subRole         : Association to SubRole;
    key workZoneGroup   : Association to WorkZoneGroup;
}