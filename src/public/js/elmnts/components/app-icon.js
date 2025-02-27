
class AppIcon extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }
    #changeCount = 0;
    static observedAttributes = ['icon'];

    attributeChangedCallback(name, oldValue, newValue){
        this.#changeCount++;
        this.shadow.innerHTML = AppIcon[newValue] || '';
        if (this.getAttribute('tooltip')){
            let $title = this.shadow.querySelector('title');
            if (!$title){
                console.error('Title not found in icon', this.getAttribute('icon'));
            }
            $title.textContent = this.getAttribute('tooltip');
        }
    }

    // connectedCallback(){
    //     this.shadow.innerHTML = AppIcon[this.getAttribute('icon')];
    //     if (this.getAttribute('tooltip')){
    //         let $title = this.shadow.querySelector('title');
    //         if (!$title){
    //             console.error('Title not found in icon', this.getAttribute('icon'));
    //         }
    //         $title.textContent = this.getAttribute('tooltip');
    //     }
    // }

    // --- Static Defs   --- //
    static Tag = 'app-icon';

    static Css = (
`:host{
    display: inline-block;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}
:host svg{
    fill: inherit;
    height: 100%;
    max-width: 100%;
    width: auto;
}`
);

    static search = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
            <style>
            .cls-1 {
                fill: none;
            }
            </style>
        </defs>
        <path d="M29,27.5859l-7.5521-7.5521a11.0177,11.0177,0,1,0-1.4141,1.4141L27.5859,29ZM4,13a9,9,0,1,1,9,9A9.01,9.01,0,0,1,4,13Z" transform="translate(0 0)"/>
        <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/>
        </svg>`
    );

    static add = (
        `<?xml version="1.0" encoding="UTF-8"?>
        <svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
            <style>
            .cls-1 {
                fill: none;
            }
            </style>
        </defs>
        <polygon points="17 15 17 5 15 5 15 15 5 15 5 17 15 17 15 27 17 27 17 17 27 17 27 15 17 15"/>
        <rect id="_Transparent_Rectangle_" data-name="&amp;lt;Transparent Rectangle&amp;gt;" class="cls-1" width="32" height="32"/>
        </svg>`
    );

    static boxes = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
            <style>
            .cls-1 {
                fill: none;
            }
            </style>
        </defs>
        <path d="M28.4473,16.1055,23,13.3818V7a1,1,0,0,0-.5527-.8945l-6-3a1.0008,1.0008,0,0,0-.8946,0l-6,3A1,1,0,0,0,9,7v6.3818L3.5527,16.1055A1,1,0,0,0,3,17v7a1,1,0,0,0,.5527.8945l6,3a1.001,1.001,0,0,0,.8946,0L16,25.1182l5.5527,2.7763a1.001,1.001,0,0,0,.8946,0l6-3A1,1,0,0,0,29,24V17A1,1,0,0,0,28.4473,16.1055ZM21,13.3818l-4,2V10.6182l4-2ZM16,5.1182,19.7637,7,16,8.8818,12.2363,7Zm-5,3.5,4,2v4.7636l-4-2ZM9,25.3818l-4-2V18.6182l4,2Zm1-6.5L6.2363,17,10,15.1182,13.7637,17Zm1,1.7364,4-2v4.7636l-4,2Zm10,4.7636-4-2V18.6182l4,2Zm1-6.5L18.2363,17,22,15.1182,25.7637,17Zm5,4.5-4,2V20.6182l4-2Z"/>
        <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/>
        </svg>`
    )

    static cloud_upload = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>cloud--upload</title><polygon points="11 18 12.41 19.41 15 16.83 15 29 17 29 17 16.83 19.59 19.41 21 18 16 13 11 18"/><path d="M23.5,22H23V20h.5a4.5,4.5,0,0,0,.36-9L23,11l-.1-.82a7,7,0,0,0-13.88,0L9,11,8.14,11a4.5,4.5,0,0,0,.36,9H9v2H8.5A6.5,6.5,0,0,1,7.2,9.14a9,9,0,0,1,17.6,0A6.5,6.5,0,0,1,23.5,22Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static cloud_download = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>cloud--download</title><path d="M23.5,22H23V20h.5a4.5,4.5,0,0,0,.36-9L23,11l-.1-.82a7,7,0,0,0-13.88,0L9,11,8.14,11a4.5,4.5,0,0,0,.36,9H9v2H8.5A6.5,6.5,0,0,1,7.2,9.14a9,9,0,0,1,17.6,0A6.5,6.5,0,0,1,23.5,22Z"/><polygon points="17 26.17 17 14 15 14 15 26.17 12.41 23.59 11 25 16 30 21 25 19.59 23.59 17 26.17"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static reset = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>reset--alt</title><path d="M27,8H6.83l3.58-3.59L9,3,3,9l6,6,1.41-1.41L6.83,10H27V26H7V19H5v7a2,2,0,0,0,2,2H27a2,2,0,0,0,2-2V10A2,2,0,0,0,27,8Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static csv = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>CSV</title><polygon points="28 9 26 22 24 9 22 9 24.516 23 27.484 23 30 9 28 9"/><path d="M18,23H12V21h6V17H14a2.002,2.002,0,0,1-2-2V11a2.002,2.002,0,0,1,2-2h6v2H14v4h4a2.002,2.002,0,0,1,2,2v4A2.002,2.002,0,0,1,18,23Z"/><path d="M10,23H4a2.0023,2.0023,0,0,1-2-2V11A2.002,2.002,0,0,1,4,9h6v2H4V21h6Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static json = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>JSON</title><polygon points="31 11 31 21 29 21 27 15 27 21 25 21 25 11 27 11 29 17 29 11 31 11"/><path d="M21.3335,21h-2.667A1.6684,1.6684,0,0,1,17,19.3335v-6.667A1.6684,1.6684,0,0,1,18.6665,11h2.667A1.6684,1.6684,0,0,1,23,12.6665v6.667A1.6684,1.6684,0,0,1,21.3335,21ZM19,19h2V13H19Z"/><path d="M13.3335,21H9V19h4V17H11a2.002,2.002,0,0,1-2-2V12.6665A1.6684,1.6684,0,0,1,10.6665,11H15v2H11v2h2a2.002,2.002,0,0,1,2,2v2.3335A1.6684,1.6684,0,0,1,13.3335,21Z"/><path d="M5.3335,21H2.6665A1.6684,1.6684,0,0,1,1,19.3335V17H3v2H5V11H7v8.3335A1.6684,1.6684,0,0,1,5.3335,21Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static filter = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>Filter</title><path d="M18,28H14a2,2,0,0,1-2-2V18.41L4.59,11A2,2,0,0,1,4,9.59V6A2,2,0,0,1,6,4H26a2,2,0,0,1,2,2V9.59A2,2,0,0,1,27.41,11L20,18.41V26A2,2,0,0,1,18,28ZM6,6V9.59l8,8V26h4V17.59l8-8V6Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`
    )

    static filter_clear = (
        `<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><title>filter</title> <defs> <style> .cls-1 { fill: none; } </style> </defs> <polygon points="30 11.414 28.586 10 24 14.586 19.414 10 18 11.414 22.586 16 18 20.585 19.415 22 24 17.414 28.587 22 30 20.587 25.414 16 30 11.414"/> <path d="M4,4A2,2,0,0,0,2,6V9.1709a2,2,0,0,0,.5859,1.4145L10,18v8a2,2,0,0,0,2,2h4a2,2,0,0,0,2-2V24H16v2H12V17.1709l-.5859-.5855L4,9.1709V6H24V8h2V6a2,2,0,0,0-2-2Z"/> <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/> </svg>`
    )

    static keyboard = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>keyboard</title><path d="M28,26H4a2,2,0,0,1-2-2V10A2,2,0,0,1,4,8H28a2,2,0,0,1,2,2V24A2,2,0,0,1,28,26ZM4,10V24H28V10Z"/><rect x="10" y="20" width="11" height="2"/><rect x="6" y="12" width="2" height="2"/><rect x="10" y="12" width="2" height="2"/><rect x="14" y="12" width="2" height="2"/><rect x="18" y="12" width="2" height="2"/><rect x="6" y="20" width="2" height="2"/><rect x="6" y="16" width="2" height="2"/><rect x="10" y="16" width="2" height="2"/><rect x="14" y="16" width="2" height="2"/><rect x="22" y="12" width="4" height="2"/><rect x="22" y="16" width="4" height="2"/><rect x="18" y="16" width="2" height="2"/><rect x="23" y="20" width="3" height="2"/><rect id="_Transparent_Rectangle_" data-name=" Transparent Rectangle " class="cls-1" width="32" height="32"/></svg>`)

    static data = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>data-base</title><path d="M24,3H8A2,2,0,0,0,6,5V27a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V5A2,2,0,0,0,24,3Zm0,2v6H8V5ZM8,19V13H24v6Zm0,8V21H24v6Z"/><circle cx="11" cy="8" r="1"/><circle cx="11" cy="16" r="1"/><circle cx="11" cy="24" r="1"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`)

    static admin = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">  <defs>    <style>      .cls-1 {        fill: none;      }    </style>  </defs><title>Admin</title>  <path d="M30,24V22H27.8989a4.9678,4.9678,0,0,0-.7319-1.7529l1.49-1.49-1.414-1.414-1.49,1.49A4.9678,4.9678,0,0,0,24,18.1011V16H22v2.1011a4.9678,4.9678,0,0,0-1.7529.7319l-1.49-1.49-1.414,1.414,1.49,1.49A4.9678,4.9678,0,0,0,18.1011,22H16v2h2.1011a4.9678,4.9678,0,0,0,.7319,1.7529l-1.49,1.49,1.414,1.414,1.49-1.49A4.9678,4.9678,0,0,0,22,27.8989V30h2V27.8989a4.9678,4.9678,0,0,0,1.7529-.7319l1.49,1.49,1.414-1.414-1.49-1.49A4.9678,4.9678,0,0,0,27.8989,24Zm-7,2a3,3,0,1,1,3-3A3.0033,3.0033,0,0,1,23,26Z" transform="translate(0 0)"/>  <path d="M14,26.667l-3.2344-1.7246A8.9858,8.9858,0,0,1,6,17V4H26V14h2V4a2.0023,2.0023,0,0,0-2-2H6A2.0023,2.0023,0,0,0,4,4V17a10.9814,10.9814,0,0,0,5.8242,9.707L14,28.9336Z" transform="translate(0 0)"/>  <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`);

    static schema = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>schematics</title><path d="M27,19.001A4.0056,4.0056,0,0,0,22.9991,15H9.0011A2.0031,2.0031,0,0,1,7,12.9991V9.858A3.9949,3.9949,0,0,0,9.8581,7h12.284a4,4,0,1,0,0-2H9.8581A3.9916,3.9916,0,1,0,5,9.858v3.1411A4.0057,4.0057,0,0,0,9.0011,17h13.998A2.003,2.003,0,0,1,25,19.001V22H22v3H9.8581a4,4,0,1,0,0,2H22v3h8V22H27ZM26,4a2,2,0,1,1-2,2A2.0019,2.0019,0,0,1,26,4ZM4,6A2,2,0,1,1,6,8,2.0019,2.0019,0,0,1,4,6ZM6,28a2,2,0,1,1,2-2A2.002,2.002,0,0,1,6,28Zm22-4v4H24V24Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`)

    static key = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <path d="M21,2a8.9977,8.9977,0,0,0-8.6119,11.6118L2,24v6H8L18.3881,19.6118A9,9,0,1,0,21,2Zm0,16a7.0125,7.0125,0,0,1-2.0322-.3022L17.821,17.35l-.8472.8472-3.1811,3.1812L12.4141,20,11,21.4141l1.3787,1.3786-1.5859,1.586L9.4141,23,8,24.4141l1.3787,1.3786L7.1716,28H4V24.8284l9.8023-9.8023.8472-.8474-.3473-1.1467A7,7,0,1,1,21,18Z"/> <circle cx="22" cy="10" r="2"/> <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`)

    static archive = (`<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><style>.cls-1{fill:none;}</style></defs><title>box</title><path d="M20,21H12a2,2,0,0,1-2-2V17a2,2,0,0,1,2-2h8a2,2,0,0,1,2,2v2A2,2,0,0,1,20,21Zm-8-4v2h8V17Z"/><path d="M28,4H4A2,2,0,0,0,2,6v4a2,2,0,0,0,2,2V28a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V12a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4ZM26,28H6V12H26Zm2-18H4V6H28v4Z"/><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/></svg>`)

    static close = (`<svg version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"	 width="32px" height="32px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve"><style type="text/css">	.st0{fill:none;}</style><title>checkmark</title><path d="M16,2C8.2,2,2,8.2,2,16s6.2,14,14,14s14-6.2,14-14S23.8,2,16,2z M16,28C9.4,28,4,22.6,4,16S9.4,4,16,4s12,5.4,12,12	S22.6,28,16,28z"/><rect id="_Transparent_Rectangle_" class="st0" width="32" height="32"/><polygon points="21.4,23 16,17.6 10.6,23 9,21.4 14.4,16 9,10.6 10.6,9 16,14.4 21.4,9 23,10.6 17.6,16 23,21.4 "/></svg>`);

    static menu = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>`
}


ELMNT.define(AppIcon);

