class iDate extends ELMNT_Input
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('input');
    }

    

    //  --- Public Properties --- //
    minLength = 0;
    

    // --- Private Properties --- //
    #value = '';
    #input;
    #period = 'date';
    #periods = ['datetime-local', 'date', 'week', 'month', 'quarter', 'year'];
    
    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['iput','change', this._onChange ],
            ['quarter','change', this._onChange ]
        ];
    }

    // Public Methods
    populate(value){
        this.#input.value = value;
        this.dataset.state = this.#checkState();
    }

    setToday(){
        const now = new Date();
        if (this.#period === 'datetime-local'){
            this.#value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16);
        } else {
            this.#value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 10);
        }

        const inputDate = this.#dateToInput(this.#value);
        this.#input.value = inputDate;
    }

    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v; 
        // Set to Blank if Null
        if (!v || v === ''){ 
            this.#input.value = '';
            return
        }
        // Check Valid Date Format
        try{
            const inputDate = new Date(v);
        } catch (e){
            console.warn('Invalid Date Format', v, this.name);
            console.log(e, this.name, v);
            return
        }
       
        this.#input.value = this.#dateToInput(v);
    }

    get value(){
        return this.#getValue();
    }

    set $period(v){
        // ['datetime-local', 'date', 'week', 'month', 'quarter', 'year'];
        this.dataset.period = this.#period = v.value || v;
        if (['datetime-local', 'date', 'week', 'month'].includes(this.#period)){
            this.#input.type = this.#period;
        } else if (this.#period === 'quarter' || this.#period === 'year'){
            this.#input.type = 'number';
            this.#input.step = 1;
            this.#input.placeholder = 'YYYY';
        }
    }

    set readOnly(v){
        v = v ? true : false;
        this.#input.disabled = v;
        this.$el('quarter').disabled = v;
    }


    // Events
    _onChange(){
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#getValue()){
            return 0;
        }
        return 1;
    }

    #dateToInput(v){
        const inputDate = new Date(v + 'T00:00:00Z');
        if (['datetime-local', 'date'].includes(this.#period)){
            return v;
        } else if (this.#period === 'week'){
            const dayNum = inputDate.getUTCDay() || 7; // Get the day number, use 7 for Sunday (ISO weeks start on Monday)
            inputDate.setUTCDate(inputDate.getUTCDate() + 4 - dayNum); // Ensure the date is in the correct week
            const yearStart = new Date(Date.UTC(inputDate.getUTCFullYear(),0,1)); // Start of this year
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7); // Calculate week number
            return `${inputDate.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`; 
        } else if (this.#period === 'month'){
            const year = inputDate.getUTCFullYear(); // Get the full year
            const month = (inputDate.getUTCMonth() + 1).toString().padStart(2, '0'); 
            return `${year}-${month}`;
        } else if (this.#period === 'quarter'){
            const qrt = Math.ceil((inputDate.getUTCMonth()+1) / 3).toString().padStart(2, '0');
            this.$el('quarter').value = {'01': '01', '02':'04', '03':'07', '04': '10'}[qrt]
            return inputDate.getUTCFullYear();
        } else if (this.#period === 'year'){
            return inputDate.getUTCFullYear();
        }
    }

    #getValue(){
        if (!this.#input.value || this.#input.value === ''){ return null; }
        if (['datetime-local', 'date'].includes(this.#period)){
            return this.#input.value;
        } else if (this.#period === 'week'){
            const [year, week] = weekValue.split('-W');
            const firstDayOfYear = new Date(year, 0, 1);
            const dayOffset = (firstDayOfYear.getDay() === 0 ? 6 : firstDayOfYear.getDay() - 1);
            const firstMonday = new Date(firstDayOfYear);
            firstMonday.setDate(firstDayOfYear.getDate() - dayOffset + (week - 1) * 7);

            const day = firstMonday.getDate().toString().padStart(2, '0');
            const month = (firstMonday.getMonth() + 1).toString().padStart(2, '0');
            const formattedDate = `${firstMonday.getFullYear()}-${month}-${day}`;
            return formattedDate;
        } else if (this.#period === 'month'){
            return `${this.#input.value}-01`;
        } else if (this.#period === 'quarter'){
            const q = this.$el('quarter').value || "01";
            const year = this.#input.value;
            return `${year}-${q}-01`;
        } else if (this.#period === 'year'){
            return `${this.#input.value}-01-01`;
        }
    }

    // Static Methods
    static Tag = 'i-date';

    static Html = (
        `<div>
        <input type="date" id="iput" input/>
        <select id="quarter">
            <option value="01">Q1</option>
            <option value="04">Q2</option>
            <option value="07">Q3</option>
            <option value="10">Q4</option>
        </select>
        </div>`);

    static Css = (
        `:host{
            display: block;
        }
        div{
            display: flex;
            align-items: center;
            border: 1px solid var(--b3);
            width: fit-content;
        }
        #quarter{
            display: none;
        }
        :host([data-period="quarter"]) #quarter{
            display: block;
        }
        input[type="number"]{
            width: 10em;
        }
        input,select{
            border: none;
            flex: 1 1 100%;
            height: 100%;
            padding: .5em;
            max-width: 12em;
        }
        input:disabled,
        select:disabled{
            background: var(--b4);
        }`
    )
}

ELMNT.define(iDate);

class icDate extends iDate
{
    constructor(){
        super();
    }

    connectedCallback(){
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
      
        this.value = `${year}-${month}-${day}`;
        this.readOnly = true;
        this.classList.add('elmnts-input');
    }

    get state(){
        return 1;
    }

    static Tag = 'i-cdate';
}
ELMNT.define(icDate);

class uDate extends icDate
{
    constructor(){
        super();
    }

    static Tag = 'i-udate';
}
ELMNT.define(uDate);