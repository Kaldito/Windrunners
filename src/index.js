// ---------------- PACKAGES ---------------- //
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    FacebookAuthProvider,
    TwitterAuthProvider,
    GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getFirestore,
    doc, 
    getDoc,
    setDoc,
    getDocs,
    collection,
    query, 
    where,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// ---------------- FUNCTIONS ---------------- //
function gameStart(){
    var config = {
        type: Phaser.AUTO,
        width: 1150,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        parent: 'game-page'
    };
    
    var player;
    var stars;
    var bombs;
    var platforms;
    var cursors;
    var score = 0;
    var gameOver = false;
    var scoreText;
    
    var game = new Phaser.Game(config);
    
    function preload ()
    {
        this.load.image('sky', 'assets/bg.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 41 });
    }
    
    function create ()
    {
        scoreSpan.innerHTML = 0;
        //  A simple background for our game
        this.add.image(400, 300, 'sky').setScale(1.5);
    
        //  The platforms group contains the ground and the 2 ledges we can jump on
        platforms = this.physics.add.staticGroup();
    
        //  Here we create the ground.
        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        platforms.create(575, 584, 'ground').setScale(3, 1).refreshBody();
    
    
        // The player and its settings
        player = this.physics.add.sprite(100, 450, 'dude');
    
        //  Player physics properties. Give the little guy a slight bounce.
        player.setBounce(0.1);
        player.setCollideWorldBounds(true);
    
        //  Our player animations, turning, walking left and walking right.
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        player.body.setGravityY(gy);
    
        //  Input Events
        cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown_W', function (event) {
            gy += -400;

            player.body.setGravityY(gy);
        });

        this.input.keyboard.on('keydown_S', function (event) {
            gy += 400;

            player.body.setGravityY(gy);
        });

        this.input.keyboard.on('keydown_D', function (event) {
            gx += 4800;

            player.body.setGravityX(gx);
        });

        
        this.input.keyboard.on('keydown_A', function (event) {
            gx += -4800;

            player.body.setGravityX(gx);
        });
    
        //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
        stars = this.physics.add.staticGroup({
            key: 'star',
            repeat: 1,
            setXY: { x: Phaser.Math.Between(100, 1050), y: Phaser.Math.Between(50, 500), stepX: Phaser.Math.Between(50, 100), stepY: Phaser.Math.Between(50, 100)}
        });
    
        stars.children.iterate(function (child) {
    
            //  Give each star a slightly different bounce
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    
        });
    
        bombs = this.physics.add.group();
    
        //  The score
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
    
        //  Collide the player and the stars with the platforms
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(bombs, platforms);
    
        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        this.physics.add.overlap(player, stars, collectStar, null, this);
    
        this.physics.add.collider(player, bombs, hitBomb, null, this);
    }
    
    function update ()
    {
        if (gameOver)
        {
            return;
        }
    
        if (cursors.left.isDown)
        {
            if(player.body.touching.down){
                player.setVelocityX(-100);
            } else {
                player.setVelocityX(-40);
            }

            player.anims.play('left', true);
        }
        else if (cursors.right.isDown)
        {
            if(player.body.touching.down){
                player.setVelocityX(100);
            } else {
                player.setVelocityX(40);
            }
            player.anims.play('right', true);
        }
        else
        {
            player.setVelocityX(0);

            player.anims.play('turn');  
        }

        if (cursors.up.isDown && player.body.touching.down)
        {
            player.setVelocityY(-230);
        }
    }
    
    function collectStar (player, star)
    {
        star.disableBody(true, true);
    
        //  Add and update the score
        score += 10;
        scoreSpan.innerHTML = score;
        scoreText.setText('Score: ' + score);
    
        if (stars.countActive(true) === 0)
        {
            //  A new batch of stars to collect
            stars.children.iterate(function (child) {
    
                
                child.enableBody(true, Phaser.Math.Between(100, 1050),  Phaser.Math.Between(50, 500), true, true);
    
            });
    
            var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    
            var bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;
    
        }
    }
    
    function hitBomb (player, bomb)
    {
        this.physics.pause();
    
        player.setTint(0xff0000);
    
        player.anims.play('turn');
    
        gameOver = true;

        game.destroy(true, false);

        scoreDiv.classList.remove("hide");
        continueBtn.classList.remove("hide");
    }
}

// ---------------- HTML ---------------- //
//- Sections
const mainPage = document.querySelector("#main-page");
const loginPage = document.querySelector("#login-page");
const registerPage = document.querySelector("#register-page");
const dataPage = document.querySelector("#data-page");
const gamePage = document.querySelector("#game-page");
const resultsPage = document.querySelector("#results-page");
// - Divs
const ganadores = document.querySelector("#ganadores");
// - Buttons
const startGameBtn = document.querySelector("#start-game");
const mainLogin = document.querySelector("#main-login");
const mainRegister = document.querySelector("#main-register")
const registerAnchor = document.querySelector("#register-anchor");
const registerBtn = document.querySelector("#register-btn");
const loginAnchor = document.querySelector("#login-anchor");
const loginBtn = document.querySelector("#login-btn");
const googleBtn = document.querySelector("#google-btn");
const twitterBtn = document.querySelector("#twitter-btn");
const facebookBtn = document.querySelector("#facebook-btn");
const githubBtn = document.querySelector("#github-btn");
const updateBtn = document.querySelector("#update-btn");
const logoutBtn = document.querySelector("#logout-btn");
const retryBtn = document.querySelector("#retry");
// - Inputs
const emailLoginInput = document.querySelector("#login-email-input");
const passwordLoginInput = document.querySelector("#password-email-input");
const emailRegisterInput = document.querySelector("#register-email-input");
const passwordRegisterInput = document.querySelector("#register-password-input")
const nicknameInput = document.querySelector("#nickname");
const regionInput = document.querySelector("#region");
// - Score
const scoreSpan = document.querySelector("#score");
const scoreDiv = document.querySelector("#score-div");
const continueBtn = document.querySelector("#continue")

// ---------------- CONSTANTS AND VARIABLES ---------------- //
let gy = 300;
let gx = 0;

// ---------------- FIREBASE APP CONFIG ---------------- //
const firebaseApp = initializeApp({
    apiKey: "AIzaSyD3EHwsI4BVT_Q8ro8ojTPYCvUNRPh81f8",
    authDomain: "fir-intro-83b54.firebaseapp.com",
    projectId: "fir-intro-83b54",
    storageBucket: "fir-intro-83b54.appspot.com",
    messagingSenderId: "1034291028507",
    appId: "1:1034291028507:web:9d49f4bf8d3315ef6c0ebe",
    measurementId: "G-2JTEH1G11C",
});

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const providerGoogle = new GoogleAuthProvider();
const providerFacebook = new FacebookAuthProvider();
const providerTwitter = new TwitterAuthProvider();
const providerGithub = new GithubAuthProvider();


// ---------------- MAIN ---------------- //
// - Main Page
mainLogin.addEventListener("click", function(){
    mainPage.classList.add("hide");
    loginPage.classList.remove("hide");
})

mainRegister.addEventListener("click", function(){
    mainPage.classList.add("hide");
    registerPage.classList.remove("hide");
})

// - Register Page
registerBtn.addEventListener("click", function () {
    createUserWithEmailAndPassword(auth, emailRegisterInput.value, passwordRegisterInput.value)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorMessage);
            // ..
        });
});

registerAnchor.addEventListener("click", function(){
    loginPage.classList.add("hide");
    registerPage.classList.remove("hide");
})

// - Login Page
loginBtn.addEventListener("click", function () {
    signInWithEmailAndPassword(auth, emailLoginInput.value, passwordLoginInput.value)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(error.message);
        });
});

// -- Google OAuth -- //
googleBtn.addEventListener("click", function(){
    signInWithPopup(auth, providerGoogle)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      // ...
    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });
})

// -- Facebook OAuth -- //
facebookBtn.addEventListener("click", function(){
    signInWithPopup(auth, providerFacebook)
    .then((result) => {
      // The signed-in user info.
      const user = result.user;
  
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
  
      // IdP data available using getAdditionalUserInfo(result)
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = FacebookAuthProvider.credentialFromError(error);
  
      // ...
    });
})

// -- Twitter OAuth -- //
twitterBtn.addEventListener("click", function(){
    signInWithPopup(auth, providerTwitter)
  .then((result) => {
    // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
    // You can use these server side with your app's credentials to access the Twitter API.
    const credential = TwitterAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const secret = credential.secret;

    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = TwitterAuthProvider.credentialFromError(error);
    // ...
  });
})

// -- Github OAuth -- //
githubBtn.addEventListener("click", function(){
    signInWithPopup(auth, providerGithub)
  .then((result) => {
    // This gives you a GitHub Access Token. You can use it to access the GitHub API.
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    // ...
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GithubAuthProvider.credentialFromError(error);
    // ...
  });
})

loginAnchor.addEventListener("click", function(){
    registerPage.classList.add("hide");
    loginPage.classList.remove("hide");
})

// - Game Page
startGameBtn.addEventListener("click", function(){
    startGameBtn.classList.add("hide");

    gameStart();
})

// -- Cerrar Sesion -- //
logoutBtn.addEventListener("click", function () {
    signOut(auth)
        .then(() => {
            gamePage.classList.add("hide");
            mainPage.classList.remove("hide");
        })
        .catch((error) => {
            console.log(error);
        });
});

retryBtn.addEventListener("click", function(){
    resultsPage.classList.add("hide");
    startGameBtn.classList.remove("hide");
    gamePage.classList.remove("hide");
})

// -- Observador -- //
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        mainPage.classList.add("hide");
        loginPage.classList.add("hide");
        registerPage.classList.add("hide");

        if (docSnap.exists()) {
            gamePage.classList.remove("hide");

            continueBtn.addEventListener("click", async function(){
                let scores = []
    
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
    
                if(parseInt(scoreSpan.innerHTML) > parseInt(docSnap.data().score)){
                    await updateDoc(doc(db, "users", user.uid), {
                        score: scoreSpan.innerHTML,
                    });
                }
    
                const querySnapshot = await getDocs(collection(db, "users"));
                console.log(querySnapshot);
                querySnapshot.forEach((doc) => {
                    scores.push(doc.data().score)
                });
    
                const best_score = Math.max(...scores);
    
                const q = query(collection(db, "users"), where("score", "==", best_score.toString()));
                const bestPlayers = await getDocs(q);
    
                ganadores.innerHTML = ""
    
                bestPlayers.forEach((doc) => {
                    console.log(doc.data());
                    ganadores.innerHTML += `<h2 style:"color: black">${doc.data().nickname} - ${doc.data().score}puntos</h2><div id="${doc.data().nickname}"></div>`
                });
    
                scoreDiv.classList.add("hide");
                continueBtn.classList.add("hide");
                gamePage.classList.add("hide");
                resultsPage.classList.remove("hide");
    
                scoreSpan.innerHTML = 0;
            })
        } else {
            dataPage.classList.remove("hide");
            
            updateBtn.addEventListener("click", async function(){
                if(nicknameInput.value != ""){
                    try{
                        await setDoc(doc(db, "users", user.uid), {
                            id: user.uid,
                            nickname: nicknameInput.value,
                            region: regionInput.value,
                            score: 0
                        }); 
                        console.log(user.uid);
    
                    } catch(err){
                        console.log(err);
                    }
              
                    
                    window.location.reload()
                } else {
                    alert("No dejes ningun input vacio!");
                }
            })
        }

        console.log("User loged");
    } else {
        console.log("No user");
    }
});
