

class $SplashPage extends ELMNT
{
    constructor(){
        super();
    }


    // Static Helpers
    static Tag = 'splash-page';
    static Html = (
        `<div class="loader"></div>
        <div class="text"></div>`
    );
    
    static Css = (
        `:host{
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1000;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loader,
        .loader:before,
        .loader:after{
            width: 35px;
            aspect-ratio: 1;
            box-shadow: 0 0 0 3px inset rgb(253,209,0);
            position: relative;
            animation: l6 1.5s infinite 0.5s;
            animation-delay: 500ms;
        }
        .loader:before,
        .loader:after{
            content: "";
            position: absolute;
            left: calc(100% + 5px);
            animation-delay: 1s;
        }
        .loader:after{
            left: -40px;
            animation-delay: 0s;
        }
        @keyframes l6 {
            0%,55%,100%  {border-radius:0  }
            20%,30%      {border-radius:50%}
        }`
    )
}

ELMNT.define($SplashPage);





