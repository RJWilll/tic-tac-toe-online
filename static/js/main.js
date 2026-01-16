//attached to main.html


function replaceChar(orignalString, index, char)//js is so bad man
{
    if(index < 0 || index > orignalString.length - 1)
    {
        return orignalString;
    }
    else
    {
        return orignalString.substring(0, index) + char + orignalString.substring(index + 1, orignalString.length);
    }
}

function rand(max)
{
    return Math.random() * max;
}

function randomizeTurn()
{
    if(rand(10) % 2 == 1)//if random number is odd
    {
        return "X";
    }
    else //if random number is even
    {
        return "O";
    }
}

class board
{
    constructor()
    {
        this.id = "!";
        this.turn = "!";
        this.host = "!";

        this.constructorHelper();
        setInterval(() => this.constructorHelper(), 2000);
    }

    async getValues()
    {
        let fetchURL = "/game/i/" + window.location.pathname.split('/')[3];
        let response = await fetch(fetchURL);
        if(response.redirected)
        {
            window.location.href = response.url;//parses url to output, catch if data has been deleted
        }

        let data = await response.json();
        //get values from database
        this.id = data.boardStatus;
        this.turn = data.turn;
        this.host = data.host;
    }

    constructorHelper()
    {
        console.log("POP");
        this.getValues().then(() => {
            //can only set up buttons after values are gotten
            this.setUpButtons();
            this.showTurn();
            this.showSymbol();

            if(this.turn == "W")
            {
                this.onWin();
            }
            else if(this.turn == "T")
            {
                this.onTie();
            }

        });
    }

    setUpButtons()
    {
        const buttons = [
            document.getElementById("tile1"),
            document.getElementById("tile2"),
            document.getElementById("tile3"),
            document.getElementById("tile4"),
            document.getElementById("tile5"),
            document.getElementById("tile6"),
            document.getElementById("tile7"),
            document.getElementById("tile8"),
            document.getElementById("tile9")
        ]

        for(let i = 0; i < 9; i++)
        {
            buttons[i].textContent = this.id[i];
            let name = window.location.pathname.split('/')[2];

            if(this.id[i] == '!')
            {
                buttons[i].textContent = "\u00A0";
            }

            if(this.id[i] != '!' || (name == this.host && this.turn != "X") || (name != this.host && this.turn != "O"))
            {
                buttons[i].disabled = true;
            }
            else
            {
                buttons[i].disabled = false;
            }
        }
    }

    showTurn()
    {
        let render = document.getElementById("turn");
        render.textContent = "Turn: " + this.turn;
    }

    showSymbol()
    {
        let render = document.getElementById("symbol");
        let name = window.location.pathname.split('/')[2];
        if(this.host == name)
        {
            render.textContent = "Your Symbol: X";
        }
        else
        {
            render.textContent = "Your Symbol: O";
        }
    }

    click(button)//fix put command
    {
        button.style.color = "black";
        button.textContent = thisBoard.turn;
        button.disabled = true;
        this.checkifWon();
        this.swap();
        this.postUpdate();
    }

    swap()//gets symbol and swaps, ONLY swaps if X or O is turn, so if turn makes it W, it wont change
    {
        if(this.turn == "X")
        {
            this.turn = "O";
        }
        else if(this.turn == "O")
        {
            this.turn = "X";
        }
    }

    checkifWon()//checks if won
    {
        if(((this.id[0] == this.id[1]) && (this.id[1] == this.id[2]) && (this.id[0] != "!")) || 
        ((this.id[3] == this.id[4]) && (this.id[4] == this.id[5]) && (this.id[5] != "!")) ||
        ((this.id[6] == this.id[7]) && (this.id[7] == this.id[8]) && (this.id[8] != "!")) || 
        ((this.id[0] == this.id[3]) && (this.id[3] == this.id[6]) && (this.id[6] != "!")) || 
        ((this.id[1] == this.id[4]) && (this.id[4] == this.id[7]) && (this.id[7] != "!")) ||
        ((this.id[2] == this.id[5]) && (this.id[5] == this.id[8]) && (this.id[8] != "!")) ||
        ((this.id[0] == this.id[4]) && (this.id[4] == this.id[8]) && (this.id[8] != "!")) ||
        ((this.id[2] == this.id[4]) && (this.id[4] == this.id[6]) && (this.id[6] != "!"))//dont question it
        )
        {
            this.onWin(this.turn);
        }
        else if(this.id[0] != "!" && 
            this.id[1] != "!" &&
            this.id[2] != "!" &&
            this.id[3] != "!" &&
            this.id[4] != "!" &&
            this.id[5] != "!" &&
            this.id[6] != "!" &&
            this.id[7] != "!" &&
            this.id[8] != "!"
        )//tie happened
        {
            this.onTie();
        }
    }

    onWin()//runs if won
    {
        document.getElementById("result").textContent = "PLAYER HAS WON";
        this.postRankChange(this.turn);
        this.turn = "W";
        document.getElementById("reset").disabled = false;
    }

    onTie()
    {
        document.getElementById("result").textContent = "TIE OCCURED";
        this.turn = "T"
        document.getElementById("reset").disabled = false;
    }

    reset()
    {
        const buttons = [
            document.getElementById("tile1"),
            document.getElementById("tile2"),
            document.getElementById("tile3"),
            document.getElementById("tile4"),
            document.getElementById("tile5"),
            document.getElementById("tile6"),
            document.getElementById("tile7"),
            document.getElementById("tile8"),
            document.getElementById("tile9")
        ]

        document.getElementById("result").textContent = " ";//reset result

        for(const button of buttons)//reenable and reset button text
        {
            button.disabled = false;
            button.textContent = "\u00A0";
        }

        this.id = "!!!!!!!!!";
        this.turn = randomizeTurn();

        this.postUpdate();//update the database with new game

        document.getElementById("reset").disabled = true;//disable reset button
    }

    postUpdate()
    {
        const postData = 
        {
            board: this.id,
            turn: this.turn,
            point: 0
        }

        fetch(window.location.pathname, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
        })
    }

    postRankChange(winSymbol)
    {
        let profile = window.location.pathname.split('/')[2];
        let points = 0;

        if((winSymbol == "X" && profile == this.host) || (winSymbol == "O" && profile != this.host))//if won
        {
            points = 1;
        }
        else if((winSymbol == "X" && profile != this.host) || (winSymbol == "O" && profile == this.host))//if lost
        {
            points = -1;
        }

        const postData = 
        {
            board: this.id,
            turn: this.turn,
            point: points
        }

        fetch(window.location.pathname, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
        })
    }

    endGame()
    {
        fetch(window.location.pathname, {
            method: 'DELETE'
        })
        .then(response => { //this is how you actually redirect why man
            if(response.redirected)
            {
                window.location.href = response.url;//parses url to output  
            }
        })
    }
}

document.getElementById("tile1").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 0, thisBoard.turn);
    thisBoard.click(document.getElementById("tile1"));
});

document.getElementById("tile2").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 1, thisBoard.turn);
    thisBoard.click(document.getElementById("tile2"));
});

document.getElementById("tile3").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 2, thisBoard.turn);
    thisBoard.click(document.getElementById("tile3"));
});

document.getElementById("tile4").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 3, thisBoard.turn);
    thisBoard.click(document.getElementById("tile4"));
});

document.getElementById("tile5").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 4, thisBoard.turn);
    thisBoard.click(document.getElementById("tile5"));
});

document.getElementById("tile6").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 5, thisBoard.turn);
    thisBoard.click(document.getElementById("tile6"));
});

document.getElementById("tile7").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 6, thisBoard.turn);
    thisBoard.click(document.getElementById("tile7"));
});

document.getElementById("tile8").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 7, thisBoard.turn);
    thisBoard.click(document.getElementById("tile8"));
});

document.getElementById("tile9").addEventListener("click", function() 
{
    thisBoard.id = replaceChar(thisBoard.id, 8, thisBoard.turn);
    thisBoard.click(document.getElementById("tile9"));
});

document.getElementById("reset").addEventListener("click", function() 
{
    thisBoard.reset();
});

document.getElementById("end").addEventListener("click", function() 
{
    thisBoard.endGame();
});

//ran code
let thisBoard = new board();
