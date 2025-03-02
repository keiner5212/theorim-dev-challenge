async function pullDatasets() {
    const compileStart = performance.now();
    console.log('Refreshing Datasets');

    //obtener los datasets
    const partitions = await Engine.listPartitions(UPDATE_DELAY);
    const proms = [];

    // Procesar cada uno
    for (const p of partitions) {
        Partitions[p.name] = { ...p }; // no veo necesario usar JSON.parse(JSON.stringify(p))

        Engine.addDef(defaultModelerDef(p.name, p.title));

        const prm = formatDef(p.name)
            .then(def => {
                Engine.addDef(def);
                Partitions[p.name].lastPull = Date.now(); // no vi que esto se usara, pero lo dejare por si acaso
            })
            .catch(e => {
                console.log('Def not valid', p.name);
            });

        proms.push(prm);
    }

    // Esperar a que todas las promesas de formatDef se resuelvan
    await Promise.allSettled(proms);

    // Personalmente no me gusta mutar variables dentro de promesas, asi que haria algo asi, pero mi objetivo es optimizar, asi que no lo hago
    // results.forEach(result => {
    //     if (result.status === 'fulfilled' && result.value) {
    //         Partitions[result.value.name].lastPull = result.value.lastPull;
    //     }
    // });

    // Mostrar el tiempo de ejecución en segundos
    const compileTimeInSeconds = (performance.now() - compileStart) / 1000;
    console.log('Partitions Refreshed in', compileTimeInSeconds.toFixed(2), 'seconds');

    return true;
}


async function formatDef(defName) {
    // ==== PULL ====
    const defObjRes = await Engine.db.query({ pk: `defs/${defName}` });
    const defObj = defObjRes.Items;

    // ==== NEST ====
    const ds = defObj.find(o => o.sk === `dataset$${defName}`);
    ds.jtables = defObj.filter(obj => obj.__object === 'jtable');

    // Nest Props
    const allProps = defObj.filter(p => p.$class === 'property');
    const subProps = allProps.filter(p => allProps.some(ap => p.__parent === ap.sk));

    // se me ocurrio que podria hacerlo con un map para no usar find dentro del bucle siguiente
    const parentPropMap = new Map();
    for (const p of defObj) {
        if (p.$class === 'property') {
            parentPropMap.set(p.sk, p);
        }
    }

    for (const sub of subProps) {
        const parentProp = parentPropMap.get(sub.__parent);
        if (!parentProp) continue;
        parentProp.items = parentProp.items || { type: "object", properties: {} };
        parentProp.items.properties[sub.name] = sub;
    }

    // Nest DS
    // lo mismo aca, con un map se evita un poco la complejidad O(n^2)
    const schemaMap = new Map();
    for (const obj of defObj) {
        if (obj.__parent && obj.__parent.startsWith('jtables/')) {
            if (!schemaMap.has(obj.__parent)) {
                schemaMap.set(obj.__parent, []);
            }
            schemaMap.get(obj.__parent).push(obj);
        }
    }

    for (const jt of ds.jtables) {
        jt.schemas = schemaMap.get(jt.sk) || []; // busqueda en tiempo constante O(1)
        for (const schema of jt.schemas) {
            schema.properties = {};
            const schProps = schemaMap.get(schema.sk) || []; // busqueda en tiempo constante O(1)
            for (const prop of schProps) {
                schema.properties[prop.name] = prop;
            }
        }
    }

    // ==== FORMAT ====
    // -- jTables
    for (const jtable of ds.jtables) {
        // Set PK
        jtable.pk = `${ds.name}/${jtable.name}`;

        // Reformat Table Views (version equivalente)
        jtable.$tableViews = jtable.$tableViews?.map(view => ({
            name: view.name,
            cols: view.cols.map(col => ({ name: col.column.name, width: col.width })),
            filters: view.filters.map(f => ({ ...f, column: f.column.name })),
            sort: (view.sort || []).map(s => ({ column: s.column.name, dir: s.direction }))
        })) || [];

        // Add Default Table View
        if (!jtable.$tableViews.length) { // como minimo ahora sera un array vacio
            const defaultCols = Object.keys(jtable.schemas[0].properties || {}).slice(0, 4); // mismo resultado, menos codigo
            jtable.$tableViews = [{
                name: 'All',
                cols: defaultCols.map(c => ({ name: c, width: 1 })),
                filters: [],
                sort: []
            }];
        }
    }

    // -- Schemas
    for (const jtable of ds.jtables) {
        for (const schema of jtable.schemas) {
            // Create default form view if none exists
            // Reformat Form Views if exist
            schema.$formViews = schema.$formViews?.map(v => ({
                name: v.name,
                cols: v.cols.map(c => c.name)
            })) || [{ name: 'All', cols: Object.keys(schema.properties) }]; //mismo resultado, menos codigo

            // Flatten column arrays
            schema.required = (schema.required || []).map(r => r.name);

            // Add Titlefield
            schema.$titleField = schema.$titleField?.name || '';
            if (!schema.$titleField) {
                schema.$titleField = schema.required[0] || Object.keys(schema.properties).find(p => {
                    const fieldType = schema.properties[p].$is || schema.properties[p].type;
                    return ['string', 'number', 'date'].includes(fieldType);
                });
            }

            // Add Comments Field
            if (schema.$enableComments === true) {
                schema.properties._comments = {
                    name: '_comments',
                    label: 'Comments',
                    type: 'array',
                    $is: 'comments'
                };
                schema.$formViews.push({ name: 'Comments', cols: ['_comments'] });
            }

            // Add History Field
            schema.properties._history = {
                name: '_history',
                label: 'History',
                type: 'array',
                $is: 'history'
            };
            schema.$formViews.push({ name: 'History', cols: ['_history'] });
        }
    }

    return ds;
}