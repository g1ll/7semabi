window.onload = function () {
    var winw = window.innerWidth;
    var winh = window.innerHeight;
    var f15;
    var enemy;
    var shot = false;
    var enemydead = false;
    var explodir = false;
    var score = 0;
    var clock = new THREE.Clock();
    var hud = document.getElementById('hud');
    var danos = 0;
    var nao_abatidos = 0;
    var gameover = false;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
            45,
            winw / winh,
            1, 100);
    camera.position.y = 1;
    camera.position.z = 5;

    var renderer = new THREE.WebGLRenderer(
            {alpha: true});
    renderer.setSize(winw, winh);
    document.body.appendChild(renderer.domElement);

    var loader = new THREE.OBJLoader();
    var mtl = new THREE.MTLLoader()
            .setPath('models/jato/')
            .load('f15c.mtl', function (materials) {
                materials.preload();
                loader.setMaterials(materials)
                        .setPath('models/jato/')
                        .load('f15c.obj', function (object) {
                            f15 = object;
                            f15.position.x = 0;
                            f15.position.y = -2;
                            f15.position.z = -6;
                            f15.rotateX(1.3);
//                           f15.rotateZ(0.5);
                            scene.add(f15);
                            renderer.render(scene, camera);

                        });
            });

    var loadere = new THREE.OBJLoader();
    var mtle = new THREE.MTLLoader()
            .setPath('models/jato/')
            .load('f15c_enemi.mtl', function (materials) {
                materials.preload();
                loadere.setMaterials(materials)
                        .setPath('models/jato/')
                        .load('f15c.obj', function (object) {
                            enemy = object;
                            enemy.position.x = 0;
                            enemy.position.y = 7;
                            enemy.position.z = -6;
                            enemy.rotateX(1.5);
//                           enemy.rotateZ(0.5);
                            enemy.rotateY(Math.PI / 180 * 180);

                            scene.add(enemy);
                            renderer.render(scene, camera);
                        });
            });


    var light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    var plight = new THREE.PointLight(0xffffff, 1);
    plight.position.set(15, 7, 1);
    scene.add(plight);

    //MAPA - ANIMACAO JS (EDGE NAO SUPORTA)    
//     document.body.animate([
//        //keyframes
//        {backgroundPosition: '0px 0px'},
//        {backgroundPosition: '0px 1000px'}
//    ],{//funcoes de tempo
//        duration:5000,
//        iterations: Infinity,
//        easing: 'linear'
//    });
    //Geometria do mapa
    var textura = new THREE.TextureLoader()
            .load('img/maplong.jpg');
    var geometry = new THREE.CylinderGeometry(80, 80, 100, 100);
    var material = new THREE.MeshBasicMaterial({map: textura});
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.z = -130;
    cylinder.position.x = 0;
    cylinder.position.y = 0;
    cylinder.rotateZ(Math.PI / 180 * 90);
    cylinder.rotateY(Math.PI / 180 * 90);
    scene.add(cylinder);

    //Geometria do missil
    geometry = new THREE.CylinderGeometry(0.01, 0.03, 0.7, 100);
    material = new THREE.MeshBasicMaterial({color: 0xcccccc});
    var missil = new THREE.Mesh(geometry, material);
    missil.position.x = 0;
    missil.position.y = 0;
    missil.position.z = 0;


    //Geometria e Textura da explosao
    var explosionTexture = new THREE.ImageUtils.loadTexture('img/sprite-animation-explosion_vert.png');
    var explodeMaterial = new THREE.MeshBasicMaterial({map: explosionTexture, transparent: true});
    var exploGeo = new THREE.PlaneGeometry(4, 4, 1, 1);
    var explosion = new THREE.Mesh(exploGeo, explodeMaterial);
    var explodeSprite = new TextureAnimator(explosionTexture, 8, 6, 48, 50);
    explosion.position.x = 2;
    explosion.position.z = -6;
    explosion.position.y = -2;
    var explosionlight = new THREE.PointLight(0xff3300, 1, 5);

    function animate() {
        //Animacao do mapa
        if (typeof cylinder !== 'undefined') {
            cylinder.rotation.x += 0.002;
        }

        enemyFlight();

        f15Flight();

        if (shot && colide(missil, enemy) && !enemydead) {
            enemydead = true;
            explodir = true;
            missil.position.y = 11;
            scene.remove(missil);
            score++;
        }

        //ACERTOU INIMIGO
        explosao();

        updateHud();
        
        renderer.render(scene, camera);
        if (!gameover) {
            window.requestAnimationFrame(animate);
        } else {
            alert('Game Over!\nPontos: ' + score + ' | Danos: ' + (danos * 100).toFixed(1) + ' % | Não Abatidos: ' + nao_abatidos);
            window.location.reload();
        }
    }

    animate();

    function controle(e) {
        //console.log(e.keyCode);
        let rz = f15.rotation._z.toFixed(2);
        if (e.keyCode === 37) {//left            
            if (parseFloat(rz) < 1.05) {
                f15.position.x -= 0.1;
                f15.rotateZ(Math.PI / 9);
            }
        } else if (e.keyCode === 39) {//right
            if (parseFloat(rz) > -1.05) {
                f15.position.x += 0.1;
                f15.rotateZ(-Math.PI / 9);
            }
        } else if (e.keyCode === 32) {
            shot = true;
        }
    }

    window.addEventListener('keydown', controle);

    function colide(obj1, obj2) {
        var x1 = obj1.position.x;
        var y1 = obj1.position.y;
        var x2 = obj2.position.x;
        var y2 = obj2.position.y;
        if ((y2 >= y1 - 0.5 && y2 <= y1 + 0.5)
                && (x2 >= x1 - 0.5 && x2 <= x1 + 0.5)) {
            return true;
        } else {
            return false;
        }
    }

    function f15Flight() {
        //animacao e controle do personagem principal f15
        if (typeof f15 !== 'undefined') {
            let rz = parseFloat(f15.rotation._z.toFixed(2));
            if (rz !== 0) {
                let vel = Math.abs(rz / 10);
                if (rz < 0 && rz >= -1.05) {//direita
                    f15.position.x += vel;
                    if (f15.position.x > 2) {
                        f15.position.x = 2;
                    }
                }

                if (rz > 0 && rz <= 1.05) {//esquerda
                    f15.position.x -= vel;
                    if (f15.position.x < -2) {
                        f15.position.x = -2;
                    }
                }
            }

            if (shot && missil.position.y < 7) {
                scene.add(missil);
                missil.position.y += 0.3;
            } else {
                missil.position.y = f15.position.y;
                missil.position.x = f15.position.x * 1.15;
                missil.position.z = f15.position.z - 2;
                shot = false;
                scene.remove(missil);
            }

        }
    }

    function enemyFlight() {
        //animacao e controle do inimigo
        if (typeof enemy !== 'undefined') {
            enemy.position.y -= 0.05;
            if (enemy.position.y < -5) {
                if (!enemydead)
                    nao_abatidos++;
                enemydead = false;
                explodir = false;
                clock = new THREE.Clock();
                explodeSprite.reset();
                scene.add(enemy);
                enemy.position.y = 7;
                enemy.position.x = -2 + Math.random() * 4;
//                enemy.position.x =0;
                

                if (nao_abatidos >= 3) {
                    gameover = true;
                }
            }
        }
    }

    //Lee Stemkoski
    //http://stemkoski.github.io/Three.js/Texture-Animation.html
    function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration)
    {
        // note: texture passed by reference, will be updated by the update function.

        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;
        // how many images does this spritesheet contain?
        //  usually equals tilesHoriz * tilesVert, but not necessarily,
        //  if there at blank tiles at the bottom of the spritesheet. 
        this.numberOfTiles = numTiles;
        this.texture = texture;
        this.texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        this.texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);

        // how long should each image be displayed?
        this.tileDisplayDuration = tileDispDuration;

        // how long has the current image been displayed?
        this.currentDisplayTime = 0;

        // which image is currently being displayed?
        this.currentTile = 0;

        this.update = function (milliSec)
        {
            this.currentDisplayTime += milliSec;
            while (this.currentDisplayTime > this.tileDisplayDuration)
            {
                this.currentDisplayTime -= this.tileDisplayDuration;
                this.currentTile++;
                if (this.currentTile == this.numberOfTiles)
                    this.currentTile = 0;
                var currentColumn = this.currentTile % this.tilesHorizontal;
                this.texture.offset.x = currentColumn / this.tilesHorizontal;
                var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
                this.texture.offset.y = currentRow / this.tilesVertical;
            }
        };

        this.reset = function () {
            this.texture.offset.x = 0;
            this.texture.offset.y = 0;
            this.currentTile = 0;
            this.currentDisplayTime = 0;
        };
    }

    function explosao() {
        if (explodir) {
            explosion.position.x = enemy.position.x - .25;
            explosion.position.z = enemy.position.z + .5;
            explosion.position.y = enemy.position.y;
            explosionlight.position.set(explosion.position.x, explosion.position.y, explosion.position.z + 2);
            scene.add(explosionlight);
            explodeSprite.update(1000 * clock.getDelta());
            scene.add(explosion);
            if (explodeSprite.currentTile > explodeSprite.numberOfTiles / 2) {
                scene.remove(enemy);
                explosionlight.power -= 50;
                if (explosionlight.power < 0)
                    explosionlight.power = 0;
            } else {
                explosionlight.power += 10;
                if (colide(explosion, f15)) {
                    danos += 0.1;
                    if (danos > 1)
                        danos = 1;
                }
            }
            if (explodeSprite.currentTile === explodeSprite.numberOfTiles - 1) {
                explodir = false;
                clock = new THREE.Clock();
                explodeSprite.reset();
                console.log(explodir);
            }
        } else {
            scene.remove(explosion);
            scene.remove(explosionlight);
        }
    }

    function updateHud() {
         hud.innerHTML = "Pontos: " + score + " | Danos: " + (danos * 100).toFixed(1) + " % | Não Abatidos: " + nao_abatidos;
                    
    }


    //EVENTOS TOUCH
    
    function touchControl(e) {
        tend = e.changedTouches[0].clientX;
        console.log(tend - tstart);
        //                alert(tend - tstart);
        let dif = (Math.abs(tend - tstart) < 5) ? 0 : tend - tstart;
        let rz = parseFloat(f15.rotation._z.toFixed(2));
        if (dif < 0) {
            if (rz < 1.05) {
                //camera.position.x += 0.1;
                f15.position.x -= 0.1;
                f15.rotateZ(Math.PI / 9);
            } else {
                f15.rotation._z = 1.05;
            }
        } else if (dif > 0) {
            if (rz > -1.05) {
                //camera.position.x -= 0.1;
                f15.position.x += 0.1;
                f15.rotateZ(-Math.PI / 9);

            } else {
                f15.rotation._z = -1.05;

            }
        } else {
            shot = 1;
        }
    }

    window.addEventListener('touchstart', function (e) {
        tstart = e.changedTouches[0].clientX;
//                    shot = 1;

    });

    window.addEventListener('touchend', touchControl);

};






