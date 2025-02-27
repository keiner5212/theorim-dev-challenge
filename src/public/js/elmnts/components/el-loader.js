
class eLoader extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    // --- Lifecycle Hooks --- //


    // --- Public Methods --- //
    show(vis){
        vis === true ? this.classList.add('show') : this.classList.remove('show');
    }

    // --- Static Defs   --- //
    static Tag = 'el-loader';
    static Html = (`<div></div><div></div><div></div><div></div>`);

    static Css = (
        `:host {
            display: none;
            position: relative;
            width: inherit;
            height: 100%;
            padding: 0;
        }
        :host(.show){
           display: inline-block; 
        }
        div{
            box-sizing: border-box;
            display: block;
            position: absolute;
            width: 1.9em;
            height: 1.9em;
            top: 0;
            border: 3px solid #000;
            border-radius: 50%;
            animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            border-color: var(--green) transparent transparent transparent;
        }
        .lds-ring div:nth-child(1) {
            animation-delay: -0.45s;
        }
        .lds-ring div:nth-child(2) {
            animation-delay: -0.3s;
        }
        .lds-ring div:nth-child(3) {
            animation-delay: -0.15s;
        }
        @keyframes lds-ring {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }`
    );

}


ELMNT.define(eLoader);

