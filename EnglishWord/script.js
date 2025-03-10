// 单词库（名词、动词、形容词各10个）
const wordBank = [
  { en: "computer", zh: "计算机" },
  { en: "library", zh: "图书馆" },
  { en: "sunshine", zh: "阳光" },
  { en: "bicycle", zh: "自行车" },
  { en: "hospital", zh: "医院" },
  { en: "restaurant", zh: "餐厅" },
  { en: "mountain", zh: "山脉" },
  { en: "ocean", zh: "海洋" },
  { en: "giraffe", zh: "长颈鹿" },
  { en: "umbrella", zh: "雨伞" }
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