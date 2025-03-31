// 常用英语单词库（100个）
const wordBank = [
  // 名词 (40个)
  { en: "apple", zh: "苹果" },
  { en: "book", zh: "书" },
  { en: "cat", zh: "猫" },
  { en: "dog", zh: "狗" },
  { en: "egg", zh: "鸡蛋" },
  { en: "fish", zh: "鱼" },
  { en: "girl", zh: "女孩" },
  { en: "house", zh: "房子" },
  { en: "ice", zh: "冰" },
  { en: "juice", zh: "果汁" },
  { en: "key", zh: "钥匙" },
  { en: "lion", zh: "狮子" },
  { en: "milk", zh: "牛奶" },
  { en: "nose", zh: "鼻子" },
  { en: "orange", zh: "橙子" },
  { en: "pen", zh: "钢笔" },
  { en: "queen", zh: "女王" },
  { en: "rain", zh: "雨" },
  { en: "sun", zh: "太阳" },
  { en: "tree", zh: "树" },
  { en: "umbrella", zh: "雨伞" },
  { en: "vegetable", zh: "蔬菜" },
  { en: "water", zh: "水" },
  { en: "box", zh: "盒子" },
  { en: "year", zh: "年" },
  { en: "zoo", zh: "动物园" },
  { en: "baby", zh: "婴儿" },
  { en: "car", zh: "汽车" },
  { en: "door", zh: "门" },
  { en: "eye", zh: "眼睛" },
  { en: "father", zh: "父亲" },
  { en: "game", zh: "游戏" },
  { en: "hand", zh: "手" },
  { en: "island", zh: "岛" },
  { en: "jacket", zh: "夹克" },
  { en: "kite", zh: "风筝" },
  { en: "leg", zh: "腿" },
  { en: "mother", zh: "母亲" },
  { en: "name", zh: "名字" },
  { en: "orange", zh: "橙子" },

  // 动词 (30个)
  { en: "ask", zh: "问" },
  { en: "buy", zh: "买" },
  { en: "come", zh: "来" },
  { en: "do", zh: "做" },
  { en: "eat", zh: "吃" },
  { en: "find", zh: "找到" },
  { en: "go", zh: "去" },
  { en: "have", zh: "有" },
  { en: "jump", zh: "跳" },
  { en: "know", zh: "知道" },
  { en: "like", zh: "喜欢" },
  { en: "make", zh: "制作" },
  { en: "need", zh: "需要" },
  { en: "open", zh: "打开" },
  { en: "play", zh: "玩" },
  { en: "read", zh: "读" },
  { en: "see", zh: "看见" },
  { en: "take", zh: "拿" },
  { en: "use", zh: "使用" },
  { en: "walk", zh: "走" },
  { en: "work", zh: "工作" },
  { en: "write", zh: "写" },
  { en: "call", zh: "打电话" },
  { en: "dance", zh: "跳舞" },
  { en: "fly", zh: "飞" },
  { en: "give", zh: "给" },
  { en: "help", zh: "帮助" },
  { en: "learn", zh: "学习" },
  { en: "move", zh: "移动" },
  { en: "run", zh: "跑" },

  // 形容词 (30个)
  { en: "big", zh: "大的" },
  { en: "cold", zh: "冷的" },
  { en: "dry", zh: "干的" },
  { en: "easy", zh: "容易的" },
  { en: "fast", zh: "快的" },
  { en: "good", zh: "好的" },
  { en: "happy", zh: "快乐的" },
  { en: "hot", zh: "热的" },
  { en: "kind", zh: "善良的" },
  { en: "long", zh: "长的" },
  { en: "new", zh: "新的" },
  { en: "old", zh: "老的" },
  { en: "quick", zh: "迅速的" },
  { en: "red", zh: "红色的" },
  { en: "small", zh: "小的" },
  { en: "tall", zh: "高的" },
  { en: "ugly", zh: "丑的" },
  { en: "warm", zh: "温暖的" },
  { en: "young", zh: "年轻的" },
  { en: "clean", zh: "干净的" },
  { en: "dark", zh: "黑暗的" },
  { en: "empty", zh: "空的" },
  { en: "full", zh: "满的" },
  { en: "heavy", zh: "重的" },
  { en: "light", zh: "轻的" },
  { en: "nice", zh: "好的" },
  { en: "quiet", zh: "安静的" },
  { en: "sad", zh: "悲伤的" },
  { en: "slow", zh: "慢的" },
  { en: "wet", zh: "湿的" }
];

let currentWord;
let selectedLetters = [];
let score = 0;

// DOM元素
const chineseHint = document.getElementById('chineseHint');
const wordDisplay = document.getElementById('wordDisplay');
const message = document.getElementById('message');
const lettersDiv = document.getElementById('letters');
const nextBtn = document.getElementById('nextBtn');

// 初始化游戏
function initGame() {
  // 随机选择单词
  currentWord = wordBank[Math.floor(Math.random() * wordBank.length)];
  chineseHint.textContent = currentWord.zh;
  
  // 打乱字母顺序
  const scrambled = currentWord.en.split('').sort(() => Math.random() - 0.5);
  
  // 生成字母按钮
  lettersDiv.innerHTML = scrambled
    .map(letter => `<button class="letter">${letter}</button>`)
    .join('');
  
  // 绑定点击事件
  document.querySelectorAll('.letter').forEach(btn => {
    btn.addEventListener('click', handleLetterClick);
  });
  
  updateDisplay();
}

// 更新显示状态
function updateDisplay() {
  wordDisplay.innerHTML = currentWord.en
    .split('')
    .map((_, index) => selectedLetters[index] || '_')
    .join(' ');
  
  // 检查是否完成
  if (selectedLetters.join('') === currentWord.en) {
    message.textContent = '正确！+10分';
    message.style.color = 'green';
    score += 10;
    nextBtn.disabled = false;
  }
}

// 字母点击处理
function handleLetterClick(e) {
  if (nextBtn.disabled) {
    const letter = e.target.textContent;
    const position = selectedLetters.length;
    
    if (letter === currentWord.en[position]) {
      selectedLetters.push(letter);
      e.target.disabled = true;
      e.target.classList.add('correct');
      message.textContent = '';
      updateDisplay();
    } else {
      message.textContent = '错误，请重试！';
      message.style.color = 'red';
    }
  }
}

// 下一单词
nextBtn.addEventListener('click', () => {
  selectedLetters = [];
  message.textContent = '';
  nextBtn.disabled = true;
  initGame();
});

// 开始游戏
initGame();
nextBtn.disabled = true;