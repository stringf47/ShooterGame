const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const grass = new Image();
grass.src = 'grass.png';
const sheep = new Image();
sheep.src  = 'sheep.png';
//const grass = document.getElementById("bgImage");
//const sheep = document.getElementById("sheepImage");

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#scoreEl');
const startGameButton = document.querySelector('#startGameButton');
const modalEl = document.querySelector('#modalEl');
const panelScore = document.querySelector('#panelScore');

function drawBg()
{
    c.save();
    c.globalAlpha=0.995;
    c.drawImage(
        grass, 0, 0, canvas.width, canvas.height
    );
    c.restore();
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();  
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.drawImage(
             sheep, this.x - 2.9*this.radius, this.y - 2.68*this.radius, this.radius*6, this.radius*6
        );
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.975;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x = this.velocity.x * friction;
        this.velocity.y = this.velocity.y * friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -=0.005;
    }
}

const x = canvas.width /2;
const y = canvas.height /2;

let player = new Player(x, y, 10, 'black')
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

function init() {
    player = new Player(x, y, 10, 'black')
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
}

function spawnEnemies() {
    setInterval( () => {
        const radius = Math.random() * (40 - 10) + 10;
        let x
        let y
        if(Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 -  radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        }
        else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 -  radius : canvas.height + radius;
        }
        const color = 'red';

        const angle = Math.atan2(
            canvas.height/2 - y,
            canvas.width/2 - x);
        const velocity = {
            x: 0.7 * (Math.cos(angle)),
            y: 0.7 * (Math.sin(angle)) };

        enemies.push(new Enemy(x, y, radius, color, velocity));

    }, 1000);
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawBg();
    player.draw();
    
    //create explosions
    particles.forEach((particle, index) => {
        if(particle.alpha <=0) {
                particles.splice(index, 1);
        }
        else{
            particle.update();
        }
    })

    projectiles.forEach((projectile, index) => {
        projectile.update();
        //remove offscreen projectiles
        if(projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width
            || projectile.y + projectile.radius < 0  || projectile.y - projectile.radius > canvas.height)
        {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        //endgame
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if(dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            modalEl.style.visibility = 'visible';
            panelScore.innerHTML = score;
        };

        //projectile enemy collision
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(dist - enemy.radius - projectile.radius < 1) {

                //generating particles
                for(let i = 1; i < enemy.radius; i++)
                {
                    particles.push(new Particle(projectile.x, projectile.y,
                        Math.random() * 5, enemy.color, {x: 4*(Math.random() - 0.5), y: 4*(Math.random() - 0.5)}));
                }

                if(enemy.radius > 20) {
                    enemy.radius -=10;
                //increasing score
                score = score + 50;
                scoreEl.innerHTML = score;
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
                else {
                //increasing score
                score = score + 150;
                scoreEl.innerHTML = score;
                setTimeout(() => {
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                }, 0);
            }
            };
        });
    });
};


window.addEventListener('click', (event) => {
    const angle = Math.atan2(
        event.clientY - canvas.height/2,
        event.clientX - canvas.width/2);
    const velocity = {
        x:Math.cos(angle) * 5,
        y:Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(canvas.width/2, canvas.height/2,
        5, 'yellow', velocity));
})

startGameButton.addEventListener('click', () => {
    init();
    modalEl.style.visibility = 'hidden';
    animate();
    spawnEnemies();
})
