const { DynamoDBClient, ScanCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const $users = require('./$users');
const $data = require('./$data');

exports.reset = async function(){
    // await deleteDB();
    const allItems = await $data.scan();
    console.log('allItems', allItems.length, allItems[allItems.length-1]);
    for (const item of allItems){
        if (item.pk && item.sk){
            $data.deleteItem(item);
        } else {
            console.log('missing pk/sk', item);
        }
    }
    console.log('done deleting all items');
    const groups = await $users.listGroups();
    for (const group of groups){
        console.log('deleteing group', group.name);
        if (group.name !== 'admin'){
            await $users.deleteGroup(group.name);
        }
    }
}

