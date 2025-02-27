
class SplashScreen extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    x;

    // --- Private Properties --- //
    #x;

    // --- Lifecycle Hooks --- //
    get Events(){
        return []
    }

    connectedCallback(){
        // Add User Events --- //
        this.classList.add('active');
    }

    // --- Setters & Getters --- //
    set access(v){
        this.classList.toggle('no-access',!v);
    }

    // --- Public Methods --- //


    // --- User Events --- //

    // --- Private Helpers --- //

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'splash-screen';

    static Html = (
        `<div class="splash-text has-access">
        <div>
          <div class="top">Theorim</div>
        </div>
      </div>
      <div class="splash-text no-access">
          <div>
            <div class="top">Looks like you don't have any access yet</div>
            <div class="subtext">Ask your admin or a data owner to grant you access</div>
            <div class="subtext">Log out and log back in to refresh accesses</div>
        </div>
      </div>`
    );

    static Css = (
        `:host{
            position: absolute;
            background: white;
            z-index: 10;
            width: 100%;
            height: 100%;
        }
        .splash-text{
            display: flex;
            flex-direction: row;
            justify-content: center;
            padding-top: 15vh;
            font-size: 36px;
            line-height: 3;
            text-align: center;
            font-weight: 600;
            color: var(--b2);
        }
        :host(:not(.no-access)) .no-access{
            display: none;
        }
        :host(.no-access) .has-access{
            display: none;
        }
        .subtext{
            font-size: 12px;
            line-height: 1.5;
        }`
    );

}


ELMNT.define(SplashScreen);

