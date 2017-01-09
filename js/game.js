const PUZZLE_DIFFICULTY = 4;
const PUZZLE_HOVER_TINT = '#009900';

var _canvas;
var _stage;

var _img;
var _pieces;
var _puzzleWidth;
var _puzzleHeight;
var _oldPuzzleWidth;
var _oldPuzzleHeight;
var _originalPieceWidth;
var _originalPieceHeight;
var _pieceWidth;
var _pieceHeight;
var _currentPiece;
var _currentDropPiece;

var _mouse;

var _soundWin;
var _soundClick;

// TODO: set scale of hint image to fit screen...

function init(){
    _soundWin   = new Audio("assets/win.ogg");
    _soundClick = new Audio("assets/click.ogg");
    _img = new Image();
    _img.addEventListener('load',onImage,false);
    _img.src = "assets/puzzle8.jpg";
}

function onImage(e){
    _originalPieceWidth  = _img.width / PUZZLE_DIFFICULTY;
    _originalPieceHeight = _img.height / PUZZLE_DIFFICULTY;
    _pieceWidth   = _originalPieceWidth;
    _pieceHeight  = _originalPieceHeight;
    _puzzleWidth  = _img.width;
    _puzzleHeight = _img.height;
    setCanvas();
    initPuzzle();
}

function setCanvas(){
    _canvas = document.getElementById('canvas');
    _stage = _canvas.getContext('2d');
    _canvas.width = _puzzleWidth;
    _canvas.height = _puzzleHeight;
    _canvas.style.border = "1px solid black";
}

function resize() {
    var _canvasRatio = _puzzleHeight / _puzzleWidth;
    var _windowRatio = window.innerHeight / window.innerWidth;
    _oldPuzzleWidth = _puzzleWidth;
    _oldPuzzleHeight = _puzzleHeight;
    if (_windowRatio < _canvasRatio) {
        _puzzleHeight = window.innerHeight;
        _puzzleWidth  = _puzzleHeight / _canvasRatio;
    } else {
        _puzzleWidth  = window.innerWidth;
        _puzzleHeight = _puzzleWidth * _canvasRatio;
    }

    _canvas.width  = _puzzleWidth;
    _canvas.height = _puzzleHeight;
    resizePieces();
}
window.addEventListener('resize', resize, false);

function resizePieces(){
    for (var i = 0; i < _pieces.length; i++) {
        _pieces[i].xPos = _pieces[i].xPos / (_oldPuzzleWidth / PUZZLE_DIFFICULTY ) * ( _puzzleWidth / PUZZLE_DIFFICULTY);
        _pieces[i].yPos = _pieces[i].yPos / (_oldPuzzleHeight / PUZZLE_DIFFICULTY ) * ( _puzzleHeight / PUZZLE_DIFFICULTY);
    }
    _pieceHeight = _puzzleHeight / PUZZLE_DIFFICULTY;
    _pieceWidth  = _puzzleWidth / PUZZLE_DIFFICULTY;

    resetPuzzleAndCheckWin();
}

function initPuzzle(){
    _pieces = [];
    _mouse = {x:0,y:0};
    _currentPiece = null;
    _currentDropPiece = null;
    buildPieces();
}

function buildPieces(){
    var i;
    var piece;
    var xPos = 0.0;
    var yPos = 0.0;
    for(i = 0;i < PUZZLE_DIFFICULTY * PUZZLE_DIFFICULTY;i++){
        piece = {};
        piece.sx = xPos;
        piece.sy = yPos;
        _pieces.push(piece);
        xPos += _pieceWidth;
        if(xPos >= _puzzleWidth){
            xPos = 0.0;
            yPos += _pieceHeight;
        }
    }
    shufflePuzzle();
}

function shufflePuzzle(){
    _pieces = shuffleArray(_pieces);
    _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
    var i;
    var piece;
    var xPos = 0;
    var yPos = 0;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        piece.xPos = xPos;
        piece.yPos = yPos;
        _stage.drawImage(_img, piece.sx, piece.sy, _originalPieceWidth, _originalPieceHeight, xPos, yPos, _pieceWidth, _pieceHeight);
        _stage.strokeRect(xPos, yPos, _pieceWidth,_pieceHeight);
        xPos += _pieceWidth;
        if(xPos >= _puzzleWidth){
            xPos = 0;
            yPos += _pieceHeight;
        }
    }
    resize();
    document.ontouchstart = onPuzzleClick;
    _canvas.onmousedown = onPuzzleClick;
}

function shuffleArray(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function onPuzzleClick(e){
    if (e.type == "mousedown") {
        _mouse.x = e.offsetX == undefined ? e.layerX:e.offsetX;
        _mouse.y = e.offsetY == undefined ? e.layerY:e.offsetY;
        e.preventDefault();
    } else { // touchstart
        _mouse.x = e.targetTouches[0].pageX - _canvas.offsetLeft;
        _mouse.y = e.targetTouches[0].pageY - _canvas.offsetTop;
    }
    _currentPiece = checkPieceClicked();
    if(_currentPiece != null){
        _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
        _stage.save();
        _stage.globalAlpha = .9;
        _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _originalPieceWidth, _originalPieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight /
 2), _pieceWidth, _pieceHeight);
        _stage.restore();
        if (e.type == "mousedown") {
            document.onmousemove = updatePuzzle;
            document.onmouseup = pieceDropped;
        } else { // touchstart
            document.ontouchmove = updatePuzzle;
            document.ontouchend = pieceDropped;
        }
    }
}

function checkPieceClicked(){
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
            //PIECE NOT HIT
        }
        else{
            return piece;
        }
    }
    return null;
}

function updatePuzzle(e){
    _currentDropPiece = null;
    if (e.type == "mousemove") {
        _mouse.x = e.offsetX == undefined ? e.layerX:e.offsetX;
        _mouse.y = e.offsetY == undefined ? e.layerY:e.offsetY;
    } else { // touch
        _mouse.x = e.targetTouches[0].pageX - _canvas.offsetLeft;
        _mouse.y = e.targetTouches[0].pageY - _canvas.offsetTop;
    }
    _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        if(piece == _currentPiece){
            continue;
        }
        _stage.drawImage(_img, piece.sx, piece.sy, _originalPieceWidth, _originalPieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
        _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
        if(_currentDropPiece == null){
            if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                //NOT OVER
            }
            else{
                _currentDropPiece = piece;
                _stage.save();
                _stage.globalAlpha = .4;
                _stage.fillStyle = PUZZLE_HOVER_TINT;
                _stage.fillRect(_currentDropPiece.xPos,_currentDropPiece.yPos,_pieceWidth, _pieceHeight);
                _stage.restore();
            }
        }
    }
    _stage.save();
    _stage.globalAlpha = .6;
    _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _originalPieceWidth, _originalPieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
    _stage.restore();
    _stage.strokeRect( _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth,_pieceHeight);
}

function pieceDropped(e){
    document.ontouchmove = null;
    document.onmousemove = null;
    document.ontouchend = null;
    if(_currentDropPiece != null){
        _soundClick.play();
        var tmp = {xPos:_currentPiece.xPos,yPos:_currentPiece.yPos};
        _currentPiece.xPos = _currentDropPiece.xPos;
        _currentPiece.yPos = _currentDropPiece.yPos;
        _currentDropPiece.xPos = tmp.xPos;
        _currentDropPiece.yPos = tmp.yPos;
    }
    resetPuzzleAndCheckWin();
    _currentDropPiece = null;
}
function resetPuzzleAndCheckWin(){
    _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
    var gameWin = true;
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        _stage.drawImage(_img, piece.sx, piece.sy, _originalPieceWidth, _originalPieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
        _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
        var xTemp = _pieces[i].xPos * (_img.width  / _puzzleWidth);
        var yTemp = _pieces[i].yPos * (_img.height / _puzzleHeight);
        if(piece.sx != xTemp || piece.sy != yTemp){
            gameWin = false;
        }
    }
    if (gameWin){
        gameOver();
    }
}

function gameOver(){
    _soundWin.play();
    document.ontouchstart = null;
    document.ontouchmove = null;
    document.ontouchend = null;
    _canvas.onmousedown = null;
    document.onmousemove = null;
    document.onmouseup = null;
    window.removeEventListener('resize', resize);
}

function changePuzzle(puzzleNum){
    _img.src = "assets/puzzle" + puzzleNum + ".jpg";
    document.getElementById('puzzles').style.display = 'none';
    document.getElementById('puzzleImg').src = "assets/puzzle" + puzzleNum + ".jpg"
}

function showPuzzleList(){
    document.getElementById('puzzles').style.display = 'flex';
}

document.getElementById('puzzleImg').parentNode.parentNode.addEventListener('click', hideCurrentPuzzle, false);

function showCurrentPuzzle(){
    document.getElementById('puzzleImg').parentNode.parentNode.style.display = 'flex';
}
function hideCurrentPuzzle(){
    document.getElementById('puzzleImg').parentNode.parentNode.style.display = 'none';
}

document.onkeypress = function (e) { // hide popups when ESC key is pressed
    e = e || window.event;
    if (e.keyCode === 27) {
        document.getElementById('puzzleImg').parentNode.parentNode.style.display = 'none';
        document.getElementById('puzzles').style.display = 'none';
    }
};
