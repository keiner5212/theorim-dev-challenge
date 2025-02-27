

class Global
{
    static loaded;
    
    // Public Global
    static version = '';
    static entitlements = {};
    static access = { owner: false, admin: false, user: false,ai: true,dashboards:true };
    static someAccess = false;


    static #getRoutes = {
        def: '/api/defs/:dataset',
        schema: '/api/defs/:dataset/:jtable/:schema',
        data: '/api/data/:dataset/:jtable/:sk',
        roles: '/api/roles/:dataset',
        dslinks: '/api/dslinks',
        links: '/api/links/:dataset',
        item: 'api/item/:sk'
    };

    static #postRoutes = {
        data: '/api/data?action=:action',
        delfile: '/api/delfile/:path',
        import: `/api/import`
    };

    static Routes = {
        users: 'api/users?q=:q',
        usergroups: 'api/usergroups',
        links: (p) => {
            const pth = (p.jtable ? `/${p.jtable}` : '') + (p.schema ? `/${p.schema}` : '');
            const objQuery = p.obj ? `?obj=${p.obj}&` : '?';
            const primQuery = p.primitives ? `prim=true` : ''; 
            return `api/links/${p.dataset}${pth}${objQuery}${primQuery}`;
        },
        jtcols: (p) => {
            return `api/jtcols/${p.dataset}/${p.jtable}`;
        }
    }

    static ItemPath(params){
        return `/?item=${params.dataset}/${params.jtable}/${params.sk.trim()}/${params.uid}`;
    }

    static Path(sk){
        try{
            return {
                __object: sk.split('+').pop().split('-').pop().split('$')[0]
            }
        } catch (e){
            return {}
        }
    }



    static get = async (routeName,opts,query) => {
        let route = this.#getRoutes[routeName];
        if (!route) throw new Error('Route not found');
        for (const k in opts){
            route = route.replace(`:${k}`,opts[k]);
        }
        route = route.replace(/:(\w+)(\/|$)/g, '')
        let url = new URL(route, window.location.origin);
        if (query){
            for (const k in query){
                url.searchParams.append(k,query[k]);
            }
        }
        console.debug('GET:',routeName,url.href)
        const res = await fetch(url.href);
        if (res.status != 200){
            const txt = await res.text();
            console.log('FETCH ERROR:',res.status, txt)
            throw new Error('Fetch failed')
        }
        return await res.json();
    }

    static post = async (routeName,opts,data) => {
        console.debug('POST:',routeName,opts)
        let route = this.#postRoutes[routeName];
        if (!route){ throw new Error('Route or action not found') };
        if (!data.pk){ throw new Error('Primary Key not found') };
        for (const k in opts){
            route = route.replace(`:${k}`,encodeURIComponent(opts[k]));
        }
        const res = await fetch(route, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (res.status != 200){
            const txt = await res.text();
            console.log('PAYLOAD',data);
            console.log('FETCH ERROR:',res.status, txt)
            throw new Error(txt + '\n[' + res.status + ']')
        }
        return await res.json();
    }

    static upload = async function(path,field,files) {
        const url = `/api/file/${path.dataset}/${path.jtable}/${path.schema}/${field}/${path.uid}`;
        console.debug('Upload URL:',url)
        const res = await fetch(url, { method: 'POST', body: files });
        if (res.status != 200){
            const txt = await res.text();
            console.log('POST ERROR:',res.status, txt)
            const err = JSON.parse(txt);
            console.log(err.error)
            throw new Error(err.error)
        } else {
            const data = await res.json();
            console.log('UPLOAD RESPEONSE:',data)
            return data;
        }
    }

    static delfile = async (path) => {
        const url = `/api/delfile/${path}`;
        console.debug('delfile',url)
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        if (res.status != 200){
            const txt = await res.text();
            console.log('FETCH ERROR:',res.status, txt)
            throw new Error(txt + '\n[' + res.status + ']')
        }
        return await res.json();
    }


    static AppModules = {
        ai: {
            tag: 'ai-module',
            title: 'AI',
            icon: 'neurology',
            subpages: false,
        },
        user: {
            tag: 'data-module',
            title: 'Datasets',
            icon: 'data',
            subpages: true,
        },
        modeler: {
            tag: 'modeler-module',
            title: 'Modeler',
            icon: 'schema',
            subpages: true,
        },
        admin: {
            tag: 'admin-module',
            title: 'Admin',
            icon: 'admin',
            subpages: false
        }
    }

    // Init
    static async load(){ this.loaded = this.#init(); }
    static async #init(){
        // Fetch Config
        const res = await fetch('/api/config');
        if (res.status != 200){
            const txt = await res.text();
            console.log('CONFIG ERROR:',res.status, txt)
            throw new Error('Get Config failed')
        } 
        const data = await res.json();
        // ---------------
        console.log('CONFIG:', data)
        
        // Set Config Values
        this.entitlements = data.entitlements;
        this.user = data.user;
        this.version = data.version;
        
        Object.keys(this.AppModules).forEach(k => {
            if (data.entitlements[k] === undefined || data.entitlements[k].length === 0){
                delete this.AppModules[k];
            } else {
                this.AppModules[k].pages = data.entitlements[k];
            }
        })

        // Set Access
        Object.keys(this.entitlements).forEach(k => {
            this.access[k] = this.entitlements[k].length > 0;
            if (this.access[k] === true){ 
                this.someAccess = true;
            }
        })  
    }
}

console.debug = window.localStorage.getItem('logLevel') ? console.log : ()=>{};

Global.load();