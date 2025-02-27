class iRadio extends ELMNT_Input
{
    constructor(){
        super();
    }

    static styleSheet = new CSSStyleSheet();

    // Public Globals
    name;
    get state(){ return parseInt(this.dataset.state); }

    // Private Globals
    #value;
    #readOnly;
    
    // --- Lifecycle Hooks --- //
    get Events(){
      return [
          ['options','click', this._onChange ]
      ];
  }


    // --- Setters & Getters --- //
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v;
        this.shadow.querySelectorAll('input').forEach($input=>{ 
          $input.checked = false; 
        });
        const $input = this.shadow.querySelector(`input[value="${v}"]`);
        if ($input){
            $input.checked = true;
        }
    }

    get value(){
        return this.#getValue();
    }

    set $options(v){
      const $f = this.shadow.querySelector('fieldset');
        v.forEach((v,i)=>{
          $f.insertAdjacentHTML(
            'beforeend',
            `<div>
            <input type="radio" name="radio" id="${i}" value="${v.value}" disabled="${this.#readOnly}"/>
            <span>${v.label}</span>
          </div>`);
        })
    }

    set readOnly(v){
        this.#readOnly = v;
        this.classList[v === true ? 'add' : 'remove']('readonly');
        this.shadow.querySelectorAll('input').forEach($input=>{ 
          $input.disabled = v; 
        });
    }

    // --- Public Methods --- //


    // Events
    _onChange(){
        if (this.classList.contains('disabled')){ return; }
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#getValue()){
            return 0;
        }
        return 1;
    }

    #getValue(){
      const inputValue = this.shadow.querySelector('input:checked')?.value || null;
      if (inputValue == 'true' || inputValue == 'false'){
        return inputValue === 'true' ? true : false;
      }
      return inputValue;
    }

    

    // Static Methods
    static Tag = 'i-radio';

    static Html = `<fieldset id="options"></fieldset>`;

    static Css = (
      `:host{
        display: block;
        font-size: inherit;
        font-family: inherit;
        color: inherit;
        position: relative;
      }
      fieldset{
        border: none;
        margin: 0;
        padding: 0;
      }
      div{
        display: flex;
        align-items: center;
        padding: .5em 0;
        font-weight: 500;
      }`
    );
}

ELMNT.define(iRadio);