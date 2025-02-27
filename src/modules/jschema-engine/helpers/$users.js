const {
    CognitoIdentityProviderClient,
    ListUsersInGroupCommand,
    ListUsersCommand,
    ListGroupsCommand,
    AdminRemoveUserFromGroupCommand,
    AdminGetUserCommand,
    AdminListGroupsForUserCommand,
    CreateGroupCommand, 
    GroupExistsException,
    AdminAddUserToGroupCommand,
    AdminUpdateUserAttributesCommand,
    UserNotFoundException,
    DeleteGroupCommand, 
    ResourceNotFoundException,
    AdminCreateUserCommand,
    AdminDeleteUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");


exports.listGroupUsers = async function (groupName) {
    return groupUsers(groupName);
}

exports.listGroups = async function (dataset) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION }); 
    const params = {
        UserPoolId: process.env.$APP_USERPOOLID, // replace with your user pool ID
    };

    let allGroups = [];
    let paginationToken = null;

    do {
        const command = new ListGroupsCommand({
            ...params,
            NextToken: paginationToken,
        });

        const response = await Client.send(command);
        paginationToken = response.NextToken;

        const filteredGroups = response.Groups;
        allGroups = allGroups.concat(filteredGroups.map(group => {
            return {
                name: group.GroupName,
                description: group.Description,
                creationDate: group.CreationDate,
                lastModifiedDate: group.LastModifiedDate
            };
        }));

    } while (paginationToken);
    if (dataset){
        allGroups = allGroups.filter((g)=>{return g.name.startsWith(dataset + '-') || g.name.startsWith(`${dataset}$modeler`)});
    }
    return allGroups;
};

exports.listAllUsers = async function (qry) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const params = {
        UserPoolId: process.env.$APP_USERPOOLID, // replace with your user pool ID
    };

    if (qry){
        params.Filter = `email ^= "${qry}"`;
    }

    const command = new ListUsersCommand(params);
    const response = await Client.send(command);
    const userList = response.Users.map((u)=>{
        return {
            username: u.Username,
            email: u.Attributes.find((a)=>{return a.Name == 'email'}).Value,
            status: u.UserStatus,
            created: u.UserCreateDate,
            updated: u.UserLastModifiedDate
        }
    })
    return userList ;
};

exports.removeUserGroup = async function (username, groupName) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const command = new AdminRemoveUserFromGroupCommand({
        Username: username,
        GroupName: groupName,
        UserPoolId: process.env.$APP_USERPOOLID
      });
    
    const response = await Client.send(command);
    return true;
}

exports.getEmail = async function (username) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const command = new AdminGetUserCommand({
        Username: username,
        UserPoolId: process.env.$APP_USERPOOLID
    });

    try {
        const response = await Client.send(command);
        const emailAttribute = response.UserAttributes.find(attr => attr.Name === 'email').Value;
        return emailAttribute;
    } catch (error) {
        if (error instanceof UserNotFoundException) {
            return null;
        }
        throw error; // Re-throw other unexpected errors
    }
}

exports.getUser = async function (username) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const command = new AdminGetUserCommand({
        Username: username,
        UserPoolId: process.env.$APP_USERPOOLID
    });

    try {
        const response = await Client.send(command);
        const user = {
            username: response.Username,
            email: response.UserAttributes.find((a)=>{return a.Name == 'email'}).Value,
            status: response.UserStatus,
            created: response.UserCreateDate,
            updated: response.UserLastModifiedDate
        }
        const gres = await Client.send(new AdminListGroupsForUserCommand({
            Username: username,
            UserPoolId: process.env.$APP_USERPOOLID
        }));
        const groups = gres.Groups || [];
        user.groups = groups.map(group => group.GroupName);
        return user
    } catch (error) {
        if (error instanceof UserNotFoundException) {
            return null;
        }
        throw error; // Re-throw other unexpected errors
    }
}

exports.getUserGroups = async function (username) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const response = await Client.send(new AdminListGroupsForUserCommand({
        Username: username,
        UserPoolId: process.env.$APP_USERPOOLID
      }));
    const groups = response.Groups || [];
    return groups.map(group => group.GroupName);
}

exports.createGroup = async function (groupName) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION });

    try {
        await Client.send(new CreateGroupCommand({
            GroupName: groupName,
            UserPoolId: process.env.$APP_USERPOOLID
        })); 
        return true;
    } catch (error) {
        if (error instanceof GroupExistsException) {
            return true;
        } else {
            throw error;
        }
    }
}

exports.newUser = async function (email) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const params = {
        UserPoolId: process.env.$APP_USERPOOLID, // replace with your user pool ID
        Username: email,
        UserAttributes: [ { Name: "email", Value: email } ],
        DesiredDeliveryMediums: ["EMAIL"]
    };


    const command = new AdminCreateUserCommand(params);
    const response = await Client.send(command);
    const user = {
        username: response.User.Username,
        email: response.User.Attributes.find((a)=>{return a.Name == 'email'}).Value,
        status: response.User.UserStatus,
        created: response.User.UserCreateDate,
        updated: response.User.UserLastModifiedDate
    }
    return user;
}

exports.deleteUser = async function (username) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 

    const command = new AdminDeleteUserCommand({
        Username: username,
        UserPoolId: process.env.$APP_USERPOOLID
    });
    // Write History
    await Client.send(command);
    return { status: 200, msg: {} };
}

exports.editUser = async function (username) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const params = {
        UserPoolId: process.env.$APP_USERPOOLID,
        Username: username,
        UserAttributes: [
          {
            Name: 'roles',
            Value: 'mrhippo'
          }
        ]
      };
    
    const command = new AdminUpdateUserAttributesCommand(params);
    
    const response = await Client.send(command);
    console.debug('User attribute updated successfully:', response);

    return true;
}

exports.assignRole = async function (username, groupName) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const addUserToGroupCommand = new AdminAddUserToGroupCommand({
        GroupName: groupName,
        Username: username,
        UserPoolId: process.env.$APP_USERPOOLID
    });
    // Datasets
    // User Role
    try{
        await Client.send(addUserToGroupCommand);
    } catch (error) {
        if (error.name === "ResourceNotFoundException" || error.message.includes("Group does not exist")) {
            console.debug(`Group "${groupName}" does not exist. Creating group...`);
            // Command to create the group
            const createGroupCommand = new CreateGroupCommand({
                GroupName: groupName,
                UserPoolId: process.env.$APP_USERPOOLID
            });
            // Create the group
            await Client.send(createGroupCommand);
            console.debug(`Group "${groupName}" created successfully.`);
            // Retry adding the user to the newly created group
            await Client.send(addUserToGroupCommand);
        } else {
            throw error;
        }
    }
    return true;
}

exports.removeRole = async function (username,role) {
    // Datasets
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    const command = new AdminRemoveUserFromGroupCommand({
        Username: username,
        GroupName: role,
        UserPoolId: process.env.$APP_USERPOOLID
      });
    
    // User Role
    try{
        const response = await Client.send(command);
    } catch (error) {
        console.log('Error removing user:', role, error);
        throw error;
    }
    return true;
}

exports.deleteGroup = async function (groupName) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION });

    try {
        await Client.send(new DeleteGroupCommand({
            GroupName: groupName,
            UserPoolId: process.env.$APP_USERPOOLID
        })); 
        return true;
    } catch (error) {
        if (error instanceof ResourceNotFoundException) {
            // If the group does not exist, return true as if the deletion was successful
            return true;
        } else {
            // For all other errors, rethrow them
            throw error;
        }
    }
}

exports.setGroupUsers = async function (groupName, users) {
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION }); 
    const existingUsers = await groupUsers(groupName);
    const emailsToAdd = users.filter(u => !existingUsers.find(eu => eu.email === u));
    const usersToAdd = emailsToAdd.length > 0 ? await getUserNames(emailsToAdd) : [];
    
    const usersToRemove = existingUsers.filter(eu => !users.find(u => u === eu.email));
    console.debug('emailsToAdd', emailsToAdd.length);
    console.debug('usersToRemove', usersToRemove.length);
    
    const updates = [];
    const proms = [];
    for (const user of usersToAdd) {
        const command = new AdminAddUserToGroupCommand({
            GroupName: groupName,
            Username: user.username,
            UserPoolId: process.env.$APP_USERPOOLID
        });
        proms.push(Client.send(command));
        updates.push({ action: 'removed', user: user.email });
    }

    for (const user of usersToRemove) {
        const command2 = new AdminRemoveUserFromGroupCommand({
            Username: user.username,
            GroupName: groupName,
            UserPoolId: process.env.$APP_USERPOOLID
          });
        proms.push( Client.send(command2) );
        updates.push({ action: 'added', user: user.email });
    }
    await Promise.all(proms);
    return updates;
}

exports.resetpw = async function (username) {
    // Validate Request
    const validRequest = $defs.validate(body, {
        username: { required: true, type: 'string' },
    })
    if (!validRequest.ok){return { status: 400, msg: validRequest.errors };}
    
    // Reset Password
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION}); 
    try {
        await Client.send(new AdminResetUserPasswordCommand({
            Username: body.username,
            UserPoolId: process.env.$APP_USERPOOLID
        }));
        return { status: 200, msg: {} };
        } catch (error) {
        console.log('ServerErr@resetpw:', error);
        return {status: 500, msg: { error: 'Could not reset password' } };
        }
}


// ---- INLINE HELPERS ----

async function groupUsers(groupName) {
    const client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION });

    const users = [];
    let paginationToken = null;

    do {
        // Fetch a list of users in the group
        const command = new ListUsersInGroupCommand({
            GroupName: groupName,
            UserPoolId: process.env.$APP_USERPOOLID,
            PaginationToken: paginationToken
        });
        try{
            const response = await client.send(command);
            users.push(...response.Users);
            paginationToken = response.PaginationToken;
        } catch (error) {
            paginationToken = null;
            if (error.name === "ResourceNotFoundException") {
            //   console.log("Group does not exist or was not found.");
              break;
            } else {
              console.error("An error occurred:", error);
            }
          }
    } while (paginationToken);
    const userList = users.map((u)=>{
        return {
            username: u.Username,
            email: u.Attributes.find((a)=>{return a.Name == 'email'}).Value,
            status: u.UserStatus,
            created: u.UserCreateDate,
            updated: u.UserLastModifiedDate
        }
    })
    return userList;
}


async function getUserNames(emails){
    // Initialize the AWS SDK
    const Client = new CognitoIdentityProviderClient({ region: process.env.$APP_REGION }); 
    if (!emails || emails.length < 1){ return [] }

    const users = []
    const proms = [];
    for (const email of emails){
        const params = {
            UserPoolId: process.env.$APP_USERPOOLID,
            Filter: `email="${email}"`
        };
        const command = new ListUsersCommand(params);
        proms.push( 
            Client.send(command).then((response)=>{
                for (const user of response.Users) {
                    const attributes = user.Attributes;
                    for (const attr of attributes) {
                        if (attr.Name === "email" && attr.Value === email) {
                            users.push( { username: user.Username, email: email } );
                            return true;
                        }
                    }
                }
            })
        )
    }
    await Promise.all(proms);
    return users;
}

const d = {};
d['sandbox$modeler'] = true;