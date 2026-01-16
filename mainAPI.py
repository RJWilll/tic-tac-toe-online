import os
import random
import queue
from flask import Flask, request, jsonify, render_template, url_for, redirect, Response, make_response
from flask_sqlalchemy import SQLAlchemy

#setup for database

app = Flask(__name__)
app.debug = True
database = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///my_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable tracking to save memory

dataBase = SQLAlchemy(app)

class Profile(dataBase.Model):
    __tablename__ = 'profiles'
    name = dataBase.Column(dataBase.String, primary_key=True, unique=True, nullable=False)
    rank = dataBase.Column(dataBase.Integer)
    wins = dataBase.Column(dataBase.Integer)
    losses = dataBase.Column(dataBase.Integer)
    password = dataBase.Column(dataBase.String)
    status = dataBase.Column(dataBase.String) #will have 'matchmaking', 'inmenu',  or id of the game their in

    def __repr__(self):
        return f"Name: {self.name}, Rank: {self.rank}"
    

class Game(dataBase.Model):
    __tablename__ = 'games'
    id = dataBase.Column(dataBase.String, primary_key=True, unique=True, nullable=False)
    boardStatus = dataBase.Column(dataBase.String)#9 char string that has each index in the string being assigned to each place on board, ex. XX!XO!!O!, ! = blank, X or O has them chosen that square
    numTurns = dataBase.Column(dataBase.Integer)#how many turns have gone
    turn = dataBase.Column(dataBase.String)#should be 1 char (X or O) to show its their turn, or 1 for Winner X or 0 for winner O, T for tie
    host = dataBase.Column(dataBase.String)#who created the game, to be used to know whether to have X's or O's be played -> if host then play X's, if not host then play O's

with app.app_context():
    dataBase.drop_all()
    dataBase.create_all()

#code run

myQueue = queue.Queue()

#Queries

@app.route("/")
def defaultRun():
    return redirect(url_for('setProfile'))

@app.route("/add", methods=['GET','POST'])
def setProfile():
    if(request.method == 'POST'):
        name = request.form.get('name')
        password = request.form.get('password')
        tryname = Profile.query.filter_by(name=name).all() #checks if name is already created
        if not tryname:#if name is not created then create it
            newProfile = Profile(name=name, rank=0, wins=0,losses=0, password=password, status = 'inmenu')
            dataBase.session.add(newProfile)
            dataBase.session.commit()
            return redirect(url_for('CreateGame', name=name))
        else:#else then just redirect with already made name
            curProfile = Profile.query.filter(Profile.name == name).first()
            if(curProfile.password == password):
                return redirect(url_for('CreateGame', name=name))
            else:
                return redirect("/")#should change this so is notified when the password is wrong

    return render_template('loadProfile.html')#get command runs html page that loads the post command, idk if this is good form or not

@app.route("/game/<name>", methods=['GET','POST'])
def CreateGame(name):
    if(request.method == 'POST'):
        id = request.form.get('ID')
        tryid = Game.query.filter_by(id=id).all()
        if not tryid:#if game has not already been made
            generateGame(id, name)
            return redirect(url_for('playGame', name=name, id=id))
        else:
            return redirect(url_for('playGame', name=name, id=id))
    else:
        return render_template('createGame.html')


@app.route("/game/<name>/<id>", methods=['GET','PUT', 'DELETE'])
def playGame(name, id):
    curGame = Game.query.filter(Game.id == id).first()#note that this acts as a pointer like 
    curProfile = Profile.query.filter(Profile.name == name).first()
    if(request.method == 'PUT'):
        data = request.get_json()
        if data is None:
            return "No Data",214
        curGame.boardStatus = data['board']
        curGame.turn = data['turn']
        curGame.numTurns = curGame.numTurns + 1
        curProfile.rank = curProfile.rank + data['point']
        if(data['point'] == 1):
            curProfile.wins = curProfile.wins + 1
        elif(data['point'] == -1):
            curProfile.losses = curProfile.losses
        dataBase.session.commit()
        return render_template('main.html', profile=curProfile, game=curGame)
    elif(request.method == 'GET'):
        return render_template('main.html', profile=curProfile, game=curGame)#still need to have main.html accept game data
    elif(request.method == 'DELETE'):
        dataBase.session.delete(curGame)
        dataBase.session.commit()
        return redirect(url_for('createGame', name=name))

@app.route("/game/i/<id>", methods=['GET'])
def getGame(id):
    curGame = Game.query.filter(Game.id == id).first()
    if curGame is not None:
        return jsonify(
        {
            "id": curGame.id,
            "boardStatus":  curGame.boardStatus,
            "numTurns": curGame.numTurns,
            "turn": curGame.turn,
            "host": curGame.host
        })#really weird and odd syntax needed
    else:
        return redirect(url_for('defaultRun'))


@app.route("/match/<name>", methods=['GET', 'PUT', 'POST'])
def addToMatchmaking(name):
    curProfile = Profile.query.filter(Profile.name == name).first()
    if(request.method == 'POST'):
        myQueue.put(name)
        curProfile.status = 'matchmaking'
        dataBase.session.commit()
        return redirect(url_for('addToMatchmaking', name=name))
    elif(request.method == 'PUT'):
        if(myQueue.qsize() >= 2 and myQueue.queue[0] == name):
            newID = generateID()
            partner = Profile.query.filter(Profile.name == myQueue.queue[1]).first()
            curProfile.status = newID
            partner.status = newID
            myQueue.get()#remove match from queue
            myQueue.get()
            generateGame(newID, name)
            dataBase.session.commit()
            return redirect(url_for('playGame', name=name, id=newID), code=303)#code 303 specifies that will do GET request and NOT put, which is the default
        elif(curProfile.status != 'matchmaking'):
            return redirect(url_for('playGame', name=name, id=curProfile.status), code=303)#code 303 specifies that will do GET request and NOT put, which is the default
        else:
            return "",204
    elif(request.method == 'GET'):
        return render_template('findingMatch.html', profile=curProfile)

#functions:
def randomizeTurn():
    newTurn = random.randint(0,1)#just to get random turn, X or O
    if(newTurn == 0): 
        newTurn = 'X'
    else:
        newTurn = 'O'
    return newTurn

def generateID():#returns randomly generated 10 character length id 
    id = ""
    for i in range(10):#should work
        id = id + chr(random.randint(48, 126))
    return id

def generateGame(id, name):
    newTurn = randomizeTurn()
    newGame = Game(id=id, boardStatus='!!!!!!!!!', numTurns=0, turn=newTurn, host=name)
    dataBase.session.add(newGame)
    dataBase.session.commit()



#flow:  users go to /game/name to create/join game with their made ID
#       redirects to /game/name/id which renders main.html and the base profile and board data, in which js takes id and makes GET request to get values for internal board
#       when played, put request is made and get requests are made to game/id to update internal board on both sides, other player can play
#       go until winner


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)

