// 初始化物理引擎
const Engine = Matter.Engine,
    Render = Matter.Render,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

// 创建引擎和渲染器
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    canvas: document.getElementById('gameCanvas'),
    options: {
        width: 800,
        height: 600,
        wireframes: false
    }
});

// 创建边界
const walls = [
    Bodies.rectangle(400, 0, 810, 20, { isStatic: true }), // 顶部
    Bodies.rectangle(400, 600, 810, 20, { isStatic: true }), // 底部
    Bodies.rectangle(0, 300, 20, 620, { isStatic: true }), // 左侧
    Bodies.rectangle(800, 300, 20, 620, { isStatic: true }) // 右侧
];
Composite.add(engine.world, walls);

// 创建小球
const ball = Bodies.circle(400, 100, 25, {
    restitution: 0.8,
    render: {
        fillStyle: '#F35e66'
    }
});

// 创建洞口（传感器）
const hole = Bodies.circle(700, 550, 35, {
    isStatic: true,
    isSensor: true,
    render: {
        fillStyle: '#4CAF50',
        opacity: 0.5
    }
});

Composite.add(engine.world, [ball, hole]);

// 鼠标交互
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// 碰撞检测
Matter.Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        if ((pair.bodyA === ball && pair.bodyB === hole) || 
            (pair.bodyA === hole && pair.bodyB === ball)) {
            alert('成功进洞！进入下一关！');
            // 重置小球位置
            Matter.Body.setPosition(ball, { x: 400, y: 100 });
            Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        }
    });
});

// 初始化时禁用物理引擎
engine.enabled = false;

// 启动按钮事件
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    engine.enabled = true;
});

// 运行引擎
Engine.run(engine);
Render.run(render);