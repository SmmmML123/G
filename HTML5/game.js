var scene;
var camera;
var renderer;
var clock;


var Circle;
var CircleCenter=new THREE.Vector3(0,0,0);
var CircleDistance=20;

var target;
var targetCenter=new THREE.Vector3(0,0,0);
var targetDistance=15;

var hero;
var isHeroLife=true

var Enemy;
var isEnemyLife=true;

var food=[];
var foodBody=[];

var world;
var AITarget=[];
var foodNum=18;
var sumNum=foodNum+2;
var isWin=false;

var canvas=document.getElementById("ctx");
var ctx=canvas.getContext("2d");

function myScene()
{
	scene=new THREE.Scene();
	var light=new THREE.AmbientLight(0xffffff);
	var width=window.innerWidth;
	var height=window.innerHeight;
	camera=new THREE.PerspectiveCamera(90,width/height,0.1,1000);
	camera.position.z=12;

	renderer=new THREE.WebGLRenderer({
		antialias:true,
		alpha:true
	});
	renderer.setSize(width,height);
	document.getElementById("webgl-container").appendChild(renderer.domElement);
	clock=new THREE.Clock();
	
	var sLight=new THREE.SpotLight(0xffffff);
	sLight.position.set(-100,100,100);
	
	scene.add(sLight);
	
	var aLight=new THREE.AmbientLight(0xffffff);
	scene.add(aLight);

	world = new CANNON.World();
	world.broadphase = new CANNON.NaiveBroadphase();
	world.gravity.set(0,0,0);
	world.solver.tolerance = 0.001;
}
var herobody;
var enemybody;
var planbody;
let enemy_cm;
let hero_cm;
function addHolder()
{



	hero_cm = new CANNON.Material({ friction:100, restitution: 3});
	herobody = new CANNON.Body({ mass:1, material: hero_cm});
	var shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,1));
	herobody.addShape(shape);
	herobody.position.set(1,0,0);
	world.add(herobody);


    var geometry = new THREE.BoxGeometry( 1, 1, 0 );
	var texture = THREE.ImageUtils.loadTexture( 'hero.png' );
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	hero = new THREE.Mesh( geometry, material );
	hero.position.set(1,0,0);
	scene.add( hero );


	enemy_cm = new CANNON.Material({ friction: 100, restitution: 3});
	enemybody = new CANNON.Body({ mass: 1, material: enemy_cm });
	var shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,1));
	enemybody.addShape(shape);
	enemybody.position.set(-5,0,0);
	world.add(enemybody);


	var geometry = new THREE.BoxGeometry( 1, 1, 0 );
	var texture = THREE.ImageUtils.loadTexture( 'Enemy.png' );
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	Enemy = new THREE.Mesh( geometry, material );
	Enemy.position.set(-5,0,0);
	scene.add( Enemy );

	var radius = 30,
		segments = 64,
		material = new THREE.LineBasicMaterial({ color: 0x0000ff }),
		geometry = new THREE.CircleGeometry(radius, segments);

	geometry.vertices.shift();
	Circle=new THREE.Line(geometry, material);
	scene.add(Circle);

	var radiusTarget = 15,
		segmentsTarget = 64,
		materialTarget = new THREE.LineBasicMaterial({ color: 0xFF0000 }),
		geometryTarget = new THREE.CircleGeometry(radiusTarget, segmentsTarget);

	geometryTarget.vertices.shift();
	target=new THREE.Line(geometryTarget, materialTarget);
	scene.add(target);


}


var speed1=[];
var flag=true;
var num=0;
var deltTime;
var time=5;
var keysDown={};

addEventListener("keydown",function(e){
    keysDown[e.keyCode]=true;

},false);

addEventListener("keyup",function(e){
    delete keysDown[e.keyCode];

},false);


function render()
{


	deltTime=clock.getDelta ();
	time-=deltTime;
	world.step(1 / 60);



	//模拟摩檫力
	friction(herobody);
	friction(enemybody);
	for(var i=0;i<food.length;i++)
	{
		friction(foodBody[i]);
	}

	//将物理引擎计算得到的坐标赋予物体
	Physics2Scene(Enemy,enemybody);
	Physics2Scene(hero,herobody);
	for(var i=0;i<food.length;i++)
	{
		Physics2Scene(food[i],foodBody[i]);
	}


	//向目标进行移动
	AI(Enemy,hero,enemybody);
	//随机攻击目标
	for(var i=0;i<food.length;i++)
	{
		if(AITarget[i]==null)
		{
			var index=Math.round(Math.random()*food.length);
			if(index==i)
			{
				index=(index+1)%food.length;
			}
			AITarget[i]=food[index];
		}
		if(food.length==1)
		{
			AITarget[i]=hero;
		}
		AI(food[i],AITarget[i],foodBody[i]);
	}

	//UI
	UI();

	ctrlHero();

	//记录一共多少个点到达目的点，实现同步
	num=0;
	//缩圈系统
	for(var index=0,array=Circle.geometry.vertices;index< Circle.geometry.vertices.length;index++)
	{
		//产生新的圈
		if(flag)
		{
			var randIndex=Math.round(Math.random()*64);
			var dir = new THREE.Vector3();
			dir.subVectors(targetCenter,array[randIndex]);

			var arrayTarget=target.geometry.vertices;
			var newCenter = new THREE.Vector3();
			targetDistance=targetDistance*0.5;

			newCenter.x=arrayTarget[randIndex].x+dir.normalize().x*targetDistance;
			newCenter.y=arrayTarget[randIndex].y+dir.normalize().y*targetDistance;
			newCenter.z=0;

            var randvalue=newCenter.distanceTo(targetCenter)*2;
            var value=Math.random();
            newCenter.x=newCenter.x+dir.normalize().x*randvalue*value;
            newCenter.y=newCenter.y+dir.normalize().y*randvalue*value;
            targetCenter=newCenter.clone();

			for(var i=0;i<target.geometry.vertices.length;i++)
			{
				var targetDir = new THREE.Vector3();
				targetDir.subVectors(arrayTarget[i],targetCenter);
				target.geometry.vertices[i].x=targetCenter.x+targetDir.normalize().x*targetDistance;
				target.geometry.vertices[i].y=targetCenter.y+targetDir.normalize().y*targetDistance;
				target.geometry.vertices[i].z=0;

				var newdir = new THREE.Vector3(target.geometry.vertices[i].x,target.geometry.vertices[i].y,0);
				speed1[i]=newdir.distanceTo(array[i])/5.0;

			}
			flag=false;
			time=5;
			//foodBuild();
			break;
		}
		//移动圈
		else if(!false&&time==0)
		{

			var newdir = new THREE.Vector3(array[index].x,array[index].y,array[index].z);
			if(newdir.distanceTo(targetCenter)<=targetDistance)
			{
				num++
				if(num>=64)
				{
					flag=true;

					for(var i=0;i<Circle.geometry.vertices.length;i++)
					{
						Circle.geometry.vertices[i] = target.geometry.vertices[i].clone();
					}
					CircleCenter=targetCenter;
					CircleDistance=targetDistance;

					break;
				}

			}
			else {
				var dir = new THREE.Vector3();
				dir.subVectors(targetCenter,array[index]);
				array[index].x += dir.normalize().x *(speed1[index]*deltTime);
				array[index].y += dir.normalize().y *(speed1[index]*deltTime);
			}

		}

	};
	Circle.geometry.verticesNeedUpdate=true;
	target.geometry.verticesNeedUpdate=true;
	//出圈死亡
	collider();
	renderer.render(scene,camera);
	//判断胜负
	if(!isWin)
		restartScene();
}
function  UI() {
	time=THREE.Math.clamp(time,0,100);
	ctx.clearRect(0, 0, 300, 200);
	ctx.fillStyle="rgb(0,0,0)";
	ctx.font="24px Helvetica";
	ctx.textAlign="left";
	ctx.textBaseline="top";
	ctx.fillText("剩余时间:"+time,10,10);
	ctx.fillText("剩余人数:"+sumNum,10,40);
	//ctx.fillText("2016030406237,10,80);

}
function  AI(me,target,targetBody)
{

	var dir = new THREE.Vector3();
	dir.subVectors(target.position,me.position);
	targetBody.velocity.x+=dir.normalize().x*0.3;
	targetBody.velocity.y+=dir.normalize().y*0.3;
}

//控制人物
function ctrlHero()
{
	//UP
	if(87 in keysDown)
	{
		herobody.velocity.y+=0.4;
	}
	//DOWN
	if(83 in keysDown)
	{
		herobody.velocity.y-=0.4;
	}
	//LEFT
	if(65 in keysDown)
	{
		herobody.velocity.x-=0.4;
	}
	//RIGHT
	if(68 in keysDown)
	{
		herobody.velocity.x+=0.4;
	}
}

//物理引擎处理后的坐标四元数赋予物体
function Physics2Scene(target,targetBody)
{
	target.position.x=targetBody.position.x;
	target.position.y=targetBody.position.y;
	target.position.z=targetBody.position.z=0;
	target.quaternion.x=targetBody.quaternion.x=0;
	target.quaternion.y=targetBody.quaternion.y=0;
	target.quaternion.z=targetBody.quaternion.z=0;
}


function friction( targetBody)
{
	//模拟摩檫力
	var velocityDir=new THREE.Vector3();
	velocityDir.x=targetBody.velocity.x;
	velocityDir.y=targetBody.velocity.y;
	velocityDir.z=0;
	targetBody.velocity.x-=velocityDir.x*0.1;
	targetBody.velocity.y-=velocityDir.y*0.1;
	targetBody.velocity.x=THREE.Math.clamp(targetBody.velocity.x,-5,5);
	targetBody.velocity.y=THREE.Math.clamp(targetBody.velocity.y,-5,5);
}



function foodBuild()
{
	var value1;
	var value2;
	var dir=new THREE.Vector3();
	for(var i=0;i<foodNum;i++)
	{
		value1=Math.random()*2-1;
		value2=Math.random()*2-1;;
		dir.set(Math.random()*2-1,Math.random()*2-1,0);
		var geometry = new THREE.BoxGeometry(1, 1, 0);
		var texture = THREE.ImageUtils.loadTexture('monster.png');
		var material = new THREE.MeshBasicMaterial({map: texture});
		food[i] = new THREE.Mesh(geometry, material);
		food[i].position.set(CircleCenter.x+dir.x*CircleDistance*value1, CircleCenter.y+dir.y*CircleDistance*value2, 0);
		scene.add(food[i]);

		var enemy_cm = new CANNON.Material({ friction: 100, restitution: 3});
		foodBody[i] = new CANNON.Body({ mass: 1, material: enemy_cm });
		var shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,1));
		foodBody[i].addShape(shape);
		foodBody[i].position.set(CircleCenter.x+dir.x*CircleDistance*value1, CircleCenter.y+dir.y*CircleDistance*value2, 0);
		world.add(foodBody[i]);
	}
}

//出圈死亡
function collider()
{
	var dir = new THREE.Vector3();
	for(var i=0,array=Circle.geometry.vertices;i<Circle.geometry.vertices.length;i++)
	{
		dir.set(array[i].x,array[i].y,0);
		if(dir.distanceTo(hero.position)<=1&&isHeroLife)
		{
			scene.remove(hero);
			world.remove(herobody);
			sumNum--;
			isHeroLife=false;
		}
		if(dir.distanceTo(Enemy.position)<=1&&isEnemyLife)
		{
			scene.remove(Enemy);
			world.remove(enemybody);
			isEnemyLife=false;
			sumNum--;
		}
		for(var j=0;j<food.length;j++)
		{
			if(dir.distanceTo(food[j].position)<=1)
			{
				sumNum--;
				scene.remove(food[j]);
				world.remove(foodBody[j]);
				food.splice(j,1);
				foodBody.splice(j,1);
				for(var index=0;index<AITarget.length;index++)
				{
					AITarget[index]=null;
				}
			}
		}
	}
}

function restartScene()
{

	if(sumNum==1&&isHeroLife)
	{
		UI();
		console.log(sumNum);
		isWin=true;
		setTimeout(function() {
			alert("大吉大利，今晚吃鸡！");
			location.reload();
		},10);
	}
	else if(!isHeroLife)
	{
		UI();
		isWin=true;
		setTimeout(function() {
			alert("祝下次好运！");
			location.reload();
		},10);
	}
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}
//重绘
function animate() {
    requestAnimationFrame(animate);
    render();
}

window.onload=function()
{
	myScene();
	addHolder();
	foodBuild();
	animate();
	window.addEventListener('resize',onWindowResize,false);
	
}

