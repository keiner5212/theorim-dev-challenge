class iBool extends ELMNT_Input
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
    #input = false;
    
    // --- Lifecycle Hooks --- //
    get Events(){
      return [
          ['switch','click', this._onChange ]
      ];
  }


    // --- Setters & Getters --- //
    set value(v){ 
        this.dataset.state = 0;
        this.#value = this.#input = v; 
        this.dataset.value = v;
        this.classList[this.#input === true ? 'add' : 'remove']('checked');
    }

    get value(){
        return this.#input;
    }

    // --- Public Methods --- //
    populate(v){
      this.#value = this.#input = v; 
      this.classList[this.#input === true ? 'add' : 'remove']('checked');
      this.dataset.state = this.#checkState();
    }


    // Events
    _onChange(){
        if (this.classList.contains('disabled')){ return; }
        this.#input = this.#input === true ? false : true;
        this.classList[this.#input === true ? 'add' : 'remove']('checked');
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#input){
            return 0;
        }
        if (this.#value === null && this.#input === false){
          return 0;
        }
        return 1;
    }

    

    // Static Methods
    static Tag = 'i-boolean';

    static Html = `<div id="switch"><span class="switch__label"></span></div>`;

    static Css = (
      `:host{
        display: block;
        font-size: inherit;
        font-family: inherit;
        color: inherit;
        position: relative;
      }
      div{
        display: block;
        padding: 1em;
        width: 5em;
      }
      .switch__label{
        display: block;
        cursor: pointer;
      }
      .switch__label:before{
        content: "";
        position: absolute;
        top: 2em;
        left: 0;
        width: 4em;
        height: 1.5em;
        background-color: rgba(0, 0, 0, 0.26);
        border-radius: 14px;
        z-index: 1;
        transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .switch__label:after{
            content: "";
            position: absolute;
            top: 1.8em;
            left: 0;
            width: 1.8em;
            height: 1.8em;
            background-color: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
            z-index: 2;
            transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            transition-property: left, background-color;
      }
      :host(.checked) .switch__label:before{
        background-color: var(--yellow);
        opacity: .25;
      }
      :host(.checked) .switch__label:after{
        background-color: var(--yellow);
        left: 2.5em;
      }`
    );
}

ELMNT.define(iBool);