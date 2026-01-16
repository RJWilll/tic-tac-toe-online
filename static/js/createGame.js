//for /game/<name>

function rand(min, max)
{
    return Math.random() * (max - min) + min;
}

document.getElementById("matchmaking").addEventListener("click", function() //listens for click into matchmaking
{
    url = "/match" + window.location.pathname.split("/game").join("")

    document.getElementById("matchmaking").disabled = true;

    fetch(url, {
    method: 'POST',
    })
    .then(response => { //this is how you actually redirect why man
        if(response.redirected)
        {
            window.location.href = url;//parses url to output  
        }
    })
    
});

//ran code
