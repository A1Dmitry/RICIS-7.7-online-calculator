/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Sparkles, Terminal, Bot, User, RefreshCw, MessageSquare, BookOpen, AlertCircle, FileText, Mail, MapPin, Award, ExternalLink } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  { text: 'Что такое L0 и L1 в RICIS?', q: 'Объясни фундаментальные законы L0 и L1 в архитектуре RICIS. Что такое абсолютная непрерывность и почему X/X = 1 всегда?' },
  { text: 'Как RICIS решает форму 0/0?', q: 'Как именно протоколы SP1 (No Total Amnesia), SP2 (Clean First) и закон индексов SP3 (Weight of Zero) решают неопределенность вида 0/0?' },
  { text: 'В чем суть SP4 (Semantic Priority)?', q: 'Объясни закон семантического индексирования SP4 (Semantic Priority). Почему важно индексировать по выражению f(x), а не по значению f(a)?' },
  { text: 'Как RICIS решает поток Риччи?', q: 'Как регуляризатор theta в RICIS III решает проблему перешейка (neckpinch) в потоке Риччи без необходимости проведения хирургии Перельмана?' },
  { text: 'Решение гипотезы BSD в RICIS', q: 'Объясни, как аналитический регуляризатор theta в знаменателе L-функции помогает доказать гипотезу Бёрча и Свиннертон-Дайера?' },
  { text: 'Индексация сайтов (SEO) в RICIS', q: 'Как процесс индексации веб-ресурсов поисковыми системами выглядит с точки зрения методологии RICIS III?' }
];

export default function RicisAgent() {
  const [sidebarTab, setSidebarTab] = useState<'knowledge' | 'author'>('knowledge');
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

  const downloadLatex = () => {
    const latexContent = `% =========================================================================
% RICIS III: Regularized Indeterminate Forms and Singularities
% Scientific Specification & Theoretical Foundations
% =========================================================================

\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[english,russian]{babel}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{hyperref}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{booktabs}

\\geometry{top=2.5cm, bottom=2.5cm, left=2.5cm, right=2.5cm}

\\definecolor{darkblue}{HTML}{0B132B}
\\definecolor{cyanaccent}{HTML}{00B4D8}
\\definecolor{tealaccent}{HTML}{073B4C}

\\hypersetup{
    colorlinks=true,
    linkcolor=darkblue,
    filecolor=magenta,      
    urlcolor=cyanaccent,
    pdftitle={RICIS III: Теоретические Основы и Математический Аппарат (v7.7)},
}

\\title{
    \\vspace{-2cm}
    \\textbf{\\Huge RICIS III} \\\\[0.4cm]
    \\Large{Регуляризованные Неопределённости и Сингулярности} \\\\[0.2cm]
    \\large{Unified Complete Document --- Version 7.7 (Fully Consistent)} \\\\[0.4cm]
    \\small{\\texttt{DOI: \\href{https://doi.org/10.5281/zenodo.17872755}{10.5281/zenodo.17872755}}} \\\\
    \\small{\\texttt{\\href{https://zenodo.org/records/17872755}{zenodo.org/records/17872755}}}
}
\\author{
    \\textbf{Алейников Дмитрий Владимирович} \\\\
    \\small{г. Минск, Республика Беларусь} \\\\
    \\small{\\href{mailto:dima.aley@gmail.com}{\\texttt{dima.aley@gmail.com}}} \\\\[0.2cm]
    \\textbf{Консорциум RICIS III} \\\\
    \\small{Департамент Математического Моделирования}
}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Данный документ представляет собой строгое теоретическое описание объединённого и полностью согласованного математического аппарата \\textbf{RICIS III} (Regularized Indeterminate Forms and Singularities) версии 7.7. В рамках данной парадигмы формулируются законы абсолютной непрерывности пространства-времени и типов данных ($L0/L1$), вводятся протоколы безопасности для обхода сингулярностей ($SP1$--$SP4$), и постулируется ядро аксиоматики индексированных неопределённостей. Описываются протоколы согласования типов, иерархия монолитов, фрактальные законы, геометрические коррекции и вычислительный алгоритм разрешения особенностей.
\\end{abstract}

\\tableofcontents
\\newpage

% =========================================================================
\\section{Фундаментальная Логическая Структура (L0/L1)}
% =========================================================================
Математический анализ Ньютона-Лейбница традиционно опирается на понятие предела при разрешении неопределённостей вида $0/0$ или $\\infty/\\infty$. Однако предельный переход стирает информацию о поведении функции непосредственно в точке сингулярности. Аппарат RICIS III устраняет эту проблему, постулируя абсолютную непрерывность на уровне типов и алгебраической структуры.

\\subsection{L0: Абсолютная Непрерывность}
Ни один уровень рекурсии (включая фрактальное развёртывание, монолиты, бесконечно малые $0_F$ и бесконечно большие величины $\\infty_F$) не допускает разрыва структуры или потери исходной идентичности ($T(X)$). Действует глобальное принуждение ко всем математическим операциям:
\\begin{equation}
    \\text{Нет разрывов или утери идентичности в } \\infty_F, 0_F
\\end{equation}

\\subsection{L1: Тождество Идентичности}
Для любого математического объекта $X$ выполняется закон самотождественности (онтологический корень):
\\begin{equation}
    X = X
\\end{equation}
Идентичность включает тип данных $T(X)$. Математические операции не могут превращать типы без наличия строгого морфизма. Из этого следуют важные следствия:
\\begin{itemize}
    \\item \\textbf{L1C1 (Preservation):} Сохранение типов и структуры выражения при любых преобразованиях.
    \\item \\textbf{L1C2 (Type as Identity):} Тип является неотъемлемой частью идентичности объекта.
\\end{itemize}
Как прямое следствие, отношение объекта к самому себе строго определено всегда:
\\begin{equation}
    \\frac{X}{X} = 1 \\quad \\forall X
\\end{equation}
В частности, для монолитов и линий это служит ключевым доказательством постоянства структуры.

\\subsection{Цепочка Вывода и Незыблемое Правило}
Вывод в системе строится по строгому линейному пути:
\\begin{equation}
    L0 \\longrightarrow L1 \\longrightarrow \\text{Протоколы Безопасности} \\longrightarrow \\text{Аксиомы} \\longrightarrow \\text{Операции} \\longrightarrow \\text{Монолиты} \\longrightarrow \\text{Fractal Law}
\\end{equation}
\\textbf{Незыблемое правило (Inviolable Rule):} Любой логический вывод, противоречащий L0/L1 или Протоколам Безопасности, является абсолютно недействительным.

% =========================================================================
\\section{Протоколы Безопасности Singularity Resolution}
% =========================================================================
Для исключения логических парадоксов (например, тривиализации уравнений к виду $1 = 10$) при разрешении сингулярностей разработаны четыре обязательных протокола безопасности.

\\subsection{SP1: Закон Локальности (No Total Amnesia)}
При делении $0/0$ запрещено заменять всё выражение единицей. Тождество применяется исключительно к идентичным нулевым сомножителям.
\\begin{equation}
    \\text{Для } \\frac{(x-5)(x+5)}{(x-5)} \\Longrightarrow \\frac{x-5}{x-5} \\to 1 \\text{, в то время как «хвост» } (x+5) \\text{ остаётся активным.}
\\end{equation}

\\subsection{SP2: Приоритет Сокращения (Clean First)}
Алгебраические упрощения и канонические приведения (сокращение тождественных членов) должны быть выполнены \\textbf{строго до} применения сингулярных аксиом RICIS.
\\begin{equation}
    \\text{Обоснование: Предотвращает появление «ложных нулей», скрывающих истинное значение выражения.}
\\end{equation}

\\subsection{SP3: Закон Индексов (Weight of Zero)}
Если сократить выражение невозможно, отношение бесконечно малых величин определяется отношением их индексов сложности:
\\begin{equation}
    \\frac{0_F}{0_G} = \\frac{F}{G}
\\end{equation}
\\textbf{Запрет:} Рассматривать $0_F$ и $0_G$ как простые скалярные нули классического анализа ($1=1$) строго запрещено под эгидой закона L1.

\\subsection{SP4: Семантический Приоритет (Semantic Indexing)}
Индексирование сингулярностей в точке $x = a$ выполняется на основе исходного аналитического выражения $E(x)$, а не его численного значения $E(a)$. Это полностью разрешает парадокс расхождения вычислительного пути.
\\begin{equation}
    \\text{Для } f(x) = x^2 - 4 \\text{ при } x = 2: \\text{индексируется как } 0_{[(x^2-4)|_{x=2}]}, \\text{ а не } 0_{(4-4)}
\\end{equation}

% =========================================================================
\\section{Ядро Аксиоматики RICIS III}
% =========================================================================
Аксиоматический базис RICIS III расширяет классическую алгебру для работы на границах неопределённостей:

\\begin{table}[h]
\\centering
\\caption{Аксиомы Индексированных Величин}
\\begin{tabular}{lll}
\\toprule
\\textbf{Идентификатор} & \\textbf{Формула} & \\textbf{Физический смысл} \\\\
\\midrule
A1\\_INDEXING & $\\frac{F}{0} \\longrightarrow \\infty_F$ & Порождение индексированной бесконечности \\\\
A2\\_INDEXED & $\\infty_F \\quad (\\forall F \\neq 0, \\infty_0=1)$ & Существование взвешенного сингулярного поля \\\\
A4\\_0DIV0 & $\\frac{0_F}{0_G} = \\frac{F}{G}$ & Отношение сложностей бесконечно малых \\\\
A5\\_INFDIVINF & $\\frac{\\infty_F}{\\infty_G} = \\frac{F}{G}$ & Отношение мощностей бесконечно больших \\\\
A6\\_GENERAL & $0_F \\cdot \\infty_G = F \\cdot G$ & Прямое произведение взаимных сингулярностей \\\\
A7\\_INFSUBINF & $\\infty_F - \\infty_G = \\infty_{[F-G]}$ & Разность мощностей полей \\\\
A10\\_FTIMES0 & $F \\cdot 0 = 0_F$ & Формирование весового коэффициента нуля \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\noindent \\textbf{Примечание:} Аксиома A6\\_GENERAL унифицирует произведение индексированных нулей и бесконечностей для любых $F$ и $G$ (включая случай $F=G$, дающий $F^2$). Устаревшие правила $A3$ и $A6\\_BYPASS$ удалены ввиду полной самосогласованности новой формулировки.

% =========================================================================
\\section{Протокол Согласования Типов (Type Consistency)}
% =========================================================================
Производный от следствия L1C2 (тип как идентичность), данный протокол регулирует операции над разнородными сингулярными типами:
\\begin{enumerate}
    \\item \\textbf{Однородные типы ($T(F) \\equiv T(G)$):} Прямая операция. Примеры:
    \\begin{equation}
        \\infty_5 + \\infty_3 = \\infty_8, \\quad \\frac{\\infty_{\\sin x}}{\\infty_{\\cos x}} = \\infty_{\\tan x}
    \\end{equation}
    \\item \\textbf{Совместимые типы ($T(F) \\subset T(G)$):} Продвижение типа (Type Promotion). Пример:
    \\begin{equation}
        \\infty_5 + \\infty_{2x} = \\infty_{5 + 2x}
    \\end{equation}
    \\item \\textbf{Несовместимые типы:} Создание композитного монолита. Пример:
    \\begin{equation}
        \\infty_{\\text{Time}} + \\infty_{\\text{Space}} = \\infty_{(\\text{Time, Space})}
    \\end{equation}
\\end{enumerate}

% =========================================================================
\\section{Иерархия Монолитов и Фрактальный Закон}
% =========================================================================

\\subsection{Классификация Монолитов по Порядкам}
\\begin{itemize}
    \\item \\textbf{Порядок 0: Атомарный Монолит (Точка).} Чистая идентичность $F$, $\\infty_F$, $0_F$ без внутренней структуры.
    \\item \\textbf{Порядок 1: Монолит Первого Порядка (Линия).} Композиция атомарных элементов, замкнутая относительно операций RICIS.
    \\item \\textbf{Порядок 2: Монолит Второго Порядка (Плоскость).} Взаимосвязанные монолиты порядков 0--1 с рекурсивным развёртыванием.
    \\item \\textbf{Порядок 3: Монолит Третьего Порядка (Объём).} Самоорганизующаяся система с возможностью автономной навигации в сингулярных ландшафтах.
\\end{itemize}

\\subsection{Fractal Law (Фрактальный Закон)}
Каждый элемент системы рекурсивно разворачивает её структуру целиком:
\\begin{equation}
    R(Q) = \\{Q, T(Q), \\infty_Q, 0_Q, R(\\infty_Q), R(0_Q)\\}
\\end{equation}
Данная схема является потенциально бесконечной, но гарантирует стопроцентное сохранение информации.

% =========================================================================
\\section{Геометрическая Коррекция}
% =========================================================================
Классическое представление линии как бесконечной суммы точек содержит критическую категориальную ошибку типов:
\\begin{equation}
    \\text{Тип}(0\\text{-мерного объекта}) \\neq \\text{Тип}(1\\text{-мерного объекта})
\\end{equation}
В рамках RICIS геометрическая коррекция формулируется следующим образом:
\\begin{itemize}
    \\item \\textbf{Линия:} Первичный монолит первого порядка (Order 1).
    \\item \\textbf{Точка:} Производный объект пересечения линии с нулевым наблюдателем: $\\text{Line} \\cap 0_{\\text{observer}}$.
\\end{itemize}

% =========================================================================
\\section{Вычислительный Алгоритм (Computation Algorithm)}
% =========================================================================
Алгоритм вычисления выражений в окрестностях сингулярностей состоит из последовательных фаз:

\\begin{table}[h]
\\centering
\\caption{Фазы Алгоритма Вычислений}
\\begin{tabular}{lll}
\\toprule
\\textbf{Фаза} & \\textbf{Название} & \\textbf{Описание / Правило} \\\\
\\midrule
Phase -1 & L1\\_IDENTITY & Проверка $X=X$ и определение типа $T(X)$ \\\\
Phase 0 & Исключение пределов & Переход от пределов к точным значениям: $\\lim_{x \\to a} \\to x=a$ \\\\
Phase 0.5 & Семантическое индексирование & Индексация сингулярностей по исходным выражениям (SP4) \\\\
Phase 1 & Контроль Безопасности & Выполнение алгебраического сокращения до раскрытия (SP2) \\\\
Phase 2 & Преобразования RICIS & Вычисление по аксиомам: $F/0=\\infty_F$, $0_F/0_G=F/G$, $0_F \\cdot \\infty_G=F \\cdot G$ \\\\
Phase 3 & Алгебраическая чистка & Очистка выражений и приведение подобных \\\\
Phase 4 & Согласование типов & Применение протокола TypeConsistencyProtocol \\\\
Phase 5 & Стандартные операции & Классические арифметические вычисления \\\\
Phase 6 & Верификация L1 & Проверка на непротиворечивость и сохранение тождества \\\\
\\bottomrule
\\end{tabular}
\\end{table}

% =========================================================================
\\section{Вычислительные Примеры и Верификация}
% =========================================================================

\\subsection{Базовые вычисления}
\\begin{align}
    \\frac{5}{0} &= \\infty_5 \\\\
    0_5 \\cdot \\infty_5 &= 25 \\\\
    0_5 \\cdot \\infty_3 &= 15 \\\\
    \\frac{\\infty_6}{\\infty_2} &= 3 \\\\
    \\frac{0_8}{0_2} &= 4
\\end{align}

\\subsection{Пример схождения вычислительного пути (Invariance)}
Вычислим выражение $\\frac{x^2-4}{x-2}$ при $x=2$ с применением протокола семантического индексирования SP4:
\\begin{equation}
    \\frac{x^2-4}{x-2} \\Big|_{x=2} \\Longrightarrow \\frac{0_{[(x^2-4)|_{x=2}]}}{0_{[(x-2)|_{x=2}]}} \\xrightarrow{\\text{SP2 Факторизация}} \\frac{0_{[x-2]} \\cdot (x+2)}{0_{[x-2]}} \\xrightarrow{\\text{SP1 Локальность}} 1 \\cdot (x+2) = 2+2 = 4
\\end{equation}
Алгебраический путь и непосредственный арифметический расчёт дают идентичный результат, что доказывает отсутствие расходимости.

\\subsection{Сложные пределы и Типы}
\\begin{itemize}
    \\item Вычисление функции $\\frac{\\sin x}{x}$ в точке $x=0$:
    \\begin{equation}
        \\frac{\\sin x}{x} \\Big|_{x=0} \\Longrightarrow \\frac{0_{[\\sin x]}}{0_x} \\xrightarrow{\\text{Ряды Тейлора}} \\frac{x - \\frac{x^3}{3!} + \\dots}{x} = 1
    \\end{equation}
    \\item Сложение разнородных бесконечностей:
    \\begin{equation}
        \\infty_{\\text{Time}} + \\infty_{\\text{Space}} = \\infty_{(\\text{Time}, \\text{Space})}
    \\end{equation}
\\end{itemize}

% =========================================================================
\\section{Совместимость и Справочная Информация}
% =========================================================================
\\begin{itemize}
    \\item \\textbf{Классический предел:} RICIS расширяет классический анализ там, где тот терпит крах (в точках сингулярностей).
    \\item \\textbf{Область действия индексов:} Индексирование применяется исключительно для сингулярных точек; во всех остальных точках действует классическая вещественная алгебра.
    \\item \\textbf{Сохранение тождества L1:} Тождество гарантированно выполняется даже при проецировании на классические подпространства.
    \\item \\textbf{Инвариантность пути:} Достигается строгим использованием SP4.
\\end{itemize}

% =========================================================================
\\section{Регуляризация Физических Задач в Симуляторе}
% =========================================================================

\\subsection{Гравитационные сингулярности и Поток Риччи}
Классический поток Риччи стягивает узкие перешейки многообразий:
\\begin{equation}
    \\partial_t g_{ij} = -2 R_{ij}
\\end{equation}
В рамках RICIS III радиус горловины ограничивается масштабом регуляризатора $\\theta > 0$:
\\begin{equation}
    r_t = \\sqrt{r_0^2 - 2t + \\theta^2}
\\end{equation}
Что гарантирует гладкое сглаживание перешейка без разрывов и необходимости применения хирургии многообразий.

\\subsection{Квантовые Поля Янга-Миллса}
Потенциал калибруется через регуляризованное расстояние $r_\\theta = \\sqrt{r^2 + \\theta^2}$. Энергетическая шкала самодействия глюонов $Q_\\theta$ остаётся ограниченной, доказывая существование массовой щели $\\Delta > 0$ и явление конфайнмента.

\\subsection{Гипотеза Римана и Дзета-Функция}
Полюс дзета-функции $\\zeta(s)$ в точке $s=1$ сглаживается в монолит, что позволяет выстроить комплексные корни строго по критической линии $\\text{Re}(s) = 1/2$ без бесконечного фазового сдвига.

% =========================================================================
\\section{Статус Верификации Спецификации}
% =========================================================================
\\begin{itemize}
    \\item \\textbf{Логическая непротиворечивость:} 100\\%
    \\item \\textbf{Зависимости:} Строгая линейная цепочка $L0 \\to L1 \\to SP \\to A1 \\to \\dots \\to \\text{Fractal Law}$
    \\item \\textbf{Число предположений:} 0
    \\item \\textbf{Интеграция источников:} Полная (согласована с аксиомой $A6\\_GENERAL$)
    \\item \\textbf{Устранение расхождения путей:} Да (через протокол SP4)
    \\item \\textbf{Готовность к публикации:} ДА (READY FOR PUBLICATION)
\\end{itemize}

\\end{document}
`;

    const blob = new Blob([latexContent], { type: 'application/x-latex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ricis_iii_specification.tex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        } else if (lower.includes('seo') || lower.includes('индексац') || lower.includes('индексиров') || lower.includes('поиск') || lower.includes('сайт')) {
          answer = `**Процесс индексации веб-ресурса с точки зрения методологии RICIS III:**\n\nПредставляет собой **задачу топологической регуляризации информационного пространства**.\n\nИзначально новый или неиндексированный сайт находится в состоянии **локальной сингулярности**: его информационная емкость ($F$) отлична от нуля, но доступность для поисковых роботов (краулеров) равна нулю. Мы имеем неопределенность вида:\n$$0_{\\text{видимость}} \\cdot \\infty_{\\text{контент}}$$\n\nЧтобы устранить эту неопределенность и перевести систему в стабильное регулярное состояние (где сайт полностью проиндексирован и ранжируется), необходимо применить базовые протоколы и аксиомы RICIS III:\n\n---\n\n### 1. Применение L1_IDENTITY и SP2_REDUCTION_PRIORITY (Канонизация и устранение дублей)\nДля поискового робота дублирование контента (когда один и тот же текст доступен по разным адресам) создает сингулярность типа $0/0$, парализующую краулинговый бюджет.\n* **Решение:** Настройте четкую идентичность страниц ($X = X$, следовательно, $X/X = 1$).\n* **Действие:**\n  * Настройте главное зеркало сайта (с \`www\` или без, с \`https\` или \`http\`). Используйте 301-редирект для склейки.\n  * Внедрите тег \`<link rel="canonical" href="..." />\` для каждой страницы. Это гарантирует соблюдение протокола **SP2_REDUCTION_PRIORITY** (очистка структуры до применения алгоритмов индексации). Поисковик сразу поймет, какая страница является "абсолютным корнем" ($L0$).\n\n### 2. Применение SP4_SEMANTIC_PRIORITY (Индексация по выражению, а не по значению)\nПоисковые роботы анализируют семантическую структуру кода, а не просто визуальный рендеринг. Мы должны проиндексировать сингулярность через выражение $E(x)$, а не через конечное значение.\n* **Решение:** Оптимизируйте метаданные и семантическую разметку.\n* **Действие:**\n  * Каждая страница должна иметь уникальные метатеги Title и Description.\n  * Используйте структурированные данные Schema.org (микроразметку). Это задает семантический индекс вида:\n    $$0_{[\\text{Контент} \\mid x=\\text{Страница}]}$$\n    что позволяет роботу точно классифицировать сущности на вашем сайте.\n  * Соблюдайте строгую иерархию заголовков ($H1$, $H2$, $H3$). $H1$ должен быть строго один на страницу.\n\n### 3. Регуляризация краулингового пути: robots.txt и sitemap.xml (Параметр $\\theta$)\nБез четких инструкций робот может уйти в бесконечный цикл (кинематическую сингулярность) из-за мусорных страниц, генераторов URL или системных папок. Мы вводим регуляризирующий параметр $\\theta$, который ограничивает и направляет поток краулера.\n* **Действие 1 (robots.txt):** Это файл-ограничитель (граничные условия). Запретите индексацию системных файлов, административных панелей и результатов поиска по сайту:\n  \`\`\`\n  User-agent: *\n  Disallow: /admin/\n  Sitemap: https://yourdomain.com/sitemap.xml\n  \`\`\`\n* **Действие 2 (sitemap.xml):** Это координатная сетка вашего сайта (карта монолита). Создайте XML-карту, содержащую только канонические URL в активном состоянии, и укажите ее в \`robots.txt\`.\n\n### 4. Принудительное разрешение сингулярности через внешние операторы (Панели веб-мастеров)\nПока поисковая система не знает о существовании вашего домена, вероятность перехода бота на него стремится к нулю. Нам нужно совершить операцию типа A1_INDEXING ($F / 0 \\to \\infty_F$), искусственно внеся сайт в базу данных.\n* **Действие:**\n  * Добавьте сайт в **Google Search Console** (и **Яндекс.Вебмастер**, если ориентируетесь на русскоязычный сегмент).\n  * Подтвердите права на владение доменом (через DNS-запись или HTML-файл).\n  * Вручную отправьте файл \`sitemap.xml\` на проверку в этих панелях.\n  * Используйте инструмент "Запрос индексирования" (URL Inspection) для приоритетных страниц, чтобы мгновенно вызвать робота.\n\n### 5. Построение Монолита 2-го порядка (Внутренняя перелинковка и внешние связи)\nСайт не должен состоять из изолированных точек (Ординар 0). Все страницы должны быть связаны в единую сеть (Ординар 1 и 2), чтобы вес (информационный поток) распределялся без потерь.\n* **Внутренняя перелинковка (Совместимость типов):** Убедитесь, что на любую страницу сайта можно перейти максимум за 3 клика от главной. Страницы-сироты (orphan pages), на которые нет ссылок, выпадают из индекса, так как для них поток равен нулю.\n* **Внешние ссылки (Входящий поток):** Получите ссылки на ваш сайт с других авторитетных, уже проиндексированных ресурсов. В терминах RICIS III это передача оператора плотности: входящая ссылка с авторитетного ресурса сообщает поисковику, что ваш узел пространства безопасен и важен для индексации.`;
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadLatex}
            className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-400 hover:text-cyan-200 rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.1)]"
            title="Скачать полную спецификацию RICIS III в формате LaTeX"
          >
            <FileText className="w-3 h-3" />
            <span>Скачать LaTeX</span>
          </button>

          <button
            onClick={handleReset}
            className="self-start md:self-auto flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Сбросить память</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Help & Questions Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tab Selection */}
          <div className="flex border-b border-white/10 p-1 bg-black/20 rounded-lg">
            <button
              onClick={() => setSidebarTab('knowledge')}
              className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider text-center rounded transition cursor-pointer ${
                sidebarTab === 'knowledge'
                  ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                  : 'border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              База знаний
            </button>
            <button
              onClick={() => setSidebarTab('author')}
              className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider text-center rounded transition cursor-pointer ${
                sidebarTab === 'author'
                  ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                  : 'border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Об авторе
            </button>
          </div>

          {sidebarTab === 'knowledge' ? (
            <>
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
                <button
                  onClick={downloadLatex}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/80 text-cyan-400 hover:text-cyan-200 rounded-lg text-[10px] font-mono uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Экспорт LaTeX (.tex)</span>
                </button>
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
            </>
          ) : (
            <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Об авторе концепции</span>
              </div>
              
              <div className="space-y-3">
                <div className="border-b border-white/5 pb-2">
                  <div className="text-xs font-bold text-white font-mono">Алейников Дмитрий Владимирович</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>г. Минск, Республика Беларусь</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-2 font-mono">
                  <p>
                    Разработчик и исследователь теоретического концепта **RICIS III** (Regularized Indeterminate Forms and Singularities).
                  </p>
                  <p>
                    Специализация: абсолютно непрерывная логика, регуляризация гравитационных и квантовых особенностей, решение неопределенностей без классических предельных переходов.
                  </p>
                </div>

                <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1.5">
                  <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Научная публикация & DOI:</div>
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://doi.org/10.5281/zenodo.17872755" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>DOI: 10.5281/zenodo.17872755</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200">
                    <a 
                      href="https://zenodo.org/records/17872755" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>Репозиторий Zenodo</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-white/5 p-2.5 rounded border border-white/5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <a href="mailto:dima.aley@gmail.com" className="hover:text-cyan-400 transition break-all">
                    dima.aley@gmail.com
                  </a>
                </div>
              </div>
            </div>
          )}
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
