# Dev Challenge | Espanol


## Theorim Stack

	•	Back End: Node.js y Express
	•	Front End: Native vanilla JS con Custom Elements
	•	Hosting: AWS EC2 en un Autoscaling Group con Application Load Balancer
	•	Data: AWS DynamoDB y S3 para almacenamiento de archivos
	•	Authentication: AWS Cognito

## Filosofía de Desarrollo

La filosofía de desarrollo de Theorim se basa en mantener la simplicidad limitando las dependencias, evitando procesos de compilación complejos, eliminando capas de abstracción y usando funciones nativas de JavaScript en lugar de frameworks y librerías.
	•	No se utilizan librerías ni frameworks en el front end
	•	En el back end, las dependencias están limitadas a AWS SDKs y librerías base como Express
	•	La infraestructura de AWS se implementa con CloudFormation templates, sin herramientas auxiliares ni capas de abstracción adicionales

## Conceptos Importantes

Las siguientes tecnologías son componentes clave de la aplicación Theorim. Comprender estos conceptos facilitará la comprensión de su arquitectura:

* [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html)
* [JS Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
* [JSON Schema](https://json-schema.org/learn)
* [AJV](https://ajv.js.org/)
* [expressjs](https://expressjs.com/en/starter/hello-world.html)


## Estructura General de la Aplicación

Theorim permite a los usuarios crear esquemas de datasets personalizados, asignar permisos a esos esquemas y distribuirlos para que otros usuarios los accedan y editen.
- Como modeler, los usuarios definen esquemas y campos en la UI. Estos se almacenan como registros individuales en DynamoDB.
- El módulo engine-hydrator.js en el back end compila estos registros en JSON schemas anidados.
- El JSON schema se usa en el front end para renderizar inputs y vistas de UI para los usuarios.
- En el back end, el JSON schema se usa para validar los datos recibidos desde el cliente.
- Los JSON schemas se almacenan como "rows" en DynamoDB.
- La aplicación tiene una función llamada hydrator (engine-hydrator.js) que extrae cada "row", la formatea como JSON schema y la almacena en memoria en el módulo jschema-engine, mejorando el rendimiento en la validación de cada request.

## Estructura del Código

### Back End (src/modules)
- index.js: Punto de entrada principal de Express, enruta las solicitudes al módulo correcto.
- DataUser.js / Admin.js / Modeler.js: Contienen los endpoints de cada módulo de la aplicación.
- jschema-engine: Librería principal de utilidades. Maneja la interacción con AWS, autorización de requests y validación de estructuras de datos en los POST requests.
- engine-hydrator.js: Extrae esquemas de la base de datos, los convierte en JSON schemas y los almacena en jschema-engine para mejorar la performance en la validación.

### Front End (src/public)

- app_controller.js: Script principal de inicialización, maneja la carga y renderizado inicial.
- /data_components: Custom Elements que interactúan directamente con el back end.
- /elmnts: Componentes Custom Elements modulares que son independientes y no comunican con el back end.
- /globals: Variables globales.
- /modules: Componentes que renderizan las secciones principales de la aplicación (user, modeler, admin, etc.).

## Desafío para Desarrolladores

Desafío: Proponer cambios en el código para que la función refresh en engine-hydrator.js solo extraiga y reformatee los esquemas que han sido actualizados desde la última ejecución.

### Pasos

- Para (fork) este repositorio en tu cuenta personal de Git, crea una branch llamada feature/tus-iniciales con tus cambios.
- Revisa los archivos `__partitions.json` y `prueba_paula.json`. Estos son extractos de la base de datos que representan los datos de la clave primaria de `__partitions` y el esquema generado por el usuario a partir del desafío empresarial.
- Revisar el código en `engine-hydrator.js`
  - Esta función extrae los esquemas creados por los usuarios desde DynamoDB y los convierte en JSON schemas.
  - Se ejecuta automáticamente cada 5 minutos y extrae **TODOS** los esquemas y datasets, actualizándolos con los cambios.
  - Esto genera un retraso de hasta 5 minutos en la visualización de cambios en **Modeler**, lo cual es ineficiente.
- Revisar el código en `src/modules/Modeler.js` y `jschema-engine/engine.js`
  - Estos módulos contienen las funciones utilizadas para actualizar esquemas en la sección de modeler.
- Crear una rama de desarrollo

---

### Pistas

- **DynamoDB** requiere una **primary key exacta** para cada consulta.
- Cada vez que se crea un dataset, se genera un registro con:
  - `pk = "__partition"`
  - `sk = "<partition_name>"`
- Consultar `pk="__partition"` devuelve una lista de todos los datasets y su información básica.
- Será necesario almacenar el **lastUpdate timestamp** cada vez que una partition se actualice.
- Modificar la consulta de `engine-hydrator` para que solo extraiga elementos con un `lastUpdated` mayor al último tiempo de ejecución.
- En `/jschema-engine/helpers/$db.js`, la función `exports.query` permite consultar los datos más recientes:

```javascript
db.query({ pk: '__partition', column_name: 'operator!value' })
```

### Bonus

Identificar una mejora en la aplicación que:
- Corrija un bug
- Mejore el rendimiento
- Agregue una funcionalidad interesante
- Crear una rama feature/[tus-iniciales]-bonus con los cambios.
- No es necesario desarrollar la mejora completamente, pero al menos incluir comentarios en el código indicando dónde deberían realizarse los cambios.




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

0. Fork this repository in to your own personal git account. Create a branch off main named as feature/[your-initials] with your changes.
1. Review the __partitions.json and prueba_paula.json files. These are extracts from the database that represent the __partitions PK data and the user-generated schema from the business challenge.
2. Review the code in engine-hydrator.js. This function pulls user-created schemas from DynamoDB and formats them as [JSON schemas](https://json-schema.org/learn). The function runs automatically every 5 minutes and pulls ALL schemas and datasets from DynamoDB and refreshes them with updates. As a result, it takes up to 5 minutes for changes made in Modeler to show up to users. This is inefficient since not all schemas are updated every 5 minutes.
3. Review the code in src/modules/Modeler.js and jschema-engine/engine.js. These modules have all the functions used to update schemas through the "modeler" application section.



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
