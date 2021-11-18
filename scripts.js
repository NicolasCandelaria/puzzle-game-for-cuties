let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;
let SCALER = 0.8;
let SIZE = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rows: 3,
    columns: 3
};
let PIECES = [];
let SELECTED_PIECE = null;
let START_TIME = null;
let END_TIME = null;

function main() {
    CANVAS = document.getElementById("myCanvas");
    CONTEXT = CANVAS.getContext("2d");
    addEventListeners();
    /*------------------------------
    Gets access to the device's camera
    ------------------------------*/
    let promise = navigator.mediaDevices.getUserMedia({
        video: true
    });
    promise.then(function(signal) {
        VIDEO = document.createElement("video");
        VIDEO.srcObject = signal;
        VIDEO.play();

        //Helper function to determine the size attributes of the puzzle
        VIDEO.onloadeddata = function() {
            handleResize();
            // window.addEventListener('resize', handleResize);
            initializePieces(SIZE.rows, SIZE.columns);
            updateGame();
        }
    }).catch(function(err) {
        alert("camera error: " + err);
    });
}

/*------------------------------
    Uses a switch to determine the dimensions based on the level chosen
    ------------------------------*/
function setDifficulty() {
    let diff = document.getElementById("difficulty").value;
    switch (diff) {
        case "easy":
            initializePieces(3, 3);
            break;
        case "medium":
            initializePieces(5, 5);
            break;
        case "hard":
            initializePieces(10, 10);
            break;
        case "insane":
            initializePieces(40, 25);
            break;
    }
}
/*------------------------------
    Restarts the file with the appropriate dimensions
    ------------------------------*/
function restart() {
    START_TIME = new Date().getTime();
    END_TIME = null;
    randomizePieces();
    //Hides the menu
    document.getElementById("menuItems").style.display = "none";
}

/*------------------------------
    Updates the timer on the screen, this is called on every frame in the updateGame()
    ------------------------------*/
function updateTime() {
    let now = new Date().getTime();
    if (START_TIME != null) {
        if (END_TIME != null) {
            document.getElementById("time").innerHTML = formatTime(END_TIME - START_TIME);
        } else {
            document.getElementById("time").innerHTML = formatTime(now - START_TIME);
        }
    }
}
/*------------------------------
    Checks if all the pieces are in the correct place by iteration and returns false otherwise
    ------------------------------*/
function isComplete() {
    for (let i = 0; i < PIECES.length; i++) {
        if (PIECES[i].correct == false) {
            return false;
        }
    }
    return true;
}

/*------------------------------
    Reformats the time into the 00:00:00 format
    ------------------------------*/
function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let s = Math.floor(seconds % 60);
    let m = Math.floor((seconds % (60 * 60)) / 60);
    let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));

    let formattedTime = h.toString().padStart(2, '0');
    formattedTime += ":";
    formattedTime += m.toString().padStart(2, '0');
    formattedTime += ":";
    formattedTime += s.toString().padStart(2, '0');
    formattedTime += ":";

    return formattedTime;
}

/*------------------------------
    Adds event listeners for the drag and drop functionality for mobile and web
    ------------------------------*/
function addEventListeners() {
    CANVAS.addEventListener("mousedown", onMouseDown);
    CANVAS.addEventListener("mousemove", onMouseMove);
    CANVAS.addEventListener("mouseup", onMouseUp);
    CANVAS.addEventListener("touchstart", onTouchStart);
    CANVAS.addEventListener("touchmove", onTouchMove);
    CANVAS.addEventListener("touchend", onTouchEnd);
}
/*------------------------------
    Reuses callback functions for web
    ------------------------------*/
function onTouchStart(evt) {
    let loc = {
        x: evt.touches[0].clientX,
        y: evt.touches[0].clientY
    };
    onMouseDown(loc);
}

function onTouchMove(evt) {
    let loc = {
        x: evt.touches[0].clientX,
        y: evt.touches[0].clientY
    };
    onMouseMove(loc);
}

function onTouchEnd() {
    onMouseUp();
}
/*------------------------------
    offsets the piece so it doesn't snap to the mouse's location for a smoother interaction
    ------------------------------*/
function onMouseDown(evt) {
    SELECTED_PIECE = getPressedPiece(evt);
    if (SELECTED_PIECE != null) {
        //this makes the selected piece the last image in the array so that it doesn't appear under all the other pieces ie. z-index 
        const index = PIECES.indexOf(SELECTED_PIECE);
        if (index > -1) {
            PIECES.splice(index, 1);
            PIECES.push(SELECTED_PIECE);
        }
        SELECTED_PIECE.offset = {
            x: evt.x - SELECTED_PIECE.x,
            y: evt.y - SELECTED_PIECE.y
        }
        SELECTED_PIECE.correct = false;
    }
}
/*------------------------------
    Updates the piece location with the mouse's location
    ------------------------------*/
function onMouseMove(evt) {
    if (SELECTED_PIECE != null) {
        SELECTED_PIECE.x = evt.x - SELECTED_PIECE.offset.x;
        SELECTED_PIECE.y = evt.y - SELECTED_PIECE.offset.y;
    }
}
/*------------------------------
    Checks if the piece is near its correct location and snaps it in place so the finished puzzle doesn't have to be pixel perfect
    ------------------------------*/
function onMouseUp() {
    if (SELECTED_PIECE.isClose()) {
        SELECTED_PIECE.snap();
        if (isComplete() && END_TIME == null) {
            let now = new Date().getTime();
            END_TIME = now;
        }
    }
    SELECTED_PIECE = null;
}
/*------------------------------
    - Determines if a piece is clicked by iterating through each and finds if the clicked location is within the bounds of any of them
    - It also iterates through the pieces in reverse order so that it always selects the topmost piece
    ------------------------------*/
function getPressedPiece(loc) {
    for (let i = PIECES.length - 1; i >= 0; i--) {
        if (loc.x > PIECES[i].x && loc.x < PIECES[i].x + PIECES[i].width && loc.y > PIECES[i].y && loc.y < PIECES[i].y + PIECES[i].height) {
            return PIECES[i];
        }
    }
    return null;
}

/*------------------------------
    Makes sure that the canvas is always 80% of the screen
    and allows for responsiveness
    ------------------------------*/
function handleResize() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    let resizer = SCALER *
        Math.min(
            window.innerWidth / VIDEO.videoWidth,
            window.innerHeight / VIDEO.videoHeight
        );
    SIZE.width = resizer * VIDEO.videoWidth;
    SIZE.height = resizer * VIDEO.videoHeight;
    SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
    SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}

/*------------------------------
    Updates the screen 
    ------------------------------*/
function updateGame() {
    //clearRect cleans the canvas after a piece has been displayed to avoid duplicates
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    CONTEXT.globalAlpha = 0.5;
    CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y,
        SIZE.width, SIZE.height);
    CONTEXT.globalAlpha = 1;

    for (let i = 0; i < PIECES.length; i++) {
        PIECES[i].draw(CONTEXT);
    }

    updateTime();
    //this updates the screen up to 60x/s
    window.requestAnimationFrame(updateGame);
}

/*------------------------------
    Starts with an empty array and iterates through the rows w/ i variable and columns w/ j variable
    ------------------------------*/
function initializePieces(rows, cols) {
    SIZE.rows = rows;
    SIZE.columns = cols;
    PIECES - [];
    for (let i = 0; i < SIZE.rows; i++) {
        for (let j = 0; j < SIZE.columns; j++) {
            PIECES.push(new Piece(i, j))

        }
    }
}
/*------------------------------
    Iterates through each piece and generates a random location individually
    ------------------------------*/
function randomizePieces() {
    for (let i = 0; i < PIECES.length; i++) {
        let loc = {
            x: Math.random() * (CANVAS.width - PIECES[i].width),
            y: Math.random() * (CANVAS.height - PIECES[i].height)
        }
        PIECES[i].x = loc.x;
        PIECES[i].y = loc.y;
        //This makes the timer start as soon as you choose the difficulty
        PIECES[i].correct = false;
    }
}

/*------------------------------
    Determines how many pieces there are within the puzzle and sets the location for each piece
    ------------------------------*/
class Piece {
    constructor(rowIndex, colIndex) {
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.width = SIZE.width / SIZE.columns;
        this.height = SIZE.height / SIZE.rows;
        this.x = SIZE.x + this.width * this.colIndex;
        this.y = SIZE.y + this.height * this.rowIndex;
        this.xCorrect = this.x;
        this.yCorrect = this.y;
        this.correct = true;
    }
    draw(context) {
        context.beginPath();

        //This is a draw image method w/ 9 arguments 
        //it starts with the left part, top part, width, height, then draws it using the piece's x and y location and the width and height
        context.drawImage(VIDEO, this.colIndex * VIDEO.videoWidth / SIZE.columns, this.rowIndex * VIDEO.videoHeight / SIZE.rows, VIDEO.videoWidth / SIZE.columns, VIDEO.videoHeight / SIZE.rows, this.x, this.y, this.width, this.height);

        context.rect(this.x, this.y, this.width, this.height);
        context.stroke();
    }
    //This checks if the piece is close enough to its correct location by a certain threshold
    isClose() {
        if (distance({
                x: this.x,
                y: this.y
            }, {
                x: this.xCorrect,
                y: this.yCorrect
            }) < this.width / 3) {
            return true;
        }
        return false;
    }
    //then snaps it in
    snap() {
        this.x = this.xCorrect;
        this.y = this.yCorrect;
        this.correct = true;
    }
}
/*------------------------------
    Callback function that uses pythagorean theorem to determine if the piece is close to its correct threshold
    ------------------------------*/
function distance(p1, p2) {
    return Math.sqrt(
        (p1.x - p2.x) * (p1.x - p2.x) +
        (p1.y - p2.y) * (p1.y - p2.y));
}