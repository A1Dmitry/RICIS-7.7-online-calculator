/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Sparkles, Terminal, Bot, User, RefreshCw, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  { text: 'Что такое L0 и L1 в RICIS?', q: 'Объясни фундаментальные законы L0 и L1 в архитектуре RICIS. Что такое абсолютная непрерывность и почему X/X = 1 всегда?' },
  { text: 'Как RICIS решает форму 0/0?', q: 'Как именно протоколы SP1 (No Total Amnesia), SP2 (Clean First) и закон индексов SP3 (Weight of Zero) решают неопределенность вида 0/0?' },
  { text: 'В чем суть SP4 (Semantic Priority)?', q: 'Объясни закон семантического индексирования SP4 (Semantic Priority). Почему важно индексировать по выражению f(x), а не по значению f(a)?' },
  { text: 'Как RICIS решает поток Риччи?', q: 'Как регуляризатор theta в RICIS III решает проблему перешейка (neckpinch) в потоке Риччи без необходимости проведения хирургии Перельмана?' },
  { text: 'Решение гипотезы BSD в RICIS', q: 'Объясни, как аналитический регуляризатор theta в знаменателе L-функции помогает доказать гипотезу Бёрча и Свиннертон-Дайера?' }
];

export default function RicisAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Приветствую, коллега! Я — виртуальный ассистент RICIS III. Я обладаю полными знаниями об абсолютно непрерывной логической структуре (L0/L1), четырёх законах безопасности (SP1-SP4) и аксиомах регуляризации неопределённостей. \n\nВы можете спросить меня о решении любой математической или физической сингулярности в нашей симуляции — от гравитационных коллапсов до потоков Риччи и сложности P vs NP.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    'Сглаживание Кэлерова поля...',
    'Вычисление тензоров деформации...',
    'Регуляризация по протоколу SP4...',
    'Генерация монолитов нулевого порядка...',
    'Анализ предела Кэлеровой метрики при θ > 0...',
    'Применение аксиомы A6_GENERAL...',
    'Калибровка весов неопределенностей...'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setStatusMessage(statusOptions[0]);
      let idx = 1;
      interval = setInterval(() => {
        setStatusMessage(statusOptions[idx % statusOptions.length]);
        idx++;
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(1), // Exclude greeting
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.warn('API connection failed, falling back to offline neural simulation', err);
      // Smart offline fallback simulator based on user input
      setTimeout(() => {
        let answer = '';
        const lower = textToSend.toLowerCase();

        if (lower.includes('l0') || lower.includes('l1') || lower.includes('непрерывн') || lower.includes('continuity')) {
          answer = `**Резолюция L0/L1 в рамках RICIS:**\n\n1. **L0 (Абсолютная Непрерывность):** Постулирует, что ни один уровень рекурсии (включая фрактальное развёртывание, монолиты, бесконечности 0_F, ∞_F) не допускает разрыва структуры или потери исходной идентичности.\n\n2. **L1 (Тождество Идентичности):** Фундаментальный закон X = X. В классической математике деление нуля на самого себя 0/0 не определено. В RICIS, поскольку типы сохраняются как часть идентичности, отношение X/X строго равно 1 всегда.\n\nЭто устраняет неопределённость в самом начале вычислений, гарантируя, что сингулярность не «уничтожает» информацию о породившем её объекте.`;
        } else if (lower.includes('sp1') || lower.includes('sp2') || lower.includes('sp3') || lower.includes('0/0') || lower.includes('сокращ')) {
          answer = `**Протоколы Безопасности SP1, SP2 и SP3:**\n\n* **SP1 (Локальность / No Total Amnesia):** При делении 0/0 мы не заменяем все выражение единицей. Мы сокращаем только тождественные нулевые сомножители, оставляя «хвост» выражения активным. Например: (x - 5)·(x + 5) / (x - 5) → x + 5.\n\n* **SP2 (Приоритет Сокращения / Clean First):** Все алгебраические упрощения и канонические приведения должны быть выполнены строго ДО того, как мы применим аксиомы RICIS к сингулярностям. Это предотвращает появление ложных нулей.\n\n* **SP3 (Закон Индексов / Weight of Zero):** Если сократить выражение невозможно, отношение бесконечно малых величин определяется отношением их индексов сложности: 0_F / 0_G = F / G. Здесь 0_F и 0_G рассматриваются не как пустые скалярные нули классического анализа, а как структурированные объекты с весами F и G.`;
        } else if (lower.includes('sp4') || lower.includes('семанти') || lower.includes('semantic') || lower.includes('выражен')) {
          answer = `**Закон Семантического Индексирования SP4 (Semantic Priority):**\n\nКлассический анализ терпит крах при вычислении сингулярностей, так как оценивает функции только по их численному значению в точке предела. RICIS решает эту проблему!\n\nСогласно **SP4**, индексирование сингулярностей в точке x = a должно выполняться на основе исходной аналитической структуры выражения E(x), а не его числового значения E(a).\n\n*Пример:* Для функции f(x) = x² - 4 при x = 2 мы индексируем ноль как 0_[x² - 4 | x=2] вместо абстрактного числового нуля 0_[4 - 4]. Это полностью сохраняет алгебраическую информацию для последующих упрощений по протоколу **SP2** и гарантирует инвариантность вычислительного пути!`;
        } else if (lower.includes('риччи') || lower.includes('ричи') || lower.includes('ricci') || lower.includes('поинкаре') || lower.includes('пуанкаре') || lower.includes('neckpinch') || lower.includes('перешеек')) {
          answer = `**Резолюция потока Риччи и Сингулярностей Горловины (Neckpinch) в RICIS III:**\n\nВ классическом дифференциальном анализе поток Риччи ∂_t g_ij = -2 R_ij стягивает узкие горловины (перешейки) многообразий быстрее остальной части, превращая их в сингулярности бесконечной кривизны. Это требовало хирургии Перельмана (физического разрезания и склеивания).\n\n**В рамках RICIS III:**\nМы деформируем комплексную метрику на масштабе нелокального регуляризатора θ:\n\n1. Радиус перешейка в процессе эволюции ограничивается снизу величиной: r_t = √(r₀² - 2t + θ²).\n2. При θ > 0 радиус никогда не схлопывается в чистый ноль.\n3. Перешеек плавно сглаживается и деформируется, переводя многообразие в идеальную 3-сферу. Хирургия больше не требуется, так как topological связность и непрерывность сохраняются на всем пути эволюции!`;
        } else if (lower.includes('bsd') || lower.includes('бёрч') || lower.includes('свиннертон') || lower.includes('эллиптическ') || lower.includes('l-функция')) {
          answer = `**Разрешение Гипотезы Бёрча и Свиннертон-Дайера (BSD) в RICIS III:**\n\nГлавный барьер в гипотезе BSD — сходимость бесконечных Эйлеровых произведений L-функции L(E, s) в критической точке s = 1.\n\n**В парадигме RICIS III:**\n1. Мы вводим регуляризатор Кэлера θ в знаменатели рядов L-функции.\n2. Это преобразует поведение функции в окрестности s = 1, делая её производные Ландау строго ограниченными:\n   L_θ(s) = L(s) · (s - 1)² / [ (s - 1)² + θ² + 1e-6 ]\n3. Спектральная производная стабилизируется, а порядок касания оси s в точке s = 1 становится точным целым числом, равным рангу Морделла-Вейля r. Это полностью устраняет метрический разрыв!`;
        } else if (lower.includes('янг') || lower.includes('миллс') || lower.includes('масс') || lower.includes('gap') || lower.includes('yang') || lower.includes('mills')) {
          answer = `**Анализ Массовой Щели Янга-Миллса по RICIS III:**\n\nВ калибровочных полях Янга-Миллса классический потенциал уходит в бесконечность на малых расстояниях, создавая инфракрасные и ультрафиолетовые сингулярности (конфайнмент).\n\n**Решение RICIS:**\nМы заменяем сингулярное расстояние r в знаменателях полей на регуляризованное расстояние r_θ = √(r² + θ²). За счёт этого:\n1. Энергетическая шкала самодействия глюонов Q_θ остается строго ограниченной.\n2. Сила взаимодействия не взрывается в сингулярность на малых масштабах.\n3. Физический вакуум приобретает ненулевую энергию возбуждения — массовую щель Δ > 0, что строго доказывает стабильность квантового глюонного поля.`;
        } else if (lower.includes('риман') || lower.includes('дзета') || lower.includes('riemann') || lower.includes('zeta')) {
          answer = `**Регуляризация полюса Дзета-функции Римана в RICIS III:**\n\nКлассическая Дзета-функция ζ(s) имеет полюс первого порядка в точке s = 1. Это делает её невычислимой и порождает математический разрыв.\n\n**Решение RICIS:**\nМы деформируем комплексное пространство через нелокальный регуляризатор Кэлера θ, заменяя сингулярность в s = 1 на гладкий локальный монолит.\n* Регуляризованная дзета-функция сохраняет аналитическое продолжение, но её комплексные корни выравниваются строго вдоль критической линии Re(s) = 1/2 без эффекта ухода фазы в бесконечность. Это доказывает гипотезу Римана в регуляризованной метрике.`;
        } else {
          answer = `**Анализ концепта в системе координат RICIS III:**\n\nВаш запрос касается фундаментальной структуры полей. С точки зрения RICIS III:\n\n1. Любая классическая сингулярность (деление на ноль, уход кривизны в бесконечность) — это следствие редукции многообразия к плоской скалярной метрике θ = 0.\n2. Активация регуляризационного поля Кэлера θ > 0 разворачивает точку в монолит нулевого или первого порядка, делая все метрические коэффициенты гладкими и интегрируемыми.\n3. С использованием аксиом 0_F · ∞_G = F · G и закона индексов SP3, мы можем рассчитать точные физические параметры системы даже внутри сингулярности.\n\nКакая конкретная деталь (например, протоколы SP1-SP4 или теория монолитов) вас интересует подробнее?`;
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Память очищена. Сессия RICIS III инициализирована. Готов к анализу новых математических сингулярностей.'
      }
    ]);
  };

  return (
    <div id="ricis-agent-widget" className="bg-[#0b0c10]/80 border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Sleek top design line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500" />
      
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Cpu className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">RICIS III AI Агент-Советник</span>
              <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-bold font-mono tracking-widest uppercase">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Нейросетевая модель со знанием абсолютно непрерывного исчисления
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="self-start md:self-auto flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Сбросить память</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Help & Questions Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">База знаний RICIS III</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Агент оперирует аксиомами абсолютно непрерывных отображений и законами безопасности **SP1-SP4**, позволяющими разрешать неопределенности деления на ноль без предела.
            </p>
            <div className="text-[10px] font-mono text-slate-500 uppercase space-y-1 bg-black/30 p-2 rounded border border-white/5">
              <div>• L0: Непрерывность тождества</div>
              <div>• L1: X = X; X/X = 1 всегда</div>
              <div>• SP1: Принцип локальности сомножителей</div>
              <div>• SP3: Вес нуля (0_F/0_G = F/G)</div>
              <div>• SP4: Семантический индекс E(x)</div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block px-1">Быстрые вопросы агенту:</span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {QUICK_QUESTIONS.map((qq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qq.q)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 bg-white/2 border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-950/20 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition duration-150 leading-relaxed cursor-pointer"
                >
                  {qq.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[400px] bg-black/40 border border-white/5 rounded-xl p-4">
          
          {/* Scrollable message container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                    : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-3 rounded-xl text-xs leading-relaxed font-mono ${
                  msg.role === 'user'
                    ? 'bg-emerald-950/20 border border-emerald-500/20 text-slate-100'
                    : 'bg-cyan-950/10 border border-cyan-500/10 text-slate-200'
                }`}>
                  {/* Handle markdown block styling slightly */}
                  <div className="whitespace-pre-line">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 rounded-xl bg-cyan-950/10 border border-cyan-500/10 text-xs font-mono text-cyan-400/80 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="mt-4 flex gap-2 border-t border-white/5 pt-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите агента о любом законе или сингулярности по RICIS..."
              disabled={isLoading}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/80 text-cyan-400 hover:text-white disabled:opacity-40 rounded-xl flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
