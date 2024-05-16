namespace dynamic_workzone_roles;

using {managed} from '@sap/cds/common';

entity MainRole: managed {
    key id              : UUID;
        name            : String;
        subRoles        : Association to many SubRole on subRoles.mainRole = $self;
}

entity SubRole: managed {
    key id              : UUID;
        name            : String;
        mainRole        : Association to MainRole;
}