class iUser extends iSelect
{
    constructor(){
        super();
    }

    $query = Global.Routes.users;
    $loadAll = false;
    $labelKey = 'email';
    $valueKey = 'username';

    static Tag = 'i-user';
}

class iUserGroup extends iSelect
{
    constructor(){
        super();
    }

    $query = Global.Routes.usergroups;
    $loadAll = true;
    $labelKey = 'label';
    $valueKey = 'name';

    static Tag = 'i-usergroup';
}

class iJTableCols extends iSelect
{
    constructor(){
        super();
    }

    set __path(v){
        this.$query = Global.Routes.jtcols({
            dataset: v.pk.split('$')[0],
            jtable: v.sk.split('-jtable$')[1].split('-')[0],
        });
    }

    $query;
    $loadAll = true;
    $labelKey = 'label';
    $valueKey = 'name';
    $multi = false;
    static Tag = 'i-jtcols';
}

class iJtSchemas extends iSelect
{
    constructor(){
        super();
    }

    set __path(v){
        this.$query = Global.Routes.links({
            dataset: v.pk.split('$')[0],
            jtable: v.sk.split('-jtable$')[1].split('-')[0],
            obj: 'schema'
        });
    }

    $query;
    $loadAll = true;
    $multi = false;
    $labelKey = 'title';
    $valueKey = '$id';

    static Tag = 'i-jtschemas';
}

class iSchemaParents extends iSelect
{
    constructor(){
        super();
    }

    set __path(v){
        this.$query = Global.Routes.links({
            dataset: v.pk.split('$')[0],
            jtable: v.sk.split('-jtable$')[1].split('-')[0],
            obj: 'schema'
        });
    }

    $query;
    $loadAll = true;
    $multi = true;
    $labelKey = 'title';
    $valueKey = '$id';

    static Tag = 'i-schparents';
}

class iSchemaTitle extends iSelect
{
    constructor(){
        super();
    }

    set __path(v){
        this.$query = Global.Routes.links({
            dataset: v.pk.split('$')[0],
            jtable: v.sk.split('-jtable$')[1].split('-')[0],
            schema: v.sk.split('-schema$')[1].split('-')[0] + '-',
            primitives: true
        });
    }


    $query;
    $loadAll = true;
    $labelKey = 'label';
    $valueKey = 'name';
    $multi = false;
    static Tag = 'i-schtitle';
}

class iSchemaRequired extends iSelect
{
    constructor(){
        super();
    }

    set __path(v){
        this.$query = Global.Routes.links({
            dataset: v.pk.split('$')[0],
            jtable: v.sk.split('-jtable$')[1].split('-')[0],
            schema: v.sk.split('-schema$')[1].split('-')[0] + '-'
        });
    }

    $query;
    $loadAll = true;
    $multi = true;
    $labelKey = 'label';
    $valueKey = 'name';

    static Tag = 'i-schrequired';
}
ELMNT.define(iJtSchemas);
ELMNT.define(iJTableCols);
ELMNT.define(iSchemaTitle);
ELMNT.define(iSchemaRequired);
ELMNT.define(iSchemaParents);
ELMNT.define(iUser);
ELMNT.define(iUserGroup);