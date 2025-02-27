const Errors = {};
var LogFailed = false;

window.onerror = function(message, source, lineno, colno, error) {
    if (LogFailed){ return }
    try{
        const errorMessage = `${message} at ${source}:${lineno}`;
        console.warn('Window OnError:',errorMessage);
        fetch('/api/error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: errorMessage,
            })
        }).catch((e)=>{ window.LogFailed = true;});
        console.warn('Logging Error:',errorMessage);
    } catch (e){
        LogFailed = true;
        window.onerror = ()=>{}
        console.warn('!Logging Error:',e);
    }
    return false; // Let the browser handle the error as well
};

window.addEventListener('unhandledrejection', function(event) {
    if (LogFailed){ return }
    window.LogFailed = true;
    console.warn('Unhandled Rejection:',event.reason);
    try{
        const { message, stack } = event.reason;
        const source = stack.split('\n')[1].trim().split('/').pop();

        const errorMessage = `${message} at ${source}`;
        fetch('/api/error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            error: errorMessage,
            })
        }).catch((e)=>{ window.LogFailed = true;});
    } catch (e){
        LogFailed = true;
        console.warn('!Logging Error (Promise):',e);
    }
});