var db = firebase.firestore();
var canvas = document.querySelector("canvas");
var c = canvas.getContext("2d");
var scoreboardEL = document.getElementById("scoreboard");
var scoreEL = document.getElementById("score");
var score = 0;
var startEL = document.getElementById("start");
var menyEL = document.getElementById("meny");
var intervall = 100;
var trykk = 1;
var fiendeFart = 2;
var fiendeFartEL = document.getElementById("fiendeFart");

//canvaset skal dekke hele skjermen
canvas.width = innerWidth;
canvas.height = innerHeight;   

class Spiller {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    tegn() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

class Projektil { //projektilklasse for projektilene
    constructor(x, y, radius, color, v) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.v = v;
    }

    tegn() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    oppdater() {
        this.tegn();
        this.x = this.x + this.v.x
        this.y = this.y + this.v.y
    }
}

class Fiende { //fiendeklasse for fiendene
    constructor(x, y, radius, color, v) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.v = v;
    }

    tegn() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    oppdater() {
        this.tegn();
        this.x = this.x + this.v.x
        this.y = this.y + this.v.y
    }
}

var friksjon = 0.98; //friksjon slik at partikklene sakkes ned for hver oppdatering
class Partikkel {
    constructor(x, y, radius, color, v) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.v = v;
        this.alpha = 1;
    }

    tegn() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    oppdater() {
        this.tegn();
        this.v.x *= friksjon
        this.v.y *= friksjon
        this.x = this.x + this.v.x
        this.y = this.y + this.v.y
        this.alpha -= 0.01
    }
}

//variabler med midten av skjermen for enkelhetsskyld
var xcord = canvas.width/2
var ycord = canvas.height/2

var spiller = new Spiller(xcord, ycord, 10*trykk, "white");

//definerer arrays som trengs
var projektiler = [];
var fiender = [];
var partikkler = [];

function spawnFiender() {
    var spawnFienderInterval = setInterval( () => {
        var radius = Math.random() * (30 - 10) + 10;
        
        //finn et tilfeldig sted å spawne fienden utenfor canvas med vektor mot sentrum
        if (Math.random() < 0.5) {
            var fiendeX = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            var fiendeY = Math.random() * canvas.height;
        } else if (Math.random() < 0.5) {
            var fiendeX = Math.random() * canvas.width;
            var fiendeY = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        var color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        var vinkel = Math.atan2(ycord - fiendeY, xcord - fiendeX)
        var fart = {x: Math.cos(vinkel)*fiendeFart*trykk, y: Math.sin(vinkel)*fiendeFart*trykk}

        fiender.push(new Fiende(fiendeX, fiendeY, radius*trykk, color, fart));

        fiendeFart = fiendeFart*1.01
        fiendeFartEL.innerHTML = "Fart: "+ Math.floor(fiendeFart*5) 
    },intervall*10); //intervall styres av spillerens ønske om vansklighetsgrad
}

//Animasjons loop
var animationID
function animer() {
    //tegn et svart canvas med alpha for fade samt start animationID
    animationID = requestAnimationFrame(animer);
    c.fillStyle = "rgba(0, 0, 0, 0.15";
    c.fillRect(0, 0, canvas.width, canvas.height);
    spiller.tegn();

    //Hvis en partikkel sin opacity blir under 0 skal det fjernes fra programmet
    partikkler.forEach((partikkel, parIndex) => {
        if (partikkel.alpha <= 0) {
            partikkler.splice(parIndex, 1)
        } else {
        partikkel.oppdater();
        }
    });

    //Hvis et projektil blir skutt utenfor canvas skal det fjernes fra programmet
    projektiler.forEach((projektil, proIndex) => {
        projektil.oppdater()
        if (
            projektil.x + projektil.radius < 0 || 
            projektil.x - projektil.radius > canvas.width ||
            projektil.y + projektil.radius < 0 ||
            projektil.y - projektil.radius > canvas.height
            ) {
            projektiler.splice(proIndex, 1)
        }
    });

    fiender.forEach((fiende, index) => {
        fiende.oppdater();

        var dist = Math.hypot(spiller.x - fiende.x, spiller.y - fiende.y)
        
        //game over hvis en fiende treffer spilleren
        if (dist - fiende.radius - spiller.radius < 1) {
            gameOver();
        }

        projektiler.forEach((projektil, proIndex) => {
            var dist = Math.hypot(projektil.x - fiende.x, projektil.y - fiende.y)
  
            //Fiende og projektil rører hverandre
            if (dist - fiende.radius - projektil.radius < 0) {

                for (let i=0; i<fiende.radius*4;i++) {
                    partikkler.push(
                        new Partikkel(projektil.x, projektil.y, Math.random()*3*trykk,fiende.color,{
                            x: (Math.random() - 0.5)*(Math.random()* 10), 
                            y: (Math.random() - 0.5)*(Math.random()* 10)
                        })) //spawner tilfeldig antall parikkler med tilfeldig vektor når en fiende blir truffet
                }
                //hvis fienden er større en 20 skal den forminskes og ikke fjernes
                if (fiende.radius - 10*trykk > 10*trykk) {
                    score ++; //+1 poeng ved forminskning
                    scoreEL.innerHTML = score + " poeng, ";

                    gsap.to(fiende, { //Fade animasjon hentet fra https://greensock.com/gsap/
                        radius: fiende.radius - 10*trykk
                    })
                    setTimeout(() => { //settimeout for å forhindre hakking
                        projektiler.splice(proIndex, 1);
                    })
                } else {
                setTimeout(() => {
                    fiender.splice(index, 1); //fjern fiende som ble truffet
                    projektiler.splice(proIndex, 1); //fjern projektil som traff fiende
                    score += 2; //+2 poeng når en fiende blir elimminert
                    scoreEL.innerHTML = score + " poeng"; //oppdater score
                })};
            }
        });
    });
}
//animasjonsloop slutt

//Eventlistener for musbasert input
window.addEventListener("mousedown", (e) => {
    //regn ut hvor mousedown er i forhold til spilleren (sentrum)
    var vinkel = Math.atan2(e.clientY - ycord, e.clientX - xcord);
    var fart = {x: Math.cos(vinkel)*4, y: Math.sin(vinkel)*4};

    //spawn ny projektil i en vektor mot vinkel
    projektiler.push(new Projektil(
        xcord, ycord, 5, "white", fart))
})

//Eventlistener for touchbasert input
window.addEventListener("touchstart", (e) => {

    trykk = 2; //dobler spillets hastighet når touchskjerm brukes da det er mye enklere
    var vinkel = Math.atan2(e.touches[0].clientY - ycord, e.touches[0].clientX - xcord);
    var fart = {x: Math.cos(vinkel)*4*trykk, y: Math.sin(vinkel)*4*trykk};
    projektiler.push(new Projektil(
        xcord, ycord, 5*trykk, "white", fart))
})

startEL.addEventListener("click", gameStart)

function gameStart() {
    //resetter alle relevante variabler
    fiender = [];
    projektiler = [];
    partikkler = [];
    score = 0;
    fiendeFart = 2;
    //gjem highscoretabellen men vis score
    scoreEL.innerHTML = score + " poeng";
    fiendeFartEL.innerHTML = "Fart: "+ Math.floor(fiendeFart*5) 
    scoreEL.style.visibility = "visible";
    scoreboardEL.style.visibility = "hidden";
    menyEL.style.visibility = "hidden";
    animer();
    spawnFiender();
}

function gameOver() {
    for(i=0; i<100; i++) { //fjerner alle setInterval's i koden slik at spawnFiender() stopper opp
        window.clearInterval(i);
    }
    cancelAnimationFrame(animationID); //stop animasjonen og gjør gameover skjermen synlig
    scoreEL.innerHTML = score + " poeng";
    scoreEL.style.visibility = "hidden";
    scoreboardEL.style.visibility = "visible";
    intervall = 100;
    menyEL.innerHTML = `
    <p>GAME OVER</p>
    <p class="small">Du fikk ${score} poeng</p>
    <input class="anim" id="navn" type="text" placeholder="Hva er navnet ditt...">
    <button class="anim" onclick="saveScore()">Save Score (Beta)</button>
    <button class="anim" id="omStart">Spill igjen</button>
    <input id="vanskelighetRange" type="range" value="100" min="10" max="190" oninput="this.nextElementSibling.value = parseInt(this.value)*0.01; intervall = parseInt(this.value)">
    <output class="small">1</output><p class="small"> sekund mellom hver ball</p> 
    `
    var omStartEL = document.getElementById("omStart"); //omstart knapp aktiveres
    omStartEL.addEventListener("click", gameStart);
    menyEL.style.visibility = "visible";
}

/*

function saveScore() {
    // Henter navnet fra input boksen
    var navn = document.getElementById('navn').value;

    // Sjekk om det står et navn i boksen
    if(navn !== "") {
        // Legg inn navn samt score i firestore databasen
        db.collection("scores").doc().set({
            navn: navn,
            score: score
        })
        updateScores();
    } else {
        alert('Please enter a name');
    }
}

function updateScores(e) {
    // Fjern alle elementer fra highscorelisten
    document.getElementById('scoreboard').innerHTML = '<tr><th>Navn</th><th>Score</th></tr>';
    
    // Hent frem de 5 høyeste scorene i databasen og vis de i highscorelisten
    db.collection("scores").orderBy("score", "desc").limit(5).get().then((e) => {
        e.forEach((doc) => {
            document.getElementById('scoreboard').innerHTML += '<tr>' +
            '<td>' + doc.data().navn + '</td>' +
            '<td>' + doc.data().score + '</td>' +
            '</tr>';
        })
    })
}

window.onload = updateScores();

*/
