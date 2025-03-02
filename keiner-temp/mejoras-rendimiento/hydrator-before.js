async function pullDatasets() {
    const compileStart = performance.now();
    console.log('Refreshing Datasets');
    const partitions = await Engine.listPartitions();
    const proms = [];
    for (const p of partitions) {
        Partitions[p.name] = JSON.parse(JSON.stringify(p))
        Engine.addDef(defaultModelerDef(p.name, p.title));
        const prm = formatDef(p.name).then(def => {
            Engine.addDef(def);
            Partitions[p.name].lastPull = Date.now();
        }).catch((e) => {
            console.log('Def not valid', p.name);
        });
        proms.push(prm)
    }
    await Promise.all(proms);
    console.log('Partitions Refreshed in', performance.now() - compileStart);
    return true;
}

async function formatDef(defName) {
    // ==== PULL ====
    const defObjRes = await Engine.db.query({ pk: `defs/${defName}` });
    const defObj = defObjRes.Items;

    // ==== NEST ====
    const ds = defObj.find(o => { return o.sk === `dataset$${defName}` });
    ds.jtables = defObj.filter(obj => { return obj.__object === 'jtable' });

    // Nest Props
    const allProps = defObj.filter(p => { return p.$class === 'property' })
    const subProps = allProps.filter(p => {
        return allProps.find(ap => { return p.__parent === ap.sk })
    });
    for (const sub of subProps) {
        const parentProp = defObj.find(p => { return p.__parent === p.sk });
        if (!parentProp) { continue }
        parentProp.items = parentProp.items || { type: "object", properties: {} };
        parentProp.items.properties[sub.name] = sub;
    }

    // Nest DS
    for (const jt of ds.jtables) {
        jt.schemas = defObj.filter(obj => { return obj.__parent === jt.sk });
        for (const schema of jt.schemas) {
            schema.properties = {};
            const schProps = defObj.filter(itm => { return itm.__parent === schema.sk });
            // console.log('props-',schema.sk, schema.$id, defName,schProps.length, schProps[0]);
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
        // Reformat Table Views
        jtable.$tableViews.forEach(view => {
            view.cols = view.cols.map(col => { return { name: col.column.name, width: col.width } });
            view.filters.forEach(f => { f.column = f.column.name });
            view.sort = view.sort || [];
            view.sort = view.sort.map(s => { return { column: s.column.name, dir: s.direction } });
        })
        // Add Default Table View
        if (jtable.$tableViews?.length < 1) {
            const defaultCols = Object.keys(jtable.schemas[0].properties);
            if (defaultCols.length > 0) {
                if (defaultCols.length > 4) { defaultCols.length = 4; }
                jtable.$tableViews = [{ name: 'All', cols: defaultCols.map(c => { return { name: c, width: 1 } }), filters: [], sort: [] }];
            } else {
                jtable.$tableViews = [{ name: 'All', cols: [], filters: [], sort: [] }];
            }
        }
    }
    // -- Schemas
    for (const jtable of ds.jtables) {
        for (const schema of jtable.schemas) {
            // Create default form view if none exists
            if (!schema.$formViews) {
                schema.$formViews = [{ name: 'All', cols: Object.keys(schema.properties) }];
            } else {
                // Reformat Form Views if exist
                schema.$formViews = schema.$formViews.map(v => {
                    return {
                        name: v.name,
                        cols: v.cols.map(c => { return c.name })
                    }
                });
            }
            // Flatten column arrays
            schema.required = schema.required || [];
            schema.required = schema.required.map(r => { return r.name });

            // Add Titlefield
            schema.$titleField = schema.$titleField ? schema.$titleField.name : '';
            if (!schema.$titleField) {
                let titleField = Array.isArray(schema.required) && schema.required[0] ? schema.required[0] : Object.keys(schema.properties).find(p => {
                    const fieldType = schema.properties[p].$is || schema.properties[p].type;
                    return ['string', 'number', 'date'].includes(fieldType)
                });
                schema.$titleField = titleField;
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
