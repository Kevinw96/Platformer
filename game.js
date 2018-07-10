const times = [];
let fps;
function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    refreshLoop();
  });
}
refreshLoop();

function closeMenu() {
  $("#menu").css("display","none");
}

function reset() {
  $(".status").text("Game is paused.");
  $(".time").text("");
  $("#resume").prop('disabled', false);
  $("#resume").css("cursor","pointer");
  finished = false;
  for (var i = 0; i < obj.length; i++) {
    if (obj[i].type == "checkpoint"){
      obj[i].color = "#660000";
    }
  }
  player.spawnX = startX;
  player.spawnY = startY;
  player.x = startX;
  player.y = startY;
  seconds = 0;
  minutes = 0;
  time = "00:00";
  closeMenu();
}



$(document).ready(function(){ //When the document is loaded

  setInterval(update, 1000/60); //Frames per second the game runs
  var canvas = document.getElementById("canvas"), //Get the canvas element
    ctx = canvas.getContext("2d"), //Canvas is 2d
    mapArray = $("#canvas").text().split(","); //split string into the array
    obj = [], //Place to store all the obj
    keys = [], //Place to store the keys
    array = [],
    shadowAngle = 45,
    shadows = true,
    background = { //Background colour (HSL)
      hue: 193,
      saturation: 15,
      lightness: 25,
    },
    gravity = 0.5, //Set gravity for player
    startX = 0,
    startY = 0,
    player = { //The player and all it's properties
      x: 0, //Player horizontal position
      y: 0, //Player vertical position
      spawnX: 0, //Horizontal spawn coords
      spawnY: 0, //Vetical spawn coords
      w: 50, //Player width
      h: 49, //Player height
      speed: 5, //Player speed
      jumpHeight: 12, //Jump height
      vx: 0, //Player horizontal velocity
      vy: 1, //Player vertical velocity
      color: "#2B853D", //Player colour
      grounded: false, //If the player is on the ground
      crouching: false, //If the player is crouching
      canStand: true,

      draw: function() { //Function to draw the player onto the canvas
        ctx.beginPath(); //Start drawing
          ctx.rect(this.x, this.y, this.w, this.h);        
          ctx.fillStyle = this.color; //Give player selected colour
          ctx.fill(); //fill in the shape
        ctx.closePath(); //stop drawing
        shadow.draw(this.x, this.y, this.w, this.h); //Draw a shadow       
      }
    },
    finished = false;
    time = "00:00",
    seconds = 0,
    minutes = 0;
    canvas.width = 1080;
    canvas.height = 720;

  $("#canvas").css('background-color', 'hsl('+background.hue+','+background.saturation+'%,'+background.lightness+'%)'); //Set the background colour

  for (var i = 0; i < mapArray.length; i++) {
   mapArray[i] = mapArray[i].split("_"); //Split the array into a 2d array
  }
  var row = 0, //Setting up some variables to generate the map
    column = 0,
    mapWidth = 0;
  for (var y = 0; y < mapArray.length; y++) { //Load the map in vertically
    for (var x = 0; x < mapArray[y].length; x++) { //Load the map in horizontally
      drawMap(mapArray[y][x], column, row); //Convert the id to a object in the world and put it in the "obj" array
      column += 50; //Go to next column
      if (mapArray[y].length > mapWidth){
        mapWidth = mapArray[y].length;
      } 
    }
    row += 50; //go to next row
    column = 0; //Start again from left side
  }


  setInterval(timer, 1000);
  function timer() {
    if ($("#menu").css("display") == "none") {
      seconds = seconds + 1;
      if (seconds == 60) {
        seconds = 0;
        minutes = minutes + 1;
      }
      if (seconds < 10) {
        time = ":0"+seconds;
      } else {
        time = ":"+seconds;
      }
      if (minutes < 10) {
        time = "0"+minutes+time;
      } else {
        time = minutes + time;
      }
    }
  }

  document.body.addEventListener("keydown", function (e) { //When a key is pressed
    keys[e.keyCode] = true; //Set the pressed key as true
    if (!finished) {
      if (keys[27]) {
        $("#menu").toggle();
      }
    } 
  });

  document.body.addEventListener("keyup", function (e) { //When a key is released
    keys[e.keyCode] = false; //Set the released key as false
  });

  function update() { //This function will update according to the specified framerate
    if ($("#menu").css("display") == "none") {

      player.y += player.vy; //drop player down
      if (player.vy < 12) { //stop player from going to fast
        player.vy += gravity; //increment the players falling speed
      }
      
      if (keys[83] || keys[16] || keys[40]) { //If crouching keys "S", "SHIFT" or "DOWN ARROW" are pressed
        if (!player.crouching) { //If player is not already crouching
          player.h = player.h / 2; //Half the players height
          player.y = player.y + player.h;
          player.crouching = true; //Set the player as crouching
        }     
      }

      if (!keys[83] && !keys[16] && !keys[40]) { //If the crouching key is released
        if (player.crouching && player.canStand) { //Player must be crouching
          player.y = player.y - player.h;
          player.h = player.h * 2; //Double the height of the player
          player.crouching = false; //Set as not crouching
        }
      }

      if (keys[38] || keys[32] || keys[87]) { //When the player presses the jumping keys "W", "SPACEBAR", "UP ARROW"
        if (player.grounded) { //If the player is on the ground
          player.vy =- player.jumpHeight; //Shoot the player up
          player.grounded = false; //Set player as not on the ground anymore
        }
      }

      if (keys[39] || keys[68]) { //When the player presses the right keys "D" or "RIGHT ARROW"
        player.x += player.speed; //Increment player x coords
      }

      if (keys[37] || keys[65]) { //When the player presses the left keys "A" or "LEFT ARROW"
        player.x -= player.speed; //Decrement player x coords
      }
    }
    
    if(player.grounded) { //If the player is standing on a platform
      player.vy = 0; //Stop the player from falling
    }
           
    collision(); //Check for collision
    clearCanvas(); //Clear the canvas
  }

  function clearCanvas() { //Clear the canvas
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Delete everything of the canvas

    var offsetX = -(player.x + player.w - canvas.width / 2),
      offsetY = -(player.y + player.h - canvas.height / 2);

    if (mapWidth * 50 > canvas.width) {
      if (offsetX > 0) {
        offsetX = 0;
      } else if (offsetX - canvas.width < -mapWidth * 50){
        offsetX = -(mapWidth * 50 - canvas.width);
      } else {
        offsetX = -(player.x + player.w - canvas.width / 2);
      }
    } else {
      offsetX = 0;
    }

  if (row > canvas.height) {
    if (offsetY > 0) {
      offsetY = 0;
    } else if (offsetY - canvas.height < -row){
      offsetY = -(player.y + player.h - canvas.height + row - player.y - player.h);
    }  else {
      offsetY = -(player.y + player.h - canvas.height / 2);
    }
  } else {
    offsetY = -(player.y + player.h - canvas.height + row - player.y - player.h);
  }
  ctx.translate(offsetX,offsetY);

    ctx.beginPath();
    ctx.rect(-canvas.width / 2, -canvas.height / 2, canvas.width / 2, canvas.height + row);
    ctx.rect(mapWidth * 50, -canvas.height / 2, canvas.width / 2, canvas.height + row);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();
    
    for (var i = 0; i < obj.length; i++) { //Redraw all the objects
      obj[i].draw();
    }
    player.draw(); //Redraw the player

    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(time, Math.abs(offsetX) + canvas.width - 50, Math.abs(offsetY) - 100);
    ctx.font = "20px Arial";
    if (fps < 30) {
      ctx.fillStyle = "red";
    }
    ctx.fillText("FPS: "+fps, Math.abs(offsetX) + 50, Math.abs(offsetY) - 100);
  }

  function collision() { //check for collisions
    player.grounded = false; //Set player as not on the ground
    var pulX = player.x, //Player upper left X
        pulY = player.y, //Player upper left Y
        pur = pulX + player.w, //Player upper right
        pll = pulY + player.h; //Player lower left
    for (var i = 0; i < obj.length; i++) { //Loop through all objects
    var oulX = obj[i].x, //Object upper left X
        oulY = obj[i].y, //Object upper left Y
        our = oulX + obj[i].w, //Object upper right
        oll = oulY + obj[i].h; //Object lower left
     
      if(pulX < 0){ //if the player touches the left map border
        player.x = 0;
      } else if (pur > mapWidth * obj[i].w) {//If the player touches the right map border
        player.x = mapWidth * obj[i].w - player.w;
      }

      if (obj[i].type == "slab") {
        if (pulY > oulY && pulX < our && pur > oulX && pulY < oulY + obj[i].h * 2){
          array.push(0);
        } else {
          array.push(1);
        }
        if (array.includes(0)) {
        player.canStand = false;
        } else {
        player.canStand = true;
        }
      }
      
      if (obj[i].type == "trap") { //If the block is a trap
        if (pll + 1 > oulY && pulY < oll && pulX < our && pur > oulX){ //Check if player is touching deadly platform
          kill(); //Kill the player
        }
      } else if (pulY > row) {
        kill(); //Kill the player
      }

      if (obj[i].type == "checkpoint" && obj[i].color == "#660000") { //If the block is a checkpoint
        if (pur > oulX && pulX < our && pll > oulY && pulY < oll){
          player.spawnX = obj[i].x;
          player.spawnY = obj[i].y;
          obj[i].color = obj[i].active;
        }
      }

      if (obj[i].collision == true) {
        if (pll > oulY && pulY < oll && pur - 5 > oulX && pulX + 5 < our){ //If the player is vertically aligned with the platform
          if (obj[i].type == "finish") {
            finish();
          }
          if (pll < obj[i].y + obj[i].h / 2) { //if player touches top of a platform
              player.y = obj[i].y - player.h; //Stop the player from falling through the top of the platform
              player.grounded = true; //Player is on a platform 
          } 
          if (pulY > obj[i].y + obj[i].h / 2) { //if player touches bottom of a platform
              player.y = obj[i].y + obj[i].h; //Stop player from going up
              player.vy = 1; //Reset the player velocity
          }
        }

        if (player.y + player.h > oulY && pulY < oll && pur > oulX && pulX < our){ //If the player is horizontally aligned with the platform
          if (pur < obj[i].x + obj[i].w / 2) {  //If the player touches the left of the platform
            player.x = obj[i].x - player.w; //prevent player from going left
          }
          if (pulX > obj[i].x + obj[i].w / 2) { //If the player touches the right of the platform
            player.x = obj[i].x + obj[i].w; //prevent player from going right
          }
        }
      }
    }
    array = [];
  }

  function kill() { //When player is killed 
      player.x = player.spawnX; //Respawn the player to stored coords
      player.y = player.spawnY;
      player.vy = 0; //Reset player velocity
  }

  function finish() {
    finished = true;
    $("#menu").css("display","block");
    $("#resume").prop('disabled', true);
    $("#resume").css("cursor","not-allowed");
    $(".status").text("You won!");
    $(".time").text("Your completion time is: "+time);

  }

  function drawMap(id, x, y) {
    if (parseInt(id) == 0) { //if it is a player
        startX = x;
        startY = y;
        player.x = x; //Place player on x coords
        player.y = y; //Place player on y coords
        player.spawnX = x; //set spawn coords
        player.spawnY = y;
      }
      if (id == 1) { //If it is a solid platform
        obj.push({
          x: x,
          y: y,
          w: 50, //platform width
          h: 51, //platform height
          color: "black", //platform colour
          collision: true,

          draw: function() {
          shadow.draw(x, y, this.w, this.h);
          ctx.beginPath(); //Start drawing 
            ctx.rect(x, y, this.w, this.h);
            ctx.fillStyle = this.color;
            ctx.fill(); //fill in all the shapes that are being drawn
          ctx.closePath(); //Stop drawing
          }
        });
      }
      if (id == 2) { //If it is a solid half platform
        obj.push({
          x: x,
          y: y,
          w: 50, //platform width
          h: 25, //platform height
          color: "black", //platform colour
          type: "slab",
          collision: true,

          draw: function() {
          shadow.draw(x, y, this.w, this.h);
          ctx.beginPath(); //Start drawing   
            ctx.rect(x, y, this.w, this.h);
            ctx.fillStyle = this.color;
            ctx.fill(); //fill in all the shapes that are being drawn
          ctx.closePath(); //Stop drawing
          }
        });
      }
      if (id == 3) { //If it is a spike trap
        obj.push({
          x: x,
          y: y,
          w: 50, //trap width
          h: 50, //trap height
          spikes: 4,
          height: 15,
          type: "trap", //This object can kill the player
          color: "black", //trap colour

          draw: function() {
            function isOdd(num) { 
              return num % 2;
            }
            shadow.draw(x, y, this.w, this.h);
            //Top of the spikes
            ctx.beginPath();
            ctx.moveTo(x, y);
            for(var i = 0; i < this.spikes * 2; i++){
              if (isOdd(i)) {
                ctx.lineTo(x + this.w / (this.spikes * 2) * i, y - this.height);
              } else {
                ctx.lineTo(x + this.w / (this.spikes * 2) * i, y);
              }
            }
            ctx.lineTo(x + this.w, y);
            //Right side of the spikes
            for(var i = 0; i < this.spikes * 2; i++){
              if (isOdd(i)) {
                ctx.lineTo(x + this.w + this.height, y + this.h / (this.spikes * 2) * i);
              } else {
                ctx.lineTo(x + this.w, y + this.h / (this.spikes * 2) * i);
              }
            }
            ctx.lineTo(x + this.w, y + this.h);
            //Bottom side of the spikes
            for(var i = this.spikes * 2; i > 0; i--){
              if (isOdd(i)) {
                ctx.lineTo(x + this.w / (this.spikes * 2) * i, y + this.h + this.height);
              } else {
                ctx.lineTo(x + this.w / (this.spikes * 2) * i, y + this.h);
              }
            }
            ctx.lineTo(x, y + this.h);
            //Left side of the spikes
            for(var i = this.spikes * 2; i > 0; i--){
              if (isOdd(i)) {
                ctx.lineTo(x - this.height, y + this.h / (this.spikes * 2) * i);
              } else {
                ctx.lineTo(x, y + this.h / (this.spikes * 2) * i);
              }
            }            
            ctx.lineTo(this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.fill(); //Fill in the spikes
            ctx.closePath();
          }
        });
      }
      if (parseInt(id) == 4) { //If it is a textbox
        obj.push({
          x: x,
          y: y,
          type: "text",
          text: id.substring(2),
          fill: "white",
          stroke: "black",

          draw: function() {
          ctx.textAlign = "center"; //Text alignment
            ctx.font = "20px Arial"; //Text font
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = 5;
            ctx.strokeText(this.text, x, y);
            ctx.fillStyle = this.fill; //Text colour
          ctx.fillText(this.text, x, y); //The text itself and it's position
          }
        });
      }
      if (id == 5) { //If it is a spike trap
        obj.push({
          x: x,
          y: y,
          w: 50,
          h: 50,
          color: "#660000",
          active: "#339933",
          type: "checkpoint",

          draw: function() {
          ctx.beginPath();
            ctx.rect(x + 20, y, 10, this.h)
            ctx.fillStyle = "black";
            ctx.fill();
          ctx.closePath();
          ctx.beginPath();
            ctx.arc(x + 25, y + 10,10,0,2*Math.PI);
            ctx.fillStyle = this.color;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
          ctx.closePath();
          }
        });
      }
      if (id == 6) {
        obj.push({
          x: x,
          y: y,
          w: 50,
          h: 50,
          type: "finish",
          collision: true,

          draw: function() {
          shadow.draw(x, y, this.w, this.h);
          ctx.beginPath();
            ctx.rect(this.x, y, this.w / 2, this.h / 2);
            ctx.rect(this.x + this.w / 2, y + this.h / 2, this.w / 2, this.h / 2);
            ctx.fillStyle = "black";
            ctx.fill();
          ctx.closePath();
          ctx.beginPath();
            ctx.rect(x + this.w / 2, y, this.w / 2, this.h / 2);
            ctx.rect(x, y + this.h / 2, this.w / 2, this.h / 2);
            ctx.fillStyle = "lightgray";
            ctx.fill();
          ctx.closePath();
          }
        });
      }
  }
  var shadowOffset,
    shadow = {
        angle: shadowAngle,
        show: shadows,

        draw: function(x, y, w, h) {
          if (this.show) { //If shadows are enabled
            ctx.globalCompositeOperation = "destination-over";
            shadowOffset = (row - y - h) / 45 * this.angle;
            ctx.beginPath();
            if (this.angle >= 0) {
              ctx.moveTo(x + w, y);
              ctx.lineTo(x, y + h);
              ctx.lineTo(x + shadowOffset, row);
              ctx.lineTo(x + shadowOffset + w + h / 45 * this.angle, row);
            } else {
              ctx.moveTo(x , y);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x + w + shadowOffset, row);
              ctx.lineTo(x + shadowOffset - h / 45 * -this.angle, row);
            }
            ctx.fillStyle = 'hsl('+(background.hue-6)+','+(background.saturation+6)+'%,'+(background.lightness-10)+'%)';
            ctx.fill();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over";
          }
        }
      };
});