(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const ie=!1,Y=typeof window<"u"&&typeof window.DEBUG<"u"?window.DEBUG:ie;function s(...o){Y&&console.log(...o)}function x(...o){Y&&console.warn(...o)}function c(...o){console.error(...o)}class E{static SCREENS={IDLE:"idle",WELCOME:"welcome",GALLERY:"gallery",CODE:"code",GAME:"game",SCORE:"score",LEADERBOARD:"leaderboard",QR:"qr"};static TRANSITIONS={idle:["welcome"],welcome:["gallery","idle"],gallery:["code","idle"],code:["game","idle"],game:["score","idle"],score:["leaderboard","game","idle"],leaderboard:["qr","gallery","idle"],qr:["idle"]};constructor(){this.currentScreen=E.SCREENS.IDLE,this.selectedGame=null,this.currentScore=null,this.playerName=null,this.scoreTimestamp=null,this.timeoutHandles={},this.observers=[]}transition(e){if(!Object.values(E.SCREENS).includes(e))return c(`Invalid screen: ${e}`),!1;if(!E.TRANSITIONS[this.currentScreen].includes(e))return c(`Invalid transition: ${this.currentScreen} → ${e}`),!1;this.clearAllTimeouts();const i=this.currentScreen;return this.currentScreen=e,s(`Screen transition: ${i} → ${e}`),this.notifyObservers(e,i),!0}setGame(e){if(!e||!e.id||!e.name||!e.path){c("Invalid game object:",e);return}this.selectedGame=e,s("Selected game:",e.name)}setScore(e){if(typeof e!="number"||e<0){c("Invalid score:",e);return}this.currentScore=e,s("Score set:",e)}setPlayerName(e){if(typeof e!="string"||e.length!==3||!/^[A-Z]{3}$/.test(e)){c("Invalid player name (must be 3 letters A-Z):",e);return}this.playerName=e,s("Player name set:",e)}setScoreTimestamp(e){if(typeof e!="string"){c("Invalid score timestamp:",e);return}this.scoreTimestamp=e,s("Score timestamp set:",e)}reset(){s("Resetting AppState to idle"),this.selectedGame=null,this.currentScore=null,this.playerName=null,this.scoreTimestamp=null,this.clearAllTimeouts();const e=this.currentScreen;this.currentScreen=E.SCREENS.IDLE,this.notifyObservers(E.SCREENS.IDLE,e)}addObserver(e){if(typeof e!="function"){c("Observer must be a function");return}this.observers.push(e),s("Observer registered, total:",this.observers.length)}subscribe(e){if(typeof e!="function")return c("Subscribe callback must be a function"),()=>{};const t=()=>{e(this.getState())};return this.observers.push(t),s("Subscriber registered, total:",this.observers.length),()=>{const i=this.observers.indexOf(t);i>-1&&(this.observers.splice(i,1),s("Subscriber removed, total:",this.observers.length))}}notifyObservers(e,t){this.observers.forEach(i=>{try{i(e,t)}catch(a){c("Observer callback error:",a)}})}setTimeout(e,t,i="default"){this.timeoutHandles[i]&&clearTimeout(this.timeoutHandles[i]),this.timeoutHandles[i]=setTimeout(()=>{s(`Auto-advance timeout: ${this.currentScreen} → ${t}`),this.transition(t),delete this.timeoutHandles[i]},e),s(`Timeout set: ${e}ms → ${t} (ID: ${i})`)}clearTimeout(e){this.timeoutHandles[e]&&(clearTimeout(this.timeoutHandles[e]),delete this.timeoutHandles[e],s(`Cleared timeout: ${e}`))}clearAllTimeouts(){Object.keys(this.timeoutHandles).forEach(e=>{clearTimeout(this.timeoutHandles[e])}),this.timeoutHandles={},s("All timeouts cleared")}getState(){return{currentScreen:this.currentScreen,selectedGame:this.selectedGame,currentScore:this.currentScore,playerName:this.playerName,scoreTimestamp:this.scoreTimestamp}}}class g{static KEY_PREFIX="scores_";static MAX_SCORES=50;constructor(){this.isAvailable=this.testLocalStorage(),this.isAvailable||x("localStorage not available - scores will not persist")}testLocalStorage(){try{const e="__storage_test__";return localStorage.setItem(e,"test"),localStorage.removeItem(e),!0}catch{return!1}}saveScore(e,t,i){if(!this.isAvailable)return x("Cannot save score - localStorage not available"),!1;if(!e||typeof e!="string")return c("Invalid gameName:",e),!1;if(!t||typeof t!="string"||t.length!==3)return c("Invalid playerName (must be 3 letters):",t),!1;if(typeof i!="number"||i<0)return c("Invalid score:",i),!1;try{const a=this.getScores(e);a.push({name:t.toUpperCase(),score:i,date:new Date().toISOString()}),a.sort((l,h)=>h.score-l.score);const n=a.slice(0,g.MAX_SCORES),r=g.KEY_PREFIX+e;return localStorage.setItem(r,JSON.stringify(n)),s(`Score saved: ${e} - ${t}: ${i}`),!0}catch(a){if(a.name==="QuotaExceededError"){x("localStorage quota exceeded, clearing old scores"),this.handleQuotaExceeded(e);try{const n=this.getScores(e);n.push({name:t.toUpperCase(),score:i,date:new Date().toISOString()}),n.sort((h,m)=>m.score-h.score);const r=n.slice(0,g.MAX_SCORES),l=g.KEY_PREFIX+e;return localStorage.setItem(l,JSON.stringify(r)),s("Score saved after quota cleanup"),!0}catch(n){return c("Failed to save score after retry:",n),!1}}else return c("Error saving score:",a),!1}}getScores(e){if(!this.isAvailable)return[];if(!e||typeof e!="string")return c("Invalid gameName:",e),[];try{const t=g.KEY_PREFIX+e,i=localStorage.getItem(t);if(!i)return[];const a=JSON.parse(i);if(!Array.isArray(a))return c("Invalid scores data structure for",e),[];const n=a.filter(r=>r&&typeof r.name=="string"&&typeof r.score=="number"&&typeof r.date=="string");return n.sort((r,l)=>l.score-r.score),n.slice(0,g.MAX_SCORES)}catch(t){return c("Error loading scores:",t),[]}}isHighScore(e,t){if(typeof t!="number"||t<0)return!1;const i=this.getScores(e);if(i.length<g.MAX_SCORES)return!0;const a=i[i.length-1].score;return t>a}clearScores(e){if(!this.isAvailable)return!1;if(!e||typeof e!="string")return c("Invalid gameName:",e),!1;try{const t=g.KEY_PREFIX+e;return localStorage.removeItem(t),s(`Cleared scores for: ${e}`),!0}catch(t){return c("Error clearing scores:",t),!1}}handleQuotaExceeded(e){s("Handling localStorage quota exceeded");try{const t=[];for(let i=0;i<localStorage.length;i++){const a=localStorage.key(i);a&&a.startsWith(g.KEY_PREFIX)&&t.push(a)}t.forEach(i=>{i!==g.KEY_PREFIX+e&&(localStorage.removeItem(i),s("Removed old scores:",i))})}catch(t){c("Error handling quota:",t)}}getAllGames(){if(!this.isAvailable)return[];try{const e=[];for(let t=0;t<localStorage.length;t++){const i=localStorage.key(t);if(i&&i.startsWith(g.KEY_PREFIX)){const a=i.substring(g.KEY_PREFIX.length);e.push(a)}}return e}catch(e){return c("Error getting games:",e),[]}}getTotalScoreCount(){if(!this.isAvailable)return 0;const e=this.getAllGames();let t=0;return e.forEach(i=>{const a=this.getScores(i);t+=a.length}),t}}class se{static KEYS={SPACE:" ",ESCAPE:"Escape",ENTER:"Enter",ARROW_UP:"ArrowUp",ARROW_DOWN:"ArrowDown",ARROW_LEFT:"ArrowLeft",ARROW_RIGHT:"ArrowRight",ONE:"1",TWO:"2",THREE:"3",FOUR:"4",FIVE:"5",SIX:"6",SEVEN:"7",A:"a",D:"d",W:"w",S:"s"};constructor(){this.pressedKeys=new Map,this.justPressedKeys=new Set,this.keyPressCallbacks=[],this.handleKeyDown=this.handleKeyDown.bind(this),this.handleKeyUp=this.handleKeyUp.bind(this),this.startListening(),this.preventDefaults()}startListening(){window.addEventListener("keydown",this.handleKeyDown),window.addEventListener("keyup",this.handleKeyUp),s("InputManager: Listening for keyboard events")}stopListening(){window.removeEventListener("keydown",this.handleKeyDown),window.removeEventListener("keyup",this.handleKeyUp),s("InputManager: Stopped listening")}handleKeyDown(e){const t=e.key;this.isArcadeKey(t)&&e.preventDefault(),this.pressedKeys.has(t)||(this.justPressedKeys.add(t),this.pressedKeys.set(t,!0),this.triggerKeyPressCallbacks(t,e),setTimeout(()=>{this.justPressedKeys.delete(t)},100))}handleKeyUp(e){const t=e.key;this.pressedKeys.delete(t),this.justPressedKeys.delete(t)}isPressed(e){return this.pressedKeys.has(e)}wasJustPressed(e){return this.justPressedKeys.has(e)}onKeyPress(e){if(typeof e!="function"){c("Callback must be a function");return}this.keyPressCallbacks.push(e)}offKeyPress(e){const t=this.keyPressCallbacks.indexOf(e);t>-1&&this.keyPressCallbacks.splice(t,1)}triggerKeyPressCallbacks(e,t){this.keyPressCallbacks.forEach(i=>{try{i(e,t)}catch(a){c("Key press callback error:",a)}})}isArcadeKey(e){return[" ","Escape","Enter","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","1","2","3","4","5","6","7","8","a","A","d","D","w","W","s","S"].includes(e)}getThemeFromKey(e){return["1","2","3","4"].includes(e)?"day":["5","6","7","8"].includes(e)?"night":null}preventDefaults(){window.addEventListener("keydown",e=>{e.key==="F11"&&e.preventDefault()}),window.addEventListener("keydown",e=>{e.ctrlKey&&e.key==="w"&&e.preventDefault()}),window.addEventListener("keydown",e=>{e.key==="Backspace"&&e.target===document.body&&e.preventDefault()}),s("InputManager: Browser defaults prevented (Space handled in handleKeyDown)")}clear(){this.pressedKeys.clear(),this.justPressedKeys.clear()}getPressedKeys(){return Array.from(this.pressedKeys.keys())}destroy(){this.stopListening(),this.keyPressCallbacks=[],this.clear(),s("InputManager: Destroyed")}}class G{static MESSAGE_TYPE="gameOver";static DEFAULT_TIMEOUT=15e3;constructor(){this.gameOverCallbacks=[],this.timeoutHandle=null,this.handleMessage=this.handleMessage.bind(this),this.listening=!1}startListening(e=G.DEFAULT_TIMEOUT){if(this.listening){x("IframeComm already listening");return}window.addEventListener("message",this.handleMessage),this.listening=!0,e>0&&(this.timeoutHandle=setTimeout(()=>{x("IframeComm: Timeout - no gameOver message received"),this.triggerTimeout()},e)),s(`IframeComm: Listening for messages (timeout: ${e}ms)`)}stopListening(){this.listening&&(window.removeEventListener("message",this.handleMessage),this.listening=!1,this.timeoutHandle&&(clearTimeout(this.timeoutHandle),this.timeoutHandle=null),s("IframeComm: Stopped listening"))}handleMessage(e){if(!e.data||typeof e.data!="object")return;const{type:t,payload:i}=e.data;if(t===G.MESSAGE_TYPE){if(!i||typeof i!="object"){c("Invalid gameOver payload:",i);return}if(typeof i.score!="number"||i.score<0){c("Invalid score in gameOver payload:",i.score);return}s("IframeComm: Received gameOver message:",i.score),this.timeoutHandle&&(clearTimeout(this.timeoutHandle),this.timeoutHandle=null),this.sendAcknowledgment(e.source),this.triggerGameOverCallbacks(i.score),this.stopListening()}}sendAcknowledgment(e){try{e.postMessage({type:"acknowledged"},"*"),s("IframeComm: Sent acknowledgment to game")}catch(t){c("Error sending acknowledgment:",t)}}onGameOver(e){if(typeof e!="function"){c("Callback must be a function");return}this.gameOverCallbacks.push(e),s("IframeComm: Game Over callback registered")}offGameOver(e){const t=this.gameOverCallbacks.indexOf(e);t>-1&&this.gameOverCallbacks.splice(t,1)}triggerGameOverCallbacks(e){this.gameOverCallbacks.forEach(t=>{try{t(e)}catch(i){c("Game Over callback error:",i)}})}triggerTimeout(){s("IframeComm: Timeout triggered"),this.gameOverCallbacks.forEach(e=>{try{e(null)}catch(t){c("Game Over timeout callback error:",t)}}),this.stopListening()}reset(){this.stopListening(),this.gameOverCallbacks=[],s("IframeComm: Reset")}destroy(){this.stopListening(),this.gameOverCallbacks=[],s("IframeComm: Destroyed")}}class b{static CONFIG={SOFT_DURATION:3e3,HARD_DURATION:1e4,KEY_M:"m",KEY_N:"n"};constructor(e,t,i,a){if(!e||!t||!i||!a)throw new Error("ResetManager: Missing required dependencies");this.inputManager=e,this.appState=t,this.storageManager=i,this.resetCircleUI=a,this.isResetting=!1,this.resetType=null,this.startTime=null,this.requiredDuration=null,this.animationFrameId=null,this.handleKeyDown=this.handleKeyDown.bind(this),this.handleKeyUp=this.handleKeyUp.bind(this),this.updateProgress=this.updateProgress.bind(this),s("ResetManager: Initialized")}startListening(){window.addEventListener("keydown",this.handleKeyDown),window.addEventListener("keyup",this.handleKeyUp),s("ResetManager: Listening for M and M+N combinations")}stopListening(){window.removeEventListener("keydown",this.handleKeyDown),window.removeEventListener("keyup",this.handleKeyUp),this.isResetting&&this.cancel(),s("ResetManager: Stopped listening")}handleKeyDown(e){const i=e.key.toLowerCase();if(i!==b.CONFIG.KEY_M&&i!==b.CONFIG.KEY_N)return;const a=this.inputManager.isPressed("m")||this.inputManager.isPressed("M")||i==="m",n=this.inputManager.isPressed("n")||this.inputManager.isPressed("N")||i==="n";let r=null;if(a&&n)r="hard";else if(a&&!n){if(this.appState.getState().currentScreen==="idle")return;r="soft"}else return;if(this.isResetting){this.resetType!==r&&(s(`ResetManager: Transition ${this.resetType} → ${r}`),this.cancel(),this.startReset(r));return}this.startReset(r)}handleKeyUp(e){const t=e.key.toLowerCase();if(t!==b.CONFIG.KEY_M&&t!==b.CONFIG.KEY_N||!this.isResetting)return;const i=this.inputManager.isPressed("m")||this.inputManager.isPressed("M"),a=this.inputManager.isPressed("n")||this.inputManager.isPressed("N");if(this.resetType==="soft"&&!i){s("ResetManager: Soft reset canceled (M released)"),this.cancel();return}if(this.resetType==="hard"&&(!i||!a)){s("ResetManager: Hard reset canceled (M or N released)"),this.cancel();return}}startReset(e){this.isResetting=!0,this.resetType=e,this.startTime=Date.now(),this.requiredDuration=e==="soft"?b.CONFIG.SOFT_DURATION:b.CONFIG.HARD_DURATION,this.resetCircleUI.show(e,0),this.updateProgress(),s(`ResetManager: Started ${e} reset (${this.requiredDuration}ms)`)}updateProgress(){if(!this.isResetting)return;const e=this.inputManager.isPressed("m")||this.inputManager.isPressed("M"),t=this.inputManager.isPressed("n")||this.inputManager.isPressed("N");if(this.resetType==="soft"&&!e){s("ResetManager: Soft reset canceled (M released)"),this.cancel();return}if(this.resetType==="hard"&&(!e||!t)){s("ResetManager: Hard reset canceled (M or N released)"),this.cancel();return}const i=Date.now()-this.startTime,a=Math.min(i/this.requiredDuration,1);if(this.resetCircleUI.updateProgress(a),a>=1){s(`ResetManager: ${this.resetType} reset completed`),this.executeReset();return}this.animationFrameId=requestAnimationFrame(this.updateProgress)}executeReset(){const e=this.resetType;this.cancel(),e==="soft"?this.softReset():e==="hard"&&this.hardReset()}softReset(){s("ResetManager: Executing SOFT RESET"),s("- Clearing session data"),s("- Keeping localStorage"),s("- Transitioning to Idle screen"),this.appState.reset(),s("ResetManager: Soft reset complete")}hardReset(){s("ResetManager: Executing HARD RESET"),s("- Clearing ALL localStorage"),s("- Clearing session data"),s("- Transitioning to Idle screen");try{localStorage.clear(),s("ResetManager: localStorage cleared")}catch(e){c("ResetManager: Failed to clear localStorage:",e)}this.appState.reset(),s("ResetManager: Hard reset complete")}cancel(){this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null),this.resetCircleUI.hide(),this.isResetting=!1,this.resetType=null,this.startTime=null,this.requiredDuration=null,s("ResetManager: Reset canceled")}getResetState(){if(!this.isResetting)return{type:null,progress:0,isResetting:!1};const e=Date.now()-this.startTime,t=Math.min(e/this.requiredDuration,1);return{type:this.resetType,progress:t,isResetting:!0}}destroy(){this.stopListening(),this.resetCircleUI.destroy(),s("ResetManager: Destroyed")}}class L{static THEMES={DAY:"day",NIGHT:"night"};constructor(){this.currentTheme=L.THEMES.DAY,this.observers=[],this.applyTheme(this.currentTheme),s("ThemeManager: Initialized with day theme")}setTheme(e){if(!Object.values(L.THEMES).includes(e))throw new Error(`Invalid theme: ${e}. Must be 'day' or 'night'`);this.currentTheme!==e&&(this.currentTheme=e,this.applyTheme(e),this.notifyObservers(e),this.broadcastToIframes(e),s(`ThemeManager: Theme changed to ${e}`))}getTheme(){return this.currentTheme}applyTheme(e){typeof document>"u"||document.documentElement.setAttribute("data-theme",e)}addObserver(e){if(typeof e!="function"){c("ThemeManager: Observer must be a function");return}this.observers.push(e),s(`ThemeManager: Observer added (total: ${this.observers.length})`)}removeObserver(e){const t=this.observers.indexOf(e);t>-1&&(this.observers.splice(t,1),s(`ThemeManager: Observer removed (total: ${this.observers.length})`))}notifyObservers(e){this.observers.forEach(t=>{try{t(e)}catch(i){c("ThemeManager: Observer callback error:",i)}})}broadcastToIframes(e){if(typeof document>"u")return;const t=document.querySelectorAll("iframe");t.forEach(i=>{try{i.contentWindow&&i.contentWindow.postMessage({type:"themeChange",payload:{theme:e}},"*")}catch(a){c("ThemeManager: Failed to broadcast to iframe:",a)}}),s(`ThemeManager: Broadcasted theme '${e}' to ${t.length} iframe(s)`)}}const ae=1200,ne=1920;function y(){const o=ae/ne;if(window.innerWidth>window.innerHeight){const t=Math.floor(window.innerWidth*.95),i=Math.floor(t/o);if(i>window.innerHeight){const a=window.innerHeight;return{containerWidth:Math.floor(a*o),containerHeight:a,aspectRatio:o}}return{containerWidth:t,containerHeight:i,aspectRatio:o}}else{const t=window.innerHeight;return{containerWidth:Math.floor(t*o),containerHeight:t,aspectRatio:o}}}class p{static COLORS={SOFT_RESET:"#4285F4",HARD_RESET:"#EA4335"};static DIMENSIONS={SIZE:60,RADIUS:26,STROKE_WIDTH:4,CIRCUMFERENCE:163.36};constructor(){this.isVisible=!1,this.currentType=null,this.currentProgress=0,this.container=null,this.svg=null,this.circle=null,s("ResetCircleUI: Initialized")}show(e,t=0){if(!e||e!=="soft"&&e!=="hard"){c("ResetCircleUI: Invalid type:",e);return}s(`ResetCircleUI: Show (${e}, ${t})`),this.isVisible=!0,this.currentType=e,this.currentProgress=t,this.container||this.createDOM();const i=e==="soft"?p.COLORS.SOFT_RESET:p.COLORS.HARD_RESET;this.circle.setAttribute("stroke",i),this.updateProgress(t),this.container.style.display="block"}hide(){this.isVisible&&(s("ResetCircleUI: Hide"),this.isVisible=!1,this.currentType=null,this.currentProgress=0,this.container&&(this.container.style.display="none"))}updateProgress(e){if(!this.isVisible||!this.circle)return;const t=Math.max(0,Math.min(1,e));this.currentProgress=t;const i=p.DIMENSIONS.CIRCUMFERENCE*(1-t);this.circle.setAttribute("stroke-dashoffset",i)}createDOM(){this.container=document.createElement("div"),this.container.id="reset-circle-ui",this.container.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      width: ${p.DIMENSIONS.SIZE}px;
      height: ${p.DIMENSIONS.SIZE}px;
      z-index: 9999;
      pointer-events: none;
      display: none;
    `,this.svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svg.setAttribute("width",p.DIMENSIONS.SIZE),this.svg.setAttribute("height",p.DIMENSIONS.SIZE),this.svg.setAttribute("viewBox",`0 0 ${p.DIMENSIONS.SIZE} ${p.DIMENSIONS.SIZE}`),this.circle=document.createElementNS("http://www.w3.org/2000/svg","circle");const e=p.DIMENSIONS.SIZE/2;this.circle.setAttribute("cx",e),this.circle.setAttribute("cy",e),this.circle.setAttribute("r",p.DIMENSIONS.RADIUS),this.circle.setAttribute("fill","none"),this.circle.setAttribute("stroke",p.COLORS.SOFT_RESET),this.circle.setAttribute("stroke-width",p.DIMENSIONS.STROKE_WIDTH),this.circle.setAttribute("stroke-linecap","round"),this.circle.setAttribute("stroke-dasharray",p.DIMENSIONS.CIRCUMFERENCE),this.circle.setAttribute("stroke-dashoffset",p.DIMENSIONS.CIRCUMFERENCE),this.circle.setAttribute("transform",`rotate(-90 ${e} ${e})`),this.svg.appendChild(this.circle),this.container.appendChild(this.svg),document.body.appendChild(this.container),s("ResetCircleUI: DOM created")}getState(){return{isVisible:this.isVisible,type:this.currentType,progress:this.currentProgress}}destroy(){this.container&&(this.container.remove(),this.container=null,this.svg=null,this.circle=null),this.isVisible=!1,this.currentType=null,this.currentProgress=0,s("ResetCircleUI: Destroyed")}}const re=[{id:"space-invaders",name:"Cellfront Command",path:"games/game-wrapper.html?game=space-invaders",key:"1",promptPath:"/games/space-invaders-prompt.txt",thinkingPath:"/games/space-invaders-thinking.txt"},{id:"dino-runner",name:"Automata Rush",path:"games/game-wrapper.html?game=dino-runner",key:"2",promptPath:"/games/dino-runner-prompt.txt",thinkingPath:"/games/dino-runner-thinking.txt"},{id:"breakout",name:"Cellular Shatter",path:"games/game-wrapper.html?game=breakout",key:"3",promptPath:"/games/breakout-prompt.txt",thinkingPath:"/games/breakout-thinking.txt"},{id:"flappy-bird",name:"Hoppy Glider",path:"games/game-wrapper.html?game=flappy-bird",key:"4",promptPath:"/games/flappy-bird-prompt.txt",thinkingPath:"/games/flappy-bird-thinking.txt"},{id:"galaga",name:"Cellship Strike",path:"games/game-wrapper.html?game=galaga",key:"5",promptPath:"/games/galaga-prompt.txt",thinkingPath:"/games/galaga-thinking.txt"},{id:"snake",name:"Trail of Life",path:"games/game-wrapper.html?game=snake",key:"6",promptPath:"/games/snake-prompt.txt",thinkingPath:"/games/snake-thinking.txt"},{id:"asteroids",name:"Debris Automata",path:"games/game-wrapper.html?game=asteroids",key:"7",promptPath:"/games/asteroids-prompt.txt",thinkingPath:"/games/asteroids-thinking.txt"},{id:"life-drop",name:"Conway's GoL",path:"games/game-wrapper.html?game=life-drop",key:"8",promptPath:"/games/life-drop-prompt.txt",thinkingPath:"/games/life-drop-thinking.txt"}],oe=`Develop a 2D arcade shooter titled "Cellfront Command" where the user pilots a ship fixed to the bottom horizontal axis, moving left and right to fire vertical projectiles at an encroaching enemy force. This enemy force is not a set of static sprites but a dynamic "Cellfront Grid" occupying the top 70% of the screen, running a simulation of Conway's Game of Life (B3/S23 rules). The simulation must advance one generation at a slow, fixed "tick" interval (e.g., 0.5 seconds), distinct from the 60 FPS game loop, creating a rhythmic, creeping expansion threat. The player's primary mechanic is to shoot upwards; if a projectile strikes a "live" cell, that cell is instantly set to "dead" for the next generation, allowing the player to prune and shape the enemy structure. To attack the player, every "live" cell on the grid has a small random probability each frame to drop a damaging projectile downwards, creating a chaotic "rain" that erodes the player's destructible shield bunkers and threatens the ship. The game concludes with a victory if the player successfully reduces the live cell count to zero, or a defeat if the player is destroyed or if the simulation evolves a live cell past a visual "Invasion Line" separating the grid from the player's zone. Level progression should introduce increasingly volatile initial cell patterns, such as "guns" or "puffers," to ramp up the difficulty.\r
`,le=`Create a single-player infinite runner game for web browsers titled "Automata Rush" The visual style should be a monochromatic pixel-art aesthetic where the background is a scrolling discrete grid. The player controls a sprite of a small dinosaur that runs in place on the left side of the screen while the grid moves rapidly from right to left. The objective is to survive as long as possible by jumping over or ducking under procedurally generated obstacles derived from cellular automata patterns. Ground-based obstacles, replacing traditional barriers, should be rendered as "Still Life" patterns (such as Blocks, Beehives, or Loaves) that remain static on the grid floor. Aerial obstacles must be dynamic "Oscillator" or "Spaceship" patterns (like Blinkers, Toads, or Gliders) that float at varying heights, requiring the player to crouch or time their jump carefully. The control scheme involves using the Spacebar/Up Arrow to jump (with gravity pulling the dinosaur back down) and the Down Arrow to crouch (reducing the sprite's hit area). As the game progresses, the scrolling speed of the grid accelerates, reducing reaction time. The game ends instantly if any non-transparent pixel of the dinosaur sprite overlaps with a "live" cell of an obstacle pattern, triggering a "Game Over" screen with the final distance score.`,ce=`Develop a 2D arcade physics game titled "Cellular Shatter" where the player controls a horizontal paddle situated at the bottom of the screen, moving strictly along the x-axis to deflect a bouncing projectile upwards into a grid of target blocks. Unlike traditional static targets, the upper portion of the screen is populated by a dynamic grid running Conway's Game of Life algorithm (B3/S23 rules). The projectile behaves as a "sterilizer"; when it collides with a "live" cell, it not only rebounds based on the angle of incidence but also immediately sets that cell's state to "dead." The core challenge lies in the grid's ability to regenerate: the simulation advances one generation at a fixed time interval (e.g., every 3 seconds), potentially causing "dead" areas to fill back in or new structures to spawn if the player is not aggressive enough. The game physics must handle collision detection against a constantly mutating discrete topology, ensuring the ball bounces correctly off the current "live" edges of the automata. The objective is to achieve total extinction (zero live cells on the grid) before the player runs out of lives by letting the projectile fall below the paddle, effectively turning the gameplay into a race against biological exponential growth.`,he=`Create a side-scrolling arcade game titled "Hoppy Glider" set within a strict cellular automata grid environment. The player controls a "Glider"—the famous 5-cell pattern from Conway's Game of Life—which is subjected to simulated gravity, constantly falling downwards within the grid. The core input mechanic is a single "tap" or "click" that imparts an immediate upward vertical impulse, counteracting gravity to keep the Glider afloat. The objective is to navigate the Glider through openings in vertical barrier structures that scroll from right to left. These barriers are constructed from static "dead" or "live" cell columns, resembling the "tubes" or "walls" seen in similar physics games, but rendered as discrete grid blocks. Crucially, the Glider sprite should cycle through its four evolutionary phases (animation frames) based on a timer independent of the game physics, meaning the player's hitbox changes slightly every few milliseconds. A "Game Over" state is triggered if any "live" cell of the player's Glider overlaps with a "live" cell of a wall, or touches the top/bottom boundaries of the grid. The score increments for every vertical barrier successfully passed.\r
`,de=`Create a vertical scrolling shoot-'em-up (shmup) titled "Cellship Strike". The player pilots a ship at the bottom of the screen that flies upward through a constantly generating field of "Agar"—random noise that evolves according to B3/S23 rules. Unlike traditional shooters where enemies are sprites, the enemies here are vast, connected regions of "live" cells. The player's weapon is a "De-Life Beam," a rapid-fire projectile that turns any "live" cell it touches into a "dead" cell. The core loop involves carving a path through dense "biological walls" or destroying specific "Organelles" (dense clusters like "Puffers") that generate trails of debris. The screen scrolls at a constant rate, forcing the player to clear the path ahead or be crushed against the bottom edge. Power-ups should not be icons, but specific "glider" patterns the player can catch; catching one changes the player's weapon mode (e.g., catching a Glider gives a diagonal spread shot). The boss battles are massive "Breeder" patterns that grow quadratically, filling the screen with cells, requiring the player to target the "seed" cells to halt the growth.\r
`,pe=`Develop a grid-based movement game titled "Trail of Life". The player controls a "Head Cell" that moves continuously in one of four cardinal directions. Instead of a static tail, the trail left behind by the player consists of "live" cells that immediately begin to interact with each other according to Conway's Game of Life rules (B3/S23) after a short delay (e.g., 5 ticks). The objective is to collect "Food Cells" (static Blocks) which add length to the initial input trail. The twist is that the tail does not simply follow the head; it evolves, breaks apart, and forms independent "Still Lifes" or "Oscillators" based on the shape of the path the player drew. The player dies if the Head Cell collides with any "live" cell, including their own evolved tail or the grid boundaries. This means a careless turn can create a "glider" that shoots forward and kills the player 10 seconds later. The score is based on the number of generations the player survives and the amount of stable biomass created on the grid.\r
`,me=`Create a multidirectional vector shooter titled "Debris Automata" situated in a toroidal (screen-wrapping) environment. The player pilots a triangular vessel equipped with rotational controls and a thrust mechanic that applies inertia-based movement. The primary antagonists are not static sprites, but drifting "Colony Clusters"—floating, independent grids containing active cellular automata simulations. These clusters move with their own velocity and rotation across the screen, bouncing off each other while internally running Conway's Game of Life rules at a slow, rhythmic tick rate. The player's goal is to fire projectiles that function as "cell deleters." When a projectile strikes a "live" cell within a cluster, that specific cell is destroyed. Crucially, the game must implement a real-time "integrity check" or connected-component algorithm: if a player's shot destroys a connecting cell and severs a cluster into two non-contiguous groups of live cells, the cluster must physically split into two smaller, separate entity objects with divergent momentum vectors. This mimics the fragmentation mechanic of the genre but driven entirely by the topology of the grid. The game ends if the player's ship collides with any "live" cell, and victory is achieved when the screen is entirely void of biological activity.\r
`,ge=`Create a simulation of "Conway's Game of Life". The visual output is a standard orthogonal grid where cells evolve according to the B3/S23 ruleset, but the user's primary point of focus is a high-contrast "Cursor" frame that overlays a single grid coordinate. The joystick input must map to discrete movement, shifting the cursor one cell at a time across the X and Y axes with a slight input repeat delay to allow for precision. "Button 1" acts as the "State Modifier," instantly toggling the specific cell directly beneath the cursor between "live" and "dead" statuses; this input must remain responsive even while the simulation is actively processing generations, allowing for real-time interference. "Button 2" functions as the "Master Clock Toggle," switching the simulation state between "Paused" (static) and "Running" (updating at a fixed tick rate). The UI must clearly visualize the simulation status (e.g., a "PLAY/PAUSE" icon) without obstructing the grid. The objective is to provide a tactile, console-like experience where constructing complex patterns like Glider Guns requires deliberate navigation rather than rapid clicking.\r
`,ue=`My design process for "Cellfront Command" necessitated a rigorous deconstruction of <span class="highlight red">arcade shooter fundamentals</span> followed by a careful synthesis with the mathematical predictability of <span class="highlight green">cellular automata</span>.\r
I began by defining the player's constraints—horizontal-only movement and single-projectile firing—to establish a familiar control scheme that contrasts sharply with the chaotic nature of the enemy. The core challenge was translating the abstract behavior of <span class="highlight blue">Conway’s Game of Life</span> into a tangible adversary; I realized that simply rendering the automata wasn't enough, so I devised the <span class="highlight yellow">"Cellfront Grid" concept</span> where the simulation's evolution speed is decoupled from the rendering framerate.This decoupling is critical, as it transforms the mathematical "generations" into a rhythmic, dread-inducing "march" that the player can anticipate and interrupt. \r
When determining how the enemy attacks, I rejected the idea of specific "gunner" cells in favor of a <span class="highlight red">probabilistic "rain" model</span>; this implies that the sheer biomass of the organism is the threat, making dense clusters inherently more dangerous than sparse ones. I further refined the combat loop by treating the player's bullets as "editing tools" that force state changes (Live to Dead), creating a unique strategic layer where a missed shot is harmless, but a hit fundamentally alters the future topology of the enemy. \r
Finally, I established the "Invasion Line" as the hard failure state to mimic the pressure of an advancing front without needing traditional pathfinding, ensuring the coding AI treats the automata not just as a visual effect, but as the central logic driver for win/loss conditions and difficulty scaling.`,fe=`My design approach for "Automata Rush" focused on creating a deliberate <span class="highlight yellow">visual dissonance</span> by juxtaposing a recognizable, organic protagonist against a strictly mathematical and algorithmic environment. \r
I chose to retain the dinosaur as a distinct sprite—rather than converting it into a cell pattern—to metaphorically represent a <span class="highlight red">biological anomaly</span> attempting to survive within a sterile, computational machine. When translating the mechanics of a standard runner, I had to strictly categorize the Conway's <span class="highlight green">Game of Life patterns</span> by their behavioral properties to fit gameplay archetypes: <span class="highlight blue">"Still Lifes"</span> were selected for ground hazards because their unchanging nature makes them reliable, wall-like barriers, whereas <span class="highlight blue">"Oscillators"</span> were chosen for aerial threats because their shifting shapes introduce a variable hitbox, forcing the player to judge not just the position but the timing of the obstacle's cycle.\r
Technically, I envisioned the world generation not as loading pre-made asset chunks, but as a <span class="highlight red">procedural grid injection</span> system where specific columns are populated with live cells on the rightmost edge based on a randomized difficulty curve. This necessitated a hybrid <span class="highlight red">collision detection system</span> that checks the continuous float position of the sprite against the discrete integer coordinates of the grid, ensuring that the "hitbox" is pixel-perfect to the cell structure. Furthermore, I decided that the "Gliders" should technically move independently of the global scroll speed to mimic the erratic flight patterns of birds in similar games, adding a layer of relative velocity calculation that creates distinct parrying windows for the user.\r
Ultimately, the goal was to use the <span class="highlight green">cellular automata</span> not just as a texture, but as the logic driving the physical boundaries of the play space.`,ye=`My conceptual framework for "Cellular Shatter" involved analyzing the <span class="highlight red">core loop of block-breaking games</span>—systematic destruction of a finite structure—and inverting it by introducing infinite regenerative potential. \r
\r
I realized that the standard static wall of bricks offers no strategic depth beyond aiming, whereas a <span class="highlight green">cellular automata grid</span> acts as an opponent that actively repairs itself. This shifts the player's mindset from "cleaning up" to "containing an outbreak," creating a sense of urgency. I had to carefully consider the <span class="highlight red">collision logic</span>: usually, physics engines rely on pre-baked geometry, but here the "level" changes shape every few seconds. Therefore, I decided the collision system must check the ball's vector against the grid's integer coordinates in real-time, treating every "live" cell as a solid 1x1 AABB (Axis-Aligned Bounding Box) for that specific frame. \r
\r
I also deliberated on the <span class="highlight yellow">evolution tick rate</span>. If it's too fast, the player feels helpless; if too slow, it's trivial. I settled on a medium-paced timer independent of the ball speed, which forces the player to prioritize "keystone" cells—killing a specific cell that supports a whole cluster—thereby leveraging the <span class="highlight blue">underpopulation rule</span> (death by isolation) as a weapon. This transforms the paddle from a passive deflector into a tool for surgical strikes against the <span class="highlight yellow">morphology</span> of the pattern. \r
\r
Finally, I decided that the "win state" must be absolute <span class="highlight green">extinction</span>, reinforcing the theme of fighting a resilient, microscopic organism.`,ve=`My conceptualization for "Hoppy Glider" began by attempting to reconcile <span class="highlight red">physics-based flight mechanics</span> with the rigid, discrete nature of a <span class="highlight green">cellular grid</span>. I identified that the primary friction point would be the movement interpolation; unlike a smooth sprite, a "Glider" pattern exists on integer coordinates. \r
\r
Therefore, I decided the physics engine must calculate float-point positions for smoothness, but "snap" the rendering to the nearest grid square to maintain the <span class="highlight yellow">lo-fi automata aesthetic</span>. Choosing the <span class="highlight blue">"Glider" pattern</span> as the protagonist was deliberate not just for its name, but for the unique mechanical challenge it creates: because the pattern evolves through four distinct shapes, the <span class="highlight red">collision detection</span> becomes dynamic. A gap that is safe to pass through in "Phase 1" of the animation might result in a crash in "Phase 3" if a wing of the Glider clips the wall. This turns the animation cycle into a gameplay variable rather than just visual flair. \r
\r
I also considered the design of the obstacles; rather than using standard sprites, I opted for <span class="highlight blue">"Still Life"</span> structures (like vertical stacks of Blocks) to form the pillars, ensuring the entire world adheres to the logic of <span class="highlight green">Conway's simulation</span>. The difficulty curve is mathematically derived: rather than just speeding up the scroll, the game can decrease the <span class="highlight red">frequency of the gap placement</span> or narrow the aperture between the top and bottom pillars, requiring pixel-perfect impulses. \r
\r
Ultimately, the design intent is to strip a chaotic genre down to its most <span class="highlight yellow">deterministic elements</span>, creating a punishing experience where the player is fighting against both gravity and the geometry of the grid itself.`,xe=`When conceptualizing "Cellship Strike" I wanted to subvert the <span class="highlight red">bullet-hell genre</span> by making the environment itself the bullet. In a standard shooter, space is empty and bullets are the threat; here, the <span class="highlight green">cellular biomass</span> occupies 80% of the screen, creating a claustrophobic "tunneling" experience rather than an open-sky dogfight.\r
\r
My focus was heavily on the <span class="highlight yellow">weaponization of the user's input</span>. I decided that the act of shooting shouldn't just be "damage," but "erasure." This led to the train of thought regarding "regeneration": if the player shoots a hole in a wall, the B3/S23 rules might naturally close that hole up in the next tick if the surrounding density is high (birth condition).\r
\r
This creates a <span class="highlight blue">dynamic difficulty</span> where the player must shoot faster than the simulation can heal, effectively fighting the algorithm's reproduction rate. I also struggled with the "Boss" concept until I realized that in automata theory, "Breeders" are essentially engines of infinite growth. Using a <span class="highlight blue">Quadratic Growth pattern</span> as a boss forces the player to identify the source of the pattern (the "gun") rather than just shooting the mass, adding a tactical puzzle element to the frantic action. \r
\r
The scrolling mechanic was the final piece; it acts as the <span class="highlight red">pressure variable</span>, forcing the player to make snap decisions about which cellular structures are thin enough to blast through and which are too dense to risk engaging.\r
`,we=`My design philosophy for "Trail of Life" was to transform the passive tail of the original game into an active, <span class="highlight red">autonomous threat</span>.\r
\r
I reasoned that in the standard game, the tail is merely an obstacle of geometry; in this version, the tail is a <span class="highlight green">biological hazard</span>. The critical design challenge was the "safe zone" behind the head. If the rules applied instantly, the tail would disintegrate immediately. Therefore, I implemented a <span class="highlight yellow">"gestation delay"</span> logic: the cells dropped by the player are inert for a few frames, acting as a wall, before "waking up" and following the simulation rules.\r
\r
This forces the player to think about the shape they are drawing. A straight line is safe (it evaporates in GofL), but a sharp U-turn creates a 3-cell cluster that might spawn a stable "Block" or an exploding "Pentomino." I realized this turns the game into a spatial puzzle: the player must eat food to grow, but must move in patterns that result in <span class="highlight blue">self-destructing tails</span> to keep the arena clean. \r
\r
The "Game Over" condition becomes emergent; you aren't just trapping yourself in a corner; you are accidentally building a <span class="highlight blue">"Glider Gun"</span> that snipes you from across the map. This shifts the cognitive load from pure reflex to <span class="highlight red">predictive pattern management</span>, where every turn is a seed for future chaos.`,be=`My architectural strategy for "Debris Automata" required solving a complex conflict between <span class="highlight red">continuous vector physics</span> and discrete grid logic.\r
\r
I started by deconstructing the original genre's core loop—breaking large threats into smaller, faster threats—and sought a way to replicate that utilizing <span class="highlight green">cellular morphology</span> rather than arbitrary hit-point thresholds. The breakthrough came in defining the enemies not as a single background layer, but as individual "floating canvases" or <span class="highlight blue">local grids</span>. This allows the clusters to drift and rotate smoothly (sub-pixel movement) while maintaining the rigid integer-based structure required for the automata rules.\r
\r
I spent considerable time mentally simulating the <span class="highlight yellow">"fragmentation logic"</span>: I realized that simply killing a cell wasn't enough; the system needs to run a flood-fill or <span class="highlight red">connected-component analysis</span> after every impact to detect if the "island" of cells has been bisected. If it has, the physics engine must dynamically instantiate a new parent object for the severed chunk, calculating a new trajectory to simulate an explosion. I also emphasized the <span class="highlight yellow">toroidal topology</span> (screen wrapping) because it aligns perfectly with the mathematical boundary conditions often used in academic Conway's Game of Life simulations, creating a seamless, claustrophobic arena.\r
\r
Finally, I decided that the Conway's "Game of Life" rules should act as a <span class="highlight green">passive regeneration mechanic</span>—if the player is too slow to destroy a cluster, the inherent B3/S23 rules might cause a small fragment to grow back into a massive, screen-clogging blockage, punishing hesitation with exponential biological growth.`,Se=`My design philosophy for this specific iteration of "Conway's Game of Life" was centered on the concept of <span class="highlight red">intentional friction</span>. By removing the mouse—which allows for random access and rapid "painting"—and replacing it with a <span class="highlight red">joystick-driven cursor</span>, I fundamentally altered the user's relationship with the grid from that of an omnipotent architect to a localized operator.\r
\r
I had to carefully consider the <span class="highlight yellow">cursor logic</span>; unlike a mouse pointer, a grid cursor exists at a coordinate rather than floating above it, meaning the visualization needs to invert the colors of the cell beneath it or use a thick border to ensure visibility on both "live" and "dead" backgrounds. The decision to allow "Button 1" to function during the active simulation was critical; it transforms the experience from a passive observation into an active <span class="highlight red">feedback loop</span> where the user can frantically try to patch "leaks" in a stabilizing pattern or sabotage a growing structure in real-time.\r
\r
I also mentally simulated the <span class="highlight blue">input handling</span> for the joystick: purely analog movement would be too slippery for a discrete grid, so I mandated a digital "tap-to-move" or "hold-to-scroll" logic to ensure the user can target single pixels with precision. \r
\r
Ultimately, this control scheme recontextualizes the <span class="highlight green">cellular automata simulation</span>, making the act of creating a simple "Blinker" feel like a mechanical accomplishment rather than a trivial click, emphasizing the digital physicality of the <span class="highlight blue">B3/S23 algorithm</span>.`;const W={"space-invaders":{prompt:oe,thinking:ue},"dino-runner":{prompt:le,thinking:fe},breakout:{prompt:ce,thinking:ye},"flappy-bird":{prompt:he,thinking:ve},galaga:{prompt:de,thinking:xe},snake:{prompt:pe,thinking:we},asteroids:{prompt:me,thinking:be},"life-drop":{prompt:ge,thinking:Se}},I=re.map(o=>({...o,prompt:W[o.id].prompt,thinking:W[o.id].thinking}));function Te(o){return I.find(e=>e.id===o)||null}function F(o){return!o||typeof o!="object"?!1:["id","name","path","key","prompt","thinking"].every(t=>o.hasOwnProperty(t)&&o[t]!==null&&o[t]!==void 0&&typeof o[t]=="string"&&o[t].length>0)}class j{static AUTO_CLOSE_TIMEOUT=2e4;constructor(e,t,i,a){this.appState=e,this.inputManager=t,this.storageManager=i,this.onCloseCallback=a,this.element=null,this.isActive=!1,this.selectedGame=null,this.autoCloseTimerHandle=null,this.handleKeyPress=this.handleKeyPress.bind(this)}selectRandomGame(){const e=I.filter(i=>this.storageManager.getScores(i.id).length>0);if(e.length===0)return null;const t=Math.floor(Math.random()*e.length);return e[t]}show(){if(s("IdleLeaderboardShowcaseScreen: Show"),this.selectedGame=this.selectRandomGame(),!this.selectedGame){s("IdleLeaderboardShowcaseScreen: No games with scores - aborting"),this.close();return}s("IdleLeaderboardShowcaseScreen: Showing",this.selectedGame.name),this.isActive=!0,this.createDOM(),this.inputManager.onKeyPress(this.handleKeyPress),this.autoCloseTimerHandle=setTimeout(()=>{s("IdleLeaderboardShowcaseScreen: Auto-close timeout reached"),this.close()},j.AUTO_CLOSE_TIMEOUT),s("IdleLeaderboardShowcaseScreen: Active (20s auto-close)")}createDOM(){const{containerWidth:e,containerHeight:t}=y();this.element=document.createElement("div"),this.element.id="idle-leaderboard-showcase",this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${e}px;
      height: ${t}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 200;
      animation: fadeIn 0.5s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `;const i=document.createElement("div");i.textContent=`Top players of ${this.selectedGame.name}`,i.style.cssText=`
      position: absolute;
      top: clamp(60px, 6.1cqh, 117px);
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      width: 90%;
    `;const a=this.createTable();this.element.appendChild(i),this.element.appendChild(a),document.body.appendChild(this.element),this.addStyles()}createTable(){const e=this.storageManager.getScores(this.selectedGame.id).slice(0,5),t=document.createElement("div");t.style.cssText=`
      position: absolute;
      top: clamp(250px, 29.3cqh, 562px);
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      min-width: 300px;
      max-width: 820px;
    `;const i=document.createElement("div");i.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 clamp(10px, 1.56cqw, 30px);
      margin-bottom: clamp(20px, 4.1cqh, 79px);
    `;const a=document.createElement("div");a.textContent="Rank",a.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(60px, 8cqw, 100px);
    `;const n=document.createElement("div");n.textContent="Score",n.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 1;
      text-align: center;
    `;const r=document.createElement("div");r.textContent="Player",r.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(100px, 12cqw, 150px);
    `,i.appendChild(a),i.appendChild(n),i.appendChild(r);const l=document.createElement("div");if(l.style.cssText=`
      display: flex;
      flex-direction: column;
    `,e.length>0)e.forEach((h,m)=>{const S=this.createRow(h,m+1);l.appendChild(S)});else{const h=document.createElement("div");h.textContent="No scores yet",h.style.cssText=`
        text-align: center;
        font-size: clamp(18px, 1.46cqh, 28px);
        color: var(--text-tertiary);
        padding: clamp(30px, 3.13cqh, 60px) 0;
        font-family: 'Google Sans Flex', sans-serif;
      `,l.appendChild(h)}return t.appendChild(i),t.appendChild(l),t}createRow(e,t){const i=t===1,a=document.createElement("div");a.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: clamp(20px, 2.45cqh, 47px) clamp(10px, 1.56cqw, 30px);
      border-bottom: ${i?"4px":"3px"} solid ${i?"var(--text-primary)":"var(--text-tertiary)"};
    `;const n=document.createElement("div");n.textContent=`${t}`,n.style.cssText=`
      color: ${i?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(60px, 8cqw, 100px);
      text-align: center;
    `;const r=document.createElement("div");r.textContent=e.score.toString(),r.style.cssText=`
      color: ${i?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 1;
      text-align: center;
    `;const l=document.createElement("div");return l.textContent=e.name,l.style.cssText=`
      color: ${i?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(100px, 12cqw, 150px);
    `,a.appendChild(n),a.appendChild(r),a.appendChild(l),a}addStyles(){if(document.getElementById("idle-showcase-styles"))return;const e=document.createElement("style");e.id="idle-showcase-styles",e.textContent=`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #idle-leaderboard-showcase {
        animation: fadeIn 0.5s ease-in;
      }
    `,document.head.appendChild(e)}handleKeyPress(e){s("IdleLeaderboardShowcaseScreen: Key pressed - closing"),this.close()}close(){s("IdleLeaderboardShowcaseScreen: Closing"),this.hide(),this.onCloseCallback&&this.onCloseCallback()}hide(){s("IdleLeaderboardShowcaseScreen: Hide"),this.isActive=!1,this.autoCloseTimerHandle&&(clearTimeout(this.autoCloseTimerHandle),this.autoCloseTimerHandle=null),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),s("IdleLeaderboardShowcaseScreen: Cleaned up")}}class U{static SHOWCASE_INACTIVITY_TIMEOUT=12e4;constructor(e,t,i){this.appState=e,this.inputManager=t,this.storageManager=i,this.element=null,this.titleElement=null,this.promptElement=null,this.isActive=!1,this.showcaseScreen=null,this.showcaseTimerHandle=null,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("IdleScreen: Show"),this.isActive=!0;const{containerWidth:e,containerHeight:t}=y();this.element=document.createElement("div"),this.element.id="idle-screen",this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${e}px;
      height: ${t}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      z-index: 100;
      container-type: size; /* Enable Container Queries */
    `;const i=document.createElement("div");i.style.cssText=`
      width: clamp(300px, 61%, 732px);
      min-height: clamp(200px, 24.3cqh, 467px);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: clamp(20px, 5cqh, 96px);
    `,this.titleElement=document.createElement("div"),this.titleElement.textContent=`Conway's
Arcade`,this.titleElement.style.cssText=`
      width: 100%;
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(48px, 7cqh, 134px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      white-space: pre-line;
      word-wrap: break-word;
    `,i.appendChild(this.titleElement);const a=document.createElement("div");a.style.cssText=`
      width: clamp(300px, 53.5%, 642px);
      min-height: clamp(80px, 11.5cqh, 221px);
      display: flex;
      justify-content: center;
      align-items: center;
    `,this.promptElement=document.createElement("div"),this.promptElement.textContent="Press any button to start",this.promptElement.style.cssText=`
      width: 100%;
      text-align: center;
      color: var(--text-secondary);
      font-size: clamp(24px, 2.9cqh, 55px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      word-wrap: break-word;
    `,a.appendChild(this.promptElement),this.element.appendChild(i),this.element.appendChild(a),document.body.appendChild(this.element),this.inputManager.onKeyPress(this.handleKeyPress),this.startShowcaseTimer(),s("IdleScreen: Active (2min showcase timer)")}startShowcaseTimer(){this.showcaseTimerHandle&&clearTimeout(this.showcaseTimerHandle),this.showcaseTimerHandle=setTimeout(()=>{s("IdleScreen: Showcase timer triggered - showing leaderboard"),this.showShowcase()},U.SHOWCASE_INACTIVITY_TIMEOUT)}showShowcase(){this.showcaseScreen||(this.titleElement&&(this.titleElement.style.visibility="hidden"),this.promptElement&&(this.promptElement.style.visibility="hidden"),this.showcaseScreen=new j(this.appState,this.inputManager,this.storageManager,()=>this.onShowcaseClosed()),this.showcaseScreen.show())}onShowcaseClosed(){this.titleElement&&(this.titleElement.style.visibility="visible"),this.promptElement&&(this.promptElement.style.visibility="visible"),this.showcaseScreen=null,this.startShowcaseTimer(),s("IdleScreen: Showcase closed - timer restarted")}hide(){s("IdleScreen: Hide"),this.isActive=!1,this.showcaseTimerHandle&&(clearTimeout(this.showcaseTimerHandle),this.showcaseTimerHandle=null),this.showcaseScreen&&(this.showcaseScreen.hide(),this.showcaseScreen=null),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.element=null,this.titleElement=null,this.promptElement=null,s("IdleScreen: Cleaned up")}handleKeyPress(e){this.showcaseScreen&&this.showcaseScreen.isActive||(this.startShowcaseTimer(),(e===" "||e==="n"||e==="N")&&(s(`IdleScreen: Key "${e}" pressed - advancing to Welcome`),this.appState.transition("welcome")))}}class O{static INACTIVITY_TIMEOUT=3e4;constructor(e,t){this.appState=e,this.inputManager=t,this.element=null,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("WelcomeScreen: Show");const{containerWidth:e,containerHeight:t}=y();if(this.element=document.createElement("div"),this.element.id="welcome-screen",this.element.innerHTML=`
      <div class="welcome-container">
        <h1 class="welcome-title">Welcome to<br/>Conway's Arcade</h1>
        <div class="welcome-subtitle">
          <span class="line line-1">This is where <span class="highlight green">prompts</span> become <span class="highlight yellow">games</span>,</span>
          <span class="line line-2">patterns become <span class="highlight red">play</span>, and AI</span>
          <span class="line line-3">becomes pure <span class="highlight blue">arcade energy</span>.</span>
        </div>
      </div>
    `,this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${e}px;
      height: ${t}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding-top: clamp(48px, 5cqh, 96px);
      z-index: 100;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `,document.body.appendChild(this.element),!document.getElementById("welcome-screen-styles")){const i=document.createElement("style");i.id="welcome-screen-styles",i.textContent=`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-container {
          width: 100%;
          padding: 0 clamp(40px, 9cqw, 108px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
        }

        .welcome-title {
          font-size: clamp(36px, 5cqh, 95px);
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 clamp(32px, 4cqh, 76px) 0;
          line-height: 1;
          opacity: 0;
          animation: slideUp 0.8s ease-out 0.2s forwards;
        }

        .welcome-subtitle {
          font-size: clamp(36px, 5cqh, 95px);
          font-weight: 500;
          line-height: 1;
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .welcome-subtitle .line {
          display: block;
          opacity: 0;
        }

        .welcome-subtitle .line-1 {
          animation: slideUp 0.8s ease-out 0.6s forwards;
        }

        .welcome-subtitle .line-2 {
          animation: slideUp 0.8s ease-out 0.9s forwards;
        }

        .welcome-subtitle .line-3 {
          animation: slideUp 0.8s ease-out 1.2s forwards;
        }

        .welcome-subtitle .highlight.green {
          color: var(--highlight-green);
        }

        .welcome-subtitle .highlight.yellow {
          color: var(--highlight-yellow);
        }

        .welcome-subtitle .highlight.red {
          color: var(--highlight-red);
        }

        .welcome-subtitle .highlight.blue {
          color: var(--highlight-blue);
        }
      `,document.head.appendChild(i)}this.inputManager.onKeyPress(this.handleKeyPress),this.appState.setTimeout(O.INACTIVITY_TIMEOUT,"idle","welcome-inactivity"),s("WelcomeScreen: Active (30s inactivity timer)")}hide(){s("WelcomeScreen: Hide"),this.appState.clearTimeout("welcome-inactivity"),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),s("WelcomeScreen: Cleaned up")}handleKeyPress(e){this.appState.clearTimeout("welcome-inactivity"),this.appState.setTimeout(O.INACTIVITY_TIMEOUT,"idle","welcome-inactivity"),(e===" "||e==="n"||e==="N")&&(s("WelcomeScreen: Key pressed - advancing to Gallery"),this.appState.transition("gallery"))}}class R{static INACTIVITY_TIMEOUT=3e4;constructor(e,t){this.appState=e,this.inputManager=t,this.element=null,this.cardsContainer=null,this.leftArrow=null,this.rightArrow=null,this.currentIndex=0,this.isAnimating=!1,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("GalleryScreen: Show");const{containerWidth:e,containerHeight:t}=y();this.element=document.createElement("div"),this.element.id="gallery-screen",this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${e}px;
      height: ${t}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 100;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `;const i=document.createElement("div");i.innerHTML=`<span style="font-family: 'Google Sans Flex', sans-serif; font-weight: 500;">Prompt Library</span>`,i.style.cssText=`
      position: absolute;
      top: clamp(60px, 6.1cqh, 117px);
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(32px, 3.65cqh, 70px);
      font-weight: 500;
      line-height: 1;
      z-index: 10;
    `,this.cardsContainer=document.createElement("div"),this.cardsContainer.style.cssText=`
      position: absolute;
      top: 58%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: clamp(600px, 75cqh, 1440px);
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 2000px;
    `,I.forEach((n,r)=>{const l=this.createCard(n,r);this.cardsContainer.appendChild(l)});const a=document.createElement("div");a.style.cssText=`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 88.4%;
      min-width: 500px;
      max-width: 1061px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      pointer-events: none;
    `,this.leftArrow=this.createArrow("left"),this.rightArrow=this.createArrow("right"),this.leftArrow.addEventListener("click",()=>this.navigate("left")),this.rightArrow.addEventListener("click",()=>this.navigate("right")),a.appendChild(this.leftArrow),a.appendChild(this.rightArrow),this.element.appendChild(i),this.element.appendChild(this.cardsContainer),this.element.appendChild(a),document.body.appendChild(this.element),this.addStyles(),this.updateCarousel(!1),this.updateArrowVisibility(),this.inputManager.onKeyPress(this.handleKeyPress),this.appState.setTimeout(R.INACTIVITY_TIMEOUT,"idle","gallery-inactivity"),s("GalleryScreen: Active (30s inactivity timer)")}createCard(e,t){const i=document.createElement("div");i.className="gallery-card",i.dataset.index=t;const a=document.createElement("div");a.className="gallery-card-title",a.textContent=e.name,a.style.cssText=`
      text-align: center;
      color: var(--text-secondary);
      font-size: clamp(20px, 2.12cqh, 40.67px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      margin-bottom: clamp(30px, 3.44cqh, 66px);
    `;const n=document.createElement("div");n.className="gallery-card-prompt-container",n.style.cssText=`
      position: relative;
      max-height: clamp(450px, 54cqh, 1036px);
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
    `;const r=document.createElement("div");return r.className="gallery-card-prompt",r.textContent=e.prompt,r.style.cssText=`
      text-align: justify;
      color: var(--text-primary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Mono', monospace;
      font-weight: 500;
      line-height: 1;
      white-space: pre-line;
      word-wrap: break-word;
    `,n.appendChild(r),i.appendChild(a),i.appendChild(n),i.style.cssText=`
      position: absolute;
      width: 70%;
      min-width: 350px;
      max-width: 840px;
      padding: clamp(30px, 3.28cqh, 63px) clamp(30px, 3.65cqh, 70px) clamp(40px, 4.53cqh, 87px) clamp(30px, 3.65cqh, 70px);
      transition: all 0.3s ease;
      transform-style: preserve-3d;
    `,i}createArrow(e){const t=document.createElement("img");return t.className=`gallery-arrow gallery-arrow-${e}`,t.src="img/arrow.png",t.style.cssText=`
      height: clamp(50px, 6.05cqh, 116.1px);
      cursor: pointer;
      pointer-events: auto;
      transition: filter 0.2s ease;
      filter: brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%);
      ${e==="left"?"transform: scaleX(-1);":""}
    `,t.addEventListener("mouseenter",()=>{t.style.filter="brightness(0) saturate(100%) invert(42%) sepia(98%) saturate(1721%) hue-rotate(203deg) brightness(100%) contrast(95%)"}),t.addEventListener("mouseleave",()=>{t.style.filter="brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%)"}),t}addStyles(){if(document.getElementById("gallery-v2-styles"))return;const e=document.createElement("style");e.id="gallery-v2-styles",e.textContent=`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #gallery-screen {
        animation: fadeIn 0.3s ease-in;
      }
    `,document.head.appendChild(e)}updateCarousel(e=!0){this.cardsContainer.querySelectorAll(".gallery-card").forEach((i,a)=>{const n=a-this.currentIndex;n===0?(i.style.transform="translateX(-50%) scale(1) translateZ(0)",i.style.left="50%",i.style.opacity="1",i.style.zIndex="3",i.style.pointerEvents="auto"):n===-1?(i.style.transform="translateX(-50%) scale(0.85) translateZ(-200px) rotateY(25deg)",i.style.left="-5%",i.style.opacity="0.35",i.style.zIndex="2",i.style.pointerEvents="none"):n===1?(i.style.transform="translateX(-50%) scale(0.85) translateZ(-200px) rotateY(-25deg)",i.style.left="105%",i.style.opacity="0.35",i.style.zIndex="2",i.style.pointerEvents="none"):n<-1?(i.style.transform="translateX(-50%) scale(0.7) translateZ(-400px)",i.style.left=`${-100*Math.abs(n)}%`,i.style.opacity="0",i.style.zIndex="1",i.style.pointerEvents="none"):(i.style.transform="translateX(-50%) scale(0.7) translateZ(-400px)",i.style.left=`${100+100*n}%`,i.style.opacity="0",i.style.zIndex="1",i.style.pointerEvents="none"),e||(i.style.transition="none",setTimeout(()=>{i.style.transition="all 0.3s ease"},50))})}updateArrowVisibility(){this.leftArrow&&(this.leftArrow.style.visibility=this.currentIndex===0?"hidden":"visible"),this.rightArrow&&(this.rightArrow.style.visibility=this.currentIndex===I.length-1?"hidden":"visible")}navigate(e){this.isAnimating||(this.isAnimating=!0,e==="left"?this.currentIndex=Math.max(0,this.currentIndex-1):e==="right"&&(this.currentIndex=Math.min(I.length-1,this.currentIndex+1)),this.updateCarousel(),this.updateArrowVisibility(),setTimeout(()=>{this.isAnimating=!1},300),s(`GalleryScreen: Navigated to game ${this.currentIndex+1}`))}hide(){s("GalleryScreen: Hide"),this.appState.clearTimeout("gallery-inactivity"),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null,this.cardsContainer=null,this.leftArrow=null,this.rightArrow=null),s("GalleryScreen: Cleaned up")}handleKeyPress(e){this.appState.clearTimeout("gallery-inactivity"),this.appState.setTimeout(R.INACTIVITY_TIMEOUT,"idle","gallery-inactivity"),e==="ArrowLeft"||e==="a"||e==="A"?this.navigate("left"):e==="ArrowRight"||e==="d"||e==="D"?this.navigate("right"):(e===" "||e==="n"||e==="N")&&this.confirmSelection()}confirmSelection(){const e=I[this.currentIndex];s(`GalleryScreen: Confirmed selection - ${e.name}`),this.appState.setGame(e),this.appState.transition("code")}}class Ce{constructor(e,t){this.appState=e,this.inputManager=t,this.element=null,this.currentText="",this.targetText="",this.currentChar=0,this.intervalHandle=null,this.timeoutHandle=null,this.handleKeyPress=this.handleKeyPress.bind(this)}async show(){s("CodeAnimationScreen: Show");const e=this.appState.getState().selectedGame;if(!e){c("No game selected"),this.appState.reset();return}const t=Te(e.id);if(!t||!t.thinking){c(`No thinking text found for game: ${e.id}`),this.appState.reset();return}this.targetText=t.thinking,this.element=document.createElement("div"),this.element.id="code-screen",this.element.innerHTML=`
      <div class="code-container">
        <div class="code-display">
          <div class="code-content"></div>
        </div>
      </div>
    `;const{containerWidth:i,containerHeight:a}=y();if(this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${i}px;
      height: ${a}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: var(--code-bg);
      z-index: 100;
      animation: fadeIn 0.3s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `,document.body.appendChild(this.element),!document.getElementById("code-screen-styles")){const n=document.createElement("style");n.id="code-screen-styles",n.textContent=`
        .code-container {
          padding: clamp(80px, 10.3cqh, 198px) clamp(30px, 5cqw, 60px);
          font-family: 'Google Sans Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .code-display {
          flex: 1;
          overflow-y: auto;
          /* Hide scrollbar for all browsers */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .code-display::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .code-content {
          font-size: clamp(18px, 2.34cqh, 45px);
          line-height: 1.2;
          color: var(--code-text);
          white-space: pre-wrap;
          word-wrap: break-word;
          font-weight: 400;
        }

        .code-content .highlight {
          font-weight: 600;
        }

        .code-content .highlight.red {
          color: var(--highlight-red);
        }

        .code-content .highlight.green {
          color: var(--highlight-green);
        }

        .code-content .highlight.blue {
          color: var(--highlight-blue);
        }

        .code-content .highlight.yellow {
          color: var(--highlight-yellow);
        }

        .code-content .cursor {
          display: inline-block;
          width: 0.6em;
          height: 1em;
          background: var(--code-text);
          animation: blink 0.8s infinite;
          vertical-align: text-bottom;
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `,document.head.appendChild(n)}this.startTypewriter(),this.inputManager.onKeyPress(this.handleKeyPress),s("CodeAnimationScreen: Active")}hide(){s("CodeAnimationScreen: Hide"),this.intervalHandle&&(clearInterval(this.intervalHandle),this.intervalHandle=null),this.timeoutHandle&&(clearTimeout(this.timeoutHandle),this.timeoutHandle=null),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),this.currentText="",this.targetText="",this.currentChar=0,s("CodeAnimationScreen: Cleaned up")}startTypewriter(){this.currentChar=0,this.currentText="",this.intervalHandle=setInterval(()=>{if(this.currentChar<this.targetText.length){const e=this.targetText[this.currentChar];if(e==="<"){const i=this.targetText.indexOf(">",this.currentChar);i!==-1?(this.currentText+=this.targetText.substring(this.currentChar,i+1),this.currentChar=i+1):(this.currentText+=e,this.currentChar++)}else this.currentText+=e,this.currentChar++;const t=this.element.querySelector(".code-content");if(t){t.innerHTML=this.currentText+'<span class="cursor"></span>';const i=this.element.querySelector(".code-display");i&&(i.scrollTop=i.scrollHeight)}}else clearInterval(this.intervalHandle),this.intervalHandle=null,this.timeoutHandle=setTimeout(()=>{const e=this.element.querySelector(".code-content");e&&(e.innerHTML=this.currentText),setTimeout(()=>{this.advanceToGame()},500)},1e3)},5)}handleKeyPress(e){(e===" "||e==="n"||e==="N")&&(s("CodeAnimationScreen: Key pressed - skipping animation"),this.advanceToGame())}advanceToGame(){s("CodeAnimationScreen: Advancing to Game"),this.appState.transition("game")}}class K{static MAX_GAME_TIME=1800*1e3;constructor(e,t,i,a){this.appState=e,this.inputManager=t,this.iframeComm=i,this.themeManager=a,this.element=null,this.iframe=null,this.gameTimeoutHandle=null,this.gameMessageHandler=null,this.themeObserverCleanup=null,this.handleKeyPress=this.handleKeyPress.bind(this),this.handleGameOver=this.handleGameOver.bind(this),this.handleThemeChange=this.handleThemeChange.bind(this)}show(){s("GameScreen: Show");const e=this.appState.getState().selectedGame;if(!F(e)){c("GameScreen: Invalid or missing game"),this.appState.reset();return}this.element=document.createElement("div"),this.element.id="game-screen";const{containerWidth:t,containerHeight:i}=y();this.iframe=document.createElement("iframe");const a=this.themeManager.getTheme(),n=e.path.includes("?")?"&":"?";this.iframe.src=`${e.path}${n}theme=${a}`,this.iframe.tabIndex=0,this.iframe.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${t}px;
      height: ${i}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      border: none;
      object-fit: contain;
      z-index: 100;
      container-type: size; /* Enable Container Queries */
    `,this.iframe.onload=()=>{try{this.iframe.focus(),this.iframe.contentWindow&&this.iframe.contentWindow.focus(),this.iframe.click(),s("GameScreen: Iframe focused - keyboard events ready"),s("GameScreen: Active element:",document.activeElement)}catch(r){x("GameScreen: Could not auto-focus iframe:",r)}},this.iframe.addEventListener("click",()=>{this.iframe.focus(),this.iframe.contentWindow&&this.iframe.contentWindow.focus()}),this.element.appendChild(this.iframe),this.element.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-primary);
      z-index: 99;
      overflow: hidden;
    `,document.body.appendChild(this.element),this.iframeComm.onGameOver(this.handleGameOver),this.iframeComm.startListening(K.MAX_GAME_TIME),this.inputManager.stopListening(),s("GameScreen: InputManager disabled - iframe has full keyboard control"),this.gameMessageHandler=r=>{if(r.origin===window.location.origin){if(r.data&&r.data.type==="exitGame"){s("GameScreen: Received exitGame message from iframe"),this.exitToIdle();return}if(r.data&&r.data.type==="themeChangeFromGame"){const l=r.data.payload?.theme;(l==="day"||l==="night")&&(s(`GameScreen: Received themeChangeFromGame message - changing to ${l}`),this.themeManager.setTheme(l));return}}},window.addEventListener("message",this.gameMessageHandler),this.gameTimeoutHandle=setTimeout(()=>{x("GameScreen: Game timeout reached (30 min)"),this.exitToIdle()},K.MAX_GAME_TIME),this.themeManager.addObserver(this.handleThemeChange),s(`GameScreen: Loading ${e.name}`)}handleThemeChange(e){s(`GameScreen: Theme changed to ${e} - notifying game`),this.sendThemeToGame(e)}sendThemeToGame(e){this.iframe&&this.iframe.contentWindow&&(this.iframe.contentWindow.postMessage({type:"themeChange",payload:{theme:e}},"*"),s(`GameScreen: Sent theme "${e}" to game`))}hide(){s("GameScreen: Hide"),this.iframeComm.stopListening(),this.iframeComm.offGameOver(this.handleGameOver),this.themeManager&&this.themeManager.removeObserver(this.handleThemeChange),this.inputManager.startListening(),s("GameScreen: InputManager re-enabled"),this.gameMessageHandler&&(window.removeEventListener("message",this.gameMessageHandler),this.gameMessageHandler=null),this.gameTimeoutHandle&&(clearTimeout(this.gameTimeoutHandle),this.gameTimeoutHandle=null),this.element&&(this.element.remove(),this.element=null,this.iframe=null),s("GameScreen: Cleaned up")}handleGameOver(e){if(s("GameScreen: Game Over received, score:",e),e===null){x("GameScreen: No score received (timeout)"),this.exitToIdle();return}if(typeof e!="number"||e<0){c("GameScreen: Invalid score:",e),this.exitToIdle();return}this.appState.setScore(e),this.appState.transition("score")}handleKeyPress(e){x("GameScreen.handleKeyPress should not be called (InputManager disabled)")}exitToIdle(){s("GameScreen: Exiting to Idle"),this.appState.reset()}}class D{static INACTIVITY_TIMEOUT=3e4;constructor(e,t,i){this.appState=e,this.inputManager=t,this.storageManager=i,this.element=null,this.letters=["A","A","A"],this.currentPosition=0,this.currentScreen=1,this.autoAdvanceTimeout=null,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("ScoreEntryScreen: Show");const e=this.appState.getState(),t=e.currentScore,i=e.selectedGame;if(t===null||!F(i)){c("ScoreEntryScreen: Invalid score or game"),this.appState.reset();return}this.letters=["A","A","A"],this.currentPosition=0,this.currentScreen=1,this.element=document.createElement("div"),this.element.id="score-entry-screen";const{containerWidth:a,containerHeight:n}=y();if(this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${a}px;
      height: ${n}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 100;
      animation: fadeIn 0.5s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `,document.body.appendChild(this.element),!document.getElementById("score-entry-screen-styles")){const r=document.createElement("style");r.id="score-entry-screen-styles",r.textContent=`
        .score-entry-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-family: 'Google Sans Flex', Arial, sans-serif;
        }

        .score-entry-gameover {
          font-size: clamp(48px, 6.25cqh, 120px);
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          line-height: 1;
          text-align: center;
        }

        .score-entry-container-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: clamp(60px, 7.6cqh, 146px) clamp(45px, 9cqw, 108px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
          animation: fadeIn 0.5s ease-in;
        }

        .score-entry-header {
          font-size: clamp(28px, 4.69cqh, 90px);
          font-weight: 500;
          line-height: 1;
          white-space: nowrap;
          text-align: center;
          width: 100%;
        }

        .score-entry-header-text {
          color: var(--text-primary);
        }

        .score-entry-header-highlight {
          color: var(--highlight-green);
        }

        .score-entry-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(21px, 2.68cqh, 51px);
        }

        .score-entry-number {
          font-size: clamp(94px, 12.19cqh, 234px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
          text-align: center;
        }

        .score-entry-game-name {
          font-size: clamp(24px, 3.66cqh, 70px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
          text-align: center;
          white-space: nowrap;
        }

        .score-entry-continue {
          font-size: clamp(16px, 2.12cqh, 41px);
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          width: 100%;
          line-height: 1;
        }

        .score-entry-container-name {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: clamp(60px, 7.6cqh, 146px) clamp(45px, 9.4cqw, 113px);
          font-family: 'Google Sans Flex', Arial, sans-serif;
          animation: fadeIn 0.5s ease-in;
        }

        .score-entry-letters-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(20px, 4cqw, 50px);
          flex: 1;
        }

        .score-entry-letter-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(21px, 2.68cqh, 51px);
        }

        .score-entry-letter-char {
          font-size: clamp(80px, 12.19cqh, 234px);
          font-weight: 400;
          color: var(--text-tertiary);
          line-height: 1;
          text-align: center;
          transition: color 0.3s ease, font-weight 0.3s ease;
        }

        .score-entry-letter-char.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        .score-entry-letter-line {
          width: clamp(120px, 22cqw, 250px);
          height: 0;
          border: none;
          border-top: clamp(4px, 0.57cqh, 11px) solid var(--text-primary);
          position: relative;
        }

        .score-entry-letter-line::after {
          content: '';
          position: absolute;
          top: clamp(21px, 2.68cqh, 51px);
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: clamp(15px, 2cqh, 40px) solid transparent;
          border-right: clamp(15px, 2cqh, 40px) solid transparent;
          border-bottom: clamp(20px, 2.6cqh, 50px) solid var(--text-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .score-entry-letter-box:has(.active) .score-entry-letter-line::after {
          opacity: 1;
        }

        .score-entry-footer {
          position: absolute;
          bottom: clamp(80px, 10cqh, 192px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          white-space: nowrap;
        }

        .score-entry-play-again {
          color: #7D7D7D;
          font-size: clamp(18px, 2.08cqh, 40px);
          font-family: 'Google Sans Flex', sans-serif;
          font-weight: 500;
          text-decoration: underline;
          line-height: 1;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,document.head.appendChild(r)}this.showCurrentScreen(),this.inputManager.onKeyPress(this.handleKeyPress),s("ScoreEntryScreen: Active")}showCurrentScreen(){if(!this.element)return;const e=this.appState.getState(),t=e.currentScore;if(this.autoAdvanceTimeout&&(clearTimeout(this.autoAdvanceTimeout),this.autoAdvanceTimeout=null),this.currentScreen===1){this.element.innerHTML=`
        <div class="score-entry-container">
          <h1 class="score-entry-gameover">Game over</h1>
        </div>
        <div class="score-entry-footer">
          <div class="score-entry-play-again">Play again</div>
        </div>
      `;const i=this.element.querySelector(".score-entry-play-again");i&&i.addEventListener("click",()=>{this.playAgain()}),this.autoAdvanceTimeout=setTimeout(()=>{this.advanceScreen()},5e3)}else if(this.currentScreen===2){const i=e.selectedGame?e.selectedGame.name:"Game";this.element.innerHTML=`
        <div class="score-entry-container-score">
          <div class="score-entry-header">
            <span class="score-entry-header-text">Here's your final </span><span class="score-entry-header-highlight">score:</span>
          </div>
          <div class="score-entry-card">
            <div class="score-entry-number">${t.toString()}</div>
            <div class="score-entry-game-name">${i}</div>
          </div>
          <div style="visibility: hidden; height: clamp(16px, 2.12cqh, 41px);"></div>
        </div>
      `,this.autoAdvanceTimeout=setTimeout(()=>{this.advanceScreen()},3e3)}else this.currentScreen===3&&(this.element.innerHTML=`
        <div class="score-entry-container-name">
          <div class="score-entry-header">
            <span class="score-entry-header-text">Write your </span><span class="score-entry-header-highlight">name</span>
          </div>
          <div class="score-entry-letters-row">
            ${this.letters.map((i,a)=>`
              <div class="score-entry-letter-box">
                <div class="score-entry-letter-char ${a===this.currentPosition?"active":""}">${i}</div>
                <div class="score-entry-letter-line"></div>
              </div>
            `).join("")}
          </div>
          <div style="visibility: hidden; height: clamp(16px, 2.12cqh, 41px);"></div>
        </div>
      `,this.appState.setTimeout(D.INACTIVITY_TIMEOUT,"idle","score-entry-inactivity"))}advanceScreen(){this.currentScreen<3&&(this.currentScreen++,this.showCurrentScreen())}playAgain(){s("ScoreEntryScreen: Play again selected - restarting game"),this.appState.transition("game")}hide(){s("ScoreEntryScreen: Hide"),this.appState.clearTimeout("score-entry-inactivity"),this.autoAdvanceTimeout&&(clearTimeout(this.autoAdvanceTimeout),this.autoAdvanceTimeout=null),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),s("ScoreEntryScreen: Cleaned up")}handleKeyPress(e){this.currentScreen===3&&(this.appState.clearTimeout("score-entry-inactivity"),this.appState.setTimeout(D.INACTIVITY_TIMEOUT,"idle","score-entry-inactivity")),e===" "||e==="n"||e==="N"?this.currentScreen===1?(this.autoAdvanceTimeout&&(clearTimeout(this.autoAdvanceTimeout),this.autoAdvanceTimeout=null),this.playAgain()):this.currentScreen===2?(this.autoAdvanceTimeout&&(clearTimeout(this.autoAdvanceTimeout),this.autoAdvanceTimeout=null),this.advanceScreen()):this.nextLetter():this.currentScreen===3&&(e==="ArrowUp"||e==="w"||e==="W"?this.changeLetter(1):e==="ArrowDown"||e==="s"||e==="S"?this.changeLetter(-1):e==="ArrowRight"||e==="d"||e==="D"?this.nextLetter():(e==="ArrowLeft"||e==="a"||e==="A")&&this.previousLetter())}changeLetter(e){let a=this.letters[this.currentPosition].charCodeAt(0)+e;a<65&&(a=90),a>90&&(a=65),this.letters[this.currentPosition]=String.fromCharCode(a),this.updateDisplay()}nextLetter(){this.currentPosition<2?(this.currentPosition++,this.updateDisplay()):this.confirmName()}previousLetter(){this.currentPosition>0&&(this.currentPosition--,this.updateDisplay())}updateDisplay(){if(!this.element)return;this.element.querySelectorAll(".score-entry-letter-char").forEach((t,i)=>{t.textContent=this.letters[i],i===this.currentPosition?t.classList.add("active"):t.classList.remove("active")})}confirmName(){const e=this.letters.join("");s(`ScoreEntryScreen: Confirmed name - ${e}`),this.appState.setPlayerName(e);const t=this.appState.getState(),i=new Date().toISOString();if(this.storageManager.saveScore(t.selectedGame.id,e,t.currentScore)){s("Score saved successfully");const n=this.storageManager.getScores(t.selectedGame.id);s("ScoreEntryScreen DEBUG:"),s("- Looking for:",e,t.currentScore),s("- Timestamp before save:",i),s("- All scores:",n.map(l=>({name:l.name,score:l.score,date:l.date})));const r=n.filter(l=>l.name===e&&l.score===t.currentScore);if(s("- Matching entries:",r),r.length>0){const l=r.reduce((h,m)=>new Date(m.date)>new Date(h.date)?m:h);this.appState.setScoreTimestamp(l.date),s("✓ Score timestamp captured:",l.date)}else c("✗ Could not find matching score entry"),s("- This means the score was saved but immediately discarded (not in top 10)"),this.appState.setScoreTimestamp(i)}else c("Failed to save score");this.appState.transition("leaderboard")}}class B{static AUTO_TIMEOUT=3e4;constructor(e,t,i){this.appState=e,this.inputManager=t,this.storageManager=i,this.element=null,this.selectedOption=0,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("LeaderboardScreen: Show");const e=this.appState.getState(),t=e.selectedGame,i=e.playerName,a=e.currentScore,n=e.scoreTimestamp;if(!F(t)){c("LeaderboardScreen: Invalid or missing game"),this.appState.reset();return}const r=this.storageManager.getScores(t.id);s("LeaderboardScreen DEBUG:"),s("- Total scores:",r.length),s("- Looking for player:",i,a,n),s("- All scores:",JSON.stringify(r.map(d=>({name:d.name,score:d.score,date:d.date})),null,2));const l=r.findIndex(d=>d.name===i&&d.score===a&&d.date===n)+1;s("- Player rank:",l);let h=[];l===0||l<=5?(h=r.slice(0,5),s("- Showing top 5 normally")):(h=[...r.slice(0,4),{...r[l-1],displayRank:l}],s("- Showing top 4 + player at rank",l)),s("- Display scores:",JSON.stringify(h.map(d=>({name:d.name,score:d.score,rank:d.displayRank||"(index)"})),null,2));const{containerWidth:m,containerHeight:S}=y();this.element=document.createElement("div"),this.element.id="leaderboard-screen",this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${m}px;
      height: ${S}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 100;
      animation: fadeIn 0.5s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `;const T=document.createElement("div");T.textContent=t.name,T.style.cssText=`
      position: absolute;
      top: clamp(60px, 6.1cqh, 117px);
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: var(--text-primary);
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
    `;const w=document.createElement("div");w.style.cssText=`
      position: absolute;
      top: clamp(250px, 29.3cqh, 562px);
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      min-width: 300px;
      max-width: 820px;
    `;const v=document.createElement("div");v.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 clamp(10px, 1.56cqw, 30px);
      margin-bottom: clamp(20px, 4.1cqh, 79px);
    `;const z=document.createElement("div");z.textContent="Rank",z.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(60px, 8cqw, 100px);
      text-align: center;
    `;const N=document.createElement("div");N.textContent="Score",N.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 1;
      text-align: center;
    `;const $=document.createElement("div");$.textContent="Player",$.style.cssText=`
      color: var(--text-secondary);
      font-size: clamp(20px, 2.34cqh, 45px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(100px, 12cqw, 150px);
    `,v.appendChild(z),v.appendChild(N),v.appendChild($);const P=document.createElement("div");if(P.style.cssText=`
      display: flex;
      flex-direction: column;
    `,h.length>0)h.forEach((d,ee)=>{const te=this.createRow(d,ee,i,a,n);P.appendChild(te)});else{const d=document.createElement("div");d.textContent="No scores yet - Be the first!",d.style.cssText=`
        text-align: center;
        font-size: clamp(18px, 1.46cqh, 28px);
        color: var(--text-tertiary);
        padding: clamp(30px, 3.13cqh, 60px) 0;
        font-family: 'Google Sans Flex', sans-serif;
      `,P.appendChild(d)}w.appendChild(v),w.appendChild(P);const q=document.createElement("div");q.style.cssText=`
      position: absolute;
      bottom: clamp(80px, 10cqh, 192px);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: clamp(20px, 3.3cqw, 40px);
      align-items: center;
      white-space: nowrap;
    `,this.createGameLink=document.createElement("div"),this.createGameLink.className="footer-option",this.createGameLink.textContent="Play online",this.createGameLink.style.cssText=`
      color: #7D7D7D;
      font-size: clamp(18px, 2.08cqh, 40px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      text-decoration: underline;
      line-height: 1;
      cursor: pointer;
      transition: color 0.2s ease;
    `,this.createGameLink.addEventListener("click",()=>{this.selectedOption=0,this.confirmSelection()}),this.playAgainLink=document.createElement("div"),this.playAgainLink.className="footer-option",this.playAgainLink.textContent="Play again",this.playAgainLink.style.cssText=`
      color: #7D7D7D;
      font-size: clamp(18px, 2.08cqh, 40px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      opacity: 0.4;
      cursor: pointer;
      transition: opacity 0.2s ease, color 0.2s ease;
    `,this.playAgainLink.addEventListener("click",()=>{this.selectedOption=1,this.confirmSelection()}),q.appendChild(this.createGameLink),q.appendChild(this.playAgainLink),this.updateFooterSelection(),this.element.appendChild(T),this.element.appendChild(w),this.element.appendChild(q),document.body.appendChild(this.element),this.addStyles(),this.inputManager.onKeyPress(this.handleKeyPress),this.appState.setTimeout(B.AUTO_TIMEOUT,"qr","leaderboard-timeout"),s("LeaderboardScreen: Active (30s auto-advance)")}createRow(e,t,i,a,n){const r=e.name===i&&e.score===a&&e.date===n,l=e.displayRank||t+1,h=document.createElement("div");if(h.style.cssText=`
      position: relative;
      display: flex;
      align-items: center;
    `,r){const v=document.createElement("div");v.textContent="▶",v.style.cssText=`
        position: absolute;
        left: clamp(-80px, -3.3cqw, -80px);
        color: var(--text-primary);
        font-size: clamp(32px, 3.65cqh, 70px);
        font-family: 'Google Sans Flex', sans-serif;
        font-weight: 500;
        line-height: 1;
      `,h.appendChild(v)}const m=document.createElement("div");m.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: clamp(20px, 2.45cqh, 47px) clamp(10px, 1.56cqw, 30px);
      border-bottom: ${r?"4px":"3px"} solid ${r?"var(--text-primary)":"var(--text-secondary)"};
      flex: 1;
    `;const S=document.createElement("div");S.textContent=`${l}`,S.style.cssText=`
      color: ${r?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(60px, 8cqw, 100px);
      text-align: center;
    `;const T=document.createElement("div");T.textContent=e.score.toString(),T.style.cssText=`
      color: ${r?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 1;
      text-align: center;
    `;const w=document.createElement("div");return w.textContent=e.name,w.style.cssText=`
      color: ${r?"var(--text-primary)":"var(--text-tertiary)"};
      font-size: clamp(32px, 3.65cqh, 70px);
      font-family: 'Google Sans Flex', sans-serif;
      font-weight: 500;
      line-height: 1;
      flex: 0 0 auto;
      min-width: clamp(100px, 12cqw, 150px);
    `,m.appendChild(S),m.appendChild(T),m.appendChild(w),h.appendChild(m),h}addStyles(){if(document.getElementById("leaderboard-v2-styles"))return;const e=document.createElement("style");e.id="leaderboard-v2-styles",e.textContent=`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #leaderboard-screen {
        animation: fadeIn 0.3s ease-in;
      }
    `,document.head.appendChild(e)}updateFooterSelection(){!this.createGameLink||!this.playAgainLink||(this.selectedOption===0?(this.createGameLink.style.textDecoration="underline",this.createGameLink.style.opacity="1",this.playAgainLink.style.textDecoration="none",this.playAgainLink.style.opacity="0.4"):(this.createGameLink.style.textDecoration="none",this.createGameLink.style.opacity="0.4",this.playAgainLink.style.textDecoration="underline",this.playAgainLink.style.opacity="1"))}confirmSelection(){this.selectedOption===0?(s("LeaderboardScreen: Create game selected - advancing to QR screen"),this.appState.transition("qr")):(s("LeaderboardScreen: Play again selected - going to gallery"),this.appState.transition("gallery"))}hide(){s("LeaderboardScreen: Hide"),this.appState.clearTimeout("leaderboard-timeout"),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),this.selectedOption=0,this.createGameLink=null,this.playAgainLink=null,s("LeaderboardScreen: Cleaned up")}handleKeyPress(e){s("LeaderboardScreen: Key pressed:",e,"Current selection:",this.selectedOption),e==="ArrowLeft"||e==="a"||e==="A"?(s("LeaderboardScreen: Left - selecting Create game"),this.selectedOption=0,this.updateFooterSelection()):e==="ArrowRight"||e==="d"||e==="D"?(s("LeaderboardScreen: Right - selecting Play again"),this.selectedOption=1,this.updateFooterSelection()):(e===" "||e==="n"||e==="N")&&(s("LeaderboardScreen: Key pressed - confirming selection",this.selectedOption),this.confirmSelection())}}class A{static INACTIVITY_TIMEOUT=3e4;static BASE_URL=`${typeof window<"u"?window.location.origin:""}/games/`;constructor(e,t){this.appState=e,this.inputManager=t,this.element=null,this.handleKeyPress=this.handleKeyPress.bind(this)}show(){s("QRCodeScreen: Show");const e=this.appState.getState(),t=e.selectedGame,i=e.playerName||"LFC";if(s("QRCodeScreen DEBUG: playerName =",i),s("QRCodeScreen DEBUG: full state =",e),!t){c("No game selected"),this.appState.reset();return}A.BASE_URL+t.id+"",this.element=document.createElement("div"),this.element.id="qr-screen";const{containerWidth:a,containerHeight:n}=y();if(this.element.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${a}px;
      height: ${n}px;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 10 / 16;
      background: transparent;
      z-index: 100;
      animation: fadeIn 0.5s ease-in;
      overflow: hidden;
      container-type: size; /* Enable Container Queries */
    `,this.element.innerHTML=`
      <div class="qr-container">
        <!-- Title at top -->
        <div class="qr-title-wrapper">
          <div class="qr-title">
            <span class="qr-title-text">Thank you </span><span class="qr-title-highlight">${i}</span><span class="qr-title-text"> for playing!</span>
          </div>
        </div>

        <!-- Center section with QR -->
        <div class="qr-center">
          <!-- Scan prompt above QR -->
          <div class="qr-scan-prompt">Scan to play online</div>

          <!-- QR Code with blur circle -->
          <div class="qr-code-wrapper">
            <div class="qr-blur-circle"></div>
            <img src="./img/qr.png" alt="QR Code" class="qr-code-image" />
          </div>

          <!-- Work at google prompt below QR -->
          <div class="qr-scan-prompt">Work at Google <div class="qr-scan-prompt-link">g.co/jobs/AI</div></div>
        </div>
      </div>
    `,document.body.appendChild(this.element),!document.getElementById("qr-screen-styles")){const r=document.createElement("style");r.id="qr-screen-styles",r.textContent=`
        .qr-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Google Sans Flex', Arial, sans-serif;
          padding: clamp(60px, 6cqh, 115px) clamp(45px, 7.7cqw, 92px);
        }

        .qr-title-wrapper {
          width: 100%;
          margin-bottom: 0;
          flex-shrink: 0;
        }

        .qr-title {
          font-size: clamp(36px, 4.43cqh, 80px);
          font-weight: 500;
          line-height: 1.1;
          text-align: left;
        }

        .qr-title-text {
          color: var(--text-primary);
        }

        .qr-title-highlight {
          color: var(--highlight-red);
        }

        .qr-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          width: 100%;
          gap: clamp(20px, 3cqh, 60px);
        }

        .qr-scan-prompt {
          font-size: clamp(24px, 2.86cqh, 55px);
          font-weight: 500;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1;
          margin: 0;
          padding: 0;
          background: transparent;
          z-index: 2;
        }

        .qr-scan-prompt-link {
          color: var(--text-primary);
          display: inline;
        }

        .qr-code-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(280px, 48cqw, 577px);
          height: clamp(280px, 29.8cqh, 572px);
        }

        .qr-blur-circle {
          position: absolute;
          width: clamp(350px, 61.8cqw, 741px);
          height: clamp(350px, 38.6cqh, 741px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(66, 133, 244, 0.08) 0%, rgba(66, 133, 244, 0.03) 50%, rgba(255, 255, 255, 0) 100%);
          filter: blur(60px);
          z-index: 1;
        }

        .qr-code-image {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 2;
        }

        /* Corner decorations */
        .qr-decoration {
          position: absolute;
          background: var(--border-color);
          opacity: 0.6;
          border-radius: 8px;
        }

        .qr-decoration-top-left {
          width: clamp(40px, 7cqw, 84px);
          height: clamp(20px, 2cqh, 38px);
          left: clamp(56px, 9.4cqw, 113px);
          top: clamp(242px, 24.2cqh, 465px);
        }

        .qr-decoration-top-right {
          width: clamp(40px, 7cqw, 84px);
          height: clamp(36px, 3.8cqh, 73px);
          right: clamp(90px, 15cqw, 182px);
          top: clamp(148px, 14.8cqh, 285px);
        }

        .qr-decoration-bottom-left {
          width: clamp(100px, 17.3cqw, 208px);
          height: clamp(121px, 12.1cqh, 232px);
          left: clamp(151px, 25.3cqw, 303px);
          bottom: clamp(171px, 17.1cqh, 329px);
        }

        .qr-decoration-bottom-right {
          width: clamp(87px, 14.6cqw, 175px);
          height: clamp(67px, 6.7cqh, 129px);
          right: clamp(62px, 10.4cqw, 125px);
          bottom: clamp(302px, 30.2cqh, 583px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,document.head.appendChild(r)}this.inputManager.onKeyPress(this.handleKeyPress),this.appState.setTimeout(A.INACTIVITY_TIMEOUT,"idle","qr-inactivity"),s("QRCodeScreen: Active (30s inactivity timer)")}hide(){s("QRCodeScreen: Hide"),this.appState.clearTimeout("qr-inactivity"),this.inputManager.offKeyPress(this.handleKeyPress),this.element&&(this.element.remove(),this.element=null),this.appState.currentScreen==="idle"&&(this.appState.selectedGame=null,this.appState.currentScore=null,this.appState.playerName=null),s("QRCodeScreen: Cleaned up")}handleKeyPress(e){this.appState.clearTimeout("qr-inactivity"),this.appState.setTimeout(A.INACTIVITY_TIMEOUT,"idle","qr-inactivity"),(e===" "||e==="n"||e==="N")&&(s("QRCodeScreen: Key pressed - returning to Idle"),this.appState.reset())}}console.log("=== GAME OF LIFE ARCADE - Physical Installation ===");console.log("Initializing...");const f=new E,M=new g,u=new se,V=new G,H=new L;console.log("✓ Managers initialized");u.onKeyPress((o,e)=>{const t=u.getThemeFromKey(o);t&&(console.log(`Theme change requested: ${t}`),H.setTheme(t))});H.addObserver(o=>{console.log(`Video system: Theme changed to ${o}`),_(o)});_(H.getTheme());Z();console.log("✓ Theme system connected (keys 1-4: day, 5-8: night)");console.log("✓ Video system connected to theme");console.log("✓ Video container responsive initialized");const X=new p,Q=new b(u,f,M,X);Q.startListening();console.log("✓ Reset system initialized (M=3s soft, M+N=10s hard)");const k={idle:new U(f,u,M),welcome:new O(f,u),gallery:new R(f,u),code:new Ce(f,u),game:new K(f,u,V,H),score:new D(f,u,M),leaderboard:new B(f,u,M),qr:new A(f,u)};console.log("✓ Screen instances created");let C=null;function _(o){const e=document.getElementById("bg-video-idle"),t=document.getElementById("bg-video-loop");if(!e||!t)return;const i=o==="night"?"_dark":"",a=`/conways-arcade-online/videos/idle${i}.mp4`,n=`/conways-arcade-online/videos/loop${i}.mp4`;if(e.src!==window.location.origin+a){const r=!e.paused,l=e.currentTime;e.src=a,e.load(),r&&(e.currentTime=l,e.play().catch(h=>console.log("Idle video play prevented:",h)))}if(t.src!==window.location.origin+n){const r=!t.paused,l=t.currentTime;t.src=n,t.load(),r&&(t.currentTime=l,t.play().catch(h=>console.log("Loop video play prevented:",h)))}console.log(`Video sources updated for ${o} mode: ${a}, ${n}`)}function Z(){const{containerWidth:o,containerHeight:e}=y(),t=document.getElementById("video-container");t&&(t.style.width=`${o}px`,t.style.height=`${e}px`,t.style.maxWidth="100vw",t.style.maxHeight="100vh",t.style.aspectRatio="10 / 16",console.log(`Video container updated: ${o}×${e}`))}function Ee(o){const e=document.getElementById("bg-video-idle"),t=document.getElementById("bg-video-loop");if(!e||!t)return;const i=n=>{n.paused&&n.play().catch(r=>console.log("Auto-play prevented:",r))},a=n=>{setTimeout(()=>{n.style.opacity==="0"&&n.pause()},1e3)};o==="idle"||o==="idle-leaderboard"?(i(e),e.style.opacity="1",t.style.opacity="0",a(t)):o==="code"||o==="game"?(e.style.opacity="0",t.style.opacity="0",a(e),a(t)):(i(t),t.style.opacity="1",e.style.opacity="0",a(e))}function J(o){console.log(`Screen transition: ${C} → ${o}`),Ee(o),C&&k[C]&&(console.log(`Hiding ${C}`),k[C].hide()),k[o]?(console.log(`Showing ${o}`),k[o].show(),C=o):console.error(`Screen "${o}" not found!`)}f.subscribe(o=>{console.log("AppState changed:",o),o.currentScreen!==C&&J(o.currentScreen)});console.log("✓ AppState observer registered");console.log("Starting with IdleScreen...");J("idle");window.arcade={appState:f,storageManager:M,inputManager:u,iframeComm:V,resetManager:Q,resetCircleUI:X,screens:k};console.log("✓ Installation ready");console.log("Press SPACE to begin");window.addEventListener("resize",()=>{Z()});console.log("✓ Resize listener registered for video container");
