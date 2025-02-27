# Dev Challenge | Espanol



________


# Dev Challenge | English

## Theorim Stack

* **Back End:** nodejs and express
* **Front End:** native vanilla js [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
* **Hosting:** AWS EC2 instances running in an Autoscaling Group and Application Load Balancer.
* **Data:** AWS DynamoDB and S3 for file storage
* **Authentication:** AWS Cognito

## Dev Philosophy

Theorim's dev philosophy is based on maintaining simplicity by limiting dependencies, avoiding complex build processes, eliminating abstraction layers, and relying on native JS functions over frameworks and libraries. 

* No front-end libraries or frameworks
* Back end dependencies are limited to AWS SDKs and foundational libraries like Express
* AWS infrastructure is built using Cloudformation templates without any helper utilities or additional abstraction

## Important Concepts
_The features below are key components of the Theorim application. Learning the basic concepts behind these technologies will enable a better understanding of how Theorim is built_

* [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html)
* [JS Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
* [JSON Schema](https://json-schema.org/learn)
* [AJV](https://ajv.js.org/)
* [expressjs](https://expressjs.com/en/starter/hello-world.html)

## Application Structure Overview

1. Theorim allows users to build custom dataset schemas, apply permissions to those schemas, and distribute them to users to access and edit.
2. As a modeler, users define **schemas** and **fields** in the UI. These are stored as individual records DynamoDB. The back end engine-hydrator.js module compiles the records as nested [JSON schemas](https://json-schema.org/learn)
3. The JSON schema is used by the front end to render inputs and UIs views for users
4. On the back end, the JSON schema is used to validate data passed in from the client
5. JSON schemas are stored as "rows" in DynamoDB. The application has a hydrator function (engine-hydrator.js) that pulls each "row" and formats it as a JSON schema. The formatted JSON schema is stored in memory in the jschema-engine module

## Code Structure

* **src/modules** Back End Code
* * index.js: Main express entry point. Routes requests to the correct module
* * DataUser.js / Admin.js / Modeler.js: Each file has the endpoints associated with the specific application module
* * jschema-engine: Main helper library. Houses all the utility functions for interacting directly with AWS, authorizing requests, and validating data structures of POST requests
* * engine-hydrator.js: This module pulls schemas from the DB, formats them as JSON schemas, and passes them to the jschema-engine. The engine stores the formatted schema in memory for faster performance when validating each request.
* **src/public:** Front End Code
* * app_controller.js: Main initialization script that handles initial loading and rendering
* * /data_components: Custom elements that interact directly with the back end
* *  /elmnts: Modular custom element components that are independent and do not communicate with the back end
* * /globals: Global variables
* * /modules: Components that render the main sections of the application (user, modeler, admin, etc.)

## Developer Challenge

**Challenge: Propose code changes so that the refresh function in engine-hydrator.js only pulls and reformats schemas that have been updated since the last run.**

1. Review the code in engine-hydrator.js. This function pulls user-created schemas from DynamoDB and formats them as [JSON schemas](https://json-schema.org/learn). The function runs automatically every 5 minutes and pulls ALL schemas and datasets from DynamoDB and refreshes them with updates. As a result, it takes up to 5 minutes for changes made in Modeler to show up to users. This is inefficient since not all schemas are updated every 5 minutes.
2. Review the code in src/modules/Modeler.js and jschema-engine/engine.js. These modules have all the functions used to update schemas through the "modeler" application section.
3. Create a branch off p/1.7/dev named as feature/[your-initials] with your changes.


**Hints:** 
* DynamoDB requires you to specific an _exact_ primary key for every query. For that reason, every time a dataset is created, a record is created with the pk **__partition** and sk <partition_name>. Querying for pk=__partition will return a list of all datasets and basic information about the dataset.
* The challenge will require storing the lastUpdate timestamp whenever a partition is updated. It will also require updating the engine-hydrator refresh query to only pull back items with a lastUpdated value greater than the time of the last run.
* The /jschema-engine/helpers/$db.js has a exports.query function that can be used to query the most up to date data. The function accepts an object where each attribute is the name of a column to query. pk is always required.

`db.query({
   pk: '__partition',
   column_name: 'operator!value
})`

**Example**

`db.query({
   pk: '__partition',
   name: '=!my_data_set'
})`

## Bonus

Identify an improvement to the application that fixes a bug, improves performance, or adds a cool feature. Create the code changes in a branch called feature/[your-initials]-bonus. It does not need to be fully developed, but at a minimum put comment placeholders in the code where changes would need to be made
