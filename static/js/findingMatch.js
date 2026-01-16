//for /match/<name>

function checkQueue()
{
    console.debug('pop');
    fetch(window.location.pathname, {
    method: 'PUT',
    })
    .then(response => { //this is how you actually redirect why man
        if(response.redirected)
        {
            window.location.href = response.url;//parses url to output  
        }
    })
}

setInterval(checkQueue, 2000);//keep checking put command 